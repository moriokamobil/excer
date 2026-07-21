import { describe, it, expect } from 'vitest';
import { isAllowedLicense, validateAssetLicenses } from './license';

describe('isAllowedLicense', () => {
  it('CC0/PDは許可', () => {
    expect(isAllowedLicense('CC0')).toBe(true);
    expect(isAllowedLicense('PD')).toBe(true);
  });
  it('それ以外は不許可', () => {
    expect(isAllowedLicense('CC-BY')).toBe(false);
    expect(isAllowedLicense('All rights reserved')).toBe(false);
    expect(isAllowedLicense(null)).toBe(false);
    expect(isAllowedLicense(undefined)).toBe(false);
    expect(isAllowedLicense('')).toBe(false);
  });
});

describe('validateAssetLicenses', () => {
  it('CC0の名画は通過', () => {
    expect(validateAssetLicenses({ artworkLicense: 'CC0' })).toEqual({ ok: true, reason: null });
  });
  it('不許可ライセンスの名画は弾く', () => {
    const r = validateAssetLicenses({ artworkLicense: 'CC-BY-SA' });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('名画ライセンス不許可');
  });
  it('録音がPDかつclearance済みは通過', () => {
    expect(
      validateAssetLicenses({ musicRecordingLicense: 'PD', globalClearanceChecked: true }),
    ).toEqual({ ok: true, reason: null });
  });
  it('録音ライセンス不許可は弾く', () => {
    const r = validateAssetLicenses({ musicRecordingLicense: 'CC-BY', globalClearanceChecked: true });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('録音ライセンス不許可');
  });
  it('録音がCC0でもclearance未確認は弾く（著作隣接権に注意）', () => {
    const r = validateAssetLicenses({ musicRecordingLicense: 'CC0', globalClearanceChecked: false });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('global_clearance_checked');
  });
  it('未指定項目はスキップ', () => {
    expect(validateAssetLicenses({})).toEqual({ ok: true, reason: null });
  });
});
