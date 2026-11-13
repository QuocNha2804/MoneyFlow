import React, { useMemo, useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RecurringFrequency, TransactionType } from '../../types/models';
import type { MainStackScreenProps } from '../../types/navigation';
import { roundAmount } from '../../utils/currencyFormatter';
import {
  combineDateTime,
  format,
  formatDisplayDate,
  nowTime,
  parseDateKey,
  toDateKey,
  todayKey,
} from '../../utils/dateHelpers';
import { evaluateExpression } from '../../utils/mathEvaluator';
import { computeWalletBalances, parseTags } from '../../utils/transactionHelpers';
import { saveTransactionFlow } from '../../services/transactionActions';
import {
  useCategoryStore,
  useCurrentUser,
  useUserCategories,
  useUserGoals,
  useUserQuickTemplates,
  useUserTransactions,
  useUserWallets,
} from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { NumericKeyboard } from '../../components/transaction/NumericKeyboard';
import { WalletPicker } from '../../components/transaction/WalletPicker';
import { CategoryGrid } from '../../components/transaction/CategoryGrid';
import { ReceiptImagePicker } from '../../components/transaction/ReceiptImagePicker';

const FREQ_OPTIONS: { key: RecurringFrequency | null; label: string }[] = [
  { key: null, label: 'Tắt' },
  { key: 'daily', label: 'Hàng ngày' },
  { key: 'weekly', label: 'Hàng tuần' },
  { key: 'monthly', label: 'Hàng tháng' },
  { key: 'yearly', label: 'Hàng năm' },
];

export function AddTransactionModal({
  navigation,
  route,
}: MainStackScreenProps<'AddTransaction'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const wallets = useUserWallets();
  const transactions = useUserTransactions();
  const quickTemplates = useUserQuickTemplates();
  const goals = useUserGoals();
  const addCategory = useCategoryStore((s) => s.addCategory);

  const editing = transactions.find((t) => t.id === route.params?.transactionId);
  const prefillTpl = quickTemplates.find((q) => q.id === route.params?.templateId);

  const [type, setType] = useState<TransactionType>(
    editing?.type ?? prefillTpl?.type ?? route.params?.type ?? 'expense',
  );
  const categories = useUserCategories(type === 'income' ? 'income' : 'expense');

  const [expression, setExpression] = useState<string>(
    editing
      ? String(editing.amount)
      : prefillTpl
        ? String(prefillTpl.amount)
        : '0',
  );
  const [walletId, setWalletId] = useState<string>(
    editing?.walletId ?? prefillTpl?.walletId ?? wallets[0]?.id ?? '',
  );
  const [toWalletId, setToWalletId] = useState<string | undefined>(
    editing?.toWalletId ?? wallets.find((w) => w.id !== (editing?.walletId ?? wallets[0]?.id))?.id,
  );
  const [categoryId, setCategoryId] = useState<string | undefined>(
    editing?.categoryId ?? prefillTpl?.categoryId ?? categories[0]?.id,
  );
  const [date, setDate] = useState<string>(editing?.date ?? route.params?.date ?? todayKey());
  const [time, setTime] = useState<string>(editing?.time ?? nowTime());
  const [note, setNote] = useState<string>(editing?.note ?? prefillTpl?.note ?? '');
  const [tagsText, setTagsText] = useState<string>((editing?.tags ?? []).join(' '));
  const [receiptUri, setReceiptUri] = useState<string | undefined>(editing?.receiptUri);
  const [goalId, setGoalId] = useState<string | undefined>(editing?.goalId ?? route.params?.goalId);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency | null>(null);
  const [saveAsQuick, setSaveAsQuick] = useState(false);

  const [showKeyboard, setShowKeyboard] = useState(!editing);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const balances = useMemo(
    () => computeWalletBalances(wallets, transactions),
    [wallets, transactions],
  );

  if (!user) return null;

  const switchType = (next: TransactionType) => {
    haptics.selection();
    setType(next);
    if (next !== 'transfer') {
      const list = useCategoryStore
        .getState()
        .categories.filter((c) => c.userId === user.id && c.type === next && !c.archived);
      setCategoryId(list[0]?.id);
    }
  };

  const handleSave = async () => {
    setError('');
    const amount = roundAmount(evaluateExpression(expression), user.currency);
    if (amount <= 0) {
      setError('Số tiền phải lớn hơn 0.');
      haptics.error();
      return;
    }
    if (!walletId) {
      setError('Vui lòng chọn Ví thực hiện giao dịch.');
      haptics.error();
      return;
    }
    if (type === 'transfer') {
      if (!toWalletId || toWalletId === walletId) {
        setError('Ví đích phải khác Ví nguồn.');
        haptics.error();
        return;
      }
    } else if (!categoryId) {
      setError('Vui lòng chọn Danh mục.');
      haptics.error();
      return;
    }
    if (!date) {
      setError('Ngày giao dịch không được để trống.');
      return;
    }

    const tags = Array.from(new Set([...parseTags(note), ...parseTags(tagsText)]));

    await saveTransactionFlow(
      {
        userId: user.id,
        amount,
        type,
        categoryId: type === 'transfer' ? undefined : categoryId,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : undefined,
        goalId,
        note: note.trim() || undefined,
        tags: tags.length ? tags : undefined,
        receiptUri,
        date,
        time,
      },
      editing?.id,
      editing?.goalId,
      {
        recurringFrequency: recurringFreq,
        saveQuickTemplate: saveAsQuick,
      },
    );

    setSavedSuccess(true);
    setTimeout(() => {
      navigation.goBack();
    }, 380);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header
        title={editing ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}
        onBack={() => navigation.goBack()}
        rightIcon={showKeyboard ? 'keyboard-close' : 'calculator-variant-outline'}
        onRightPress={() => setShowKeyboard((v) => !v)}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Segmented Tabs: Chi tiêu | Thu nhập | Chuyển khoản */}
          <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
            {(
              [
                { key: 'expense', label: 'Chi tiêu', color: colors.expense },
                { key: 'income', label: 'Thu nhập', color: colors.income },
                { key: 'transfer', label: 'Chuyển khoản', color: colors.transfer },
              ] as const
            ).map((tab) => {
              const active = type === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => switchType(tab.key)}
                  style={[
                    styles.segBtn,
                    active && { backgroundColor: tab.color },
                  ]}
                >
                  <Text
                    style={[
                      typography.label,
                      { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Bàn phím số tích hợp máy tính */}
          {showKeyboard ? (
            <NumericKeyboard
              expression={expression}
              currency={user.currency}
              onChangeExpression={setExpression}
              onDone={() => setShowKeyboard(false)}
            />
          ) : (
            <Pressable
              onPress={() => setShowKeyboard(true)}
              style={[styles.amountBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Số tiền (chạm để mở máy tính)
              </Text>
              <Text style={[typography.h1, { color: colors.primary }]}>{expression}</Text>
            </Pressable>
          )}

          {/* Chọn Ví */}
          <WalletPicker
            wallets={wallets}
            balances={balances}
            currency={user.currency}
            isTransfer={type === 'transfer'}
            walletId={walletId}
            toWalletId={toWalletId}
            onChangeWallet={(id) => {
              setWalletId(id);
              if (toWalletId === id) {
                setToWalletId(wallets.find((w) => w.id !== id)?.id);
              }
            }}
            onChangeToWallet={setToWalletId}
          />

          {/* Lưới chọn Danh mục (Thu / Chi) */}
          {type !== 'transfer' && (
            <CategoryGrid
              categories={categories}
              selectedId={categoryId}
              type={type}
              onSelect={setCategoryId}
              onQuickCreate={(name, icon, color) =>
                addCategory({ userId: user.id, name, icon, color, type })
              }
              onOpenManage={() => navigation.navigate('ManageCategories', { type })}
            />
          )}

          {/* Ngày & Giờ */}
          <View style={styles.dateTimeRow}>
            <Pressable
              onPress={() => setPickerMode('date')}
              style={[styles.dateChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="calendar-outline" size={19} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
                {formatDisplayDate(date, true)}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPickerMode('time')}
              style={[styles.timeChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="clock-outline" size={19} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
                {time}
              </Text>
            </Pressable>
          </View>

          {pickerMode && (
            <DateTimePicker
              value={combineDateTime(date, time)}
              mode={pickerMode}
              maximumDate={pickerMode === 'date' ? new Date() : undefined}
              onChange={(_e, d) => {
                const mode = pickerMode;
                setPickerMode(null);
                if (!d) return;
                if (mode === 'date') setDate(toDateKey(d));
                else setTime(format(d, 'HH:mm'));
              }}
            />
          )}

          {/* Ghi chú & Hashtags */}
          <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
              Ghi chú & Hashtag (#...)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="VD: Ăn trưa cùng đồng nghiệp #congty"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
            <View style={styles.quickTagsRow}>
              {['#congty', '#dulich', '#giadinh', '#damcuoi', '#anuong'].map((tg) => (
                <Pressable
                  key={tg}
                  onPress={() =>
                    setTagsText((prev) => (prev.includes(tg) ? prev : `${prev} ${tg}`.trim()))
                  }
                  style={[styles.tagPreset, { backgroundColor: colors.primarySoft }]}
                >
                  <Text style={[typography.small, { color: colors.primaryDark }]}>{tg}</Text>
                </Pressable>
              ))}
            </View>
            {tagsText ? (
              <TextInput
                value={tagsText}
                onChangeText={setTagsText}
                placeholder="#tag1 #tag2"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.primary, borderColor: colors.border }]}
              />
            ) : null}
          </View>

          {/* Đính kèm ảnh hóa đơn */}
          <ReceiptImagePicker uri={receiptUri} onChange={setReceiptUri} />

          {/* Liên kết Mục tiêu tài chính */}
          {goals.length > 0 && (
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
                Gắn với Mục tiêu Tiết kiệm / Trả nợ (Tùy chọn)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                <Pressable
                  onPress={() => setGoalId(undefined)}
                  style={[
                    styles.goalChip,
                    {
                      backgroundColor: !goalId ? colors.primarySoft : colors.card,
                      borderColor: !goalId ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
                    Không gắn
                  </Text>
                </Pressable>
                {goals.map((g) => {
                  const active = goalId === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => setGoalId(active ? undefined : g.id)}
                      style={[
                        styles.goalChip,
                        {
                          backgroundColor: active ? withAlpha(g.color, 0.16) : colors.card,
                          borderColor: active ? g.color : colors.border,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name={g.icon as never} size={16} color={g.color} />
                      <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
                        {g.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Lặp lại định kỳ */}
          {!editing && (
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
                Lặp lại định kỳ (Tự động sinh giao dịch)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {FREQ_OPTIONS.map((f) => {
                  const active = recurringFreq === f.key;
                  return (
                    <Pressable
                      key={String(f.key)}
                      onPress={() => setRecurringFreq(f.key)}
                      style={[
                        styles.freqChip,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          { color: active ? '#FFFFFF' : colors.text, fontWeight: '600' },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Checkbox Lưu thành mẫu nhập nhanh */}
          {!editing && type !== 'transfer' && (
            <Pressable
              onPress={() => setSaveAsQuick((v) => !v)}
              style={styles.checkboxRow}
            >
              <MaterialCommunityIcons
                name={saveAsQuick ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={saveAsQuick ? colors.primary : colors.textMuted}
              />
              <Text style={[typography.body, { color: colors.text }]}>
                Lưu vào mẫu nhập nhanh 1 chạm (Quick Template)
              </Text>
            </Pressable>
          )}

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={[typography.caption, { color: colors.danger, flex: 1 }]}>{error}</Text>
            </View>
          ) : null}

          <CustomButton
            title={savedSuccess ? '✓ Đã lưu thành công!' : editing ? 'Lưu thay đổi' : 'Lưu giao dịch'}
            icon="check"
            onPress={handleSave}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  amountBanner: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateTimeRow: { flexDirection: 'row', gap: spacing.sm },
  dateChip: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  timeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  box: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
  },
  quickTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagPreset: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    borderWidth: 1.5,
  },
  freqChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
});
