/** M5 鑑賞モード: 完成画を額縁つき全画面表示 + 蓄音機BGMプレイヤー + 作品クレジット。§5.4 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Alert } from 'react-native';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen, Card, Title, Body, Caption, Heading, Button, Loading } from '../components/ui';
import { ArtworkFrame } from '../components/ArtworkFrame';
import { GramophonePlayer } from '../components/GramophonePlayer';
import { api } from '../api/client';
import { useApp } from '../state/AppContext';
import type { Artwork, Music } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme';
import { T } from '../i18n/messages';

export function ViewingScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Viewing'>>();
  const { width } = useWindowDimensions();
  const { refresh } = useApp();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [music, setMusic] = useState<Music | null>(null);

  const load = useCallback(async () => {
    const { artwork } = await api.artwork(route.params.artworkId);
    setArtwork(artwork);
    const m = await api.artworkMusic(route.params.artworkId);
    setMusic(m.music);
  }, [route.params.artworkId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const playWithSpring = async () => {
    if (!artwork) return;
    try {
      // 鑑賞モードでのBGM再生はゼンマイを1消費（§3.4）
      const r = await api.gramophonePlay(artwork.id);
      setMusic(r.music);
      await refresh();
    } catch (e: any) {
      Alert.alert('再生できません', e?.message ?? String(e));
    }
  };

  if (!artwork) return <Loading />;

  const frameSize = Math.min(width - spacing.md * 2 - 24, 360);

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
        <ArtworkFrame imageUrl={artwork.imageUrlHigh} pieces={artwork.pieces} size={frameSize} />
      </View>
      <Title>{artwork.titleJa}</Title>
      <Caption>{artwork.titleOriginal}</Caption>

      <Button label="蓄音機のゼンマイを巻いてBGMを流す（ゼンマイ1）" onPress={playWithSpring} variant="gold" />
      <GramophonePlayer music={music} />

      <Heading>{T.viewing.credit}</Heading>
      <Card>
        <Body>{T.viewing.artist}: {artwork.artist}</Body>
        <Body>{T.viewing.year}: {artwork.yearCreated}</Body>
        <Body>{T.viewing.museum}: {artwork.sourceMuseum}</Body>
        {music && <Body>{T.viewing.recording}: {music.recordingSource ?? '—'}</Body>}
        <Caption>ライセンス: {artwork.license}（パブリックドメイン / CC0）</Caption>
        <Caption>{artwork.descriptionJa}</Caption>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({});
