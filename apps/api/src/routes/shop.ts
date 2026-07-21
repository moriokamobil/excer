import type { FastifyInstance } from 'fastify';
import { query, queryOne, withTransaction } from '../infra/db';
import { config } from '../infra/config';
import { MESSAGES, RESOURCE_LIMITS } from '@lost-museum/shared';
import { spendCoins, canAffordCoins, grantPaint } from '../domain/resources';
import { canAffordPlay, spendSpringForPlay } from '../domain/resources';

export async function shopRoutes(app: FastifyInstance): Promise<void> {
  // GET /shop/items — コイン交換アイテム
  app.get('/shop/items', { preHandler: app.authGuard }, async () => {
    const items = await query(
      `SELECT item_id AS "itemId", item_name AS "itemName", coin_cost AS "coinCost",
              daily_cap AS "dailyCap", enabled
         FROM exchange_rates WHERE enabled=true ORDER BY coin_cost`,
    );
    return { items };
  });

  // POST /shop/exchange — コイン→クーポン/絵の具 交換
  app.post<{ Body: { item_id?: string } }>(
    '/shop/exchange',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const itemId = req.body?.item_id;
      if (!itemId) return reply.code(400).send({ error: 'bad_request', message: 'item_id が必要です' });

      const rate = await queryOne<{ item_id: string; item_name: string; coin_cost: number; daily_cap: number }>(
        'SELECT item_id, item_name, coin_cost, daily_cap FROM exchange_rates WHERE item_id=$1 AND enabled=true',
        [itemId],
      );
      if (!rate) return reply.code(404).send({ error: 'not_found', message: MESSAGES.ITEM_NOT_FOUND });

      if (!canAffordCoins(req.player.coins, rate.coin_cost)) {
        return reply.code(400).send({ error: 'not_enough_coins', message: MESSAGES.NOT_ENOUGH_COINS });
      }

      // 1日の交換上限（daily_cap）チェック
      const todayCount = await queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM coin_exchanges
          WHERE player_id=$1 AND item_id=$2 AND exchanged_at::date = (now() AT TIME ZONE 'UTC')::date`,
        [req.playerId, itemId],
      );
      if (todayCount && parseInt(todayCount.count, 10) >= rate.daily_cap) {
        return reply.code(400).send({ error: 'daily_cap_reached', message: '本日の交換上限に達しました' });
      }

      const result = await withTransaction(async (client) => {
        const pRes = await client.query('SELECT * FROM players WHERE id=$1 FOR UPDATE', [req.playerId]);
        const player = pRes.rows[0];
        const remaining = spendCoins(player.coins, rate.coin_cost);

        let couponCode: string | null = null;
        let paintGranted = 0;

        if (itemId === 'paint_x10') {
          // 絵の具付与（1日上限を尊重）
          const g = grantPaint(player.restore_paint, player.paint_earned_today, 10);
          paintGranted = g.granted;
          await client.query(
            'UPDATE players SET coins=$2, restore_paint=$3, paint_earned_today=$4 WHERE id=$1',
            [req.playerId, remaining, g.restorePaint, g.paintEarnedToday],
          );
        } else {
          // citras クーポン発行（mock citras POST /coupons）
          try {
            const res = await fetch(`${config.mockCitrasUrl}/coupons`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                citras_user_id: player.citras_user_id,
                item_id: itemId,
                attributes: { min_ride_minutes: 30 },
              }),
            });
            const data = (await res.json()) as { coupon_code?: string };
            couponCode = data.coupon_code ?? null;
          } catch {
            couponCode = null;
          }
          await client.query('UPDATE players SET coins=$2 WHERE id=$1', [req.playerId, remaining]);
        }

        await client.query(
          'INSERT INTO coin_exchanges (player_id, item_id, coupon_code, coins_spent) VALUES ($1,$2,$3,$4)',
          [req.playerId, itemId, couponCode, rate.coin_cost],
        );

        return { itemId, coinsSpent: rate.coin_cost, couponCode, paintGranted, remainingCoins: remaining };
      });

      return reply.send({ ...result, message: MESSAGES.EXCHANGE_DONE });
    },
  );

  // GET /shop/history — 交換履歴
  app.get('/shop/history', { preHandler: app.authGuard }, async (req) => {
    const history = await query(
      `SELECT ce.item_id AS "itemId", er.item_name AS "itemName", ce.coupon_code AS "couponCode",
              ce.coins_spent AS "coinsSpent", ce.exchanged_at AS "exchangedAt"
         FROM coin_exchanges ce
         LEFT JOIN exchange_rates er ON er.item_id = ce.item_id
        WHERE ce.player_id=$1 ORDER BY ce.exchanged_at DESC LIMIT 50`,
      [req.playerId],
    );
    return { history };
  });

  // POST /gramophone/play — BGM再生（ゼンマイ消費。鑑賞モード）
  app.post<{ Body: { artwork_id?: string } }>(
    '/gramophone/play',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const artworkId = req.body?.artwork_id;
      if (!artworkId) return reply.code(400).send({ error: 'bad_request', message: 'artwork_id が必要です' });

      // 完成済みか
      const pa = await queryOne<{ state: string }>(
        'SELECT state FROM player_artworks WHERE player_id=$1 AND artwork_id=$2',
        [req.playerId, artworkId],
      );
      if (pa?.state !== 'completed') {
        return reply.code(403).send({ error: 'not_completed', message: 'この名画はまだ完成していません' });
      }

      if (!canAffordPlay(req.player.gramophone_spring)) {
        return reply.code(400).send({ error: 'not_enough_spring', message: MESSAGES.NOT_ENOUGH_SPRING });
      }

      const music = await queryOne(
        `SELECT m.id, m.title_ja AS "titleJa", m.composer, m.audio_url AS "audioUrl"
           FROM artwork_masters a JOIN music_masters m ON m.id = a.linked_music_id
          WHERE a.id=$1`,
        [artworkId],
      );
      if (!music) return reply.code(404).send({ error: 'no_music', message: 'BGMが見つかりません' });

      const result = await withTransaction(async (client) => {
        const pRes = await client.query(
          'SELECT gramophone_spring FROM players WHERE id=$1 FOR UPDATE',
          [req.playerId],
        );
        const remaining = spendSpringForPlay(pRes.rows[0].gramophone_spring);
        await client.query(
          'UPDATE players SET gramophone_spring=$2, spring_updated_at=now() WHERE id=$1',
          [req.playerId, remaining],
        );
        return { remainingSpring: remaining };
      });

      return reply.send({
        music,
        springSpent: RESOURCE_LIMITS.SPRING_PER_PLAY,
        remainingSpring: result.remainingSpring,
      });
    },
  );
}
