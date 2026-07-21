/**
 * 素材ライセンス検証（純粋関数・テスト対象）。
 * REQUIREMENTS §8 / §13:
 *  - 名画: license は CC0/PD のみ
 *  - 楽曲: recording_license は CC0/PD のみ かつ global_clearance_checked=true
 * いずれか満たさない素材は取り込まない（import-assets.ts / seed で使用）。
 */
import { ALLOWED_LICENSES, type License } from '@lost-museum/shared';

export function isAllowedLicense(value: string | null | undefined): value is License {
  return typeof value === 'string' && (ALLOWED_LICENSES as readonly string[]).includes(value);
}

export interface LicenseCheckInput {
  artworkLicense?: string | null;
  musicRecordingLicense?: string | null;
  globalClearanceChecked?: boolean;
}

export interface LicenseCheckResult {
  ok: boolean;
  reason: string | null;
}

/**
 * 名画・楽曲いずれかのライセンス妥当性を検証する。
 * 指定された項目のみ検証し、未指定はスキップ。
 */
export function validateAssetLicenses(input: LicenseCheckInput): LicenseCheckResult {
  if (input.artworkLicense !== undefined) {
    if (!isAllowedLicense(input.artworkLicense)) {
      return { ok: false, reason: `名画ライセンス不許可: ${input.artworkLicense}` };
    }
  }
  if (input.musicRecordingLicense !== undefined) {
    if (!isAllowedLicense(input.musicRecordingLicense)) {
      return { ok: false, reason: `録音ライセンス不許可: ${input.musicRecordingLicense}` };
    }
    if (input.globalClearanceChecked !== true) {
      return { ok: false, reason: '録音の権利確認(global_clearance_checked)が未完了' };
    }
  }
  return { ok: true, reason: null };
}
