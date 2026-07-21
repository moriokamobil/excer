import { describe, it, expect } from 'vitest';
import {
  grantCoins,
  grantPaint,
  canAffordRestore,
  spendPaintForRestore,
  canAffordPlay,
  spendSpringForPlay,
  recoverSpring,
  grantSpring,
  canAffordCoins,
  spendCoins,
} from './resources';

describe('grantCoins（1日上限3,000）', () => {
  it('上限内はそのまま付与', () => {
    const r = grantCoins({ coins: 100, coinsEarnedToday: 0 }, 500);
    expect(r.granted).toBe(500);
    expect(r.coins).toBe(600);
    expect(r.coinsEarnedToday).toBe(500);
    expect(r.capped).toBe(false);
  });

  it('上限を超える分はクランプされcapped=true', () => {
    const r = grantCoins({ coins: 0, coinsEarnedToday: 2900 }, 500);
    expect(r.granted).toBe(100);
    expect(r.coinsEarnedToday).toBe(3000);
    expect(r.capped).toBe(true);
  });

  it('すでに上限到達なら0付与', () => {
    const r = grantCoins({ coins: 3000, coinsEarnedToday: 3000 }, 100);
    expect(r.granted).toBe(0);
    expect(r.capped).toBe(true);
  });

  it('負の付与量は例外', () => {
    expect(() => grantCoins({ coins: 0, coinsEarnedToday: 0 }, -1)).toThrow();
  });
});

describe('grantPaint（1日上限20）', () => {
  it('上限内はそのまま', () => {
    const r = grantPaint(5, 0, 10);
    expect(r.granted).toBe(10);
    expect(r.restorePaint).toBe(15);
    expect(r.paintEarnedToday).toBe(10);
    expect(r.capped).toBe(false);
  });
  it('上限超過はクランプ', () => {
    const r = grantPaint(0, 18, 5);
    expect(r.granted).toBe(2);
    expect(r.paintEarnedToday).toBe(20);
    expect(r.capped).toBe(true);
  });
  it('負値は例外', () => {
    expect(() => grantPaint(0, 0, -3)).toThrow();
  });
});

describe('絵の具の修復消費（3消費）', () => {
  it('3以上で修復可能', () => {
    expect(canAffordRestore(3)).toBe(true);
    expect(canAffordRestore(2)).toBe(false);
  });
  it('消費後は3減る', () => {
    expect(spendPaintForRestore(5)).toBe(2);
  });
  it('不足時は例外', () => {
    expect(() => spendPaintForRestore(2)).toThrow();
  });
});

describe('ゼンマイの再生消費（1消費）', () => {
  it('1以上で再生可能', () => {
    expect(canAffordPlay(1)).toBe(true);
    expect(canAffordPlay(0)).toBe(false);
  });
  it('消費後は1減る', () => {
    expect(spendSpringForPlay(3)).toBe(2);
  });
  it('不足時は例外', () => {
    expect(() => spendSpringForPlay(0)).toThrow();
  });
});

describe('recoverSpring（30分/1回復・最大10）', () => {
  const t0 = new Date('2026-07-20T00:00:00Z');
  it('30分未満は回復なし', () => {
    const now = new Date('2026-07-20T00:20:00Z');
    expect(recoverSpring(3, t0, now)).toBe(3);
  });
  it('65分で2回復', () => {
    const now = new Date('2026-07-20T01:05:00Z');
    expect(recoverSpring(3, t0, now)).toBe(5);
  });
  it('最大10を超えない', () => {
    const now = new Date('2026-07-21T00:00:00Z'); // 24h = 48回復分
    expect(recoverSpring(3, t0, now)).toBe(10);
  });
  it('すでに最大なら変化なし', () => {
    const now = new Date('2026-07-21T00:00:00Z');
    expect(recoverSpring(10, t0, now)).toBe(10);
  });
  it('時刻逆転は変化なし', () => {
    const past = new Date('2026-07-19T00:00:00Z');
    expect(recoverSpring(3, t0, past)).toBe(3);
  });
});

describe('grantSpring（最大10）', () => {
  it('通常付与', () => {
    expect(grantSpring(5, 3)).toBe(8);
  });
  it('最大でクランプ', () => {
    expect(grantSpring(8, 5)).toBe(10);
  });
  it('負値は例外', () => {
    expect(() => grantSpring(0, -1)).toThrow();
  });
});

describe('コイン交換', () => {
  it('残高十分なら交換可', () => {
    expect(canAffordCoins(1000, 800)).toBe(true);
    expect(canAffordCoins(500, 800)).toBe(false);
  });
  it('消費後残高', () => {
    expect(spendCoins(1000, 800)).toBe(200);
  });
  it('不足時は例外', () => {
    expect(() => spendCoins(500, 800)).toThrow();
  });
});
