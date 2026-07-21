import type {
  ArtworkState,
  PieceType,
  AcquireSource,
  License,
} from './constants';

/** 位置情報を要するエンドポイント共通ペイロード（§6.1） */
export interface LocationPayload {
  lat: number;
  lng: number;
  accuracy: number;
  is_mock_location: boolean;
  client_timestamp: string; // ISO8601
}

export interface PlayerProfile {
  id: string;
  citrasUserId: string;
  curatorName: string;
  level: number;
  xp: number;
  coins: number;
  coinsEarnedToday: number;
  restorePaint: number;
  gramophoneSpring: number;
  suspendedUntil: string | null;
}

export interface Inventory {
  restorePaint: number;
  gramophoneSpring: number;
  coins: number;
}

export interface PieceMaster {
  id: string;
  artworkId: string;
  pieceIndex: number;
  pieceType: PieceType;
  name: string;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  acquireSource: AcquireSource;
}

export interface PlayerPiece {
  pieceId: string;
  acquiredAt: string;
  isRestored: boolean;
}

export interface ArtworkMaster {
  id: string;
  titleJa: string;
  titleOriginal: string;
  artist: string;
  artistDeathYear: number | null;
  yearCreated: string;
  sourceMuseum: string;
  sourceUrl: string;
  license: License;
  imageUrlHigh: string;
  imageUrlThumb: string;
  pieceCount: number;
  linkedMusicId: string | null;
  descriptionJa: string;
}

export interface ArtworkWithProgress extends ArtworkMaster {
  state: ArtworkState;
  completedAt: string | null;
  /** ピースごとの所持・修復状況 */
  pieces: Array<PieceMaster & { owned: boolean; isRestored: boolean }>;
}

export interface MusicMaster {
  id: string;
  titleJa: string;
  composer: string;
  composerDeathYear: number | null;
  recordingSource: string;
  recordingLicense: License;
  audioUrl: string;
  globalClearanceChecked: boolean;
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
  isRelay: boolean; // 回送タスク（高報酬+特別ピース抽選）
  distanceM?: number;
}

export interface ShopItem {
  itemId: string;
  itemName: string;
  coinCost: number;
  dailyCap: number;
  enabled: boolean;
}

export interface CheckinResult {
  mainPieceAwarded: PieceMaster | null;
  alreadyCheckedInToday: boolean;
  artworkId: string;
}

export interface VisitResult {
  visitCount: number;
  replicaUnlocked: boolean;
  replicaJustUnlocked: boolean;
  regularBonusPaint: number;
  replicaArtworkId: string | null;
}

export interface RestoreResult {
  pieceId: string;
  paintSpent: number;
  artworkState: ArtworkState;
  artworkCompleted: boolean;
  unlockedMusicId: string | null;
}

export interface ClaimRewardResult {
  paintGranted: number;
  springGranted: number;
  specialPieceId: string | null;
  alreadyClaimed: boolean;
}

export interface ExchangeResult {
  couponCode: string | null;
  itemId: string;
  coinsSpent: number;
  paintGranted: number;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}
