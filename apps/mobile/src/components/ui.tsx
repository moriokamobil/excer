/** 画面共通の小さなUI部品。 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={typography.title}>{children}</Text>;
}
export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={typography.heading}>{children}</Text>;
}
export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={typography.body}>{children}</Text>;
}
export function Caption({ children }: { children: React.ReactNode }) {
  return <Text style={typography.caption}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'gold';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'gold' && styles.btnGold,
        (disabled || pressed) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.btnLabel, variant === 'gold' && { color: '#241a00' }]}>{label}</Text>
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.purpleLight} />
      <Caption>読み込み中…</Caption>
    </View>
  );
}

export function Badge({ text, color = colors.purple }: { text: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  btn: { paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.purple },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.purpleDeep },
  btnGold: { backgroundColor: colors.gold },
  btnLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
