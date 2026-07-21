/** プレイヤー関連のDB操作・デイリーリセット・サスペンド判定。 */
import type { PoolClient } from 'pg';
import { pool, queryOne } from '../infra/db';
import { recoverSpring } from '../domain/resources';

export interface PlayerRow {
  id: string;
  citras_user_id: string;
  curator_name: string;
  level: number;
  xp: number;
  coins: number;
  coins_earned_today: number;
  paint_earned_today: number;
  restore_paint: number;
  gramophone_spring: number;
  spring_updated_at: string;
  daily_reset_on: string;
  suspended_until: string | null;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** デイリーリセット + ゼンマイ時間回復を反映してプレイヤーを返す。 */
export async function loadPlayerFresh(
  client: PoolClient | typeof pool,
  playerId: string,
): Promise<PlayerRow | null> {
  const res = await client.query('SELECT * FROM players WHERE id=$1', [playerId]);
  const p = res.rows[0] as PlayerRow | undefined;
  if (!p) return null;

  const today = todayUtc();
  const spring = recoverSpring(
    p.gramophone_spring,
    new Date(p.spring_updated_at),
    new Date(),
  );

  const needsDailyReset = p.daily_reset_on !== today;
  const needsSpringUpdate = spring !== p.gramophone_spring;

  if (needsDailyReset || needsSpringUpdate) {
    const upd = await client.query(
      `UPDATE players SET
         coins_earned_today = CASE WHEN $2 THEN 0 ELSE coins_earned_today END,
         paint_earned_today = CASE WHEN $2 THEN 0 ELSE paint_earned_today END,
         daily_reset_on = $3,
         gramophone_spring = $4,
         spring_updated_at = CASE WHEN $5 THEN now() ELSE spring_updated_at END
       WHERE id=$1 RETURNING *`,
      [playerId, needsDailyReset, today, spring, needsSpringUpdate],
    );
    return upd.rows[0] as PlayerRow;
  }
  return p;
}

/** サスペンド中か（suspended_until が未来） */
export function isSuspended(p: Pick<PlayerRow, 'suspended_until'>): boolean {
  return p.suspended_until !== null && new Date(p.suspended_until).getTime() > Date.now();
}

/** citras_user_id からプレイヤーを取得（なければ作成） */
export async function upsertPlayerByCitrasId(
  citrasUserId: string,
  curatorName: string,
): Promise<PlayerRow> {
  const existing = await queryOne<PlayerRow>(
    'SELECT * FROM players WHERE citras_user_id=$1',
    [citrasUserId],
  );
  if (existing) return existing;
  const created = await queryOne<PlayerRow>(
    `INSERT INTO players (citras_user_id, curator_name) VALUES ($1,$2) RETURNING *`,
    [citrasUserId, curatorName],
  );
  return created!;
}

/** 監査ログ記録（位置つき） */
export async function recordAction(
  client: PoolClient | typeof pool,
  playerId: string,
  actionType: string,
  loc?: { lat: number; lng: number; accuracy: number },
): Promise<void> {
  if (loc) {
    await client.query(
      `INSERT INTO actions (player_id, action_type, location, accuracy)
       VALUES ($1,$2, ST_SetSRID(ST_MakePoint($3,$4),4326)::geography, $5)`,
      [playerId, actionType, loc.lng, loc.lat, loc.accuracy],
    );
  } else {
    await client.query(
      'INSERT INTO actions (player_id, action_type) VALUES ($1,$2)',
      [playerId, actionType],
    );
  }
}

/** 直近アクションの位置と時刻を取得（速度チェック用） */
export async function lastActionLocation(
  playerId: string,
): Promise<{ lat: number; lng: number; at: Date } | null> {
  const row = await queryOne<{ lat: number; lng: number; created_at: string }>(
    `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng, created_at
       FROM actions
      WHERE player_id=$1 AND location IS NOT NULL
      ORDER BY created_at DESC LIMIT 1`,
    [playerId],
  );
  return row ? { lat: row.lat, lng: row.lng, at: new Date(row.created_at) } : null;
}

/**
 * fraud_flag を記録し、閾値到達で自動サスペンドする。
 * @returns サスペンドされたか
 */
export async function recordFraudFlag(
  playerId: string,
  reason: string,
  detail: Record<string, unknown>,
  suspendThreshold: number,
  suspendHours: number,
): Promise<boolean> {
  await pool.query(
    'INSERT INTO fraud_flags (player_id, reason, detail) VALUES ($1,$2,$3)',
    [playerId, reason, JSON.stringify(detail)],
  );
  const cnt = await queryOne<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM fraud_flags WHERE player_id=$1 AND reviewed_at IS NULL',
    [playerId],
  );
  if (cnt && parseInt(cnt.count, 10) >= suspendThreshold) {
    await pool.query(
      `UPDATE players SET suspended_until = now() + ($2 || ' hours')::interval WHERE id=$1`,
      [playerId, String(suspendHours)],
    );
    return true;
  }
  return false;
}
