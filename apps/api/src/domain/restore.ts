/**
 * 修復ロジック・完成判定（純粋関数・テスト対象）。
 * REQUIREMENTS §3.1 / §5.3: 全ピースが揃い、かつ各ピースを絵の具で修復すると completed。
 */
import { ARTWORK_STATE, type ArtworkState } from '@lost-museum/shared';

export interface PieceProgress {
  pieceId: string;
  owned: boolean;
  isRestored: boolean;
}

/** 対象ピースを修復可能か検証する。 */
export function canRestorePiece(
  pieces: PieceProgress[],
  targetPieceId: string,
  restorePaint: number,
  paintPerRestore: number,
): { ok: boolean; reason: 'not_owned' | 'already_restored' | 'not_enough_paint' | null } {
  const target = pieces.find((p) => p.pieceId === targetPieceId);
  if (!target || !target.owned) return { ok: false, reason: 'not_owned' };
  if (target.isRestored) return { ok: false, reason: 'already_restored' };
  if (restorePaint < paintPerRestore) return { ok: false, reason: 'not_enough_paint' };
  return { ok: true, reason: null };
}

/**
 * 名画の状態を算出する。
 *  - 1つも所持していない → undiscovered
 *  - 全ピース所持 かつ 全ピース修復済み → completed
 *  - それ以外（所持あり）→ restoring
 */
export function computeArtworkState(pieces: PieceProgress[]): ArtworkState {
  if (pieces.length === 0) return ARTWORK_STATE.UNDISCOVERED;
  const anyOwned = pieces.some((p) => p.owned);
  if (!anyOwned) return ARTWORK_STATE.UNDISCOVERED;
  const allOwned = pieces.every((p) => p.owned);
  const allRestored = pieces.every((p) => p.owned && p.isRestored);
  if (allOwned && allRestored) return ARTWORK_STATE.COMPLETED;
  return ARTWORK_STATE.RESTORING;
}

/** 名画が完成状態か */
export function isArtworkCompleted(pieces: PieceProgress[]): boolean {
  return computeArtworkState(pieces) === ARTWORK_STATE.COMPLETED;
}

/**
 * 対象ピースを修復した後のピース進捗を返す（イミュータブル）。
 */
export function applyRestore(
  pieces: PieceProgress[],
  targetPieceId: string,
): PieceProgress[] {
  return pieces.map((p) =>
    p.pieceId === targetPieceId ? { ...p, isRestored: true } : p,
  );
}

/**
 * 修復1回分の結果（状態遷移・完成による楽曲解放判定）を計算する。
 * @returns 修復後ピース・新状態・完成したか
 */
export function restoreStep(
  pieces: PieceProgress[],
  targetPieceId: string,
): {
  pieces: PieceProgress[];
  state: ArtworkState;
  justCompleted: boolean;
} {
  const before = computeArtworkState(pieces);
  const next = applyRestore(pieces, targetPieceId);
  const after = computeArtworkState(next);
  return {
    pieces: next,
    state: after,
    justCompleted:
      after === ARTWORK_STATE.COMPLETED && before !== ARTWORK_STATE.COMPLETED,
  };
}

/** 所持済みだが未修復のピース数（工房のバッジ表示用） */
export function unrestoredOwnedCount(pieces: PieceProgress[]): number {
  return pieces.filter((p) => p.owned && !p.isRestored).length;
}
