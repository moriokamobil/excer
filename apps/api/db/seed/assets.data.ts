/**
 * Phase A 素材データ（名画5点・楽曲5曲・ピース分割）。
 * PUBLIC_DOMAIN_ASSETS.md の確定リストに一致させる。
 * 画像は Wikimedia Commons / The Met Open Access の PD/CC0 URL。
 * import-assets.ts と seed で共有する。
 */
import { PIECE_TYPE, ACQUIRE_SOURCE, type License } from '@lost-museum/shared';

export interface PieceSeed {
  index: number;
  name: string;
  type: (typeof PIECE_TYPE)[keyof typeof PIECE_TYPE];
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  acquireSource: (typeof ACQUIRE_SOURCE)[keyof typeof ACQUIRE_SOURCE];
}

export interface ArtworkSeed {
  key: string; // 安定した参照キー
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
  linkedMusicId: string;
  descriptionJa: string;
  pieces: PieceSeed[];
}

export interface MusicSeed {
  id: string;
  titleJa: string;
  composer: string;
  composerDeathYear: number | null;
  recordingSource: string;
  recordingLicense: License;
  audioUrl: string;
  globalClearanceChecked: boolean;
}

// 各ピースの1番目(index0)を main とし acquire_source=event、残りを sub とする共通ヘルパ
function pieces(defs: Array<Omit<PieceSeed, 'index' | 'type' | 'acquireSource'> & {
  main?: boolean;
  source?: PieceSeed['acquireSource'];
}>): PieceSeed[] {
  return defs.map((d, i) => ({
    index: i,
    name: d.name,
    cropX: d.cropX,
    cropY: d.cropY,
    cropW: d.cropW,
    cropH: d.cropH,
    type: d.main ? PIECE_TYPE.MAIN : PIECE_TYPE.SUB,
    acquireSource: d.main
      ? ACQUIRE_SOURCE.EVENT
      : d.source ?? (i % 2 === 0 ? ACQUIRE_SOURCE.WORK : ACQUIRE_SOURCE.VISIT),
  }));
}

export const MUSIC_SEED: MusicSeed[] = [
  {
    id: 'M1',
    titleJa: '子犬のワルツ',
    composer: 'Frédéric Chopin',
    composerDeathYear: 1849,
    recordingSource: 'Musopen',
    recordingLicense: 'CC0',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Chopin_-_valse_du_petit_chien.ogg',
    globalClearanceChecked: true,
  },
  {
    id: 'M2',
    titleJa: 'ゴルトベルク変奏曲 アリア',
    composer: 'Johann Sebastian Bach',
    composerDeathYear: 1750,
    recordingSource: 'Musopen',
    recordingLicense: 'CC0',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Goldberg_Variation_1_%28Bach%29.ogg',
    globalClearanceChecked: true,
  },
  {
    id: 'M3',
    titleJa: 'ノクターン第2番 変ホ長調',
    composer: 'Frédéric Chopin',
    composerDeathYear: 1849,
    recordingSource: 'Musopen',
    recordingLicense: 'CC0',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Frederic_Chopin_-_Nocturne_in_E_flat_major%2C_Op._9_No._2.ogg',
    globalClearanceChecked: true,
  },
  {
    id: 'M4',
    titleJa: 'ジムノペディ第1番',
    composer: 'Erik Satie',
    composerDeathYear: 1925,
    recordingSource: 'Musopen',
    recordingLicense: 'CC0',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Erik_Satie_-_Gymnopedie_No._1.ogg',
    globalClearanceChecked: true,
  },
  {
    id: 'M5',
    titleJa: '月の光',
    composer: 'Claude Debussy',
    composerDeathYear: 1918,
    recordingSource: 'Musopen',
    recordingLicense: 'CC0',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Debussy_-_Clair_de_Lune.ogg',
    globalClearanceChecked: true,
  },
];

export const ARTWORK_SEED: ArtworkSeed[] = [
  {
    key: 'sunflowers',
    titleJa: 'ひまわり',
    titleOriginal: 'Sunflowers',
    artist: 'Vincent van Gogh',
    artistDeathYear: 1890,
    yearCreated: '1887',
    sourceMuseum: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/436524',
    license: 'PD',
    imageUrlHigh:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg/800px-Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg',
    imageUrlThumb:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg/240px-Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg',
    linkedMusicId: 'M1',
    descriptionJa:
      'ゴッホがパリ時代に描いたひまわりの連作のひとつ。生命力あふれる黄色が特徴。',
    pieces: pieces([
      { name: '花（中央の主役）', cropX: 0.25, cropY: 0.1, cropW: 0.5, cropH: 0.55, main: true },
      { name: '花瓶', cropX: 0.3, cropY: 0.6, cropW: 0.4, cropH: 0.35 },
      { name: '背景（左）', cropX: 0.0, cropY: 0.0, cropW: 0.3, cropH: 1.0 },
      { name: '背景（右）', cropX: 0.7, cropY: 0.0, cropW: 0.3, cropH: 1.0 },
    ]),
  },
  {
    key: 'girl_pearl',
    titleJa: '真珠の耳飾りの少女',
    titleOriginal: 'Girl with a Pearl Earring',
    artist: 'Johannes Vermeer',
    artistDeathYear: 1675,
    yearCreated: '1665',
    sourceMuseum: 'Mauritshuis',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:1665_Girl_with_a_Pearl_Earring.jpg',
    license: 'PD',
    imageUrlHigh:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/720px-1665_Girl_with_a_Pearl_Earring.jpg',
    imageUrlThumb:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/240px-1665_Girl_with_a_Pearl_Earring.jpg',
    linkedMusicId: 'M2',
    descriptionJa:
      'フェルメールの代表作。「北のモナ・リザ」とも呼ばれ、真珠の耳飾りが印象的。',
    pieces: pieces([
      { name: '顔', cropX: 0.3, cropY: 0.2, cropW: 0.4, cropH: 0.45, main: true },
      { name: 'ターバン', cropX: 0.25, cropY: 0.05, cropW: 0.5, cropH: 0.25 },
      { name: '真珠', cropX: 0.45, cropY: 0.55, cropW: 0.2, cropH: 0.2 },
      { name: '背景', cropX: 0.0, cropY: 0.0, cropW: 1.0, cropH: 1.0 },
    ]),
  },
  {
    key: 'starry_night',
    titleJa: '星月夜',
    titleOriginal: 'The Starry Night',
    artist: 'Vincent van Gogh',
    artistDeathYear: 1890,
    yearCreated: '1889',
    sourceMuseum: 'Museum of Modern Art',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night.jpg',
    license: 'PD',
    imageUrlHigh:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/800px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
    imageUrlThumb:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/240px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
    linkedMusicId: 'M3',
    descriptionJa: 'サン=レミの療養院から見た夜空を描いた、渦巻く筆致が有名な傑作。',
    pieces: pieces([
      { name: '渦巻く空（中央）', cropX: 0.3, cropY: 0.1, cropW: 0.45, cropH: 0.45, main: true },
      { name: '月', cropX: 0.75, cropY: 0.1, cropW: 0.2, cropH: 0.2 },
      { name: '糸杉', cropX: 0.0, cropY: 0.1, cropW: 0.25, cropH: 0.8 },
      { name: '村', cropX: 0.25, cropY: 0.6, cropW: 0.6, cropH: 0.35 },
      { name: '星（左）', cropX: 0.05, cropY: 0.0, cropW: 0.25, cropH: 0.2 },
      { name: '丘（右）', cropX: 0.7, cropY: 0.55, cropW: 0.3, cropH: 0.35 },
    ]),
  },
  {
    key: 'great_wave',
    titleJa: '波（神奈川沖浪裏）',
    titleOriginal: 'Under the Wave off Kanagawa',
    artist: 'Katsushika Hokusai',
    artistDeathYear: 1849,
    yearCreated: '1831',
    sourceMuseum: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/45434',
    license: 'CC0',
    imageUrlHigh:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/800px-Tsunami_by_hokusai_19th_century.jpg',
    imageUrlThumb:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/240px-Tsunami_by_hokusai_19th_century.jpg',
    linkedMusicId: 'M4',
    descriptionJa: '葛飾北斎「富嶽三十六景」の一図。巨大な波と富士山の対比が象徴的。',
    pieces: pieces([
      { name: '大波', cropX: 0.0, cropY: 0.1, cropW: 0.55, cropH: 0.6, main: true },
      { name: '富士山', cropX: 0.4, cropY: 0.45, cropW: 0.3, cropH: 0.3 },
      { name: '舟', cropX: 0.3, cropY: 0.55, cropW: 0.4, cropH: 0.25 },
      { name: '空', cropX: 0.55, cropY: 0.0, cropW: 0.45, cropH: 0.4 },
    ]),
  },
  {
    key: 'the_kiss',
    titleJa: '接吻',
    titleOriginal: 'The Kiss',
    artist: 'Gustav Klimt',
    artistDeathYear: 1918,
    yearCreated: '1908',
    sourceMuseum: 'Österreichische Galerie Belvedere',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
    license: 'PD',
    imageUrlHigh:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/720px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
    imageUrlThumb:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/240px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg',
    linkedMusicId: 'M5',
    descriptionJa: 'クリムト黄金様式の頂点。金箔を用いた装飾と抱擁する二人が特徴。',
    pieces: pieces([
      { name: '抱擁する二人', cropX: 0.25, cropY: 0.15, cropW: 0.5, cropH: 0.6, main: true },
      { name: '花畑', cropX: 0.0, cropY: 0.7, cropW: 1.0, cropH: 0.3 },
      { name: '金の装飾（左）', cropX: 0.0, cropY: 0.0, cropW: 0.25, cropH: 0.7 },
      { name: '金の装飾（右）', cropX: 0.75, cropY: 0.0, cropW: 0.25, cropH: 0.7 },
    ]),
  },
];
