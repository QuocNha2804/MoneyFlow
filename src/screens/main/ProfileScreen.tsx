import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BackupData } from '../../types/models';
import type { TabScreenProps } from '../../types/navigation';
import {
  applyBackupData,
  exportBackupJSON,
  exportTransactionsCSV,
  persistImageFile,
  pickAndParseBackupJSON,
} from '../../services/backupService';
import {
  rescheduleSummaryNotifications,
  scheduleDailyReminder,
} from '../../services/notificationService';
import { hashSecret, isBiometricAvailable, verifySecret } from '../../services/securityService';
import {
  clearAllUserData,
  useAuthStore,
  useCurrentUser,
  useThemeStore,
  useUserTransactions,
} from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CurrencySwitchModal } from '../modals/CurrencySwitchModal';

const PRESET_AVATARS = [
  { key: 'preset:leaf', icon: 'leaf', bg: '#16A34A' },
  { key: 'preset:cat', icon: 'cat', bg: '#F97316' },
  { key: 'preset:rocket', icon: 'rocket-launch', bg: '#3B82F6' },
  { key: 'preset:crown', icon: 'crown', bg: '#EAB308' },
  { key: 'preset:diamond', icon: 'diamond-stone', bg: '#8B5CF6' },
];

const REMINDER_TIMES = ['08:00', '12:30', '19:30', '21:00', '22:00'];

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { colors, isDark } = useTheme();
  const toggleTheme = useThemeStore((s) => s.toggle);
  const user = useCurrentUser();
  const transactions = useUserTransactions();

  const updateCurrentUser = useAuthStore((s) => s.updateCurrentUser);
  const setSecurity = useAuthStore((s) => s.setSecurity);
  const setNotifications = useAuthStore((s) => s.setNotifications);
  const logout = useAuthStore((s) => s.logout);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user?.fullName ?? '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);

  if (!user) return null;

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      updateCurrentUser({ avatar: persistImageFile(res.assets[0].uri, 'avatars') });
      haptics.success();
    }
  };

  const handleSaveProfile = async () => {
    if (editName.trim()) {
      updateCurrentUser({ fullName: editName.trim() });
    }
    if (newPass) {
      const ok = await verifySecret(oldPass, user.passwordHash);
      if (!ok) {
        Alert.alert('Lỗi', 'Mật khẩu hiện tại không đúng.');
        return;
      }
      if (newPass.length < 4) {
        Alert.alert('Lỗi', 'Mật khẩu mới cần tối thiểu 4 ký tự.');
        return;
      }
      const passwordHash = await hashSecret(newPass);
      updateCurrentUser({ passwordHash });
    }
    setOldPass('');
    setNewPass('');
    setShowEditProfile(false);
    haptics.success();
  };

  const toggleBiometric = async (val: boolean) => {
    if (val) {
      const avail = await isBiometricAvailable();
      if (!avail) {
        Alert.alert(
          'Không khả dụng',
          'Thiết bị chưa đăng ký FaceID / Vân tay hoặc không hỗ trợ. Bạn có thể bật khóa Mã PIN 4 số.',
        );
        return;
      }
    }
    setSecurity({ biometricEnabled: val });
  };

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      Alert.alert('Lỗi', 'Mã PIN phải gồm đúng 4 chữ số.');
      return;
    }
    const pinCode = await hashSecret(pinInput);
    setSecurity({ pinCode });
    setPinInput('');
    setShowPinModal(false);
    haptics.success();
  };

  const handleImportJSON = async () => {
    try {
      const data = await pickAndParseBackupJSON();
      if (data) setPendingBackup(data);
    } catch (e) {
      Alert.alert('Lỗi đọc file', e instanceof Error ? e.message : 'File không hợp lệ');
    }
  };

  const preset = PRESET_AVATARS.find((p) => p.key === user.avatar);
  const isCustomAvatar = user.avatar && !user.avatar.startsWith('preset:');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Thẻ thông tin cá nhân */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            {isCustomAvatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: preset?.bg ?? colors.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name={(preset?.icon ?? 'account') as never}
                  size={34}
                  color="#FFFFFF"
                />
              </View>
            )}
            <View style={[styles.camBadge, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="camera" size={13} color="#FFFFFF" />
            </View>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={[typography.h2, { color: colors.text }]}>{user.fullName}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{user.email}</Text>
            <View style={styles.presetRow}>
              {PRESET_AVATARS.map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => updateCurrentUser({ avatar: p.key })}
                  style={[
                    styles.presetDot,
                    {
                      backgroundColor: p.bg,
                      borderWidth: user.avatar === p.key ? 2.5 : 0,
                      borderColor: colors.text,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={p.icon as never} size={13} color="#FFFFFF" />
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => {
              setEditName(user.fullName);
              setShowEditProfile(true);
            }}
            style={[styles.editBtn, { backgroundColor: colors.cardAlt }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* Quản lý Tài chính */}
        <Section title="Quản lý Tài chính">
          <MenuRow
            icon="wallet-outline"
            label="Quản lý Ví & Nguồn tiền"
            sub="Thêm, sửa, ẩn ví và điều chỉnh số dư thực tế"
            onPress={() => navigation.navigate('ManageWallets')}
          />
          <MenuRow
            icon="shape-outline"
            label="Quản lý Danh mục Thu / Chi"
            sub="Thêm, đổi màu/icon, sắp xếp thứ tự hoặc ẩn danh mục"
            onPress={() => navigation.navigate('ManageCategories')}
          />
          <MenuRow
            icon="autorenew"
            label="Giao dịch định kỳ tự động"
            sub="Xem, tạm dừng hoặc xóa các mẫu lặp lại"
            onPress={() => navigation.navigate('RecurringList')}
          />
          <MenuRow
            icon="calendar-month-outline"
            label="Lịch & Nhật ký Thu Chi"
            sub="Xem theo ngày và check-in ghi bù quá khứ"
            onPress={() => navigation.navigate('Calendar')}
          />
          <MenuRow
            icon="currency-usd"
            label="Đơn vị tiền tệ chính"
            value={user.currency}
            onPress={() => setShowCurrencyModal(true)}
          />
        </Section>

        {/* Giao diện & Bảo mật */}
        <Section title="Giao diện & Bảo mật">
          <SwitchRow
            icon="theme-light-dark"
            label="Chế độ Giao diện tối (Dark Mode)"
            value={isDark}
            onValueChange={() => toggleTheme(isDark)}
          />
          <SwitchRow
            icon="fingerprint"
            label="Khóa bằng Vân tay / FaceID"
            value={user.security.biometricEnabled}
            onValueChange={toggleBiometric}
          />
          <SwitchRow
            icon="dialpad"
            label="Khóa bằng Mã PIN 4 số"
            sub={user.security.pinCode ? 'Đã thiết lập mã PIN' : 'Chưa bật'}
            value={!!user.security.pinCode}
            onValueChange={(val) => {
              if (val) setShowPinModal(true);
              else setSecurity({ pinCode: undefined });
            }}
          />
        </Section>

        {/* Cài đặt thông báo */}
        <Section title="Thông báo & Nhắc nhở">
          <SwitchRow
            icon="bell-outline"
            label="Nhắc ghi chép hằng ngày"
            sub={`Giờ nhắc: ${user.notifications.reminderTime}`}
            value={user.notifications.dailyReminder}
            onValueChange={(v) => {
              setNotifications({ dailyReminder: v });
              void scheduleDailyReminder(v, user.notifications.reminderTime);
            }}
          />
          {user.notifications.dailyReminder && (
            <View style={styles.timeRow}>
              {REMINDER_TIMES.map((t) => {
                const active = user.notifications.reminderTime === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      setNotifications({ reminderTime: t });
                      void scheduleDailyReminder(true, t);
                    }}
                    style={[
                      styles.timeChip,
                      { backgroundColor: active ? colors.primary : colors.cardAlt },
                    ]}
                  >
                    <Text
                      style={[
                        typography.small,
                        { color: active ? '#FFFFFF' : colors.text, fontWeight: '700' },
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <SwitchRow
            icon="alert-outline"
            label="Cảnh báo vượt ngân sách (80%, 100%)"
            value={user.notifications.budgetAlert}
            onValueChange={(v) => setNotifications({ budgetAlert: v })}
          />
          <SwitchRow
            icon="trophy-outline"
            label="Cột mốc mục tiêu (25% – 100%)"
            value={user.notifications.goalMilestone}
            onValueChange={(v) => setNotifications({ goalMilestone: v })}
          />
          <SwitchRow
            icon="calendar-week"
            label="Báo cáo tổng kết tuần (Chủ nhật 20:00)"
            value={user.notifications.weeklySummary}
            onValueChange={(v) => {
              setNotifications({ weeklySummary: v });
              void rescheduleSummaryNotifications(
                { ...user, notifications: { ...user.notifications, weeklySummary: v } },
                transactions,
              );
            }}
          />
          <SwitchRow
            icon="calendar-check"
            label="Báo cáo tổng kết tháng (Cuối tháng 20:00)"
            value={user.notifications.monthlySummary}
            onValueChange={(v) => {
              setNotifications({ monthlySummary: v });
              void rescheduleSummaryNotifications(
                { ...user, notifications: { ...user.notifications, monthlySummary: v } },
                transactions,
              );
            }}
          />
        </Section>

        {/* Sao lưu & Dữ liệu */}
        <Section title="Sao lưu & Dữ liệu">
          <MenuRow
            icon="code-json"
            label="Sao lưu toàn diện (Export JSON)"
            sub="Đóng gói toàn bộ ví, giao dịch, ngân sách, mục tiêu"
            onPress={() => void exportBackupJSON(user.id)}
          />
          <MenuRow
            icon="file-excel-outline"
            label="Xuất báo cáo Excel (Export CSV)"
            sub="Chuẩn UTF-8 có BOM đọc tiếng Việt trên máy tính"
            onPress={() => void exportTransactionsCSV(user.id)}
          />
          <MenuRow
            icon="file-import-outline"
            label="Khôi phục dữ liệu (Import JSON)"
            sub="Hỗ trợ Gộp dữ liệu (Merge) hoặc Ghi đè (Replace)"
            onPress={handleImportJSON}
          />
          <MenuRow
            icon="delete-forever-outline"
            label="Xóa toàn bộ dữ liệu (Reset)"
            danger
            onPress={() => setResetStep(1)}
          />
        </Section>

        <CustomButton
          title="Đăng xuất tài khoản"
          variant="outline"
          icon="logout"
          onPress={logout}
        />
      </ScrollView>

      {/* Modal sửa thông tin & đổi mật khẩu */}
      <Modal visible={showEditProfile} transparent animationType="fade" onRequestClose={() => setShowEditProfile(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowEditProfile(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[typography.h2, { color: colors.text }]}>Chỉnh sửa hồ sơ</Text>
            <Text style={[typography.label, { color: colors.text }]}>Họ và tên</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
            <Text style={[typography.label, { color: colors.text }]}>
              Đổi mật khẩu (để trống nếu không đổi)
            </Text>
            <TextInput
              value={oldPass}
              onChangeText={setOldPass}
              secureTextEntry
              placeholder="Mật khẩu hiện tại"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
            <TextInput
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry
              placeholder="Mật khẩu mới"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <CustomButton title="Hủy" variant="outline" onPress={() => setShowEditProfile(false)} style={{ flex: 1 }} />
              <CustomButton title="Lưu" onPress={handleSaveProfile} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal đặt mã PIN 4 số */}
      <Modal visible={showPinModal} transparent animationType="fade" onRequestClose={() => setShowPinModal(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowPinModal(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[typography.h2, { color: colors.text }]}>Thiết lập Mã PIN 4 số</Text>
            <TextInput
              value={pinInput}
              onChangeText={(t) => setPinInput(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.primary,
                  borderColor: colors.border,
                  textAlign: 'center',
                  fontSize: 24,
                  letterSpacing: 12,
                },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <CustomButton title="Hủy" variant="outline" onPress={() => setShowPinModal(false)} style={{ flex: 1 }} />
              <CustomButton title="Bật khóa PIN" onPress={handleSavePin} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal chọn Merge hay Replace khi Import JSON */}
      <Modal visible={!!pendingBackup} transparent animationType="fade" onRequestClose={() => setPendingBackup(null)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.h2, { color: colors.text }]}>Khôi phục dữ liệu</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              Tìm thấy {pendingBackup?.transactions.length ?? 0} giao dịch và{' '}
              {pendingBackup?.wallets.length ?? 0} ví trong file sao lưu. Bạn muốn khôi phục theo
              cách nào?
            </Text>
            <CustomButton
              title="Gộp dữ liệu (Merge)"
              variant="secondary"
              icon="merge"
              onPress={() => {
                if (pendingBackup) applyBackupData(user.id, pendingBackup, 'merge');
                setPendingBackup(null);
                haptics.success();
              }}
            />
            <CustomButton
              title="Ghi đè toàn bộ (Replace)"
              variant="danger"
              icon="file-replace-outline"
              onPress={() => {
                if (pendingBackup) applyBackupData(user.id, pendingBackup, 'replace');
                setPendingBackup(null);
                haptics.success();
              }}
            />
            <CustomButton title="Hủy" variant="outline" onPress={() => setPendingBackup(null)} />
          </View>
        </View>
      </Modal>

      {/* Modal chuyển đổi tiền tệ */}
      <CurrencySwitchModal
        visible={showCurrencyModal}
        currentCurrency={user.currency}
        onClose={() => setShowCurrencyModal(false)}
      />

      {/* Xác nhận 2 bước xóa toàn bộ dữ liệu */}
      <ConfirmDialog
        visible={resetStep === 1}
        title="Xóa toàn bộ dữ liệu? (Bước 1/2)"
        message="Tất cả ví, giao dịch, ngân sách và mục tiêu của tài khoản này sẽ bị xóa khỏi thiết bị."
        confirmText="Tiếp tục"
        onCancel={() => setResetStep(0)}
        onConfirm={() => setResetStep(2)}
      />
      <ConfirmDialog
        visible={resetStep === 2}
        title="Xác nhận lần cuối (Bước 2/2)"
        message="Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa trắng dữ liệu?"
        confirmText="Xóa vĩnh viễn"
        onCancel={() => setResetStep(0)}
        onConfirm={() => {
          clearAllUserData(user.id);
          setResetStep(0);
          haptics.warning();
        }}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[typography.label, { color: colors.textSecondary, fontWeight: '700', paddingHorizontal: 4 }]}>
        {title}
      </Text>
      <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  sub,
  value,
  danger,
  onPress,
}: {
  icon: string;
  label: string;
  sub?: string;
  value?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: danger ? colors.dangerSoft : colors.primarySoft },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as never}
          size={20}
          color={danger ? colors.danger : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.bodyMedium,
            { color: danger ? colors.danger : colors.text, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
        {sub ? <Text style={[typography.small, { color: colors.textSecondary }]}>{sub}</Text> : null}
      </View>
      {value ? (
        <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '700' }]}>
          {value}
        </Text>
      ) : null}
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

function SwitchRow({
  icon,
  label,
  sub,
  value,
  onValueChange,
}: {
  icon: string;
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
        <MaterialCommunityIcons name={icon as never} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
          {label}
        </Text>
        {sub ? <Text style={[typography.small, { color: colors.textSecondary }]}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 44 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  presetDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.round,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
  },
});
