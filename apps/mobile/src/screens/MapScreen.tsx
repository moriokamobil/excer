/** M2 地図: 現在地・イベント店舗ピン・レプリカ常設店・カーシェアST。 */
import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Body, Caption, Button } from '../components/ui';
import { api } from '../api/client';
import { useLocation } from '../hooks/useLocation';
import type { MapSpot } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

const TOKYO: Region = { latitude: 35.681, longitude: 139.767, latitudeDelta: 0.08, longitudeDelta: 0.08 };

const PIN_COLOR: Record<MapSpot['kind'], string> = {
  event_store: colors.gold,
  replica_store: colors.purple,
  carshare_station: colors.success,
};

export function MapScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { coords } = useLocation();
  const [spots, setSpots] = useState<MapSpot[]>([]);
  const [selected, setSelected] = useState<MapSpot | null>(null);
  const region = useRef<Region>(TOKYO);

  const loadSpots = useCallback(async (r: Region) => {
    const w = r.longitude - r.longitudeDelta / 2;
    const s = r.latitude - r.latitudeDelta / 2;
    const e = r.longitude + r.longitudeDelta / 2;
    const n = r.latitude + r.latitudeDelta / 2;
    const { spots } = await api.mapSpots([w, s, e, n]);
    setSpots(spots);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSpots(region.current);
    }, [loadSpots]),
  );

  return (
    <Screen scroll={false}>
      <MapView
        style={styles.map}
        initialRegion={TOKYO}
        showsUserLocation
        onRegionChangeComplete={(r) => {
          region.current = r;
          void loadSpots(r);
        }}
      >
        {spots.map((sp) => (
          <Marker
            key={sp.id}
            coordinate={{ latitude: sp.lat, longitude: sp.lng }}
            pinColor={PIN_COLOR[sp.kind]}
            onPress={() => setSelected(sp)}
          />
        ))}
      </MapView>

      <View style={styles.legend}>
        <LegendDot color={colors.gold} label="イベント店" />
        <LegendDot color={colors.purple} label="レプリカ店" />
        <LegendDot color={colors.success} label="カーシェアST" />
      </View>

      {selected && (
        <Card style={styles.sheet}>
          <Body>{selected.name}</Body>
          <Caption>
            {selected.kind === 'event_store'
              ? 'メインピースを配布中'
              : selected.kind === 'replica_store'
                ? 'レプリカ常設店（来店でBGM）'
                : 'カーシェアステーション'}
          </Caption>
          {selected.kind !== 'carshare_station' && (
            <Button label="この店を開く" onPress={() => nav.navigate('StoreEvent', { storeId: selected.id, storeName: selected.name })} />
          )}
        </Card>
      )}
    </Screen>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  legend: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.overlay,
    padding: spacing.sm,
    borderRadius: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: colors.text, fontSize: 11 },
  sheet: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
});
