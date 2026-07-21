import type { FastifyInstance } from 'fastify';
import { pool, query, queryOne, withTransaction } from '../infra/db';
import { config } from '../infra/config';
import { MESSAGES } from '@lost-museum/shared';
import { grantPaint, grantSpring } from '../domain/resources';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'mock-citras-secret';

export async function workRoutes(app: FastifyInstance): Promise<void> {
  // GET /work/tasks?near=lat,lng — mock citras 経由でワークタスク一覧
  app.get<{ Querystring: { near?: string } }>(
    '/work/tasks',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const near = req.query.near ? `?near=${encodeURIComponent(req.query.near)}` : '';
      try {
        const res = await fetch(`${config.mockCitrasUrl}/work-tasks${near}`);
        const data = (await res.json()) as { tasks: any[] };
        const tasks = data.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          lat: t.lat,
          lng: t.lng,
          rewardPaint: t.rewardPaint,
          rewardSpring: t.rewardSpring,
          isRelay: t.isRelay,
          distanceM: t.distanceKm != null ? Math.round(t.distanceKm * 1000) : undefined,
        }));
        return { tasks };
      } catch {
        return reply.code(502).send({ error: 'mock_citras_unavailable', message: 'ワーク情報を取得できません' });
      }
    },
  );

  // POST /webhooks/work-completed — mock citras からの承認Webhook（受信IF）
  // 承認済みタスクを記録するのみ。報酬付与は claim-reward で冪等に行う。
  app.post<{ Body: any; Headers: { 'x-webhook-secret'?: string } }>(
    '/webhooks/work-completed',
    async (req, reply) => {
      const secret = req.headers['x-webhook-secret'];
      if (secret !== WEBHOOK_SECRET) {
        return reply.code(401).send({ error: 'invalid_webhook_secret' });
      }
      const b = (req.body ?? {}) as {
        task_id?: string;
        player_id?: string;
        is_relay?: boolean;
        approved?: boolean;
      };
      if (!b.task_id || !b.player_id || b.approved !== true) {
        return reply.code(400).send({ error: 'invalid_payload' });
      }
      await pool.query(
        `INSERT INTO approved_work_tasks (task_id, player_id, is_relay)
         VALUES ($1,$2,$3)
         ON CONFLICT (task_id, player_id) DO NOTHING`,
        [b.task_id, b.player_id, b.is_relay === true],
      );
      return reply.send({ ok: true });
    },
  );

  // POST /work/tasks/:id/claim-reward — 完了報酬受取（承認済み必須・冪等）
  app.post<{ Params: { id: string }; Body: { idempotency_key?: string } }>(
    '/work/tasks/:id/claim-reward',
    { preHandler: app.authGuard },
    async (req, reply) => {
      const taskId = req.params.id;
      const idempotencyKey = req.body?.idempotency_key ?? `${taskId}:${req.playerId}`;

      // 承認済みか確認
      const approved = await queryOne<{ task_id: string; is_relay: boolean; player_id: string }>(
        'SELECT task_id, is_relay, player_id FROM approved_work_tasks WHERE task_id=$1 AND player_id=$2',
        [taskId, req.playerId],
      );
      if (!approved) {
        return reply.code(403).send({ error: 'not_approved', message: MESSAGES.REWARD_NOT_APPROVED });
      }

      // 冪等: 既存 claim があればそれを返す
      const existing = await queryOne(
        `SELECT paint_granted AS "paintGranted", spring_granted AS "springGranted",
                special_piece_id AS "specialPieceId"
           FROM work_reward_claims WHERE idempotency_key=$1`,
        [idempotencyKey],
      );
      if (existing) {
        return reply.send({ ...existing, alreadyClaimed: true });
      }

      // タスク内容を mock citras から取得（報酬額）
      let rewardPaint = approved.is_relay ? 8 : 4;
      let rewardSpring = approved.is_relay ? 4 : 2;
      try {
        const res = await fetch(`${config.mockCitrasUrl}/work-tasks`);
        const data = (await res.json()) as { tasks: any[] };
        const t = data.tasks.find((x) => x.id === taskId);
        if (t) {
          rewardPaint = t.rewardPaint;
          rewardSpring = t.rewardSpring;
        }
      } catch {
        /* mock不通でも既定値で継続 */
      }

      const result = await withTransaction(async (client) => {
        const pRes = await client.query('SELECT * FROM players WHERE id=$1 FOR UPDATE', [req.playerId]);
        const player = pRes.rows[0];

        // 絵の具（1日上限尊重）・ゼンマイ（最大10）付与
        const g = grantPaint(player.restore_paint, player.paint_earned_today, rewardPaint);
        const newSpring = grantSpring(player.gramophone_spring, rewardSpring);
        await client.query(
          'UPDATE players SET restore_paint=$2, paint_earned_today=$3, gramophone_spring=$4 WHERE id=$1',
          [req.playerId, g.restorePaint, g.paintEarnedToday, newSpring],
        );

        // 回送タスクは特別ピース抽選（未所持のsubピースからランダム1つ）
        let specialPieceId: string | null = null;
        if (approved.is_relay) {
          const cand = await client.query(
            `SELECT ap.id FROM artwork_pieces ap
              WHERE ap.piece_type='sub'
                AND ap.id NOT IN (SELECT piece_id FROM player_pieces WHERE player_id=$1)
              ORDER BY random() LIMIT 1`,
            [req.playerId],
          );
          if (cand.rows[0]) {
            specialPieceId = cand.rows[0].id;
            await client.query(
              'INSERT INTO player_pieces (player_id, piece_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
              [req.playerId, specialPieceId],
            );
          }
        }

        // claim記録（idempotency_key UNIQUE で二重付与防止）
        try {
          await client.query(
            `INSERT INTO work_reward_claims (player_id, task_id, idempotency_key, paint_granted, spring_granted, special_piece_id)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [req.playerId, taskId, idempotencyKey, g.granted, rewardSpring, specialPieceId],
          );
        } catch (err: any) {
          if (err.code === '23505') {
            // 同時実行での二重: 既存を返す
            return { duplicated: true };
          }
          throw err;
        }

        return {
          paintGranted: g.granted,
          springGranted: rewardSpring,
          specialPieceId,
          alreadyClaimed: false,
        };
      });

      if ('duplicated' in result) {
        const existing2 = await queryOne(
          `SELECT paint_granted AS "paintGranted", spring_granted AS "springGranted",
                  special_piece_id AS "specialPieceId"
             FROM work_reward_claims WHERE idempotency_key=$1`,
          [idempotencyKey],
        );
        return reply.send({ ...existing2, alreadyClaimed: true });
      }
      return reply.send(result);
    },
  );
}
