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
import { hashSecret, validateEmail } from '../../services/securityService';
import { bootstrapNewUser } from '../../services/onboardingService';
import { useAuthStore } from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';

export function RegisterScreen({ navigation }: AuthStackScreenProps<'Register'>) {
  const { colors } = useTheme();
  const findByEmail = useAuthStore((s) => s.findByEmail);
  const registerUser = useAuthStore((s) => s.registerUser);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Định dạng email không hợp lệ.');
      return;
    }
    if (findByEmail(email)) {
      setError('Email này đã được đăng ký trước đó.');
      return;
    }
    if (password.length < 4) {
      setError('Mật khẩu cần tối thiểu 4 ký tự.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const passwordHash = await hashSecret(password);
      const user = registerUser({ fullName, email, passwordHash });
      bootstrapNewUser(user);
      haptics.success();
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
              <MaterialCommunityIcons name="account-plus-outline" size={34} color="#FFFFFF" />
            </View>
            <Text style={[typography.h1, { color: colors.text }]}>Tạo tài khoản mới</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
              Mật khẩu được băm bảo mật SHA-256 ngay trên thiết bị của bạn
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.field}>
              <Text style={[typography.label, { color: colors.text }]}>Họ và tên</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

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
                  placeholder="Tối thiểu 4 ký tự"
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

            <View style={styles.field}>
              <Text style={[typography.label, { color: colors.text }]}>Xác nhận mật khẩu</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showPass}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={[typography.caption, { color: colors.danger, flex: 1 }]}>{error}</Text>
              </View>
            ) : null}

            <CustomButton
              title="Đăng ký & Khởi tạo Ví"
              onPress={handleRegister}
              loading={loading}
              icon="check-circle-outline"
            />
          </View>

          <View style={styles.bottomRow}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Đã có tài khoản?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '700' }]}>
                Đăng nhập
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
    gap: spacing.lg,
  },
  brand: { alignItems: 'center', gap: spacing.xs },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
