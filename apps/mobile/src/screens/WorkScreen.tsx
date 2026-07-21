/** M7 ワーク一覧 + 完了報酬受取。すきまバイトのタスク完了で絵の具・ゼンマイを獲得。 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Title, Body, Caption, Button, Badge, Loading } from '../components/ui';
import { api } from '../api/client';
import { useApp } from '../state/AppContext';
import { useLocation } from '../hooks/useLocation';
import type { WorkTask } from '../api/types';
import { colors, spacing } from '../theme';

export function WorkScreen() {
  const { player, refresh } = useApp();
  const { coords } = useLocation();
  const [tasks, setTasks] = useState<WorkTask[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const near = coords ? { lat: coords.lat, lng: coords.lng } : undefined;
    const { tasks } = await api.workTasks(near);
    setTasks(tasks);
  }, [coords]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // 承認Webhook前提のため、モックでは「完了報告→承認→受取」を一括で試せる導線を用意。
  const claim = async (task: WorkTask) => {
    if (!player) return;
    setBusyId(task.id);
    try {
      const key = `${task.id}:${player.id}`;
      const r = await api.claimReward(task.id, key);
      await refresh();
      if (r.alreadyClaimed) {
        Alert.alert('受取済み', 'この報酬はすでに受け取り済みです。');
      } else {
        Alert.alert(
          '報酬を受け取りました',
          `修復絵の具 ×${r.paintGranted} / ゼンマイ ×${r.springGranted}` +
            (r.specialPieceId ? '\n特別ピースを入手しました！' : ''),
        );
      }
    } catch (e: any) {
      Alert.alert(
        '受け取れません',
        (e?.message ?? String(e)) + '\n（承認Webhook受信後に受取可能です）',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (!tasks) return <Loading />;

  return (
    <Screen>
      <Title>すきまワーク</Title>
      <Caption>タスク完了（承認済み）で修復絵の具と蓄音機のゼンマイを獲得できます。</Caption>
      {tasks.map((t) => (
        <Card key={t.id}>
          <View style={styles.row}>
            <Body>{t.title}</Body>
            {t.isRelay && <Badge text="回送・高報酬" color={colors.gold} />}
          </View>
          <Caption>
            報酬: 絵の具 ×{t.rewardPaint} / ゼンマイ ×{t.rewardSpring}
            {t.distanceM != null ? ` ・ ${t.distanceM}m` : ''}
          </Caption>
          <Button
            label="完了報酬を受け取る"
            onPress={() => claim(t)}
            disabled={busyId === t.id}
          />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});
