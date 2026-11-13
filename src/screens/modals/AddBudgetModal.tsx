import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Budget, Category, CurrencyCode } from '../../types/models';
import { currencySymbol, parseAmountInput } from '../../utils/currencyFormatter';
import { useBudgetStore, useCurrentUser, useUserTransactions } from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';

interface AddBudgetModalProps {
  visible: boolean;
  month: string;
  categories: Category[];
  editingBudget?: Budget | null;
  currency: CurrencyCode;
  onClose: () => void;
}

export function AddBudgetModal({
  visible,
  month,
  categories,
  editingBudget,
  currency,
  onClose,
}: AddBudgetModalProps) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const transactions = useUserTransactions();
  const upsertBudget = useBudgetStore((s) => s.upsertBudget);
  const removeBudget = useBudgetStore((s) => s.removeBudget);

  const [categoryId, setCategoryId] = useState<string>('');
  const [limitText, setLimitText] = useState('');
  const [rolloverEnabled, setRolloverEnabled] = useState(false);

  useEffect(() => {
    if (editingBudget) {
      setCategoryId(editingBudget.categoryId);
      setLimitText(String(editingBudget.limit));
      setRolloverEnabled(editingBudget.rolloverEnabled);
    } else {
      setCategoryId(categories[0]?.id ?? '');
      setLimitText(currency === 'VND' ? '3000000' : '200');
      setRolloverEnabled(false);
    }
  }, [editingBudget, categories, currency, visible]);

  const handleSave = () => {
    if (!user || !categoryId) return;
    const limit = parseAmountInput(limitText, currency);
    if (limit <= 0) return;
    upsertBudget(
      { userId: user.id, categoryId, month, limit, rolloverEnabled },
      transactions,
    );
    haptics.success();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.topRow}>
            <Text style={[typography.h2, { color: colors.text }]}>
              {editingBudget ? 'Chỉnh sửa ngân sách' : 'Thêm ngân sách tháng'}
            </Text>
            {editingBudget && (
              <Pressable
                onPress={() => {
                  removeBudget(editingBudget.id);
                  haptics.medium();
                  onClose();
                }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
              </Pressable>
            )}
          </View>

          {!editingBudget && (
            <>
              <Text style={[typography.label, { color: colors.text }]}>Chọn danh mục chi tiêu</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {categories.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: active ? withAlpha(c.color, 0.16) : colors.cardAlt,
                          borderColor: active ? c.color : colors.border,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name={c.icon as never} size={18} color={c.color} />
                      <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          <Text style={[typography.label, { color: colors.text }]}>Hạn mức tháng</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <TextInput
              value={limitText}
              onChangeText={setLimitText}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={[typography.h2, { color: colors.primary, flex: 1 }]}
            />
            <Text style={[typography.h3, { color: colors.textSecondary }]}>
              {currencySymbol(currency)}
            </Text>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
                Cộng dồn số dư sang tháng sau
              </Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>
                Tự động chuyển phần ngân sách chưa tiêu hết sang tháng kế tiếp
              </Text>
            </View>
            <Switch
              value={rolloverEnabled}
              onValueChange={setRolloverEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={rolloverEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.actions}>
            <CustomButton title="Hủy" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <CustomButton title="Lưu ngân sách" onPress={handleSave} style={{ flex: 1.3 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 410,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catRow: { gap: spacing.sm, paddingVertical: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    borderWidth: 1.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
