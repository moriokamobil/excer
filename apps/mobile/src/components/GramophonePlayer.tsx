/**
 * 蓄音機風 BGM プレイヤー（M5鑑賞モード）。§5.4
 * expo-av で再生/一時停止・シークバー・曲名・作曲家を表示。
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import type { Music } from '../api/types';
import { colors, radius, spacing, typography } from '../theme';
import { T } from '../i18n/messages';

export function GramophonePlayer({ music }: { music: Music | null }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    return () => {
      void soundRef.current?.unloadAsync();
    };
  }, []);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPlaying(status.isPlaying);
    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 1);
  };

  const toggle = async () => {
    if (!music?.audioUrl) return;
    if (!soundRef.current) {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: music.audioUrl },
        { shouldPlay: true },
        onStatus,
      );
      soundRef.current = sound;
      return;
    }
    if (playing) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  };

  const pct = Math.min(100, (position / duration) * 100);

  return (
    <View style={styles.player}>
      <View style={styles.info}>
        <Text style={styles.horn}>📯</Text>
        <View style={{ flex: 1 }}>
          <Text style={typography.heading} numberOfLines={1}>
            {music?.titleJa ?? '—'}
          </Text>
          <Text style={typography.caption}>{music?.composer ?? ''}</Text>
        </View>
        <Pressable style={styles.playBtn} onPress={toggle} disabled={!music?.audioUrl}>
          <Text style={styles.playIcon}>{playing ? '⏸' : '▶'}</Text>
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      {!music?.audioUrl && (
        <Text style={styles.locked}>名画を完成させるとBGMが解放されます</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.purpleDeep,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  horn: { fontSize: 30 },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 20 },
  track: {
    height: 4,
    backgroundColor: colors.bgMuted,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: 4, backgroundColor: colors.gold },
  locked: { ...typography.caption, marginTop: spacing.sm, textAlign: 'center' },
});
