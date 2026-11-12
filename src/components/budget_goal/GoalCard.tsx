import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode, FinancialGoal } from '../../types/models';
import { formatCurrency } from '../../utils/currencyFormatter';
import { daysUntil } from '../../utils/dateHelpers';
import { goalPercent } from '../../utils/goalProjection';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { BudgetProgressBar } from './BudgetProgressBar';

interface GoalCardProps {
  goal: FinancialGoal;
  currency: CurrencyCode;
  hideBalance?: boolean;
  onPress: () => void;
  onDeposit: () => void;
  onEdit: () => void;
}

export function GoalCard({
  goal,
  currency,
  hideBalance,
  onPress,
  onDeposit,
  onEdit,
}: GoalCardProps) {
  const { colors } = useTheme();
  const pct = goalPercent(goal.currentAmount, goal.targetAmount);
  const completed = pct >= 100;
  const remainingDays = goal.deadline ? daysUntil(goal.deadline) : null;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: withAlpha(goal.color, 0.16) }]}>
          <MaterialCommunityIcons name={goal.icon as never} size={24} color={goal.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[typography.h3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {goal.name}
            </Text>
            <Pressable onPress={onEdit} style={styles.editIcon}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.pctBadge,
                { backgroundColor: completed ? colors.incomeSoft : withAlpha(goal.color, 0.14) },
              ]}
            >
              <Text
                style={[
                  typography.small,
                  { color: completed ? colors.income : goal.color, fontWeight: '700' },
                ]}
              >
                {Math.round(pct)}%
              </Text>
            </View>
            {remainingDays != null && (
              <Text
                style={[
                  typography.caption,
                  {
                    color:
                      completed
                        ? colors.income
                        : remainingDays < 0
                          ? colors.danger
                          : colors.textSecondary,
                  },
                ]}
              >
                {completed
                  ? '🎉 Đã hoàn thành'
                  : remainingDays >= 0
                    ? `• Còn ${remainingDays} ngày`
                    : `• Quá hạn ${Math.abs(remainingDays)} ngày`}
              </Text>
            )}
          </View>
        </View>
      </View>

      <BudgetProgressBar percent={pct} height={10} customColor={goal.color} />

      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {goal.type === 'saving' ? 'Đã tiết kiệm / Mục tiêu' : 'Đã trả / Tổng nợ'}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
            {formatCurrency(goal.currentAmount, currency, { hidden: hideBalance })} /{' '}
            <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>
              {formatCurrency(goal.targetAmount, currency, { hidden: hideBalance })}
            </Text>
          </Text>
        </View>
        {!completed && (
          <Pressable
            onPress={onDeposit}
            style={[styles.depositBtn, { backgroundColor: goal.color }]}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
            <Text style={[typography.caption, { color: '#FFFFFF', fontWeight: '700' }]}>
              {goal.type === 'saving' ? 'Nạp tiền' : 'Trả nợ'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  editIcon: { padding: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.round,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
  },
});
