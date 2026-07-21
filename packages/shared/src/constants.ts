/**
 * ゲーム全体で共有する定数。インフレ対策・不正対策の閾値はここに集約する。
 * REQUIREMENTS §3.3 / §4 / §6.1 に対応。
 */

/** リソース種別 */
export const RESOURCE = {
  RESTORE_PAINT: 'restore_paint',
  GRAMOPHONE_SPRING: 'gramophone_spring',
  COIN: 'coin',
} as const;
export type ResourceKind = (typeof RESOURCE)[keyof typeof RESOURCE];

/** リソース上限・消費量（インフレ対策 §3.3） */
export const RESOURCE_LIMITS = {
  /** 1日のコイン獲得上限 */
  COIN_DAILY_CAP: 3000,
  /** 1日の絵の具獲得上限 */
  PAINT_DAILY_CAP: 20,
  /** ピース1つの修復に必要な絵の具 */
  PAINT_PER_RESTORE: 3,
  /** BGM1再生に必要なゼンマイ（鑑賞モード） */
  SPRING_PER_PLAY: 1,
  /** ゼンマイの最大保有 */
  SPRING_MAX: 10,
  /** ゼンマイの時間回復間隔（分/1回復） */
  SPRING_RECOVER_MINUTES: 30,
} as const;

/** 位置情報・不正対策の閾値（§4） */
export const FRAUD = {
  /** 位置精度がこの値(m)を超えるアクションは拒否 */
  MAX_ACCURACY_M: 100,
  /** 対象スポットとの許容距離(m) */
  CHECKIN_RADIUS_M: 80,
  /** 物理的に不可能とみなす移動速度(km/h) */
  MAX_SPEED_KMH: 150,
  /** 自動サスペンドに達する fraud_flag 件数 */
  SUSPEND_THRESHOLD: 3,
  /** サスペンド期間（時間） */
  SUSPEND_HOURS: 24,
} as const;

/** レートリミット（§4） */
export const RATE_LIMIT = {
  /** 全アクション: 1分あたりの上限 */
  ACTIONS_PER_MINUTE: 10,
  WINDOW_SECONDS: 60,
} as const;

/** リピート訪問・レプリカ（§3.6） */
export const VISIT = {
  /** レプリカ常設に必要な来店回数 */
  REPLICA_UNLOCK_COUNT: 5,
  /** 常連ボーナスで付与される絵の具（6回目以降） */
  REGULAR_BONUS_PAINT: 3,
} as const;

/** 名画の状態 */
export const ARTWORK_STATE = {
  UNDISCOVERED: 'undiscovered',
  RESTORING: 'restoring',
  COMPLETED: 'completed',
} as const;
export type ArtworkState = (typeof ARTWORK_STATE)[keyof typeof ARTWORK_STATE];

/** ピース種別 */
export const PIECE_TYPE = {
  MAIN: 'main',
  SUB: 'sub',
} as const;
export type PieceType = (typeof PIECE_TYPE)[keyof typeof PIECE_TYPE];

/** ピース入手経路 */
export const ACQUIRE_SOURCE = {
  EVENT: 'event',
  WORK: 'work',
  VISIT: 'visit',
} as const;
export type AcquireSource = (typeof ACQUIRE_SOURCE)[keyof typeof ACQUIRE_SOURCE];

/** 素材ライセンス（CC0/PD のみ許可 §8） */
export const ALLOWED_LICENSES = ['CC0', 'PD'] as const;
export type License = (typeof ALLOWED_LICENSES)[number];

/** コインショップ交換アイテム（§3.5 の初期レート） */
export const SHOP_ITEMS = [
  { itemId: 'carshare_10off', itemName: 'カーシェア 10%OFF', coinCost: 1000, dailyCap: 2 },
  { itemId: 'cycle_30min_free', itemName: 'サイクルシェア 30分無料', coinCost: 800, dailyCap: 2 },
  { itemId: 'paint_x10', itemName: '修復絵の具 ×10', coinCost: 500, dailyCap: 5 },
] as const;
