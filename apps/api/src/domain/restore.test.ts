import { describe, it, expect } from 'vitest';
import {
  canRestorePiece,
  computeArtworkState,
  isArtworkCompleted,
  applyRestore,
  restoreStep,
  unrestoredOwnedCount,
  type PieceProgress,
} from './restore';

const mk = (id: string, owned: boolean, isRestored: boolean): PieceProgress => ({
  pieceId: id,
  owned,
  isRestored,
});

describe('canRestorePiece', () => {
  const pieces = [mk('p1', true, false), mk('p2', false, false), mk('p3', true, true)];

  it('所持済み・未修復・絵の具十分なら可', () => {
    expect(canRestorePiece(pieces, 'p1', 3, 3)).toEqual({ ok: true, reason: null });
  });
  it('未所持は not_owned', () => {
    expect(canRestorePiece(pieces, 'p2', 3, 3).reason).toBe('not_owned');
  });
  it('存在しないピースは not_owned', () => {
    expect(canRestorePiece(pieces, 'zzz', 3, 3).reason).toBe('not_owned');
  });
  it('修復済みは already_restored', () => {
    expect(canRestorePiece(pieces, 'p3', 3, 3).reason).toBe('already_restored');
  });
  it('絵の具不足は not_enough_paint', () => {
    expect(canRestorePiece(pieces, 'p1', 2, 3).reason).toBe('not_enough_paint');
  });
});

describe('computeArtworkState', () => {
  it('ピース定義なしは undiscovered', () => {
    expect(computeArtworkState([])).toBe('undiscovered');
  });
  it('1つも所持なしは undiscovered', () => {
    expect(computeArtworkState([mk('a', false, false), mk('b', false, false)])).toBe(
      'undiscovered',
    );
  });
  it('一部所持は restoring', () => {
    expect(computeArtworkState([mk('a', true, false), mk('b', false, false)])).toBe(
      'restoring',
    );
  });
  it('全所持だが未修復ありは restoring', () => {
    expect(computeArtworkState([mk('a', true, true), mk('b', true, false)])).toBe(
      'restoring',
    );
  });
  it('全所持・全修復は completed', () => {
    expect(computeArtworkState([mk('a', true, true), mk('b', true, true)])).toBe(
      'completed',
    );
  });
});

describe('isArtworkCompleted', () => {
  it('完成判定', () => {
    expect(isArtworkCompleted([mk('a', true, true)])).toBe(true);
    expect(isArtworkCompleted([mk('a', true, false)])).toBe(false);
  });
});

describe('applyRestore（イミュータブル）', () => {
  it('対象のみ修復済みに', () => {
    const pieces = [mk('a', true, false), mk('b', true, false)];
    const next = applyRestore(pieces, 'a');
    expect(next[0].isRestored).toBe(true);
    expect(next[1].isRestored).toBe(false);
    // 元は不変
    expect(pieces[0].isRestored).toBe(false);
  });
});

describe('restoreStep', () => {
  it('最後の1枚を修復すると justCompleted=true', () => {
    const pieces = [mk('a', true, true), mk('b', true, false)];
    const r = restoreStep(pieces, 'b');
    expect(r.state).toBe('completed');
    expect(r.justCompleted).toBe(true);
  });
  it('途中の修復では justCompleted=false', () => {
    const pieces = [mk('a', true, false), mk('b', true, false)];
    const r = restoreStep(pieces, 'a');
    expect(r.state).toBe('restoring');
    expect(r.justCompleted).toBe(false);
  });
  it('すでに完成済みなら justCompleted=false', () => {
    const pieces = [mk('a', true, true)];
    const r = restoreStep(pieces, 'a');
    expect(r.justCompleted).toBe(false);
  });
});

describe('unrestoredOwnedCount', () => {
  it('所持済み未修復のみ数える', () => {
    const pieces = [
      mk('a', true, false),
      mk('b', true, true),
      mk('c', false, false),
      mk('d', true, false),
    ];
    expect(unrestoredOwnedCount(pieces)).toBe(2);
  });
});
