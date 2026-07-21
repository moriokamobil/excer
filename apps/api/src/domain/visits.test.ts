import { describe, it, expect } from 'vitest';
import {
  isSameDay,
  alreadyVisitedToday,
  processVisit,
  canCheckinToday,
  type VisitState,
} from './visits';

describe('isSameDay', () => {
  it('同日はtrue', () => {
    expect(
      isSameDay(new Date('2026-07-20T01:00:00Z'), new Date('2026-07-20T23:00:00Z')),
    ).toBe(true);
  });
  it('別日はfalse', () => {
    expect(
      isSameDay(new Date('2026-07-20T23:00:00Z'), new Date('2026-07-21T00:00:00Z')),
    ).toBe(false);
  });
});

describe('alreadyVisitedToday', () => {
  const now = new Date('2026-07-20T12:00:00Z');
  it('初回(null)はfalse', () => {
    expect(alreadyVisitedToday(null, now)).toBe(false);
  });
  it('本日訪問済みはtrue', () => {
    expect(alreadyVisitedToday(new Date('2026-07-20T09:00:00Z'), now)).toBe(true);
  });
  it('昨日訪問はfalse', () => {
    expect(alreadyVisitedToday(new Date('2026-07-19T09:00:00Z'), now)).toBe(false);
  });
});

describe('processVisit', () => {
  const now = new Date('2026-07-20T12:00:00Z');
  const yesterday = new Date('2026-07-19T12:00:00Z');

  it('初回訪問はカウント1', () => {
    const state: VisitState = { visitCount: 0, lastVisitedAt: null, replicaUnlocked: false };
    const r = processVisit(state, now);
    expect(r.visitCount).toBe(1);
    expect(r.replicaUnlocked).toBe(false);
    expect(r.skippedSameDay).toBe(false);
  });

  it('同日2回目はカウントされない', () => {
    const state: VisitState = {
      visitCount: 2,
      lastVisitedAt: new Date('2026-07-20T09:00:00Z'),
      replicaUnlocked: false,
    };
    const r = processVisit(state, now);
    expect(r.visitCount).toBe(2);
    expect(r.skippedSameDay).toBe(true);
    expect(r.regularBonusPaint).toBe(0);
  });

  it('5回目でレプリカ解放', () => {
    const state: VisitState = {
      visitCount: 4,
      lastVisitedAt: yesterday,
      replicaUnlocked: false,
    };
    const r = processVisit(state, now);
    expect(r.visitCount).toBe(5);
    expect(r.replicaUnlocked).toBe(true);
    expect(r.replicaJustUnlocked).toBe(true);
    expect(r.regularBonusPaint).toBe(0); // 5回目自体はボーナスなし
  });

  it('6回目以降で常連ボーナス絵の具×3', () => {
    const state: VisitState = {
      visitCount: 5,
      lastVisitedAt: yesterday,
      replicaUnlocked: true,
    };
    const r = processVisit(state, now);
    expect(r.visitCount).toBe(6);
    expect(r.replicaJustUnlocked).toBe(false);
    expect(r.regularBonusPaint).toBe(3);
  });

  it('4回目まではレプリカ未解放', () => {
    const state: VisitState = {
      visitCount: 3,
      lastVisitedAt: yesterday,
      replicaUnlocked: false,
    };
    const r = processVisit(state, now);
    expect(r.visitCount).toBe(4);
    expect(r.replicaUnlocked).toBe(false);
    expect(r.replicaJustUnlocked).toBe(false);
  });
});

describe('canCheckinToday', () => {
  const now = new Date('2026-07-20T12:00:00Z');
  it('初回は可', () => {
    expect(canCheckinToday(null, now)).toBe(true);
  });
  it('本日済みは不可', () => {
    expect(canCheckinToday(new Date('2026-07-20T08:00:00Z'), now)).toBe(false);
  });
  it('昨日なら可', () => {
    expect(canCheckinToday(new Date('2026-07-19T08:00:00Z'), now)).toBe(true);
  });
});
