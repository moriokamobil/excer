/**
 * フォアグラウンド位置情報フック（§8: バックグラウンド追跡は実装しない）。
 * expo-location で現在地を取得し、APIの LocationPayload を生成する。
 */
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { LocationPayload } from '../api/types';

export interface LocationState {
  coords: { lat: number; lng: number; accuracy: number } | null;
  isMock: boolean;
  permission: 'granted' | 'denied' | 'undetermined';
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: null,
    isMock: false,
    permission: 'undetermined',
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({ ...s, permission: 'denied', error: '位置情報の許可が必要です' }));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setState({
        coords: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 999,
        },
        // expo-location は mocked フラグを提供（Androidのみ確実）
        isMock: (pos as unknown as { mocked?: boolean }).mocked ?? false,
        permission: 'granted',
        error: null,
      });
    } catch (e) {
      setState((s) => ({ ...s, error: String(e) }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const payload = useCallback((): LocationPayload | null => {
    if (!state.coords) return null;
    return {
      lat: state.coords.lat,
      lng: state.coords.lng,
      accuracy: state.coords.accuracy,
      is_mock_location: state.isMock,
      client_timestamp: new Date().toISOString(),
    };
  }, [state]);

  return { ...state, refresh, payload };
}
