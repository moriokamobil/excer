import type { NavigatorScreenParams } from '@react-navigation/native';

/** 5タブ（ホーム/地図/美術館/ワーク/マイページ）+ モーダル的スタック。 */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  StoreEvent: { storeId: string; storeName?: string };
  Workshop: { artworkId: string };
  Viewing: { artworkId: string };
};

export type TabParamList = {
  Home: undefined;
  Map: undefined;
  Museum: undefined;
  Work: undefined;
  MyPage: undefined;
};
