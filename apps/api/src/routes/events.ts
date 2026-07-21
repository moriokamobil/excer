import type { FastifyInstance } from 'fastify';
import { queryOne, withTransaction } from '../infra/db';
import { MESSAGES, type LocationPayload } from '@lost-museum/shared';
import { processVisit, canCheckinToday } from '../domain/visits';
import { grantPaint } from '../domain/resources';
import { guardLocation } from '../services/locationGuard';
import { recordAction } from '../services/players';
import { syncArtworkState } from '../services/artworks';

interface StoreRow {
  id: string;
  name: string;
  lat: number;
  lng: number;
  main_piece_id: string | null;
  main_artwork_id: string | null;
}

async function loadStore(storeId: string): Promise<StoreRow | null> {
  return queryOne<StoreRow>(
    `SELECT cs.id, cs.name,
            ST_Y(cs.location::geometry) AS lat, ST_X(cs.location::geometry) AS lng,
            cs.main_piece_id, ap.artwork_id AS main_artwork_id
       FROM campaign_stores cs
       LEFT JOIN artwork_pieces ap ON ap.id = cs.main_piece_id
      WHERE cs.id=$1`,
    [storeId],
  );
}

export async function eventRoutes(app: FastifyInstance): Promise<void> {
  // POST /events/:storeId/checkin — 店舗イベント来店 → メインピース入手
  app.post<{ Params: { storeId: string }; Body: LocationPayload }>(
    '/events/:storeId/checkin',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const store = await loadStore(req.params.storeId);
      if (!store) return reply.code(404).send({ error: 'not_found', message: '店舗が見つかりません' });

      const b = req.body;
      const guard = await guardLocation({
        playerId: req.playerId,
        lat: b.lat,
        lng: b.lng,
        accuracy: b.accuracy,
        isMockLocation: b.is_mock_location,
        clientTimestamp: b.client_timestamp,
        spot: { lat: store.lat, lng: store.lng },
      });
      if (!guard.ok) {
        return reply.code(403).send({
          error: guard.reason,
          message: rejectMessage(guard.reason),
          suspended: guard.suspended,
        });
      }

      const result = await withTransaction(async (client) => {
        await client.query('SELECT id FROM players WHERE id=$1 FOR UPDATE', [req.playerId]);
        const vRes = await client.query(
          'SELECT * FROM store_visits WHERE player_id=$1 AND store_id=$2 FOR UPDATE',
          [req.playerId, store.id],
        );
        const visit = vRes.rows[0];
        const lastCheckin = visit?.last_checkin_at ? new Date(visit.last_checkin_at) : null;

        if (!canCheckinToday(lastCheckin, new Date())) {
          return { alreadyCheckedInToday: true, mainPieceAwarded: null };
        }

        // メインピース付与（未所持なら）
        let awarded = null;
        if (store.main_piece_id) {
          const already = await client.query(
            'SELECT 1 FROM player_pieces WHERE player_id=$1 AND piece_id=$2',
            [req.playerId, store.main_piece_id],
          );
          if (already.rowCount === 0) {
            await client.query(
              'INSERT INTO player_pieces (player_id, piece_id) VALUES ($1,$2)',
              [req.playerId, store.main_piece_id],
            );
            awarded = await client.query(
              `SELECT id AS "pieceId", artwork_id AS "artworkId", name, piece_type AS "pieceType",
                      crop_x AS "cropX", crop_y AS "cropY", crop_w AS "cropW", crop_h AS "cropH"
                 FROM artwork_pieces WHERE id=$1`,
              [store.main_piece_id],
            );
          }
          if (store.main_artwork_id) {
            await syncArtworkState(client as any, req.playerId, store.main_artwork_id);
          }
        }

        // チェックイン時刻更新（訪問カウントは /visit で加算するが、
        // イベントチェックインも1回の来店として last_checkin_at を記録）
        await client.query(
          `INSERT INTO store_visits (player_id, store_id, last_checkin_at)
           VALUES ($1,$2, now())
           ON CONFLICT (player_id, store_id) DO UPDATE SET last_checkin_at = now()`,
          [req.playerId, store.id],
        );
        await recordAction(client as any, req.playerId, 'checkin', {
          lat: b.lat,
          lng: b.lng,
          accuracy: b.accuracy,
        });

        return {
          alreadyCheckedInToday: false,
          mainPieceAwarded: awarded?.rows[0] ?? null,
          artworkId: store.main_artwork_id,
        };
      });

      return reply.send(result);
    },
  );

  // POST /stores/:storeId/visit — 通常来店（リピート訪問カウント + レプリカ判定）
  app.post<{ Params: { storeId: string }; Body: LocationPayload }>(
    '/stores/:storeId/visit',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const store = await loadStore(req.params.storeId);
      if (!store) return reply.code(404).send({ error: 'not_found', message: '店舗が見つかりません' });

      const b = req.body;
      const guard = await guardLocation({
        playerId: req.playerId,
        lat: b.lat,
        lng: b.lng,
        accuracy: b.accuracy,
        isMockLocation: b.is_mock_location,
        clientTimestamp: b.client_timestamp,
        spot: { lat: store.lat, lng: store.lng },
      });
      if (!guard.ok) {
        return reply.code(403).send({
          error: guard.reason,
          message: rejectMessage(guard.reason),
          suspended: guard.suspended,
        });
      }

      const result = await withTransaction(async (client) => {
        await client.query('SELECT id FROM players WHERE id=$1 FOR UPDATE', [req.playerId]);
        const vRes = await client.query(
          'SELECT * FROM store_visits WHERE player_id=$1 AND store_id=$2 FOR UPDATE',
          [req.playerId, store.id],
        );
        const visit = vRes.rows[0];

        const outcome = processVisit(
          {
            visitCount: visit?.visit_count ?? 0,
            lastVisitedAt: visit?.last_visited_at ? new Date(visit.last_visited_at) : null,
            replicaUnlocked: visit?.replica_unlocked ?? false,
          },
          new Date(),
        );

        if (!outcome.skippedSameDay) {
          await client.query(
            `INSERT INTO store_visits (player_id, store_id, visit_count, last_visited_at, replica_unlocked)
             VALUES ($1,$2,$3, now(), $4)
             ON CONFLICT (player_id, store_id)
             DO UPDATE SET visit_count=$3, last_visited_at=now(), replica_unlocked=$4`,
            [req.playerId, store.id, outcome.visitCount, outcome.replicaUnlocked],
          );

          // 常連ボーナス（絵の具×3、1日上限を尊重）
          if (outcome.regularBonusPaint > 0) {
            const pl = await client.query(
              'SELECT restore_paint, paint_earned_today FROM players WHERE id=$1',
              [req.playerId],
            );
            const g = grantPaint(
              pl.rows[0].restore_paint,
              pl.rows[0].paint_earned_today,
              outcome.regularBonusPaint,
            );
            await client.query(
              'UPDATE players SET restore_paint=$2, paint_earned_today=$3 WHERE id=$1',
              [req.playerId, g.restorePaint, g.paintEarnedToday],
            );
          }
        }

        await recordAction(client as any, req.playerId, 'visit', {
          lat: b.lat,
          lng: b.lng,
          accuracy: b.accuracy,
        });

        return {
          visitCount: outcome.visitCount,
          replicaUnlocked: outcome.replicaUnlocked,
          replicaJustUnlocked: outcome.replicaJustUnlocked,
          regularBonusPaint: outcome.skippedSameDay ? 0 : outcome.regularBonusPaint,
          skippedSameDay: outcome.skippedSameDay,
          replicaArtworkId: outcome.replicaUnlocked ? store.main_artwork_id : null,
          replicaMusicId: null as string | null,
        };
      });

      // レプリカ店の来店BGM（ゼンマイ消費なし）: 解放済みなら楽曲IDを返す
      if (result.replicaUnlocked && result.replicaArtworkId) {
        const a = await queryOne<{ linked_music_id: string | null }>(
          'SELECT linked_music_id FROM artwork_masters WHERE id=$1',
          [result.replicaArtworkId],
        );
        result.replicaMusicId = a?.linked_music_id ?? null;
      }
      return reply.send(result);
    },
  );
}

function rejectMessage(reason: string | null): string {
  switch (reason) {
    case 'mock_location':
      return MESSAGES.MOCK_LOCATION_DETECTED;
    case 'accuracy_too_low':
      return MESSAGES.ACCURACY_TOO_LOW;
    case 'impossible_speed':
      return MESSAGES.IMPOSSIBLE_SPEED;
    case 'too_far':
      return MESSAGES.TOO_FAR_FROM_SPOT;
    default:
      return 'アクションを実行できません';
  }
}

export { rejectMessage };
