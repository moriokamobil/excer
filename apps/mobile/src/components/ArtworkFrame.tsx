/**
 * 額縁つき名画表示（M4工房 / M5鑑賞 で使用）。
 * 未修復・未所持のピース領域は低彩度+ハッチング(斜線)で覆い、
 * 修復済みピースはフルカラーで見せる（クライアント側描画で表現）。§3.2 / §5.3
 */
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import type { PieceWithProgress } from '../api/types';
import { colors, radius } from '../theme';

interface Props {
  imageUrl: string;
  pieces: PieceWithProgress[];
  size: number;
  onPiecePress?: (piece: PieceWithProgress) => void;
}

// 斜線ハッチングを線の重ねで擬似表現する軽量オーバーレイ
function Hatch({ label }: { label: string }) {
  return (
    <View style={styles.hatchWrap}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[styles.hatchLine, { top: i * 10 - 4 }]} />
      ))}
      <Text style={styles.hatchLabel}>{label}</Text>
    </View>
  );
}

export function ArtworkFrame({ imageUrl, pieces, size, onPiecePress }: Props) {
  return (
    <View style={[styles.frame, { width: size + 24, height: size + 24 }]}>
      <View style={[styles.canvas, { width: size, height: size }]}>
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {pieces.map((p) => {
          if (p.owned && p.isRestored) return null; // フルカラー表示（オーバーレイなし）
          const style = {
            left: p.cropX * size,
            top: p.cropY * size,
            width: p.cropW * size,
            height: p.cropH * size,
          };
          return (
            <View
              key={p.id}
              style={[styles.pieceOverlay, style]}
              onTouchEnd={() => onPiecePress?.(p)}
            >
              {p.owned ? <Hatch label="修復" /> : <Text style={styles.missing}>＋</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  canvas: {
    backgroundColor: colors.bgMuted,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.frame,
  },
  pieceOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(20,11,38,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hatchWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  hatchLine: {
    position: 'absolute',
    left: -20,
    width: '160%',
    height: 1,
    backgroundColor: 'rgba(179,157,219,0.35)',
    transform: [{ rotate: '45deg' }],
  },
  hatchLabel: { color: colors.purpleLight, fontSize: 10 },
  missing: { color: colors.gold, fontSize: 28, fontWeight: '700' },
});
