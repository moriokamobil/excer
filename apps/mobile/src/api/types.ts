/** モバイル側APIレスポンス型（packages/shared と対応）。 */

export interface LocationPayload {
  lat: number;
  lng: number;
  accuracy: number;
  is_mock_location: boolean;
  client_timestamp: string;
}

export interface Inventory {
  restorePaint: number;
  gramophoneSpring: number;
  coins: number;
}

export type ArtworkState = 'undiscovered' | 'restoring' | 'completed';

export interface PieceWithProgress {
  id: string;
  artworkId: string;
  pieceIndex: number;
  pieceType: 'main' | 'sub';
  name: string;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  acquireSource: 'event' | 'work' | 'visit';
  owned: boolean;
  isRestored: boolean;
}

export interface Artwork {
  id: string;
  titleJa: string;
  titleOriginal: string;
  artist: string;
  artistDeathYear: number | null;
  yearCreated: string;
  sourceMuseum: string;
  sourceUrl: string;
  license: string;
  imageUrlHigh: string;
  imageUrlThumb: string;
  pieceCount: number;
  linkedMusicId: string | null;
  descriptionJa: string;
  state: ArtworkState;
  pieces: PieceWithProgress[];
}

export interface Music {
  id: string;
  titleJa: string;
  composer: string;
  composerDeathYear?: number | null;
  recordingSource?: string;
  audioUrl: string | null;
}

export interface MapSpot {
  id: string;
  kind: 'event_store' | 'replica_store' | 'carshare_station';
  name: string;
  lat: number;
  lng: number;
  mainPieceArtworkId?: string;
  replicaUnlocked?: boolean;
}

export interface WorkTask {
  id: string;
  title: string;
  lat: number;
  lng: number;
  rewardPaint: number;
  rewardSpring: number;
  isRelay: boolean;
  distanceM?: number;
}

export interface ShopItem {
  itemId: string;
  itemName: string;
  coinCost: number;
  dailyCap: number;
  enabled: boolean;
}

export interface PlayerProfile {
  id: string;
  curatorName: string;
  level: number;
  xp: number;
  coins: number;
  restorePaint: number;
  gramophoneSpring: number;
  suspendedUntil: string | null;
}
