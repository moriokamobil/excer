/**
 * リピート訪問・レプリカ解放判定（純粋関数・テスト対象）。
 * REQUIREMENTS §3.6 / §4:
 *  - 同一店舗のチェックイン/訪問カウントは1日1回まで
 *  - 5回でレプリカ常設
 *  - 6回目以降で常連ボーナス（絵の具×3）
 */
import { VISIT } from '@lost-museum/shared';

/** 同日判定（YYYY-MM-DD をローカル時刻ではなくUTCで比較） */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** 本日すでに来店済みか（同一店舗は1日1回のみカウント） */
export function alreadyVisitedToday(
  lastVisitedAt: Date | null,
  now: Date,
): boolean {
  if (lastVisitedAt === null) return false;
  return isSameDay(lastVisitedAt, now);
}

export interface VisitState {
  visitCount: number;
  lastVisitedAt: Date | null;
  replicaUnlocked: boolean;
}

export interface VisitOutcome {
  visitCount: number;
  replicaUnlocked: boolean;
  /** この訪問でちょうど5回に達しレプリカが解放された */
  replicaJustUnlocked: boolean;
  /** 6回目以降で付与される絵の具 */
  regularBonusPaint: number;
  /** 本日すでにカウント済みで加算されなかった */
  skippedSameDay: boolean;
}

/**
 * 来店を処理し、訪問カウント・レプリカ解放・常連ボーナスを計算する。
 * 同日2回目以降はカウントせず skippedSameDay=true を返す。
 */
export function processVisit(state: VisitState, now: Date): VisitOutcome {
  if (alreadyVisitedToday(state.lastVisitedAt, now)) {
    return {
      visitCount: state.visitCount,
      replicaUnlocked: state.replicaUnlocked,
      replicaJustUnlocked: false,
      regularBonusPaint: 0,
      skippedSameDay: true,
    };
  }

  const newCount = state.visitCount + 1;
  const nowUnlocked = state.replicaUnlocked || newCount >= VISIT.REPLICA_UNLOCK_COUNT;
  const replicaJustUnlocked =
    !state.replicaUnlocked && newCount >= VISIT.REPLICA_UNLOCK_COUNT;
  // 6回目以降（＝解放済みで、かつ今回が5回超）で常連ボーナス
  const regularBonusPaint =
    newCount > VISIT.REPLICA_UNLOCK_COUNT ? VISIT.REGULAR_BONUS_PAINT : 0;

  return {
    visitCount: newCount,
    replicaUnlocked: nowUnlocked,
    replicaJustUnlocked,
    regularBonusPaint,
    skippedSameDay: false,
  };
}

/** チェックイン（イベント来店）が本日可能か。同一店舗は1日1回。 */
export function canCheckinToday(lastCheckinAt: Date | null, now: Date): boolean {
  return !alreadyVisitedToday(lastCheckinAt, now);
}
