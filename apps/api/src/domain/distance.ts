/**
 * 距離・速度判定（純粋関数・テスト対象）。
 * REQUIREMENTS §4 / §6.1 に対応:
 *  - accuracy > 100m は拒否
 *  - 対象スポットとの距離 ≤ 80m
 *  - 前回アクションからの移動速度 > 150km/h 相当なら拒否 + fraud_flag
 */
import { FRAUD } from '@lost-museum/shared';

export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6371000;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * 2点間の距離をメートルで返す（Haversine 公式）。
 */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 位置精度が許容範囲か（accuracy ≤ 100m） */
export function isAccuracyAcceptable(accuracyM: number): boolean {
  return Number.isFinite(accuracyM) && accuracyM >= 0 && accuracyM <= FRAUD.MAX_ACCURACY_M;
}

/** 対象スポットの半径内(≤80m)か */
export function isWithinCheckinRadius(player: GeoPoint, spot: GeoPoint): boolean {
  return haversineMeters(player, spot) <= FRAUD.CHECKIN_RADIUS_M;
}

/**
 * 前回アクションからの移動速度(km/h)を計算する。
 * 経過時間が 0 以下（時刻逆転含む）の場合は Infinity を返し、後続で異常扱いにする。
 */
export function speedKmh(
  from: GeoPoint,
  to: GeoPoint,
  elapsedSeconds: number,
): number {
  if (elapsedSeconds <= 0) return Infinity;
  const meters = haversineMeters(from, to);
  const hours = elapsedSeconds / 3600;
  return meters / 1000 / hours;
}

/**
 * 物理的に不可能な移動速度か（> 150km/h）。
 * 前回アクションが無い（from が null）場合は false（判定不能=許容）。
 */
export function isImpossibleSpeed(
  from: GeoPoint | null,
  to: GeoPoint,
  elapsedSeconds: number,
): boolean {
  if (from === null) return false;
  return speedKmh(from, to, elapsedSeconds) > FRAUD.MAX_SPEED_KMH;
}

export type LocationRejectReason =
  | 'accuracy_too_low'
  | 'mock_location'
  | 'impossible_speed'
  | 'too_far';

export interface LocationValidationInput {
  player: GeoPoint;
  accuracyM: number;
  isMockLocation: boolean;
  /** チェックイン等でスポット距離判定が必要な場合のみ指定 */
  spot?: GeoPoint;
  /** 速度チェック用。前回アクションが無ければ null */
  lastLocation?: GeoPoint | null;
  elapsedSeconds?: number;
}

export interface LocationValidationResult {
  ok: boolean;
  reason: LocationRejectReason | null;
  /** fraud_flag を記録すべきか（スプーフィング系のみ true） */
  fraudFlag: boolean;
}

/**
 * 位置情報アクションの総合検証。順序: mock検出 → 精度 → 速度 → 距離。
 * mock / 速度異常は fraud_flag 対象。精度・距離は「拒否のみ」（正当なユーザーでも起こりうるため）。
 */
export function validateLocationAction(
  input: LocationValidationInput,
): LocationValidationResult {
  if (input.isMockLocation) {
    return { ok: false, reason: 'mock_location', fraudFlag: true };
  }
  if (!isAccuracyAcceptable(input.accuracyM)) {
    return { ok: false, reason: 'accuracy_too_low', fraudFlag: false };
  }
  if (
    isImpossibleSpeed(
      input.lastLocation ?? null,
      input.player,
      input.elapsedSeconds ?? 0,
    )
  ) {
    return { ok: false, reason: 'impossible_speed', fraudFlag: true };
  }
  if (input.spot && !isWithinCheckinRadius(input.player, input.spot)) {
    return { ok: false, reason: 'too_far', fraudFlag: false };
  }
  return { ok: true, reason: null, fraudFlag: false };
}
