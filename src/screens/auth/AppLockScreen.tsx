import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authenticateBiometric, verifySecret } from '../../services/securityService';
import { useAuthStore, useCurrentUser } from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];

export function AppLockScreen() {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const setLocked = useAuthStore((s) => s.setLocked);
  const logout = useAuthStore((s) => s.logout);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const tryBio = async () => {
    if (!user?.security.biometricEnabled) return;
    const ok = await authenticateBiometric();
    if (ok) {
      haptics.success();
      setLocked(false);
    }
  };

  useEffect(() => {
    if (user?.security.biometricEnabled) {
      void tryBio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pressDigit = async (d: string) => {
    haptics.light();
    setError('');
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      if (!user?.security.pinCode) {
        setLocked(false);
        return;
      }
      const ok = await verifySecret(next, user.security.pinCode);
      if (ok) {
        haptics.success();
        setLocked(false);
      } else {
        haptics.error();
        setError('Mã PIN không đúng, vui lòng thử lại.');
        setPin('');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.lockCircle, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="shield-lock-outline" size={44} color={colors.primary} />
        </View>
        <Text style={[typography.h2, { color: colors.text }]}>Mở khóa MoneyFlow</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Xin chào {user?.fullName}! Nhập mã PIN 4 số hoặc dùng sinh trắc học
        </Text>

        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => {
            const filled = i < pin.length;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: filled ? colors.primary : 'transparent',
                    borderColor: filled ? colors.primary : colors.border,
                  },
                ]}
              />
            );
          })}
        </View>

        {error ? (
          <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
        ) : (
          <View style={{ height: 18 }} />
        )}

        <View style={styles.pad}>
          {PAD.map((k) => {
            if (k === 'bio') {
              return (
                <Pressable
                  key={k}
                  onPress={tryBio}
                  disabled={!user?.security.biometricEnabled}
                  style={[styles.key, { opacity: user?.security.biometricEnabled ? 1 : 0.3 }]}
                >
                  <MaterialCommunityIcons name="fingerprint" size={30} color={colors.primary} />
                </Pressable>
              );
            }
            if (k === 'del') {
              return (
                <Pressable
                  key={k}
                  onPress={() => setPin((p) => p.slice(0, -1))}
                  style={styles.key}
                >
                  <MaterialCommunityIcons name="backspace-outline" size={26} color={colors.text} />
                </Pressable>
              );
            }
            return (
              <Pressable
                key={k}
                onPress={() => pressDigit(k)}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: pressed ? colors.primarySoft : colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[typography.h1, { color: colors.text }]}>{k}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={logout} style={{ marginTop: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Đổi tài khoản đăng nhập
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  lockCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginVertical: spacing.sm,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pad: {
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
