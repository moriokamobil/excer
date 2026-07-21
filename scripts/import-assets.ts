/**
 * 素材取り込みスクリプト（REQUIREMENTS §6.3 / §13）。
 * PUBLIC_DOMAIN_ASSETS.md の名画を The Met API 等から取り込み、
 *  - isPublicDomain === true を確認
 *  - license ∈ {CC0, PD} をバリデーション
 *  - 楽曲は recording_license ∈ {CC0,PD} かつ global_clearance_checked を確認
 * を満たすものだけを artwork_masters / music_masters に保存する。
 *
 * The Met API が到達不能な場合は seed の PD/CC0 URL にフォールバックする。
 * 実行: npm run import-assets （apps/api ワークスペース経由）
 */
import { pool } from '../apps/api/src/infra/db';
import {
  ARTWORK_SEED,
  MUSIC_SEED,
  type ArtworkSeed,
} from '../apps/api/db/seed/assets.data';
import { validateAssetLicenses } from '../apps/api/src/domain/license';

// PUBLIC_DOMAIN_ASSETS.md の met_object_id 対応（Phase A分）
const MET_OBJECT_IDS: Record<string, number> = {
  sunflowers: 436524,
  great_wave: 45434,
};

const MET_API = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';

interface MetObject {
  isPublicDomain: boolean;
  primaryImage: string;
  primaryImageSmall: string;
  artistDisplayName: string;
  objectDate: string;
  repository: string;
  title: string;
}

async function fetchMet(objectId: number): Promise<MetObject | null> {
  try {
    const res = await fetch(`${MET_API}/${objectId}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return (await res.json()) as MetObject;
  } catch {
    return null;
  }
}

/** 名画1点を検証して upsert。取り込めた場合 true。 */
async function importArtwork(a: ArtworkSeed): Promise<boolean> {
  // ライセンス列の検証（CC0/PD 以外は取り込まない）
  const licCheck = validateAssetLicenses({ artworkLicense: a.license });
  if (!licCheck.ok) {
    console.warn(`  ✗ skip ${a.key}: ${licCheck.reason}`);
    return false;
  }

  let imageHigh = a.imageUrlHigh;
  let imageThumb = a.imageUrlThumb;
  let artist = a.artist;
  let museum = a.sourceMuseum;

  const metId = MET_OBJECT_IDS[a.key];
  if (metId) {
    const met = await fetchMet(metId);
    if (met) {
      if (!met.isPublicDomain) {
        console.warn(`  ✗ skip ${a.key}: The Met isPublicDomain=false`);
        return false;
      }
      // Met のメタデータで補強（画像が空ならseedフォールバック）
      imageHigh = met.primaryImage || imageHigh;
      imageThumb = met.primaryImageSmall || imageThumb;
      artist = met.artistDisplayName || artist;
      museum = met.repository?.split(',')[0] || museum;
      console.log(`  ✓ ${a.key}: The Met確認済み (PD)`);
    } else {
      console.log(`  ~ ${a.key}: The Met到達不能→seed(PD)にフォールバック`);
    }
  } else {
    console.log(`  ✓ ${a.key}: Wikimedia/seed (${a.license})`);
  }

  await pool.query(
    `INSERT INTO artwork_masters
       (title_ja,title_original,artist,artist_death_year,year_created,source_museum,source_url,license,image_url_high,image_url_thumb,piece_count,linked_music_id,description_ja)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT DO NOTHING`,
    [a.titleJa, a.titleOriginal, artist, a.artistDeathYear, a.yearCreated, museum, a.sourceUrl, a.license, imageHigh, imageThumb, a.pieces.length, a.linkedMusicId, a.descriptionJa],
  );
  return true;
}

async function main(): Promise<void> {
  console.log('楽曲の取り込み（録音ライセンス検証）...');
  let musicOk = 0;
  for (const m of MUSIC_SEED) {
    const check = validateAssetLicenses({
      musicRecordingLicense: m.recordingLicense,
      globalClearanceChecked: m.globalClearanceChecked,
    });
    if (!check.ok) {
      console.warn(`  ✗ skip ${m.id}: ${check.reason}`);
      continue;
    }
    await pool.query(
      `INSERT INTO music_masters (id,title_ja,composer,composer_death_year,recording_source,recording_license,audio_url,global_clearance_checked)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET audio_url=EXCLUDED.audio_url`,
      [m.id, m.titleJa, m.composer, m.composerDeathYear, m.recordingSource, m.recordingLicense, m.audioUrl, m.globalClearanceChecked],
    );
    musicOk++;
  }
  console.log(`  楽曲 ${musicOk}/${MUSIC_SEED.length} 件`);

  console.log('名画の取り込み（PD検証 + The Met連携）...');
  let artOk = 0;
  for (const a of ARTWORK_SEED) {
    if (await importArtwork(a)) artOk++;
  }
  console.log(`  名画 ${artOk}/${ARTWORK_SEED.length} 件`);
  console.log('取り込み完了。ピース分割は npm run seed で投入されます。');
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
