import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FinancialGoal, GoalType } from '../../types/models';
import type { TabScreenProps } from '../../types/navigation';
import { computeWalletBalances } from '../../utils/transactionHelpers';
import {
  useCurrentUser,
  useUserGoals,
  useUserTransactions,
  useUserWallets,
} from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomButton } from '../../components/common/CustomButton';
import { GoalCard } from '../../components/budget_goal/GoalCard';
import { DepositGoalModal } from '../modals/DepositGoalModal';

export function GoalsScreen({ navigation }: TabScreenProps<'Goals'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const goals = useUserGoals();
  const wallets = useUserWallets();
  const transactions = useUserTransactions();

  const [tab, setTab] = useState<GoalType>(user?.primaryGoal === 'debt' ? 'debt' : 'saving');
  const [depositingGoal, setDepositingGoal] = useState<FinancialGoal | null>(null);

  const filtered = useMemo(() => goals.filter((g) => g.type === tab), [goals, tab]);
  const balances = useMemo(
    () => computeWalletBalances(wallets, transactions),
    [wallets, transactions],
  );

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.text }]}>Mục tiêu</Text>
        <CustomButton
          title="Thêm mục tiêu"
          icon="plus"
          small
          onPress={() => navigation.navigate('AddGoal', { type: tab })}
        />
      </View>

      {/* 2 Sub-tabs: Tiết kiệm | Trả nợ */}
      <View style={styles.tabWrap}>
        <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
          {(
            [
              { key: 'saving', label: '🎯 Mục tiêu Tiết kiệm' },
              { key: 'debt', label: '💳 Mục tiêu Trả nợ' },
            ] as const
          ).map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  haptics.selection();
                  setTab(t.key);
                }}
                style={[styles.segBtn, active && { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    typography.label,
                    { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={tab === 'saving' ? 'piggy-bank-outline' : 'credit-card-off-outline'}
            title={
              tab === 'saving'
                ? 'Chưa có mục tiêu tiết kiệm nào'
                : 'Chưa có khoản nợ nào cần theo dõi'
            }
            description={
              tab === 'saving'
                ? 'Tạo mục tiêu Mua nhà, Du lịch, Quỹ khẩn cấp... để theo dõi tiến độ tích lũy và nhận dự báo ngày hoàn thành.'
                : 'Theo dõi các khoản trả góp, nợ thẻ tín dụng hoặc vay cá nhân để trả dứt điểm đúng hạn.'
            }
            actionLabel={tab === 'saving' ? 'Tạo mục tiêu tiết kiệm' : 'Thêm khoản nợ cần trả'}
            onAction={() => navigation.navigate('AddGoal', { type: tab })}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {filtered.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                currency={user.currency}
                hideBalance={user.hideBalance}
                onPress={() => navigation.navigate('GoalDetail', { goalId: g.id })}
                onDeposit={() => setDepositingGoal(g)}
                onEdit={() => navigation.navigate('AddGoal', { goalId: g.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <DepositGoalModal
        visible={!!depositingGoal}
        goal={depositingGoal}
        wallets={wallets}
        balances={balances}
        currency={user.currency}
        onClose={() => setDepositingGoal(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
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
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
});
