/**
 * 管理API（admin SPA 用）。REQUIREMENTS §9 admin:
 *  - ピースcrop調整 / イベント店設定 / 交換レート / 不正レビュー
 * 簡易のため x-admin-secret ヘッダで保護（本番は citras 管理者OIDCを想定）。
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { query, pool } from '../infra/db';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'admin-dev-secret';

async function adminGuard(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
    return reply.code(401).send({ error: 'unauthorized' });
  }
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // ピース一覧（crop調整用）
  app.get('/admin/pieces', { preHandler: adminGuard }, async () => {
    const pieces = await query(
      `SELECT ap.id, ap.artwork_id AS "artworkId", am.title_ja AS "artworkTitle",
              ap.piece_index AS "pieceIndex", ap.name, ap.piece_type AS "pieceType",
              ap.crop_x AS "cropX", ap.crop_y AS "cropY", ap.crop_w AS "cropW", ap.crop_h AS "cropH",
              ap.acquire_source AS "acquireSource"
         FROM artwork_pieces ap JOIN artwork_masters am ON am.id = ap.artwork_id
        ORDER BY am.title_ja, ap.piece_index`,
    );
    return { pieces };
  });

  // ピースcrop更新
  app.patch<{ Params: { id: string }; Body: { cropX: number; cropY: number; cropW: number; cropH: number } }>(
    '/admin/pieces/:id',
    { preHandler: adminGuard },
    async (req, reply) => {
      const { cropX, cropY, cropW, cropH } = req.body;
      const r = await pool.query(
        'UPDATE artwork_pieces SET crop_x=$2, crop_y=$3, crop_w=$4, crop_h=$5 WHERE id=$1 RETURNING id',
        [req.params.id, cropX, cropY, cropW, cropH],
      );
      if (r.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
      return { ok: true };
    },
  );

  // イベント店（キャンペーン店舗）一覧
  app.get('/admin/stores', { preHandler: adminGuard }, async () => {
    const stores = await query(
      `SELECT cs.id, cs.citras_store_id AS "citrasStoreId", cs.name,
              ST_Y(cs.location::geometry) AS lat, ST_X(cs.location::geometry) AS lng,
              cs.main_piece_id AS "mainPieceId", ap.name AS "mainPieceName",
              cs.campaign_starts_at AS "campaignStartsAt", cs.campaign_ends_at AS "campaignEndsAt"
         FROM campaign_stores cs LEFT JOIN artwork_pieces ap ON ap.id = cs.main_piece_id
        ORDER BY cs.name`,
    );
    return { stores };
  });

  // イベント店の配布メインピース変更
  app.patch<{ Params: { id: string }; Body: { mainPieceId: string } }>(
    '/admin/stores/:id',
    { preHandler: adminGuard },
    async (req, reply) => {
      const r = await pool.query('UPDATE campaign_stores SET main_piece_id=$2 WHERE id=$1 RETURNING id', [
        req.params.id,
        req.body.mainPieceId,
      ]);
      if (r.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
      return { ok: true };
    },
  );

  // 交換レート一覧
  app.get('/admin/exchange-rates', { preHandler: adminGuard }, async () => {
    const rates = await query(
      `SELECT item_id AS "itemId", item_name AS "itemName", coin_cost AS "coinCost",
              daily_cap AS "dailyCap", enabled FROM exchange_rates ORDER BY coin_cost`,
    );
    return { rates };
  });

  // 交換レート更新
  app.patch<{ Params: { itemId: string }; Body: { coinCost?: number; dailyCap?: number; enabled?: boolean } }>(
    '/admin/exchange-rates/:itemId',
    { preHandler: adminGuard },
    async (req, reply) => {
      const { coinCost, dailyCap, enabled } = req.body;
      const r = await pool.query(
        `UPDATE exchange_rates
            SET coin_cost = COALESCE($2, coin_cost),
                daily_cap = COALESCE($3, daily_cap),
                enabled   = COALESCE($4, enabled)
          WHERE item_id=$1 RETURNING item_id`,
        [req.params.itemId, coinCost ?? null, dailyCap ?? null, enabled ?? null],
      );
      if (r.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
      return { ok: true };
    },
  );

  // 不正フラグ（未レビュー）一覧
  app.get('/admin/fraud-flags', { preHandler: adminGuard }, async () => {
    const flags = await query(
      `SELECT ff.id, ff.player_id AS "playerId", p.curator_name AS "curatorName",
              ff.reason, ff.detail, ff.created_at AS "createdAt", ff.reviewed_at AS "reviewedAt",
              p.suspended_until AS "suspendedUntil"
         FROM fraud_flags ff JOIN players p ON p.id = ff.player_id
        ORDER BY ff.created_at DESC LIMIT 100`,
    );
    return { flags };
  });

  // 不正フラグをレビュー済みにし、プレイヤーのサスペンドを解除
  app.post<{ Params: { playerId: string } }>(
    '/admin/players/:playerId/clear-suspension',
    { preHandler: adminGuard },
    async (req) => {
      await pool.query('UPDATE fraud_flags SET reviewed_at=now() WHERE player_id=$1 AND reviewed_at IS NULL', [
        req.params.playerId,
      ]);
      await pool.query('UPDATE players SET suspended_until=NULL WHERE id=$1', [req.params.playerId]);
      return { ok: true };
    },
  );
}
