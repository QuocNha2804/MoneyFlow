import React, { useState } from 'react';
import {
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
import { addMonths } from 'date-fns';
import type { GoalType } from '../../types/models';
import type { MainStackScreenProps } from '../../types/navigation';
import { ICON_CHOICES } from '../../utils/categoryTemplates';
import { currencySymbol, parseAmountInput } from '../../utils/currencyFormatter';
import { formatDisplayDate, parseDateKey, toDateKey } from '../../utils/dateHelpers';
import { useCurrentUser, useGoalStore, useUserTransactions } from '../../store';
import { haptics } from '../../utils/haptics';
import { palette, radius, spacing, typography, useTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export function AddGoalModal({ navigation, route }: MainStackScreenProps<'AddGoal'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const goals = useGoalStore((s) => s.goals);
  const addGoal = useGoalStore((s) => s.addGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const removeGoal = useGoalStore((s) => s.removeGoal);
  const syncGoalProgress = useGoalStore((s) => s.syncGoalProgress);
  const transactions = useUserTransactions();

  const editing = goals.find((g) => g.id === route.params?.goalId);

  const [type, setType] = useState<GoalType>(editing?.type ?? route.params?.type ?? 'saving');
  const [name, setName] = useState(editing?.name ?? '');
  const [icon, setIcon] = useState(editing?.icon ?? (type === 'debt' ? 'credit-card-off-outline' : 'piggy-bank'));
  const [color, setColor] = useState(editing?.color ?? (type === 'debt' ? '#EF4444' : '#16A34A'));
  const [targetText, setTargetText] = useState(
    editing ? String(editing.targetAmount) : user?.currency === 'VND' ? '20000000' : '1000',
  );
  const [initialText, setInitialText] = useState(editing ? String(editing.initialAmount) : '0');
  const [deadline, setDeadline] = useState(
    editing?.deadline ?? toDateKey(addMonths(new Date(), 6)),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSave = () => {
    setError('');
    if (!name.trim()) {
      setError('Vui lòng nhập tên mục tiêu.');
      return;
    }
    const targetAmount = parseAmountInput(targetText, user.currency);
    const initialAmount = Math.max(0, parseAmountInput(initialText, user.currency));
    if (targetAmount <= 0) {
      setError('Số tiền mục tiêu phải lớn hơn 0.');
      return;
    }
    if (editing) {
      updateGoal(editing.id, {
        type,
        name: name.trim(),
        icon,
        color,
        targetAmount,
        initialAmount,
        deadline,
      });
      syncGoalProgress(editing.id, transactions);
    } else {
      addGoal({
        userId: user.id,
        type,
        name: name.trim(),
        icon,
        color,
        targetAmount,
        initialAmount,
        deadline,
      });
    }
    haptics.success();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header
        title={editing ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu mới'}
        onBack={() => navigation.goBack()}
        rightIcon={editing ? 'trash-can-outline' : undefined}
        onRightPress={editing ? () => setConfirmDelete(true) : undefined}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
          {(['saving', 'debt'] as const).map((t) => {
            const active = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  setType(t);
                  if (!editing) {
                    setIcon(t === 'debt' ? 'credit-card-off-outline' : 'piggy-bank');
                    setColor(t === 'debt' ? '#EF4444' : '#16A34A');
                  }
                }}
                style={[styles.segBtn, active && { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                  ]}
                >
                  {t === 'saving' ? '🎯 Tiết kiệm' : '💳 Trả nợ'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.label, { color: colors.text }]}>Tên mục tiêu</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={type === 'saving' ? 'VD: Du lịch Nhật Bản, Mua xe...' : 'VD: Trả nợ thẻ tín dụng VIB...'}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[typography.label, { color: colors.text }]}>
            {type === 'saving' ? 'Số tiền mục tiêu' : 'Tổng khoản nợ cần trả'} ({currencySymbol(user.currency)})
          </Text>
          <TextInput
            value={targetText}
            onChangeText={setTargetText}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.primary, borderColor: colors.border, fontWeight: '700' }]}
          />

          <Text style={[typography.label, { color: colors.text }]}>
            {type === 'saving' ? 'Số tiền ban đầu đã có sẵn' : 'Số tiền đã trả trước đó'} ({currencySymbol(user.currency)})
          </Text>
          <TextInput
            value={initialText}
            onChangeText={setInitialText}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <Text style={[typography.label, { color: colors.text }]}>Hạn chót (Deadline)</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
          >
            <MaterialCommunityIcons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[typography.bodyMedium, { color: colors.text }]}>
              {formatDisplayDate(deadline, true)}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={parseDateKey(deadline)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_e, d) => {
                setShowDatePicker(false);
                if (d) setDeadline(toDateKey(d));
              }}
            />
          )}

          <Text style={[typography.label, { color: colors.text }]}>Màu sắc</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
            {palette.map((p) => (
              <Pressable
                key={p}
                onPress={() => setColor(p)}
                style={[
                  styles.colorDot,
                  { backgroundColor: p, borderWidth: color === p ? 3 : 0, borderColor: colors.text },
                ]}
              />
            ))}
          </ScrollView>

          <Text style={[typography.label, { color: colors.text }]}>Biểu tượng</Text>
          <View style={styles.iconGrid}>
            {ICON_CHOICES.slice(0, 28).map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={[
                  styles.iconBtn,
                  { backgroundColor: icon === ic ? color : colors.cardAlt },
                ]}
              >
                <MaterialCommunityIcons
                  name={ic as never}
                  size={20}
                  color={icon === ic ? '#FFFFFF' : colors.text}
                />
              </Pressable>
            ))}
          </View>

          {error ? (
            <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
          ) : null}

          <CustomButton title={editing ? 'Cập nhật mục tiêu' : 'Tạo mục tiêu'} onPress={handleSave} icon="check" />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Xóa mục tiêu?"
        message="Mục tiêu này sẽ bị xóa khỏi danh sách (các giao dịch liên kết vẫn được giữ lại)."
        confirmText="Xóa"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (editing) removeGoal(editing.id);
          setConfirmDelete(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.lg,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    ...typography.body,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  colorRow: { gap: spacing.sm, paddingVertical: 4 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
