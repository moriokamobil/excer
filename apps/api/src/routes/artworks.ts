import type { FastifyInstance } from 'fastify';
import { pool, query, queryOne, withTransaction } from '../infra/db';
import { RESOURCE_LIMITS, MESSAGES } from '@lost-museum/shared';
import { canRestorePiece } from '../domain/restore';
import { spendPaintForRestore } from '../domain/resources';
import {
  listArtworksWithProgress,
  getArtworkWithProgress,
  syncArtworkState,
} from '../services/artworks';
import { recordAction } from '../services/players';

export async function artworkRoutes(app: FastifyInstance): Promise<void> {
  // GET /artworks — 名画一覧（状態つき）
  app.get('/artworks', { preHandler: app.authGuard }, async (req) => {
    return { artworks: await listArtworksWithProgress(req.playerId) };
  });

  // GET /artworks/:id — 詳細・ピース構成・所持状況
  app.get<{ Params: { id: string } }>(
    '/artworks/:id',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const a = await getArtworkWithProgress(req.playerId, req.params.id);
      if (!a) return reply.code(404).send({ error: 'not_found', message: '名画が見つかりません' });
      return { artwork: a };
    },
  );

  // GET /artworks/:id/music — 完成後に解放されるBGM情報
  app.get<{ Params: { id: string } }>(
    '/artworks/:id/music',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const artwork = await queryOne<{ linked_music_id: string | null }>(
        'SELECT linked_music_id FROM artwork_masters WHERE id=$1',
        [req.params.id],
      );
      if (!artwork) return reply.code(404).send({ error: 'not_found', message: '名画が見つかりません' });
      const pa = await queryOne<{ state: string }>(
        'SELECT state FROM player_artworks WHERE player_id=$1 AND artwork_id=$2',
        [req.playerId, req.params.id],
      );
      const unlocked = pa?.state === 'completed';
      if (!artwork.linked_music_id) return { unlocked, music: null };
      const music = await queryOne(
        `SELECT id, title_ja AS "titleJa", composer, composer_death_year AS "composerDeathYear",
                recording_source AS "recordingSource", recording_license AS "recordingLicense",
                audio_url AS "audioUrl", global_clearance_checked AS "globalClearanceChecked"
         FROM music_masters WHERE id=$1`,
        [artwork.linked_music_id],
      );
      return { unlocked, music: unlocked ? music : { ...(music as any), audioUrl: null } };
    },
  );

  // POST /artworks/:id/restore — ピース修復（絵の具3消費・完成判定）
  app.post<{ Params: { id: string }; Body: { piece_id?: string } }>(
    '/artworks/:id/restore',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const artworkId = req.params.id;
      const pieceId = req.body?.piece_id;
      if (!pieceId) return reply.code(400).send({ error: 'bad_request', message: 'piece_id が必要です' });

      // 対象ピースが本当にこの名画のものか
      const piece = await queryOne<{ id: string; artwork_id: string }>(
        'SELECT id, artwork_id FROM artwork_pieces WHERE id=$1',
        [pieceId],
      );
      if (!piece || piece.artwork_id !== artworkId) {
        return reply.code(404).send({ error: 'not_found', message: MESSAGES.PIECE_NOT_OWNED });
      }

      const result = await withTransaction(async (client) => {
        // 行ロックでプレイヤー取得
        const pRes = await client.query('SELECT * FROM players WHERE id=$1 FOR UPDATE', [req.playerId]);
        const player = pRes.rows[0];

        const ownedRes = await client.query(
          `SELECT ap.id AS piece_id,
                  (pp.player_id IS NOT NULL) AS owned,
                  COALESCE(pp.is_restored, false) AS is_restored
             FROM artwork_pieces ap
             LEFT JOIN player_pieces pp ON pp.piece_id = ap.id AND pp.player_id=$1
            WHERE ap.artwork_id=$2`,
          [req.playerId, artworkId],
        );
        const pieces = ownedRes.rows.map((r: any) => ({
          pieceId: r.piece_id,
          owned: r.owned,
          isRestored: r.is_restored,
        }));

        const check = canRestorePiece(
          pieces,
          pieceId,
          player.restore_paint,
          RESOURCE_LIMITS.PAINT_PER_RESTORE,
        );
        if (!check.ok) {
          const msg =
            check.reason === 'not_owned'
              ? MESSAGES.PIECE_NOT_OWNED
              : check.reason === 'already_restored'
                ? MESSAGES.PIECE_ALREADY_RESTORED
                : MESSAGES.NOT_ENOUGH_PAINT;
          return { httpError: { code: 400, error: check.reason, message: msg } };
        }

        // 絵の具消費・ピース修復
        const remaining = spendPaintForRestore(player.restore_paint);
        await client.query('UPDATE players SET restore_paint=$2 WHERE id=$1', [req.playerId, remaining]);
        await client.query(
          'UPDATE player_pieces SET is_restored=true WHERE player_id=$1 AND piece_id=$2',
          [req.playerId, pieceId],
        );

        const sync = await syncArtworkState(client as any, req.playerId, artworkId);
        await recordAction(client as any, req.playerId, 'restore');

        return {
          pieceId,
          paintSpent: RESOURCE_LIMITS.PAINT_PER_RESTORE,
          artworkState: sync.state,
          artworkCompleted: sync.justCompleted,
          remainingPaint: remaining,
        };
      });

      if ('httpError' in result && result.httpError) {
        return reply.code(result.httpError.code).send({
          error: result.httpError.error,
          message: result.httpError.message,
        });
      }

      // 完成時は解放楽曲IDを付与
      let unlockedMusicId: string | null = null;
      if ((result as any).artworkCompleted) {
        const a = await queryOne<{ linked_music_id: string | null }>(
          'SELECT linked_music_id FROM artwork_masters WHERE id=$1',
          [artworkId],
        );
        unlockedMusicId = a?.linked_music_id ?? null;
      }
      return { ...result, unlockedMusicId };
    },
  );

  // GET /pieces — 所持ピース一覧
  app.get('/pieces', { preHandler: app.authGuard }, async (req) => {
    const pieces = await query(
      `SELECT ap.id AS "pieceId", ap.artwork_id AS "artworkId", ap.name, ap.piece_type AS "pieceType",
              ap.crop_x AS "cropX", ap.crop_y AS "cropY", ap.crop_w AS "cropW", ap.crop_h AS "cropH",
              pp.acquired_at AS "acquiredAt", pp.is_restored AS "isRestored"
         FROM player_pieces pp
         JOIN artwork_pieces ap ON ap.id = pp.piece_id
        WHERE pp.player_id=$1
        ORDER BY pp.acquired_at DESC`,
      [req.playerId],
    );
    return { pieces };
  });
}
