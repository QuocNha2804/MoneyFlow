import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode, FinancialGoal, Wallet } from '../../types/models';
import { currencySymbol, formatCompact, parseAmountInput } from '../../utils/currencyFormatter';
import { depositToGoalFlow } from '../../services/transactionActions';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';

interface DepositGoalModalProps {
  visible: boolean;
  goal: FinancialGoal | null;
  wallets: Wallet[];
  balances: Record<string, number>;
  currency: CurrencyCode;
  onClose: () => void;
}

export function DepositGoalModal({
  visible,
  goal,
  wallets,
  balances,
  currency,
  onClose,
}: DepositGoalModalProps) {
  const { colors } = useTheme();
  const [amountText, setAmountText] = useState('');
  const [walletId, setWalletId] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (goal) {
      const remain = Math.max(0, goal.targetAmount - goal.currentAmount);
      setAmountText(String(Math.min(remain || 500000, currency === 'VND' ? 1000000 : 100)));
      setWalletId(wallets[0]?.id ?? '');
      setNote('');
    }
  }, [goal, wallets, currency, visible]);

  if (!goal) return null;

  const handleSubmit = async () => {
    const amount = parseAmountInput(amountText, currency);
    if (amount <= 0 || !walletId) return;
    await depositToGoalFlow(goal.id, walletId, amount, note);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[typography.h2, { color: colors.text }]}>
            {goal.type === 'saving' ? 'Nạp tiền tiết kiệm' : 'Thanh toán khoản nợ'}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Mục tiêu: <Text style={{ color: goal.color, fontWeight: '700' }}>{goal.name}</Text>
          </Text>

          <Text style={[typography.label, { color: colors.text }]}>Số tiền</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={[typography.h2, { color: colors.primary, flex: 1 }]}
            />
            <Text style={[typography.h3, { color: colors.textSecondary }]}>
              {currencySymbol(currency)}
            </Text>
          </View>

          <Text style={[typography.label, { color: colors.text }]}>Trích từ Ví</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}>
            {wallets.map((w) => {
              const active = w.id === walletId;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => setWalletId(w.id)}
                  style={[
                    styles.walletChip,
                    {
                      backgroundColor: active ? withAlpha(w.color, 0.16) : colors.cardAlt,
                      borderColor: active ? w.color : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={w.icon as never} size={18} color={w.color} />
                  <View>
                    <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
                      {w.name}
                    </Text>
                    <Text style={[typography.small, { color: colors.textSecondary }]}>
                      {formatCompact(balances[w.id] ?? 0, currency)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ghi chú (tùy chọn)"
            placeholderTextColor={colors.textMuted}
            style={[styles.noteInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          />

          <View style={styles.actions}>
            <CustomButton title="Hủy" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <CustomButton
              title={goal.type === 'saving' ? 'Nạp ngay' : 'Thanh toán'}
              onPress={handleSubmit}
              style={{ flex: 1.3 }}
            />
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
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  walletRow: { gap: spacing.sm },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
