/**
 * mock citras API（REQUIREMENTS §6.2）。
 * カーシェア予約・すきまバイト・クーポン発行など、citras本体を疎結合にモックする。
 * タスク完了時にゲーム側 Webhook (/api/v1/webhooks/work-completed) を発火する。
 */
import Fastify from 'fastify';
import { STATIONS, CAMPAIGN_STORES, WORK_TASKS, type MockWorkTask } from './seed';

const PORT = parseInt(process.env.PORT ?? '4100', 10);
const GAME_WEBHOOK_URL =
  process.env.GAME_WEBHOOK_URL ?? 'http://localhost:4000/api/v1/webhooks/work-completed';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'mock-citras-secret';

const app = Fastify({ logger: true });

// 簡易距離（km）
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

app.get('/health', async () => ({ ok: true, service: 'mock-citras' }));

// カーシェアST一覧
app.get('/stations', async () => ({ stations: STATIONS }));

// 商工会キャンペーン店舗
app.get('/stores/campaign', async () => ({ stores: CAMPAIGN_STORES }));

// すきまバイトタスク（near で距離ソート）
app.get('/work-tasks', async (req) => {
  const q = req.query as { near?: string };
  let tasks: Array<MockWorkTask & { distanceKm?: number }> = [...WORK_TASKS];
  if (q.near) {
    const [lat, lng] = q.near.split(',').map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      tasks = tasks
        .map((t) => ({ ...t, distanceKm: distanceKm(lat, lng, t.lat, t.lng) }))
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }
  }
  return { tasks };
});

// タスク完了（承認）→ Webhook発火
app.post('/work-tasks/:id/complete', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body ?? {}) as { citras_user_id?: string; player_id?: string };
  const task = WORK_TASKS.find((t) => t.id === id);
  if (!task) return reply.code(404).send({ error: 'task_not_found' });
  if (!body.player_id) return reply.code(400).send({ error: 'player_id_required' });

  // 冪等キーは task_id + player_id で一意（同一タスク完了は同キー）
  const idempotencyKey = `${id}:${body.player_id}`;
  const payload = {
    event: 'work.completed',
    task_id: id,
    player_id: body.player_id,
    citras_user_id: body.citras_user_id ?? null,
    is_relay: task.isRelay,
    reward_paint: task.rewardPaint,
    reward_spring: task.rewardSpring,
    idempotency_key: idempotencyKey,
    approved: true,
    completed_at: new Date().toISOString(),
  };

  // ゲーム側Webhookへ非同期発火（失敗しても完了自体は成功扱い）
  fetch(GAME_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-webhook-secret': WEBHOOK_SECRET },
    body: JSON.stringify(payload),
  }).catch((err) => app.log.warn({ err }, 'webhook delivery failed'));

  return reply.send({ ok: true, task_id: id, approved: true, idempotency_key: idempotencyKey });
});

// クーポン発行（コイン交換時にゲーム側から呼ばれる）
app.post('/coupons', async (req, reply) => {
  const body = (req.body ?? {}) as {
    citras_user_id?: string;
    item_id?: string;
    attributes?: Record<string, unknown>;
  };
  if (!body.item_id) return reply.code(400).send({ error: 'item_id_required' });
  const couponCode = `CITRAS-${body.item_id?.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return reply.send({
    coupon_code: couponCode,
    item_id: body.item_id,
    // 乗車30分以上条件を属性で保持（不正防止。実citras側で検証される前提）
    attributes: { min_ride_minutes: 30, ...(body.attributes ?? {}) },
    issued_at: new Date().toISOString(),
  });
});

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`mock-citras on :${PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
