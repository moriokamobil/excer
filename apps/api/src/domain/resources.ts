/**
 * リソース上限・消費ロジック（純粋関数・テスト対象）。
 * REQUIREMENTS §3.3: コイン1日3,000 / 絵の具1日20 / 絵の具修復3消費 / ゼンマイ1再生1消費(最大10・時間回復)。
 */
import { RESOURCE_LIMITS } from '@lost-museum/shared';

export interface ResourceState {
  coins: number;
  coinsEarnedToday: number;
  restorePaint: number;
  gramophoneSpring: number;
}

/**
 * コイン付与。1日上限3,000でクランプする。
 * @returns 実際に付与された量・付与後残高・上限に達したか
 */
export function grantCoins(
  state: Pick<ResourceState, 'coins' | 'coinsEarnedToday'>,
  requested: number,
): { granted: number; coins: number; coinsEarnedToday: number; capped: boolean } {
  if (requested < 0) throw new Error('付与量は0以上でなければなりません');
  const remaining = Math.max(0, RESOURCE_LIMITS.COIN_DAILY_CAP - state.coinsEarnedToday);
  const granted = Math.min(requested, remaining);
  return {
    granted,
    coins: state.coins + granted,
    coinsEarnedToday: state.coinsEarnedToday + granted,
    capped: granted < requested,
  };
}

/**
 * 絵の具付与。1日上限は「本日獲得済み量」を別途持たない設計のため、
 * 呼び出し側が本日獲得量を渡してクランプする。
 */
export function grantPaint(
  currentPaint: number,
  paintEarnedToday: number,
  requested: number,
): { granted: number; restorePaint: number; paintEarnedToday: number; capped: boolean } {
  if (requested < 0) throw new Error('付与量は0以上でなければなりません');
  const remaining = Math.max(0, RESOURCE_LIMITS.PAINT_DAILY_CAP - paintEarnedToday);
  const granted = Math.min(requested, remaining);
  return {
    granted,
    restorePaint: currentPaint + granted,
    paintEarnedToday: paintEarnedToday + granted,
    capped: granted < requested,
  };
}

/** 絵の具でピースを修復可能か（3以上保有） */
export function canAffordRestore(restorePaint: number): boolean {
  return restorePaint >= RESOURCE_LIMITS.PAINT_PER_RESTORE;
}

/** 修復で絵の具を消費した後の残高。不足時は例外。 */
export function spendPaintForRestore(restorePaint: number): number {
  if (!canAffordRestore(restorePaint)) {
    throw new Error('修復絵の具が不足しています');
  }
  return restorePaint - RESOURCE_LIMITS.PAINT_PER_RESTORE;
}

/** BGM再生でゼンマイを消費可能か */
export function canAffordPlay(gramophoneSpring: number): boolean {
  return gramophoneSpring >= RESOURCE_LIMITS.SPRING_PER_PLAY;
}

/** BGM再生でゼンマイを消費した後の残高。不足時は例外。 */
export function spendSpringForPlay(gramophoneSpring: number): number {
  if (!canAffordPlay(gramophoneSpring)) {
    throw new Error('蓄音機のゼンマイが不足しています');
  }
  return gramophoneSpring - RESOURCE_LIMITS.SPRING_PER_PLAY;
}

/**
 * ゼンマイの時間回復量を計算する。
 * 最後の更新からの経過時間に応じて回復し、最大値(10)でクランプ。
 * @returns 回復後の残高
 */
export function recoverSpring(
  currentSpring: number,
  lastUpdatedAt: Date,
  now: Date,
): number {
  if (currentSpring >= RESOURCE_LIMITS.SPRING_MAX) return currentSpring;
  const elapsedMin = (now.getTime() - lastUpdatedAt.getTime()) / 60000;
  if (elapsedMin <= 0) return currentSpring;
  const recovered = Math.floor(elapsedMin / RESOURCE_LIMITS.SPRING_RECOVER_MINUTES);
  return Math.min(RESOURCE_LIMITS.SPRING_MAX, currentSpring + recovered);
}

/** ゼンマイ付与（最大10でクランプ） */
export function grantSpring(currentSpring: number, requested: number): number {
  if (requested < 0) throw new Error('付与量は0以上でなければなりません');
  return Math.min(RESOURCE_LIMITS.SPRING_MAX, currentSpring + requested);
}

/** コインで交換できるか（残高チェック） */
export function canAffordCoins(coins: number, cost: number): boolean {
  return coins >= cost;
}

/** コイン消費後の残高。不足時は例外。 */
export function spendCoins(coins: number, cost: number): number {
  if (!canAffordCoins(coins, cost)) {
    throw new Error('発見コインが不足しています');
  }
  return coins - cost;
}
