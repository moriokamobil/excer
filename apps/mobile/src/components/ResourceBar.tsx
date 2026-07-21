/** 所持リソース表示バー（絵の具・ゼンマイ・コイン）。 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Inventory } from '../api/types';
import { colors, radius, spacing } from '../theme';

export function ResourceBar({ inventory }: { inventory: Inventory | null }) {
  return (
    <View style={styles.bar}>
      <Item icon="🎨" label="絵の具" value={inventory?.restorePaint ?? '-'} />
      <Item icon="🎼" label="ゼンマイ" value={inventory?.gramophoneSpring ?? '-'} />
      <Item icon="🪙" label="コイン" value={inventory?.coins ?? '-'} />
    </View>
  );
}

function Item({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.icon}>{icon}</Text>
      <View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 22 },
  value: { color: colors.text, fontSize: 18, fontWeight: '700' },
  label: { color: colors.textMuted, fontSize: 11 },
});
