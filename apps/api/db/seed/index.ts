/**
 * シード投入。名画・楽曲・ピース・店舗・ST・交換レートを冪等に投入する。
 * 素材ライセンスは CC0/PD のみ許可（違反時はスキップしてログ）。
 */
import { pool } from '../../src/infra/db';
import { ARTWORK_SEED, MUSIC_SEED } from './assets.data';
import { CAMPAIGN_STORES, CARSHARE_STATIONS } from './locations.data';
import { validateAssetLicenses } from '../../src/domain/license';
import { SHOP_ITEMS } from '@lost-museum/shared';

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 楽曲（録音ライセンス検証）
    for (const m of MUSIC_SEED) {
      const check = validateAssetLicenses({ musicRecordingLicense: m.recordingLicense, globalClearanceChecked: m.globalClearanceChecked });
      if (!check.ok) {
        console.warn(`skip music ${m.id}: ${check.reason}`);
        continue;
      }
      await client.query(
        `INSERT INTO music_masters (id,title_ja,composer,composer_death_year,recording_source,recording_license,audio_url,global_clearance_checked)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET title_ja=EXCLUDED.title_ja, audio_url=EXCLUDED.audio_url`,
        [m.id, m.titleJa, m.composer, m.composerDeathYear, m.recordingSource, m.recordingLicense, m.audioUrl, m.globalClearanceChecked],
      );
    }

    const artworkIdByKey = new Map<string, string>();
    const mainPieceIdByArtworkKey = new Map<string, string>();

    for (const a of ARTWORK_SEED) {
      const check = validateAssetLicenses({ artworkLicense: a.license });
      if (!check.ok) {
        console.warn(`skip artwork ${a.key}: ${check.reason}`);
        continue;
      }
      const res = await client.query(
        `INSERT INTO artwork_masters (title_ja,title_original,artist,artist_death_year,year_created,source_museum,source_url,license,image_url_high,image_url_thumb,piece_count,linked_music_id,description_ja)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [a.titleJa, a.titleOriginal, a.artist, a.artistDeathYear, a.yearCreated, a.sourceMuseum, a.sourceUrl, a.license, a.imageUrlHigh, a.imageUrlThumb, a.pieces.length, a.linkedMusicId, a.descriptionJa],
      );
      let artworkId: string;
      if (res.rows[0]) {
        artworkId = res.rows[0].id;
      } else {
        const existing = await client.query('SELECT id FROM artwork_masters WHERE title_ja=$1', [a.titleJa]);
        artworkId = existing.rows[0].id;
      }
      artworkIdByKey.set(a.key, artworkId);

      for (const p of a.pieces) {
        const pres = await client.query(
          `INSERT INTO artwork_pieces (artwork_id,piece_index,piece_type,name,crop_x,crop_y,crop_w,crop_h,acquire_source)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (artwork_id,piece_index) DO UPDATE SET name=EXCLUDED.name, crop_x=EXCLUDED.crop_x, crop_y=EXCLUDED.crop_y, crop_w=EXCLUDED.crop_w, crop_h=EXCLUDED.crop_h
           RETURNING id`,
          [artworkId, p.index, p.type, p.name, p.cropX, p.cropY, p.cropW, p.cropH, p.acquireSource],
        );
        if (p.type === 'main') {
          mainPieceIdByArtworkKey.set(a.key, pres.rows[0].id);
        }
      }
    }

    // キャンペーン店舗
    for (const s of CAMPAIGN_STORES) {
      const mainPieceId = mainPieceIdByArtworkKey.get(s.artworkKey) ?? null;
      await client.query(
        `INSERT INTO campaign_stores (citras_store_id,name,location,main_piece_id,campaign_starts_at,campaign_ends_at)
         VALUES ($1,$2, ST_SetSRID(ST_MakePoint($3,$4),4326)::geography, $5, now() - interval '1 day', now() + interval '90 days')
         ON CONFLICT (citras_store_id) DO UPDATE SET name=EXCLUDED.name, location=EXCLUDED.location, main_piece_id=EXCLUDED.main_piece_id`,
        [s.citrasStoreId, s.name, s.lng, s.lat, mainPieceId],
      );
    }

    // カーシェアST
    for (const st of CARSHARE_STATIONS) {
      await client.query(
        `INSERT INTO carshare_stations (citras_station_id,name,location)
         VALUES ($1,$2, ST_SetSRID(ST_MakePoint($3,$4),4326)::geography)
         ON CONFLICT (citras_station_id) DO UPDATE SET name=EXCLUDED.name, location=EXCLUDED.location`,
        [st.citrasStationId, st.name, st.lng, st.lat],
      );
    }

    // 交換レート
    for (const item of SHOP_ITEMS) {
      await client.query(
        `INSERT INTO exchange_rates (item_id,item_name,coin_cost,daily_cap,enabled)
         VALUES ($1,$2,$3,$4,TRUE)
         ON CONFLICT (item_id) DO UPDATE SET item_name=EXCLUDED.item_name, coin_cost=EXCLUDED.coin_cost, daily_cap=EXCLUDED.daily_cap`,
        [item.itemId, item.itemName, item.coinCost, item.dailyCap],
      );
    }

    await client.query('COMMIT');
    console.log(`seed done: ${artworkIdByKey.size} artworks, ${MUSIC_SEED.length} music, ${CAMPAIGN_STORES.length} stores, ${CARSHARE_STATIONS.length} stations`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
