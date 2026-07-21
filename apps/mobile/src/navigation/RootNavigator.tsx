import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { MuseumScreen } from '../screens/MuseumScreen';
import { WorkScreen } from '../screens/WorkScreen';
import { MyPageScreen } from '../screens/MyPageScreen';
import { StoreEventScreen } from '../screens/StoreEventScreen';
import { WorkshopScreen } from '../screens/WorkshopScreen';
import { ViewingScreen } from '../screens/ViewingScreen';
import { colors, fonts } from '../theme';
import { T } from '../i18n/messages';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const ICONS: Record<keyof TabParamList, string> = {
  Home: '🏛',
  Map: '🗺',
  Museum: '🖼',
  Work: '🛠',
  MyPage: '👤',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text, fontFamily: fonts.serif },
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.purpleDeep },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: T.tabs.home }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: T.tabs.map }} />
      <Tab.Screen name="Museum" component={MuseumScreen} options={{ title: T.tabs.museum }} />
      <Tab.Screen name="Work" component={WorkScreen} options={{ title: T.tabs.work }} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{ title: T.tabs.mypage }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.serif },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="StoreEvent" component={StoreEventScreen} options={{ title: '店舗イベント' }} />
      <Stack.Screen name="Workshop" component={WorkshopScreen} options={{ title: '修復工房' }} />
      <Stack.Screen name="Viewing" component={ViewingScreen} options={{ title: '鑑賞モード' }} />
    </Stack.Navigator>
  );
}
