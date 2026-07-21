/** M4 修復工房: 額縁に欠けピース表示・所持ピーストレイ・絵の具消費で修復。§5.3 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Title, Heading, Body, Caption, Button, Badge, Loading } from '../components/ui';
import { ArtworkFrame } from '../components/ArtworkFrame';
import { api } from '../api/client';
import { useApp } from '../state/AppContext';
import type { Artwork, PieceWithProgress } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import { T } from '../i18n/messages';

export function WorkshopScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Workshop'>>();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refresh, inventory } = useApp();
  const { width } = useWindowDimensions();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { artwork } = await api.artwork(route.params.artworkId);
    setArtwork(artwork);
  }, [route.params.artworkId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const restorePiece = async (piece: PieceWithProgress) => {
    if (!artwork) return;
    if (!piece.owned) {
      Alert.alert('未所持', 'このピースはまだ入手していません。');
      return;
    }
    if (piece.isRestored) return;
    setBusy(true);
    try {
      const r = await api.restore(artwork.id, piece.id);
      await load();
      await refresh();
      if (r.artworkCompleted) {
        Alert.alert(T.workshop.complete, '美術館に収蔵され、BGMが解放されました。', [
          { text: T.workshop.toViewing, onPress: () => nav.navigate('Viewing', { artworkId: artwork.id }) },
        ]);
      }
    } catch (e: any) {
      Alert.alert('修復できません', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const restoreNext = () => {
    const next = artwork?.pieces.find((p) => p.owned && !p.isRestored);
    if (next) void restorePiece(next);
  };

  if (!artwork) return <Loading />;

  const frameSize = Math.min(width - spacing.md * 2 - 24, 340);
  const owned = artwork.pieces.filter((p) => p.owned);
  const nextExists = artwork.pieces.some((p) => p.owned && !p.isRestored);
  const canAfford = (inventory?.restorePaint ?? 0) >= 3;

  return (
    <Screen>
      <Title>{T.workshop.title}</Title>
      <Caption>{artwork.titleJa} ・ {artwork.artist}</Caption>

      <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
        <ArtworkFrame
          imageUrl={artwork.imageUrlHigh}
          pieces={artwork.pieces}
          size={frameSize}
          onPiecePress={restorePiece}
        />
      </View>

      <Button
        label={T.workshop.restoreNext}
        onPress={restoreNext}
        disabled={busy || !nextExists || !canAfford}
        variant="gold"
      />
      {!canAfford && nextExists && <Caption>絵の具が不足しています（ワークで集めましょう）</Caption>}

      <Heading>{T.workshop.tray}</Heading>
      <View style={styles.tray}>
        {artwork.pieces.map((p) => (
          <Card key={p.id} style={styles.pieceCard}>
            <Body>{p.name}</Body>
            <View style={styles.row}>
              {p.pieceType === 'main' && <Badge text="メイン" color={colors.gold} />}
              <Badge
                text={!p.owned ? '未入手' : p.isRestored ? '修復済' : '未修復'}
                color={!p.owned ? colors.bgMuted : p.isRestored ? colors.success : colors.purple}
              />
            </View>
          </Card>
        ))}
      </View>
      <Caption>入手済みピース {owned.length}/{artwork.pieces.length}</Caption>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tray: { gap: spacing.sm },
  pieceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 6 },
});
