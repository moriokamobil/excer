/** M10 マイページ/設定: 学芸員プロフィール・実績・位置情報の扱い明示。 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Card, Title, Heading, Body, Caption, Button } from '../components/ui';
import { ResourceBar } from '../components/ResourceBar';
import { useApp } from '../state/AppContext';
import type { RootStackParamList } from '../navigation/types';
import { spacing } from '../theme';

export function MyPageScreen() {
  const { player, inventory, progress } = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen>
      <Title>{player?.curatorName ?? '学芸員'}</Title>
      <Caption>Lv.{player?.level ?? 1} ・ XP {player?.xp ?? 0}</Caption>

      <Heading>所持リソース</Heading>
      <ResourceBar inventory={inventory} />

      <Heading>実績</Heading>
      <Card>
        <Body>修復済みの名画: {progress.completed ?? 0} 作品</Body>
        <Body>修復中: {progress.restoring ?? 0} 作品</Body>
        <Body>コレクション率: {progress.totalArtworks ? Math.round(((progress.completed ?? 0) / progress.totalArtworks) * 100) : 0}%</Body>
      </Card>

      <Heading>コインショップ</Heading>
      <Button label="クーポン交換へ" onPress={() => nav.navigate('Tabs', { screen: 'MyPage' })} variant="ghost" />

      <Heading>位置情報の扱い</Heading>
      <Card>
        <Body>本アプリはフォアグラウンドでのみ位置情報を使用します。</Body>
        <Caption>
          バックグラウンド追跡は行いません。位置ログは不正防止のために記録され、90日で匿名化されます。
          GPS偽装が検出された場合、報酬付与を制限することがあります。
        </Caption>
      </Card>

      <Heading>クレジット</Heading>
      <Card>
        <Caption>
          名画画像は The Met Open Access (CC0) / Wikimedia Commons (PD)、楽曲録音は Musopen (CC0) を出典とする
          パブリックドメイン素材です。各作品の所蔵館・作者は鑑賞モードに表示されます。
        </Caption>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({});
