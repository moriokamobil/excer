/** M1 ホーム: 修復中の名画・進捗・今日のおすすめ行動・所持リソース。 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Title, Heading, Body, Caption, Button, Badge } from '../components/ui';
import { ResourceBar } from '../components/ResourceBar';
import { useApp } from '../state/AppContext';
import { api } from '../api/client';
import type { Artwork } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import { T } from '../i18n/messages';

export function HomeScreen() {
  const { player, inventory, progress, refresh } = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [restoring, setRestoring] = useState<Artwork[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await refresh();
    const { artworks } = await api.artworks();
    setRestoring(artworks.filter((a) => a.state === 'restoring'));
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.purpleLight}
          />
        }
      >
        <Title>ようこそ、{player?.curatorName ?? '学芸員'}</Title>
        <Caption>
          修復済み {progress.completed ?? 0} / {progress.totalArtworks ?? 0} 作品
        </Caption>

        <Heading>{T.home.resources}</Heading>
        <ResourceBar inventory={inventory} />

        <Heading>{T.home.restoring}</Heading>
        {restoring.length === 0 ? (
          <Card>
            <Body>修復中の名画はありません。</Body>
            <Caption>店舗イベントでメインピースを入手して修復を始めましょう。</Caption>
          </Card>
        ) : (
          restoring.map((a) => {
            const owned = a.pieces.filter((p) => p.owned).length;
            const restored = a.pieces.filter((p) => p.isRestored).length;
            return (
              <Card key={a.id}>
                <View style={styles.row}>
                  <Heading>{a.titleJa}</Heading>
                  <Badge text={`修復 ${restored}/${a.pieces.length}`} />
                </View>
                <Caption>
                  {a.artist} ・ ピース所持 {owned}/{a.pieces.length}
                </Caption>
                <Button label="工房で修復する" onPress={() => nav.navigate('Workshop', { artworkId: a.id })} />
              </Card>
            );
          })
        )}

        <Heading>{T.home.todayAction}</Heading>
        <Card>
          <Button label={T.home.goCheckin} variant="gold" onPress={() => nav.navigate('Tabs', { screen: 'Map' })} />
          <Button label={T.home.goWork} variant="ghost" onPress={() => nav.navigate('Tabs', { screen: 'Work' })} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
