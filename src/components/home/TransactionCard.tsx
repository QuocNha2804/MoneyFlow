import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Category, CurrencyCode, Transaction, Wallet } from '../../types/models';
import { formatCurrency } from '../../utils/currencyFormatter';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';

interface TransactionCardProps {
  transaction: Transaction;
  category?: Category;
  wallet?: Wallet;
  toWallet?: Wallet;
  currency: CurrencyCode;
  hideBalance?: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTagPress?: (tag: string) => void;
}

export function TransactionCard({
  transaction: t,
  category,
  wallet,
  toWallet,
  currency,
  hideBalance,
  onPress,
  onEdit,
  onDelete,
  onTagPress,
}: TransactionCardProps) {
  const { colors } = useTheme();

  const isTransfer = t.type === 'transfer';
  const icon = isTransfer ? 'swap-horizontal' : category?.icon ?? 'shape-outline';
  const color = isTransfer
    ? colors.transfer
    : category?.color ?? (t.type === 'income' ? colors.income : colors.expense);
  const title = isTransfer
    ? `${wallet?.name ?? 'Ví'} → ${toWallet?.name ?? 'Ví'}`
    : category?.name ?? 'Danh mục';
  const amountColor =
    t.type === 'income' ? colors.income : t.type === 'expense' ? colors.expense : colors.transfer;
  const prefix = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '';

  return (
    <ReanimatedSwipeable
      friction={2}
      leftThreshold={60}
      rightThreshold={60}
      renderLeftActions={(_p, _tr, methods) => (
        <Pressable
          onPress={() => {
            methods.close();
            onEdit();
          }}
          style={[styles.swipeBtn, { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#FFFFFF" />
          <Text style={styles.swipeText}>Sửa</Text>
        </Pressable>
      )}
      renderRightActions={(_p, _tr, methods) => (
        <Pressable
          onPress={() => {
            methods.close();
            onDelete();
          }}
          style={[styles.swipeBtn, { backgroundColor: colors.danger }]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFFFFF" />
          <Text style={styles.swipeText}>Xóa</Text>
        </Pressable>
      )}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: withAlpha(color, 0.16) }]}>
          <MaterialCommunityIcons name={icon as never} size={22} color={color} />
        </View>

        <View style={styles.middle}>
          <View style={styles.titleLine}>
            <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
              {title}
            </Text>
            {t.receiptUri ? (
              <MaterialCommunityIcons name="image-outline" size={15} color={colors.primary} />
            ) : null}
            {t.recurringId ? (
              <MaterialCommunityIcons name="autorenew" size={14} color={colors.textMuted} />
            ) : null}
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {isTransfer ? 'Chuyển khoản' : wallet?.name ?? 'Ví'}
            {t.note ? ` • ${t.note}` : ''}
          </Text>

          {t.tags && t.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {t.tags.slice(0, 3).map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => onTagPress?.(tag)}
                  style={[styles.tagChip, { backgroundColor: colors.primarySoft }]}
                >
                  <Text style={[typography.small, { color: colors.primaryDark }]}>{tag}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.right}>
          <Text style={[typography.bodyMedium, { color: amountColor, fontWeight: '700' }]}>
            {hideBalance
              ? '******'
              : `${prefix}${formatCurrency(t.amount, currency, { sign: 'never' })}`}
          </Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t.time}</Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  tagChip: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radius.round,
  },
  right: { alignItems: 'flex-end', gap: 2 },
  swipeBtn: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginHorizontal: 2,
    gap: 2,
  },
  swipeText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
