import { describe, it, expect } from 'vitest';
import {
  haversineMeters,
  isAccuracyAcceptable,
  isWithinCheckinRadius,
  speedKmh,
  isImpossibleSpeed,
  validateLocationAction,
} from './distance';

// 東京駅
const TOKYO = { lat: 35.681236, lng: 139.767125 };

describe('haversineMeters', () => {
  it('同一地点は0m', () => {
    expect(haversineMeters(TOKYO, TOKYO)).toBeCloseTo(0, 5);
  });

  it('東京駅〜皇居(約1.4km)を概算できる', () => {
    const imperial = { lat: 35.685175, lng: 139.752799 };
    const d = haversineMeters(TOKYO, imperial);
    expect(d).toBeGreaterThan(1200);
    expect(d).toBeLessThan(1600);
  });

  it('緯度0.001度差は約111m', () => {
    const d = haversineMeters(TOKYO, { lat: TOKYO.lat + 0.001, lng: TOKYO.lng });
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
});

describe('isAccuracyAcceptable', () => {
  it('100m以下は許容', () => {
    expect(isAccuracyAcceptable(12.5)).toBe(true);
    expect(isAccuracyAcceptable(100)).toBe(true);
    expect(isAccuracyAcceptable(0)).toBe(true);
  });
  it('100m超は拒否', () => {
    expect(isAccuracyAcceptable(100.1)).toBe(false);
    expect(isAccuracyAcceptable(500)).toBe(false);
  });
  it('負値・非有限は拒否', () => {
    expect(isAccuracyAcceptable(-1)).toBe(false);
    expect(isAccuracyAcceptable(NaN)).toBe(false);
    expect(isAccuracyAcceptable(Infinity)).toBe(false);
  });
});

describe('isWithinCheckinRadius', () => {
  it('80m以内はtrue', () => {
    const near = { lat: TOKYO.lat + 0.0003, lng: TOKYO.lng }; // 約33m
    expect(isWithinCheckinRadius(near, TOKYO)).toBe(true);
  });
  it('80m超はfalse', () => {
    const far = { lat: TOKYO.lat + 0.001, lng: TOKYO.lng }; // 約111m
    expect(isWithinCheckinRadius(far, TOKYO)).toBe(false);
  });
});

describe('speedKmh', () => {
  it('経過時間0以下はInfinity', () => {
    expect(speedKmh(TOKYO, { lat: 35.7, lng: 139.8 }, 0)).toBe(Infinity);
    expect(speedKmh(TOKYO, { lat: 35.7, lng: 139.8 }, -10)).toBe(Infinity);
  });
  it('1km/1時間はほぼ1km/h', () => {
    const p = { lat: TOKYO.lat + 0.009, lng: TOKYO.lng }; // 約1km
    const v = speedKmh(TOKYO, p, 3600);
    expect(v).toBeGreaterThan(0.9);
    expect(v).toBeLessThan(1.1);
  });
});

describe('isImpossibleSpeed', () => {
  it('前回位置なし(null)は常にfalse', () => {
    expect(isImpossibleSpeed(null, TOKYO, 1)).toBe(false);
  });
  it('1秒で10km移動(=36000km/h)は不可能', () => {
    const far = { lat: 35.77, lng: 139.85 };
    expect(isImpossibleSpeed(TOKYO, far, 1)).toBe(true);
  });
  it('徒歩相当(5km/h)は可能', () => {
    const p = { lat: TOKYO.lat + 0.009, lng: TOKYO.lng }; // 約1km
    expect(isImpossibleSpeed(TOKYO, p, 720)).toBe(false); // 12分で1km=5km/h
  });
  it('150km/h境界: わずかに超えると不可能', () => {
    // 160km/h相当: 3600秒で160km
    const p = { lat: TOKYO.lat + 0.009 * 160, lng: TOKYO.lng };
    expect(isImpossibleSpeed(TOKYO, p, 3600)).toBe(true);
  });
});

describe('validateLocationAction', () => {
  const base = {
    player: TOKYO,
    accuracyM: 10,
    isMockLocation: false,
  };

  it('正常なチェックインはok', () => {
    const spot = { lat: TOKYO.lat + 0.0002, lng: TOKYO.lng };
    const r = validateLocationAction({ ...base, spot });
    expect(r.ok).toBe(true);
    expect(r.reason).toBeNull();
  });

  it('mock位置はfraud_flag付きで拒否', () => {
    const r = validateLocationAction({ ...base, isMockLocation: true });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('mock_location');
    expect(r.fraudFlag).toBe(true);
  });

  it('精度不足はfraud_flagなしで拒否', () => {
    const r = validateLocationAction({ ...base, accuracyM: 150 });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('accuracy_too_low');
    expect(r.fraudFlag).toBe(false);
  });

  it('速度異常はfraud_flag付きで拒否', () => {
    const r = validateLocationAction({
      ...base,
      lastLocation: { lat: 34.0, lng: 135.0 }, // 大阪
      elapsedSeconds: 60,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('impossible_speed');
    expect(r.fraudFlag).toBe(true);
  });

  it('スポット遠すぎはfraud_flagなしで拒否', () => {
    const spot = { lat: TOKYO.lat + 0.01, lng: TOKYO.lng }; // 約1.1km
    const r = validateLocationAction({ ...base, spot });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('too_far');
    expect(r.fraudFlag).toBe(false);
  });

  it('検証順序: mock検出が精度より優先', () => {
    const r = validateLocationAction({
      ...base,
      isMockLocation: true,
      accuracyM: 999,
    });
    expect(r.reason).toBe('mock_location');
  });
});
