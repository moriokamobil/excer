/** ログイン画面（citras ID mock連携）。 */
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { Screen, Title, Body, Button, Caption } from '../components/ui';
import { useApp } from '../state/AppContext';
import { colors, radius, spacing } from '../theme';
import { T } from '../i18n/messages';

export function LoginScreen() {
  const { login } = useApp();
  const [uid, setUid] = useState('curator-001');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    setBusy(true);
    try {
      await login(uid.trim(), name.trim() || undefined);
    } catch (e) {
      Alert.alert('ログイン失敗', String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Title>{T.appName}</Title>
        <Caption>時空美術館の学芸員として、街に散った名画のピースを集めよう</Caption>
      </View>
      <Body>citras ユーザーID</Body>
      <TextInput value={uid} onChangeText={setUid} style={styles.input} placeholder="curator-001" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
      <Body>学芸員名（任意）</Body>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="学芸員名" placeholderTextColor={colors.textMuted} />
      <Button label={T.common.login} onPress={onLogin} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.xl },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.purpleDeep,
  },
});
