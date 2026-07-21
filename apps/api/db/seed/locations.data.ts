/**
 * 東京23区の位置シード。
 * キャンペーン店舗15件（イベント店。artwork key で配布メインピースを指定）、
 * カーシェアST30件。ワークタスク20件は mock-citras 側の seed に定義。
 */
export interface CampaignStoreSeed {
  citrasStoreId: string;
  name: string;
  lat: number;
  lng: number;
  artworkKey: string; // 配布するメインピースの名画
}

export interface StationSeed {
  citrasStationId: string;
  name: string;
  lat: number;
  lng: number;
}

export const CAMPAIGN_STORES: CampaignStoreSeed[] = [
  { citrasStoreId: 'store-001', name: '丸の内アートカフェ', lat: 35.681236, lng: 139.767125, artworkKey: 'sunflowers' },
  { citrasStoreId: 'store-002', name: '銀座ギャラリー堂', lat: 35.671989, lng: 139.763965, artworkKey: 'girl_pearl' },
  { citrasStoreId: 'store-003', name: '上野広小路 珈琲舎', lat: 35.707724, lng: 139.774035, artworkKey: 'starry_night' },
  { citrasStoreId: 'store-004', name: '浅草雷門 茶寮', lat: 35.711016, lng: 139.796470, artworkKey: 'great_wave' },
  { citrasStoreId: 'store-005', name: '渋谷スクランブル書房', lat: 35.659518, lng: 139.700464, artworkKey: 'the_kiss' },
  { citrasStoreId: 'store-006', name: '新宿御苑前 額縁店', lat: 35.687574, lng: 139.710899, artworkKey: 'sunflowers' },
  { citrasStoreId: 'store-007', name: '池袋西口 画材堂', lat: 35.730256, lng: 139.710388, artworkKey: 'girl_pearl' },
  { citrasStoreId: 'store-008', name: '恵比寿ガーデン喫茶', lat: 35.646690, lng: 139.710106, artworkKey: 'starry_night' },
  { citrasStoreId: 'store-009', name: '品川インターサロン', lat: 35.628471, lng: 139.738760, artworkKey: 'great_wave' },
  { citrasStoreId: 'store-010', name: '中目黒リバーカフェ', lat: 35.644173, lng: 139.698713, artworkKey: 'the_kiss' },
  { citrasStoreId: 'store-011', name: '神保町 古書と珈琲', lat: 35.695950, lng: 139.757789, artworkKey: 'starry_night' },
  { citrasStoreId: 'store-012', name: '両国 相撲茶屋', lat: 35.696214, lng: 139.792900, artworkKey: 'great_wave' },
  { citrasStoreId: 'store-013', name: '表参道 モダンアート', lat: 35.665247, lng: 139.712344, artworkKey: 'the_kiss' },
  { citrasStoreId: 'store-014', name: '秋葉原 電気街ラウンジ', lat: 35.698353, lng: 139.773114, artworkKey: 'sunflowers' },
  { citrasStoreId: 'store-015', name: '月島もんじゃ横丁', lat: 35.664970, lng: 139.783640, artworkKey: 'girl_pearl' },
];

// 30件のカーシェアST。区役所・主要駅周辺に配置。
export const CARSHARE_STATIONS: StationSeed[] = [
  { citrasStationId: 'st-01', name: '東京駅八重洲ST', lat: 35.680959, lng: 139.769560 },
  { citrasStationId: 'st-02', name: '銀座四丁目ST', lat: 35.671740, lng: 139.765050 },
  { citrasStationId: 'st-03', name: '有楽町ST', lat: 35.675069, lng: 139.763328 },
  { citrasStationId: 'st-04', name: '上野公園ST', lat: 35.715321, lng: 139.773941 },
  { citrasStationId: 'st-05', name: '浅草ST', lat: 35.712410, lng: 139.798030 },
  { citrasStationId: 'st-06', name: '渋谷道玄坂ST', lat: 35.658034, lng: 139.696900 },
  { citrasStationId: 'st-07', name: '新宿東口ST', lat: 35.690921, lng: 139.700258 },
  { citrasStationId: 'st-08', name: '新宿西口ST', lat: 35.689607, lng: 139.691680 },
  { citrasStationId: 'st-09', name: '池袋東口ST', lat: 35.729503, lng: 139.715558 },
  { citrasStationId: 'st-10', name: '恵比寿駅前ST', lat: 35.646685, lng: 139.710106 },
  { citrasStationId: 'st-11', name: '品川港南ST', lat: 35.628471, lng: 139.740760 },
  { citrasStationId: 'st-12', name: '目黒駅前ST', lat: 35.633998, lng: 139.715828 },
  { citrasStationId: 'st-13', name: '五反田ST', lat: 35.626446, lng: 139.723444 },
  { citrasStationId: 'st-14', name: '神保町ST', lat: 35.695950, lng: 139.757789 },
  { citrasStationId: 'st-15', name: '秋葉原電気街ST', lat: 35.698683, lng: 139.774219 },
  { citrasStationId: 'st-16', name: '飯田橋ST', lat: 35.702180, lng: 139.744800 },
  { citrasStationId: 'st-17', name: '四ツ谷ST', lat: 35.685540, lng: 139.730370 },
  { citrasStationId: 'st-18', name: '赤坂見附ST', lat: 35.677030, lng: 139.737060 },
  { citrasStationId: 'st-19', name: '六本木ヒルズST', lat: 35.660440, lng: 139.729190 },
  { citrasStationId: 'st-20', name: '表参道ST', lat: 35.665247, lng: 139.712344 },
  { citrasStationId: 'st-21', name: '中目黒ST', lat: 35.644173, lng: 139.698713 },
  { citrasStationId: 'st-22', name: '両国国技館ST', lat: 35.696950, lng: 139.793440 },
  { citrasStationId: 'st-23', name: '錦糸町ST', lat: 35.696922, lng: 139.813780 },
  { citrasStationId: 'st-24', name: '月島ST', lat: 35.664970, lng: 139.783640 },
  { citrasStationId: 'st-25', name: '豊洲ST', lat: 35.654598, lng: 139.796399 },
  { citrasStationId: 'st-26', name: 'お台場ST', lat: 35.627888, lng: 139.775699 },
  { citrasStationId: 'st-27', name: '大手町ST', lat: 35.686640, lng: 139.766080 },
  { citrasStationId: 'st-28', name: '日本橋ST', lat: 35.683920, lng: 139.774400 },
  { citrasStationId: 'st-29', name: '御茶ノ水ST', lat: 35.699830, lng: 139.765400 },
  { citrasStationId: 'st-30', name: '中野駅北口ST', lat: 35.707460, lng: 139.665760 },
];
