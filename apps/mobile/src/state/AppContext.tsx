/** アプリ全体の状態（認証・リソース残高）を保持するコンテキスト。 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Inventory, PlayerProfile } from '../api/types';

interface AppState {
  ready: boolean;
  loggedIn: boolean;
  player: PlayerProfile | null;
  inventory: Inventory | null;
  progress: Record<string, number>;
  login: (citrasUserId: string, curatorName?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    const [me, inv] = await Promise.all([api.me(), api.inventory()]);
    setPlayer(me.player);
    setProgress(me.progress);
    setInventory(inv);
  }, []);

  const login = useCallback(
    async (citrasUserId: string, curatorName?: string) => {
      await api.login(citrasUserId, curatorName);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <Ctx.Provider
      value={{
        ready,
        loggedIn: player !== null,
        player,
        inventory,
        progress,
        login,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
