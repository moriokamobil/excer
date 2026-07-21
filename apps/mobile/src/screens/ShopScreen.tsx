/** M9 コインショップ: クーポン交換・交換履歴。 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Title, Heading, Body, Caption, Button, Loading } from '../components/ui';
import { ResourceBar } from '../components/ResourceBar';
import { api } from '../api/client';
import { useApp } from '../state/AppContext';
import type { ShopItem } from '../api/types';
import { spacing } from '../theme';
import { T } from '../i18n/messages';

export function ShopScreen() {
  const { inventory, refresh } = useApp();
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [it, h] = await Promise.all([api.shopItems(), api.shopHistory()]);
    setItems(it.items);
    setHistory(h.history);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const exchange = async (item: ShopItem) => {
    setBusy(true);
    try {
      const r = await api.exchange(item.itemId);
      await refresh();
      await load();
      Alert.alert(
        T.shop.exchange,
        r.couponCode ? `クーポンコード: ${r.couponCode}` : `絵の具 ×${r.paintGranted} を獲得しました`,
      );
    } catch (e: any) {
      Alert.alert('交換できません', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!items) return <Loading />;

  return (
    <Screen>
      <Title>{T.shop.title}</Title>
      <ResourceBar inventory={inventory} />
      {items.map((item) => (
        <Card key={item.itemId}>
          <View style={styles.row}>
            <Body>{item.itemName}</Body>
            <Body>🪙 {item.coinCost}</Body>
          </View>
          <Button
            label={T.shop.exchange}
            onPress={() => exchange(item)}
            disabled={busy || (inventory?.coins ?? 0) < item.coinCost}
          />
        </Card>
      ))}

      <Heading>{T.shop.history}</Heading>
      {history.length === 0 ? (
        <Caption>交換履歴はありません。</Caption>
      ) : (
        history.map((h, i) => (
          <Card key={i}>
            <Body>{h.itemName ?? h.itemId}</Body>
            <Caption>
              {h.couponCode ? `クーポン: ${h.couponCode}` : `-${h.coinsSpent} コイン`} ・{' '}
              {new Date(h.exchangedAt).toLocaleDateString('ja-JP')}
            </Caption>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
