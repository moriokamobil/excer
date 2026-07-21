/** M3 美術館(図鑑): 修復済/修復中/未発見の名画グリッド・BGMアイコン。 */
import React, { useCallback, useState } from 'react';
import { View, Image, Pressable, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Title, Caption, Badge, Loading } from '../components/ui';
import { api } from '../api/client';
import type { Artwork } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { T } from '../i18n/messages';

const STATE_LABEL: Record<string, string> = {
  completed: T.museum.completed,
  restoring: T.museum.restoring,
  undiscovered: T.museum.undiscovered,
};
const STATE_COLOR: Record<string, string> = {
  completed: colors.gold,
  restoring: colors.purple,
  undiscovered: colors.bgMuted,
};

export function MuseumScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [artworks, setArtworks] = useState<Artwork[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.artworks().then((r) => setArtworks(r.artworks));
    }, []),
  );

  if (!artworks) return <Loading />;

  return (
    <Screen scroll={false}>
      <View style={{ padding: spacing.md }}>
        <Title>{T.museum.title}</Title>
      </View>
      <FlatList
        data={artworks}
        numColumns={2}
        keyExtractor={(a) => a.id}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        renderItem={({ item: a }) => {
          const discovered = a.state !== 'undiscovered';
          const target = a.state === 'completed' ? 'Viewing' : 'Workshop';
          return (
            <Pressable
              style={styles.tile}
              onPress={() => nav.navigate(target, { artworkId: a.id })}
            >
              <View style={styles.thumbWrap}>
                <Image
                  source={{ uri: a.imageUrlThumb }}
                  style={[styles.thumb, a.state !== 'completed' && styles.dimmed]}
                  resizeMode="cover"
                />
                {!discovered && <View style={styles.lockOverlay} />}
                {a.state === 'completed' && a.linkedMusicId && (
                  <View style={styles.musicIcon}>
                    <Caption>🎼</Caption>
                  </View>
                )}
              </View>
              <Caption>{discovered ? a.titleJa : '？？？'}</Caption>
              <Badge text={STATE_LABEL[a.state]} color={STATE_COLOR[a.state]} />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, gap: 4 },
  thumbWrap: { aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.bgElevated },
  thumb: { width: '100%', height: '100%' },
  dimmed: { opacity: 0.55 },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,6,20,0.75)' },
  musicIcon: { position: 'absolute', right: 6, bottom: 6, backgroundColor: colors.overlay, borderRadius: 10, padding: 4 },
});
