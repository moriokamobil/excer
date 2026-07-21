/**
 * 紫(パープル)基調のダークテーマ（REQUIREMENTS §5.2）。
 * 名画が主役なので UI は暗く沈ませ、額縁内の絵を浮かび上がらせる。
 * 見出しはセリフ体(明朝系)で美術館らしい格調を出す。
 */
import { Platform } from 'react-native';

export const colors = {
  bg: '#140b26', // 最暗部（背景）
  bgElevated: '#1e1338', // カード
  bgMuted: '#2a1d4a',
  purple: '#7c4dff', // アクセント
  purpleDeep: '#5b32c9',
  purpleLight: '#b39ddb',
  gold: '#d4af37', // 額縁・完成の金
  text: '#ede7f6',
  textMuted: '#9d8fc0',
  danger: '#e05a7a',
  success: '#66bb9a',
  frame: '#4a3a1e', // 額縁の木目影
  overlay: 'rgba(10,6,20,0.7)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
} as const;

// 明朝系フォント（見出し用）。実機でのフォント名は環境依存のためフォールバックを持つ。
export const fonts = {
  serif: Platform.select({
    ios: 'Hiragino Mincho ProN',
    android: 'serif',
    default: 'serif',
  }),
  sans: Platform.select({
    ios: 'Hiragino Sans',
    android: 'sans-serif',
    default: 'System',
  }),
} as const;

export const typography = {
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, fontWeight: '600' as const },
  heading: { fontFamily: fonts.serif, fontSize: 20, color: colors.text, fontWeight: '600' as const },
  body: { fontFamily: fonts.sans, fontSize: 15, color: colors.text },
  caption: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted },
};
