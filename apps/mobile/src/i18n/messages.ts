/** 日本語文言（§8 i18n）。API側 packages/shared/messages と対をなす画面用文言。 */
export const T = {
  appName: '失われた美術館の修復',
  tabs: {
    home: 'ホーム',
    map: '地図',
    museum: '美術館',
    work: 'ワーク',
    mypage: 'マイページ',
  },
  home: {
    restoring: '修復中の名画',
    todayAction: '今日のおすすめ',
    goCheckin: '店舗でメインピースを探す',
    goWork: 'ワークで絵の具を集める',
    resources: '所持リソース',
  },
  resources: {
    paint: '修復絵の具',
    spring: '蓄音機のゼンマイ',
    coin: '発見コイン',
  },
  museum: {
    title: '美術館 図鑑',
    undiscovered: '未発見',
    restoring: '修復中',
    completed: '修復済み',
  },
  workshop: {
    title: '修復工房',
    tray: '所持ピース',
    restoreNext: '次のピースを修復する（絵の具3）',
    complete: '名画が完成しました',
    toViewing: '鑑賞モードへ',
  },
  viewing: {
    play: '再生',
    pause: '一時停止',
    credit: '作品情報',
    artist: '作者',
    year: '制作年',
    museum: '所蔵館',
    recording: '演奏元',
  },
  store: {
    checkin: '来店チェックイン',
    mainPieceHere: 'この店で入手できるメインピース',
    visit: '通常来店（訪問カウント）',
    replica: 'レプリカ常設店',
  },
  shop: {
    title: 'コインショップ',
    exchange: '交換する',
    history: '交換履歴',
  },
  common: {
    loading: '読み込み中…',
    error: '通信エラーが発生しました',
    retry: '再試行',
    close: '閉じる',
    login: 'citras IDでログイン',
  },
} as const;
