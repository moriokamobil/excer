/**
 * 位置情報アクションのサーバー検証。
 * domain/distance の純粋関数を使い、DB(前回アクション位置)と組み合わせて判定し、
 * fraud_flag 記録・自動サスペンドまで行う。
 */
import { FRAUD } from '@lost-museum/shared';
import { validateLocationAction, type GeoPoint } from '../domain/distance';
import { lastActionLocation, recordFraudFlag } from './players';

export interface LocationGuardInput {
  playerId: string;
  lat: number;
  lng: number;
  accuracy: number;
  isMockLocation: boolean;
  clientTimestamp: string;
  spot?: GeoPoint;
}

export interface LocationGuardResult {
  ok: boolean;
  reason: string | null;
  suspended: boolean;
}

/**
 * 位置検証を実行。NGならHTTP403相当を返し、スプーフィング系はfraud_flagを記録する。
 */
export async function guardLocation(
  input: LocationGuardInput,
): Promise<LocationGuardResult> {
  const last = await lastActionLocation(input.playerId);
  const now = new Date();
  const elapsedSeconds = last
    ? Math.max(0, (now.getTime() - last.at.getTime()) / 1000)
    : 0;

  const result = validateLocationAction({
    player: { lat: input.lat, lng: input.lng },
    accuracyM: input.accuracy,
    isMockLocation: input.isMockLocation,
    spot: input.spot,
    lastLocation: last ? { lat: last.lat, lng: last.lng } : null,
    elapsedSeconds,
  });

  if (result.ok) return { ok: true, reason: null, suspended: false };

  let suspended = false;
  if (result.fraudFlag) {
    suspended = await recordFraudFlag(
      input.playerId,
      result.reason ?? 'unknown',
      {
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
        is_mock_location: input.isMockLocation,
        last: last ? { lat: last.lat, lng: last.lng } : null,
        elapsed_seconds: elapsedSeconds,
      },
      FRAUD.SUSPEND_THRESHOLD,
      FRAUD.SUSPEND_HOURS,
    );
  }
  return { ok: false, reason: result.reason, suspended };
}
