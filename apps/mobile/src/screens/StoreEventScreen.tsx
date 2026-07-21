/** M6 店舗イベント / M8 レプリカ常設: メインピース出現・来店チェックイン・通常来店。 */
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Title, Heading, Body, Caption, Button } from '../components/ui';
import { api } from '../api/client';
import { useApp } from '../state/AppContext';
import { useLocation } from '../hooks/useLocation';
import type { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme';
import { T } from '../i18n/messages';

export function StoreEventScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'StoreEvent'>>();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refresh } = useApp();
  const { payload, error: locError, refresh: refreshLoc } = useLocation();
  const [busy, setBusy] = useState(false);

  const doCheckin = async () => {
    const loc = payload();
    if (!loc) {
      Alert.alert('位置情報', locError ?? '現在地を取得できません');
      void refreshLoc();
      return;
    }
    setBusy(true);
    try {
      const r = await api.checkin(route.params.storeId, loc);
      await refresh();
      if (r.alreadyCheckedInToday) {
        Alert.alert('チェックイン済み', T.store.checkin + 'は本日すでに完了しています。');
      } else if (r.mainPieceAwarded) {
        Alert.alert(
          T.store.mainPieceHere,
          `「${r.mainPieceAwarded.name}」を入手しました！`,
          [
            { text: '工房へ', onPress: () => r.artworkId && nav.navigate('Workshop', { artworkId: r.artworkId }) },
            { text: T.common.close },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert('チェックインできません', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const doVisit = async () => {
    const loc = payload();
    if (!loc) {
      Alert.alert('位置情報', locError ?? '現在地を取得できません');
      return;
    }
    setBusy(true);
    try {
      const r = await api.visit(route.params.storeId, loc);
      await refresh();
      if (r.replicaJustUnlocked) {
        Alert.alert(T.store.replica, 'この店に名画のレプリカが常設されました！来店するとBGMが流れます。');
      } else if (r.regularBonusPaint > 0) {
        Alert.alert('常連ボーナス', `修復絵の具 ×${r.regularBonusPaint} を獲得しました。`);
      } else {
        Alert.alert('来店', `訪問カウント: ${r.visitCount} 回`);
      }
    } catch (e: any) {
      Alert.alert('来店できません', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>{route.params.storeName ?? '店舗イベント'}</Title>
      <Caption>80m以内で来店チェックインできます</Caption>

      <Card>
        <Heading>{T.store.mainPieceHere}</Heading>
        <Body>来店チェックインで、この店限定のメインピースを入手できます。</Body>
        <Button label={T.store.checkin} onPress={doCheckin} disabled={busy} variant="gold" />
      </Card>

      <Card>
        <Heading>{T.store.visit}</Heading>
        <Body>通常来店は訪問カウントに加算され、5回でレプリカが常設されます。</Body>
        <Button label={T.store.visit} onPress={doVisit} disabled={busy} variant="ghost" />
      </Card>

      {locError && <Caption>⚠ {locError}</Caption>}
    </Screen>
  );
}

const styles = StyleSheet.create({});
