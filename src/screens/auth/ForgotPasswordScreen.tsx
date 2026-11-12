import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AuthStackScreenProps } from '../../types/navigation';
import { hashSecret } from '../../services/securityService';
import { useAuthStore } from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';

export function ForgotPasswordScreen({ navigation }: AuthStackScreenProps<'ForgotPassword'>) {
  const { colors } = useTheme();
  const findByEmail = useAuthStore((s) => s.findByEmail);
  const updatePasswordByEmail = useAuthStore((s) => s.updatePasswordByEmail);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    const user = findByEmail(email);
    if (!user) {
      setError('Không tìm thấy tài khoản với email này.');
      haptics.error();
      return;
    }
    if (newPassword.length < 4) {
      setError('Mật khẩu mới cần tối thiểu 4 ký tự.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    const hash = await hashSecret(newPassword);
    updatePasswordByEmail(email, hash);
    haptics.success();
    Alert.alert('Thành công', 'Mật khẩu của bạn đã được cập nhật.', [
      { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header title="Đặt lại mật khẩu" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Nhập địa chỉ email đã đăng ký trên thiết bị để đặt lại mật khẩu mới.
            </Text>

            <View style={styles.field}>
              <Text style={[typography.label, { color: colors.text }]}>Email đã đăng ký</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="ban@email.com"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[typography.label, { color: colors.text }]}>Mật khẩu mới</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Tối thiểu 4 ký tự"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[typography.label, { color: colors.text }]}>Xác nhận mật khẩu mới</Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              />
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={[typography.caption, { color: colors.danger, flex: 1 }]}>{error}</Text>
              </View>
            ) : null}

            <CustomButton title="Cập nhật mật khẩu" onPress={handleReset} icon="lock-reset" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl },
  card: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  field: { gap: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    ...typography.body,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
});
