import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MainStackScreenProps } from '../../types/navigation';
import { formatCurrency } from '../../utils/currencyFormatter';
import { formatDisplayDate } from '../../utils/dateHelpers';
import { goalPercent, goalTransactions, projectGoal } from '../../utils/goalProjection';
import { computeWalletBalances } from '../../utils/transactionHelpers';
import { deleteTransactionFlow } from '../../services/transactionActions';
import {
  useCurrentUser,
  useUserCategories,
  useUserGoals,
  useUserTransactions,
  useUserWallets,
} from '../../store';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { BudgetProgressBar } from '../../components/budget_goal/BudgetProgressBar';
import { TransactionCard } from '../../components/home/TransactionCard';
import { DepositGoalModal } from '../modals/DepositGoalModal';

export function GoalDetailScreen({ navigation, route }: MainStackScreenProps<'GoalDetail'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const goals = useUserGoals();
  const transactions = useUserTransactions();
  const wallets = useUserWallets(true);
  const categories = useUserCategories(undefined, true);

  const [showDeposit, setShowDeposit] = useState(false);

  const goal = goals.find((g) => g.id === route.params.goalId);
  const history = useMemo(
    () => (goal ? goalTransactions(goal, transactions) : []),
    [goal, transactions],
  );
  const projection = useMemo(
    () => (goal ? projectGoal(goal, transactions) : null),
    [goal, transactions],
  );
  const balances = useMemo(
    () => computeWalletBalances(wallets, transactions),
    [wallets, transactions],
  );
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  if (!user || !goal || !projection) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Header title="Chi tiết mục tiêu" onBack={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  const pct = goalPercent(goal.currentAmount, goal.targetAmount);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header
        title={goal.name}
        subtitle={goal.type === 'saving' ? 'Mục tiêu Tiết kiệm' : 'Mục tiêu Trả nợ'}
        onBack={() => navigation.goBack()}
        rightIcon="pencil-outline"
        onRightPress={() => navigation.navigate('AddGoal', { goalId: goal.id })}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.topRow}>
            <View style={[styles.iconBox, { backgroundColor: withAlpha(goal.color, 0.16) }]}>
              <MaterialCommunityIcons name={goal.icon as never} size={30} color={goal.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h2, { color: colors.text }]}>
                {formatCurrency(goal.currentAmount, user.currency)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                trên mục tiêu {formatCurrency(goal.targetAmount, user.currency)} ({Math.round(pct)}%)
              </Text>
            </View>
          </View>

          <BudgetProgressBar percent={pct} height={12} customColor={goal.color} />

          {goal.deadline && (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Hạn chót: <Text style={{ fontWeight: '700', color: colors.text }}>{formatDisplayDate(goal.deadline)}</Text>
            </Text>
          )}

          {!projection.completed && (
            <CustomButton
              title={goal.type === 'saving' ? 'Nạp tiền vào mục tiêu' : 'Thanh toán khoản nợ'}
              icon="plus"
              onPress={() => setShowDeposit(true)}
            />
          )}
        </View>

        {/* Dự báo thông minh (goalProjection) */}
        <View style={[styles.projCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
          <View style={styles.projHeader}>
            <MaterialCommunityIcons name="crystal-ball" size={22} color={colors.primaryDark} />
            <Text style={[typography.h3, { color: colors.primaryDark }]}>Dự báo thông minh</Text>
          </View>

          {projection.completed ? (
            <Text style={[typography.body, { color: colors.text }]}>
              🎉 Bạn đã hoàn thành 100% mục tiêu này!
            </Text>
          ) : projection.projectedDate ? (
            <Text style={[typography.body, { color: colors.text }]}>
              Với tốc độ trung bình hiện tại (
              <Text style={{ fontWeight: '700' }}>
                {formatCurrency(projection.avgPerMonth, user.currency)}/tháng
              </Text>
              ), bạn sẽ hoàn thành mục tiêu vào ngày{' '}
              <Text style={{ fontWeight: '700', color: colors.primaryDark }}>
                {formatDisplayDate(projection.projectedDate)}
              </Text>
              {projection.diffDaysVsDeadline != null && (
                <Text>
                  {' '}
                  ({projection.diffDaysVsDeadline >= 0
                    ? `sớm hơn dự kiến ${projection.diffDaysVsDeadline} ngày`
                    : `trễ hơn dự kiến ${Math.abs(projection.diffDaysVsDeadline)} ngày`})
                </Text>
              )}
              .
            </Text>
          ) : (
            <Text style={[typography.body, { color: colors.text }]}>
              Hãy thực hiện lần nạp đầu tiên để hệ thống tính tốc độ và dự báo ngày hoàn thành.
            </Text>
          )}

          {projection.requiredPerMonth != null && !projection.completed && (
            <View style={[styles.suggestBox, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.text, flex: 1 }]}>
                Gợi ý: Cần tích lũy khoảng{' '}
                <Text style={{ fontWeight: '800', color: colors.primary }}>
                  {formatCurrency(projection.requiredPerMonth, user.currency)}/tháng
                </Text>{' '}
                để kịp hạn chót.
              </Text>
            </View>
          )}
        </View>

        {/* Lịch sử nạp tiền / trả nợ */}
        <Text style={[typography.h3, { color: colors.text }]}>
          Lịch sử nạp tiền / trả nợ ({history.length})
        </Text>
        {history.length === 0 ? (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Chưa có giao dịch nào gắn với mục tiêu này.
          </Text>
        ) : (
          <View style={{ gap: spacing.xs }}>
            {history.map((t) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                category={t.categoryId ? catMap.get(t.categoryId) : undefined}
                wallet={walletMap.get(t.walletId)}
                currency={user.currency}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: t.id })}
                onEdit={() => navigation.navigate('AddTransaction', { transactionId: t.id })}
                onDelete={() => deleteTransactionFlow(t.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <DepositGoalModal
        visible={showDeposit}
        goal={goal}
        wallets={wallets.filter((w) => !w.archived)}
        balances={balances}
        currency={user.currency}
        onClose={() => setShowDeposit(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  projHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  suggestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: 4,
  },
});
