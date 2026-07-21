/** mock citras シードデータ。ワークタスク20件（東京23区）。ST・店舗はゲーム側seedと整合。 */

export interface MockStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface MockCampaignStore {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface MockWorkTask {
  id: string;
  title: string;
  lat: number;
  lng: number;
  rewardPaint: number;
  rewardSpring: number;
  isRelay: boolean; // 回送タスク（高報酬+特別ピース抽選）
}

export const STATIONS: MockStation[] = Array.from({ length: 30 }, (_, i) => {
  const base = [
    ['東京駅八重洲ST', 35.680959, 139.76956], ['銀座四丁目ST', 35.67174, 139.76505],
    ['有楽町ST', 35.675069, 139.763328], ['上野公園ST', 35.715321, 139.773941],
    ['浅草ST', 35.71241, 139.79803], ['渋谷道玄坂ST', 35.658034, 139.6969],
    ['新宿東口ST', 35.690921, 139.700258], ['新宿西口ST', 35.689607, 139.69168],
    ['池袋東口ST', 35.729503, 139.715558], ['恵比寿駅前ST', 35.646685, 139.710106],
    ['品川港南ST', 35.628471, 139.74076], ['目黒駅前ST', 35.633998, 139.715828],
    ['五反田ST', 35.626446, 139.723444], ['神保町ST', 35.69595, 139.757789],
    ['秋葉原電気街ST', 35.698683, 139.774219], ['飯田橋ST', 35.70218, 139.7448],
    ['四ツ谷ST', 35.68554, 139.73037], ['赤坂見附ST', 35.67703, 139.73706],
    ['六本木ヒルズST', 35.66044, 139.72919], ['表参道ST', 35.665247, 139.712344],
    ['中目黒ST', 35.644173, 139.698713], ['両国国技館ST', 35.69695, 139.79344],
    ['錦糸町ST', 35.696922, 139.81378], ['月島ST', 35.66497, 139.78364],
    ['豊洲ST', 35.654598, 139.796399], ['お台場ST', 35.627888, 139.775699],
    ['大手町ST', 35.68664, 139.76608], ['日本橋ST', 35.68392, 139.7744],
    ['御茶ノ水ST', 35.69983, 139.7654], ['中野駅北口ST', 35.70746, 139.66576],
  ][i] as [string, number, number];
  return { id: `st-${String(i + 1).padStart(2, '0')}`, name: base[0], lat: base[1], lng: base[2] };
});

export const CAMPAIGN_STORES: MockCampaignStore[] = [
  { id: 'store-001', name: '丸の内アートカフェ', lat: 35.681236, lng: 139.767125 },
  { id: 'store-002', name: '銀座ギャラリー堂', lat: 35.671989, lng: 139.763965 },
  { id: 'store-003', name: '上野広小路 珈琲舎', lat: 35.707724, lng: 139.774035 },
  { id: 'store-004', name: '浅草雷門 茶寮', lat: 35.711016, lng: 139.79647 },
  { id: 'store-005', name: '渋谷スクランブル書房', lat: 35.659518, lng: 139.700464 },
  { id: 'store-006', name: '新宿御苑前 額縁店', lat: 35.687574, lng: 139.710899 },
  { id: 'store-007', name: '池袋西口 画材堂', lat: 35.730256, lng: 139.710388 },
  { id: 'store-008', name: '恵比寿ガーデン喫茶', lat: 35.64669, lng: 139.710106 },
  { id: 'store-009', name: '品川インターサロン', lat: 35.628471, lng: 139.73876 },
  { id: 'store-010', name: '中目黒リバーカフェ', lat: 35.644173, lng: 139.698713 },
  { id: 'store-011', name: '神保町 古書と珈琲', lat: 35.69595, lng: 139.757789 },
  { id: 'store-012', name: '両国 相撲茶屋', lat: 35.696214, lng: 139.7929 },
  { id: 'store-013', name: '表参道 モダンアート', lat: 35.665247, lng: 139.712344 },
  { id: 'store-014', name: '秋葉原 電気街ラウンジ', lat: 35.698353, lng: 139.773114 },
  { id: 'store-015', name: '月島もんじゃ横丁', lat: 35.66497, lng: 139.78364 },
];

const TASK_TITLES = [
  '店頭POP設置', '在庫棚卸し補助', 'カフェ配膳ヘルプ', 'イベント設営', 'チラシ配布',
  '商品陳列', 'レジ応援', '清掃スタッフ', '受付案内', '試食配布',
];

export const WORK_TASKS: MockWorkTask[] = Array.from({ length: 20 }, (_, i) => {
  const st = STATIONS[i % STATIONS.length];
  const isRelay = i % 5 === 0; // 5件に1件は回送タスク
  return {
    id: `task-${String(i + 1).padStart(3, '0')}`,
    title: isRelay ? `【回送】カーシェア車両回送 ${st.name}` : `${TASK_TITLES[i % TASK_TITLES.length]}（${st.name}周辺）`,
    lat: st.lat + (Math.random() - 0.5) * 0.002,
    lng: st.lng + (Math.random() - 0.5) * 0.002,
    rewardPaint: isRelay ? 8 : 4,
    rewardSpring: isRelay ? 4 : 2,
    isRelay,
  };
});
