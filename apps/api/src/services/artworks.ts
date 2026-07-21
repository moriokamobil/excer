/** 名画・ピースの進捗組み立て。domain/restore で状態を算出する。 */
import { pool, query, queryOne } from '../infra/db';
import { computeArtworkState, type PieceProgress } from '../domain/restore';

export interface PieceRow {
  id: string;
  artwork_id: string;
  piece_index: number;
  piece_type: 'main' | 'sub';
  name: string;
  crop_x: number;
  crop_y: number;
  crop_w: number;
  crop_h: number;
  acquire_source: 'event' | 'work' | 'visit';
}

export interface ArtworkRow {
  id: string;
  title_ja: string;
  title_original: string;
  artist: string;
  artist_death_year: number | null;
  year_created: string;
  source_museum: string;
  source_url: string;
  license: string;
  image_url_high: string;
  image_url_thumb: string;
  piece_count: number;
  linked_music_id: string | null;
  description_ja: string;
}

function mapArtwork(a: ArtworkRow) {
  return {
    id: a.id,
    titleJa: a.title_ja,
    titleOriginal: a.title_original,
    artist: a.artist,
    artistDeathYear: a.artist_death_year,
    yearCreated: a.year_created,
    sourceMuseum: a.source_museum,
    sourceUrl: a.source_url,
    license: a.license,
    imageUrlHigh: a.image_url_high,
    imageUrlThumb: a.image_url_thumb,
    pieceCount: a.piece_count,
    linkedMusicId: a.linked_music_id,
    descriptionJa: a.description_ja,
  };
}

function mapPiece(p: PieceRow, owned: boolean, isRestored: boolean) {
  return {
    id: p.id,
    artworkId: p.artwork_id,
    pieceIndex: p.piece_index,
    pieceType: p.piece_type,
    name: p.name,
    cropX: p.crop_x,
    cropY: p.crop_y,
    cropW: p.crop_w,
    cropH: p.crop_h,
    acquireSource: p.acquire_source,
    owned,
    isRestored,
  };
}

/** プレイヤーの全名画を進捗つきで返す。 */
export async function listArtworksWithProgress(playerId: string) {
  const artworks = await query<ArtworkRow>('SELECT * FROM artwork_masters ORDER BY title_ja');
  const pieces = await query<PieceRow>('SELECT * FROM artwork_pieces ORDER BY artwork_id, piece_index');
  const owned = await query<{ piece_id: string; is_restored: boolean }>(
    'SELECT piece_id, is_restored FROM player_pieces WHERE player_id=$1',
    [playerId],
  );
  const ownedMap = new Map(owned.map((o) => [o.piece_id, o.is_restored]));

  return artworks.map((a) => {
    const aPieces = pieces.filter((p) => p.artwork_id === a.id);
    const progress: PieceProgress[] = aPieces.map((p) => ({
      pieceId: p.id,
      owned: ownedMap.has(p.id),
      isRestored: ownedMap.get(p.id) === true,
    }));
    return {
      ...mapArtwork(a),
      state: computeArtworkState(progress),
      pieces: aPieces.map((p) =>
        mapPiece(p, ownedMap.has(p.id), ownedMap.get(p.id) === true),
      ),
    };
  });
}

export async function getArtworkWithProgress(playerId: string, artworkId: string) {
  const a = await queryOne<ArtworkRow>('SELECT * FROM artwork_masters WHERE id=$1', [artworkId]);
  if (!a) return null;
  const aPieces = await query<PieceRow>(
    'SELECT * FROM artwork_pieces WHERE artwork_id=$1 ORDER BY piece_index',
    [artworkId],
  );
  const owned = await query<{ piece_id: string; is_restored: boolean }>(
    `SELECT pp.piece_id, pp.is_restored FROM player_pieces pp
     JOIN artwork_pieces ap ON ap.id = pp.piece_id
     WHERE pp.player_id=$1 AND ap.artwork_id=$2`,
    [playerId, artworkId],
  );
  const ownedMap = new Map(owned.map((o) => [o.piece_id, o.is_restored]));
  const progress: PieceProgress[] = aPieces.map((p) => ({
    pieceId: p.id,
    owned: ownedMap.has(p.id),
    isRestored: ownedMap.get(p.id) === true,
  }));
  return {
    ...mapArtwork(a),
    state: computeArtworkState(progress),
    pieces: aPieces.map((p) => mapPiece(p, ownedMap.has(p.id), ownedMap.get(p.id) === true)),
  };
}

/** プレイヤーの名画状態を再計算して player_artworks に反映する。 */
export async function syncArtworkState(
  client: typeof pool,
  playerId: string,
  artworkId: string,
): Promise<{ state: string; justCompleted: boolean }> {
  const aPieces = await client.query('SELECT id FROM artwork_pieces WHERE artwork_id=$1', [artworkId]);
  const owned = await client.query(
    `SELECT pp.piece_id, pp.is_restored FROM player_pieces pp
     JOIN artwork_pieces ap ON ap.id = pp.piece_id
     WHERE pp.player_id=$1 AND ap.artwork_id=$2`,
    [playerId, artworkId],
  );
  const ownedMap = new Map(owned.rows.map((o: any) => [o.piece_id, o.is_restored]));
  const progress: PieceProgress[] = aPieces.rows.map((p: any) => ({
    pieceId: p.id,
    owned: ownedMap.has(p.id),
    isRestored: ownedMap.get(p.id) === true,
  }));
  const state = computeArtworkState(progress);

  const prev = await client.query(
    'SELECT state FROM player_artworks WHERE player_id=$1 AND artwork_id=$2',
    [playerId, artworkId],
  );
  const prevState = prev.rows[0]?.state ?? 'undiscovered';
  const justCompleted = state === 'completed' && prevState !== 'completed';

  await client.query(
    `INSERT INTO player_artworks (player_id, artwork_id, state, completed_at)
     VALUES ($1,$2,$3, CASE WHEN $3='completed' THEN now() ELSE NULL END)
     ON CONFLICT (player_id, artwork_id)
     DO UPDATE SET state=EXCLUDED.state,
       completed_at = CASE WHEN EXCLUDED.state='completed' AND player_artworks.completed_at IS NULL THEN now() ELSE player_artworks.completed_at END`,
    [playerId, artworkId, state],
  );
  return { state, justCompleted };
}
