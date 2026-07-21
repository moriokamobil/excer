/** ゲームAPIクライアント。JWTをメモリ保持し、位置ペイロードを付与する。 */
import Constants from 'expo-constants';
import type {
  Artwork,
  Inventory,
  MapSpot,
  Music,
  PlayerProfile,
  ShopItem,
  WorkTask,
  LocationPayload,
} from './types';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:4000/api/v1';

let authToken: string | null = null;
export function setToken(token: string | null): void {
  authToken = token;
}
export function getToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ApiError(res.status, json.error ?? 'error', json.message ?? '通信エラー');
  }
  return json as T;
}

export const api = {
  async login(citrasUserId: string, curatorName?: string) {
    const r = await request<{ token: string; player: { id: string; curatorName: string } }>(
      '/auth/login',
      { method: 'POST', body: { citras_user_id: citrasUserId, curator_name: curatorName } },
    );
    setToken(r.token);
    return r;
  },

  me() {
    return request<{ player: PlayerProfile; progress: Record<string, number> }>('/players/me');
  },
  inventory() {
    return request<Inventory>('/inventory');
  },
  artworks() {
    return request<{ artworks: Artwork[] }>('/artworks');
  },
  artwork(id: string) {
    return request<{ artwork: Artwork }>(`/artworks/${id}`);
  },
  artworkMusic(id: string) {
    return request<{ unlocked: boolean; music: Music | null }>(`/artworks/${id}/music`);
  },
  restore(artworkId: string, pieceId: string) {
    return request<{
      artworkState: string;
      artworkCompleted: boolean;
      unlockedMusicId: string | null;
      remainingPaint: number;
    }>(`/artworks/${artworkId}/restore`, { method: 'POST', body: { piece_id: pieceId } });
  },
  mapSpots(bbox: [number, number, number, number]) {
    return request<{ spots: MapSpot[] }>(`/map/spots?bbox=${bbox.join(',')}`);
  },
  checkin(storeId: string, loc: LocationPayload) {
    return request<{
      alreadyCheckedInToday: boolean;
      mainPieceAwarded: { pieceId: string; name: string; artworkId: string } | null;
      artworkId: string | null;
    }>(`/events/${storeId}/checkin`, { method: 'POST', body: loc });
  },
  visit(storeId: string, loc: LocationPayload) {
    return request<{
      visitCount: number;
      replicaUnlocked: boolean;
      replicaJustUnlocked: boolean;
      regularBonusPaint: number;
      replicaArtworkId: string | null;
      replicaMusicId: string | null;
    }>(`/stores/${storeId}/visit`, { method: 'POST', body: loc });
  },
  workTasks(near?: { lat: number; lng: number }) {
    const q = near ? `?near=${near.lat},${near.lng}` : '';
    return request<{ tasks: WorkTask[] }>(`/work/tasks${q}`);
  },
  claimReward(taskId: string, idempotencyKey: string) {
    return request<{
      paintGranted: number;
      springGranted: number;
      specialPieceId: string | null;
      alreadyClaimed: boolean;
    }>(`/work/tasks/${taskId}/claim-reward`, {
      method: 'POST',
      body: { idempotency_key: idempotencyKey },
    });
  },
  shopItems() {
    return request<{ items: ShopItem[] }>('/shop/items');
  },
  exchange(itemId: string) {
    return request<{ couponCode: string | null; paintGranted: number; message: string }>(
      '/shop/exchange',
      { method: 'POST', body: { item_id: itemId } },
    );
  },
  shopHistory() {
    return request<{ history: any[] }>('/shop/history');
  },
  gramophonePlay(artworkId: string) {
    return request<{ music: Music; remainingSpring: number }>('/gramophone/play', {
      method: 'POST',
      body: { artwork_id: artworkId },
    });
  },
};
