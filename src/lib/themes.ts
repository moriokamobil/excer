// テーマカタログ（仕様書 10章）。クラウド版では themes テーブルに載せるマスタのローカル定義。
// 全配色はCSSカスタムプロパティで参照するため、切り替えは変数の書き換えのみで完結する。

export type ThemeDef = {
  key: string;
  name: string;
  description: string;
  price: number; // 0 = 無料（標準）
  isDefault: boolean;
  swatch: [string, string, string];
  cssVariables: Record<string, string>;
};

export const THEMES: ThemeDef[] = [
  {
    key: "cockpit",
    name: "コックピット（標準）",
    description: "標準のダーク計器盤テーマ",
    price: 0,
    isDefault: true,
    swatch: ["#14191e", "#ffb454", "#54e0ff"],
    cssVariables: {
      "--bg": "#0a0c0e",
      "--bg-2": "#101418",
      "--panel": "#14191e",
      "--panel-2": "#1a2128",
      "--bezel": "#232b33",
      "--amber": "#ffb454",
      "--amber-dim": "rgba(255,180,84,0.35)",
      "--amber-faint": "rgba(255,180,84,0.12)",
      "--cyan": "#54e0ff",
      "--cyan-dim": "rgba(84,224,255,0.35)",
      "--cyan-faint": "rgba(84,224,255,0.12)",
      "--text": "#e8edf2",
      "--muted": "#7d8a96",
      "--red": "#ff5d5d",
      "--green": "#47d98a",
    },
  },
  {
    key: "sunset",
    name: "サンセット",
    description: "夕焼けを思わせる暖色系テーマ",
    price: 380,
    isDefault: false,
    swatch: ["#241416", "#ff9d5c", "#ff5d8f"],
    cssVariables: {
      "--bg": "#160d0e",
      "--bg-2": "#1e1214",
      "--panel": "#241416",
      "--panel-2": "#2c191c",
      "--bezel": "#3d2226",
      "--amber": "#ff9d5c",
      "--amber-dim": "rgba(255,157,92,0.35)",
      "--amber-faint": "rgba(255,157,92,0.12)",
      "--cyan": "#ff5d8f",
      "--cyan-dim": "rgba(255,93,143,0.35)",
      "--cyan-faint": "rgba(255,93,143,0.12)",
      "--text": "#f4e9e6",
      "--muted": "#a0857f",
      "--red": "#ff5d5d",
      "--green": "#59d98a",
    },
  },
  {
    key: "forest",
    name: "フォレスト",
    description: "深緑と土色を基調にした落ち着いたテーマ",
    price: 380,
    isDefault: false,
    swatch: ["#131b15", "#4fd984", "#a8e063"],
    cssVariables: {
      "--bg": "#0c110d",
      "--bg-2": "#111812",
      "--panel": "#131b15",
      "--panel-2": "#18221a",
      "--bezel": "#243026",
      "--amber": "#4fd984",
      "--amber-dim": "rgba(79,217,132,0.35)",
      "--amber-faint": "rgba(79,217,132,0.12)",
      "--cyan": "#a8e063",
      "--cyan-dim": "rgba(168,224,99,0.35)",
      "--cyan-faint": "rgba(168,224,99,0.12)",
      "--text": "#e7f0e8",
      "--muted": "#7f9384",
      "--red": "#ff6b6b",
      "--green": "#4fd984",
    },
  },
  {
    key: "minimal-white",
    name: "ミニマル ホワイト",
    description: "明るく洗練されたライトテーマ",
    price: 550,
    isDefault: false,
    swatch: ["#ffffff", "#5b6470", "#3b6fe0"],
    cssVariables: {
      "--bg": "#f2f4f7",
      "--bg-2": "#e9edf2",
      "--panel": "#ffffff",
      "--panel-2": "#f7f9fb",
      "--bezel": "#d7dde4",
      "--amber": "#e08a1e",
      "--amber-dim": "rgba(224,138,30,0.4)",
      "--amber-faint": "rgba(224,138,30,0.1)",
      "--cyan": "#3b6fe0",
      "--cyan-dim": "rgba(59,111,224,0.35)",
      "--cyan-faint": "rgba(59,111,224,0.08)",
      "--text": "#1c2430",
      "--muted": "#66707d",
      "--red": "#d94040",
      "--green": "#1fa860",
    },
  },
  {
    key: "cyber-neon",
    name: "サイバーネオン",
    description: "ネオンが煌めくサイバーパンク風テーマ",
    price: 480,
    isDefault: false,
    swatch: ["#160a20", "#ff2ec4", "#2ee6ff"],
    cssVariables: {
      "--bg": "#0d0614",
      "--bg-2": "#140a1e",
      "--panel": "#190d26",
      "--panel-2": "#20122f",
      "--bezel": "#331d4a",
      "--amber": "#ff2ec4",
      "--amber-dim": "rgba(255,46,196,0.4)",
      "--amber-faint": "rgba(255,46,196,0.12)",
      "--cyan": "#2ee6ff",
      "--cyan-dim": "rgba(46,230,255,0.4)",
      "--cyan-faint": "rgba(46,230,255,0.12)",
      "--text": "#efe6fa",
      "--muted": "#8d7fa6",
      "--red": "#ff4d6d",
      "--green": "#3ef0a0",
    },
  },
];

export function applyTheme(key: string) {
  const theme = THEMES.find((t) => t.key === key) ?? THEMES[0];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.cssVariables)) {
    root.style.setProperty(k, v);
  }
}
