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
import type { CurrencyCode, PrimaryGoalType } from '../../types/models';
import { CURRENCIES, currencySymbol, parseAmountInput } from '../../utils/currencyFormatter';
import { PRIMARY_GOALS } from '../../utils/categoryTemplates';
import { requestNotificationPermission } from '../../services/notificationService';
import { useAuthStore } from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';

const REMINDER_TIMES = ['08:00', '12:30', '19:30', '21:00', '22:00'];

export function OnboardingScreen() {
  const { colors } = useTheme();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>('VND');
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoalType>('saving');
  const [startingBalanceText, setStartingBalanceText] = useState('2000000');
  const [reminderTime, setReminderTime] = useState('21:00');
  const [notifGranted, setNotifGranted] = useState<boolean | undefined>(undefined);

  const handleFinish = async () => {
    haptics.success();
    const startingBalance = parseAmountInput(startingBalanceText, currency);
    completeOnboarding({
      currency,
      primaryGoal,
      startingBalance: Math.max(0, startingBalance),
      defaultReminderTime: reminderTime,
      notificationsGranted: notifGranted,
    });
  };

  const askNotification = async () => {
    const ok = await requestNotificationPermission();
    setNotifGranted(ok);
    haptics.selection();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Thanh tiến độ 3 bước */}
        <View style={styles.topBar}>
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: step === i ? 28 : 8,
                    backgroundColor: step >= i ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>
          {step < 2 && (
            <Pressable onPress={() => setStep(2)}>
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
                Bỏ qua
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <View style={styles.slide}>
              <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
                <MaterialCommunityIcons name="cash-multiple" size={64} color={colors.primary} />
              </View>
              <Text style={[typography.h1, { color: colors.text, textAlign: 'center' }]}>
                Làm chủ tài chính cùng{' '}
                <Text style={{ color: colors.primary }}>MoneyFlow</Text>
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                Ứng dụng quản lý chi tiêu cá nhân 100% Offline — nhanh, riêng tư và trực quan.
              </Text>

              <View style={styles.featureList}>
                {[
                  {
                    icon: 'chart-timeline-variant',
                    title: 'Kiểm soát dòng tiền rõ ràng',
                    desc: 'Theo dõi thu chi, chuyển khoản giữa các ví trong 3 giây.',
                  },
                  {
                    icon: 'shield-Alert-outline',
                    title: 'Làm chủ ngân sách chi tiêu',
                    desc: 'Cảnh báo thông minh khi chạm ngưỡng 80% và 100% hạn mức.',
                  },
                  {
                    icon: 'bullseye-arrow',
                    title: 'Đạt mục tiêu tiết kiệm & trả nợ',
                    desc: 'Dự báo ngày hoàn thành và gợi ý mức tích lũy hàng tháng.',
                  },
                ].map((f, idx) => (
                  <View
                    key={idx}
                    style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
                      <MaterialCommunityIcons
                        name={(idx === 1 ? 'bell-ring-outline' : f.icon) as never}
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                        {f.title}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {f.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.slide}>
              <Text style={[typography.h1, { color: colors.text }]}>
                Tiền tệ & Mục tiêu ưu tiên
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                Chúng tôi sẽ gợi ý bộ danh mục và mục tiêu phù hợp nhất với bạn.
              </Text>

              <Text style={[typography.label, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>
                1. Chọn đơn vị tiền tệ chính
              </Text>
              <View style={styles.currencyRow}>
                {CURRENCIES.map((c) => {
                  const active = currency === c.code;
                  return (
                    <Pressable
                      key={c.code}
                      onPress={() => {
                        haptics.selection();
                        setCurrency(c.code);
                        if (c.code === 'VND') setStartingBalanceText('2000000');
                        else setStartingBalanceText('500');
                      }}
                      style={[
                        styles.currencyCard,
                        {
                          backgroundColor: active ? colors.primarySoft : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>{c.flag}</Text>
                      <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                        {c.code} ({c.symbol})
                      </Text>
                      <Text style={[typography.small, { color: colors.textSecondary }]} numberOfLines={1}>
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[typography.label, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>
                2. Mục tiêu tài chính ưu tiên của bạn
              </Text>
              <View style={{ gap: spacing.sm }}>
                {PRIMARY_GOALS.map((g) => {
                  const active = primaryGoal === g.key;
                  return (
                    <Pressable
                      key={g.key}
                      onPress={() => {
                        haptics.selection();
                        setPrimaryGoal(g.key);
                      }}
                      style={[
                        styles.goalOption,
                        {
                          backgroundColor: active ? withAlpha(g.color, 0.14) : colors.card,
                          borderColor: active ? g.color : colors.border,
                        },
                      ]}
                    >
                      <View style={[styles.goalIcon, { backgroundColor: withAlpha(g.color, 0.18) }]}>
                        <MaterialCommunityIcons name={g.icon as never} size={22} color={g.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                          {g.label}
                        </Text>
                        <Text style={[typography.caption, { color: colors.textSecondary }]}>
                          {g.desc}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={active ? 'radiobox-marked' : 'radiobox-blank'}
                        size={22}
                        color={active ? g.color : colors.textMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.slide}>
              <Text style={[typography.h1, { color: colors.text }]}>
                Ví khởi điểm & Nhắc nhở
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                Thiết lập số dư Ví Tiền mặt ban đầu và khung giờ nhắc ghi chép mỗi ngày.
              </Text>

              <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.boxHeader}>
                  <MaterialCommunityIcons name="cash" size={22} color={colors.primary} />
                  <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                    Số dư khởi điểm (Ví Tiền mặt)
                  </Text>
                </View>
                <View
                  style={[
                    styles.amountInputWrap,
                    { backgroundColor: colors.inputBg, borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    value={startingBalanceText}
                    onChangeText={setStartingBalanceText}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    style={[typography.h2, { color: colors.primary, flex: 1 }]}
                  />
                  <Text style={[typography.h3, { color: colors.textSecondary }]}>
                    {currencySymbol(currency)}
                  </Text>
                </View>
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  Bạn có thể thêm Ví Ngân hàng, MoMo, Thẻ tín dụng bất cứ lúc nào.
                </Text>
              </View>

              <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.boxHeader}>
                  <MaterialCommunityIcons name="clock-outline" size={22} color={colors.primary} />
                  <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                    Giờ nhắc ghi chép hằng ngày
                  </Text>
                </View>
                <View style={styles.timeRow}>
                  {REMINDER_TIMES.map((t) => {
                    const active = reminderTime === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => {
                          haptics.selection();
                          setReminderTime(t);
                        }}
                        style={[
                          styles.timeChip,
                          {
                            backgroundColor: active ? colors.primary : colors.cardAlt,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.caption,
                            { color: active ? '#FFFFFF' : colors.text, fontWeight: '700' },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <CustomButton
                  title={
                    notifGranted === true
                      ? '✓ Đã cấp quyền thông báo'
                      : 'Cho phép gửi thông báo nhắc nhở'
                  }
                  variant={notifGranted ? 'secondary' : 'outline'}
                  icon="bell-check-outline"
                  small
                  onPress={askNotification}
                />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.divider }]}>
          {step > 0 && (
            <CustomButton
              title="Quay lại"
              variant="outline"
              onPress={() => setStep((s) => s - 1)}
              style={{ flex: 1 }}
            />
          )}
          <CustomButton
            title={step < 2 ? 'Tiếp tục' : 'Bắt đầu ngay'}
            icon={step < 2 ? 'arrow-right' : 'check'}
            onPress={() => (step < 2 ? setStep((s) => s + 1) : handleFinish())}
            style={{ flex: 2 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  slide: { gap: spacing.md, paddingTop: spacing.sm },
  heroIcon: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  featureList: { gap: spacing.sm, marginTop: spacing.sm },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyRow: { flexDirection: 'row', gap: spacing.sm },
  currencyCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  boxHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.round,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
