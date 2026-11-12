import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AuthStackScreenProps } from '../../types/navigation';
import { verifySecret } from '../../services/securityService';
import { useAuthStore } from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';

export function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const { colors } = useTheme();
  const findByEmail = useAuthStore((s) => s.findByEmail);
  const loginUser = useAuthStore((s) => s.loginUser);
  const users = useAuthStore((s) => s.users);

  const [email, setEmail] = useState(users[0]?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      haptics.error();
      return;
    }
    setLoading(true);
    try {
      const user = findByEmail(email);
      if (!user) {
        setError('Tài khoản email chưa được đăng ký.');
        haptics.error();
        return;
      }
      const ok = await verifySecret(password, user.passwordHash);
      if (!ok) {
        setError('Mật khẩu không chính xác.');
        haptics.error();
        return;
      }
      haptics.success();
      loginUser(user.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="cash-multiple" size={38} color="#FFFFFF" />
            </View>
            <Text style={[typography.h1, { color: colors.text }]}>Chào mừng trở lại</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
              Đăng nhập vào MoneyFlow để tiếp tục quản lý tài chính của bạn
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.field}>
              <Text style={[typography.label, { color: colors.text }]}>Email</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="ban@email.com"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[typography.label, { color: colors.text }]}>Mật khẩu</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                />
                <Pressable onPress={() => setShowPass((v) => !v)}>
                  <MaterialCommunityIcons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignSelf: 'flex-end' }}
            >
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                Quên mật khẩu?
              </Text>
            </Pressable>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={[typography.caption, { color: colors.danger, flex: 1 }]}>{error}</Text>
              </View>
            ) : null}

            <CustomButton title="Đăng nhập" onPress={handleLogin} loading={loading} icon="login" />
          </View>

          <View style={styles.bottomRow}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Chưa có tài khoản?
            </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '700' }]}>
                Đăng ký ngay
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  brand: { alignItems: 'center', gap: spacing.xs },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  formCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  field: { gap: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 48,
  },
  input: { flex: 1, ...typography.body },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
});
