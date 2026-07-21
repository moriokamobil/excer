/**
 * 日本語文言の集約（§8 i18n: 日本語のみ、文言は定数ファイルに分離）。
 * モバイル・API のエラーメッセージ双方で参照する。
 */
export const MESSAGES = {
  // 認証・プレイヤー
  LOGIN_FAILED: 'ログインに失敗しました',
  PLAYER_SUSPENDED: 'アカウントは一時停止中です。管理者の確認をお待ちください',

  // 位置・不正
  ACCURACY_TOO_LOW: '位置情報の精度が低すぎます（100m以内で再取得してください）',
  TOO_FAR_FROM_SPOT: 'スポットから離れすぎています（80m以内に近づいてください）',
  MOCK_LOCATION_DETECTED: '位置情報の偽装が検出されました',
  IMPOSSIBLE_SPEED: '移動速度が異常です。しばらくしてからお試しください',

  // チェックイン・訪問
  ALREADY_CHECKED_IN_TODAY: 'この店舗には本日すでにチェックイン済みです',
  MAIN_PIECE_AWARDED: 'メインピースを入手しました！',
  REPLICA_UNLOCKED: 'この店に名画のレプリカが常設されました',
  REGULAR_BONUS: '常連ボーナス: 修復絵の具を獲得しました',

  // 修復
  NOT_ENOUGH_PAINT: '修復絵の具が不足しています',
  PIECE_NOT_OWNED: 'このピースをまだ所持していません',
  PIECE_ALREADY_RESTORED: 'このピースは修復済みです',
  ARTWORK_COMPLETED: '名画が完成しました！美術館に収蔵されます',

  // リソース
  COIN_DAILY_CAP_REACHED: '本日のコイン獲得上限に達しました',
  PAINT_DAILY_CAP_REACHED: '本日の絵の具獲得上限に達しました',
  NOT_ENOUGH_SPRING: '蓄音機のゼンマイが不足しています',
  NOT_ENOUGH_COINS: '発見コインが不足しています',

  // ワーク
  REWARD_ALREADY_CLAIMED: 'この報酬はすでに受け取り済みです',
  REWARD_NOT_APPROVED: 'タスクがまだ承認されていません',

  // レート
  RATE_LIMITED: 'リクエストが多すぎます。少し待ってからお試しください',

  // ショップ
  EXCHANGE_DONE: '交換が完了しました',
  ITEM_NOT_FOUND: '交換アイテムが見つかりません',
} as const;

export type MessageKey = keyof typeof MESSAGES;
