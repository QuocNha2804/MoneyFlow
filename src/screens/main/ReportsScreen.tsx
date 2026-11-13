import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addWeeks, addYears } from 'date-fns';
import {
  breakdownByCategory,
  generateInsights,
  monthlySeries,
  weeklyExpenseBars,
} from '../../services/analyticsService';
import { formatCurrency } from '../../utils/currencyFormatter';
import {
  monthRange,
  shiftMonthKey,
  weekRange,
  yearRange,
} from '../../utils/dateHelpers';
import { totalsInRange } from '../../utils/transactionHelpers';
import {
  useCurrentUser,
  useTransactionStore,
  useUserCategories,
  useUserTransactions,
  useUserWallets,
} from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { MonthPicker } from '../../components/common/MonthPicker';
import { BudgetProgressBar } from '../../components/budget_goal/BudgetProgressBar';
import { PieChartCard } from '../../components/charts/PieChartCard';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { InsightCard } from '../../components/charts/InsightCard';

type Period = 'week' | 'month' | 'year';

export function ReportsScreen() {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const selectedMonth = useTransactionStore((s) => s.selectedMonth);
  const setSelectedMonth = useTransactionStore((s) => s.setSelectedMonth);

  const transactions = useUserTransactions();
  const categories = useUserCategories(undefined, true);
  const wallets = useUserWallets();

  const [period, setPeriod] = useState<Period>('month');
  const [walletFilter, setWalletFilter] = useState<string | undefined>(undefined);
  const [pieType, setPieType] = useState<'expense' | 'income'>('expense');
  const [lineMonths, setLineMonths] = useState<6 | 12>(6);
  const [refreshing, setRefreshing] = useState(false);

  const ranges = useMemo(() => {
    if (period === 'week') {
      const cur = weekRange();
      const prev = weekRange(addWeeks(new Date(), -1));
      return { cur, prev, label: 'so với tuần trước' };
    }
    if (period === 'year') {
      const cur = yearRange();
      const prev = yearRange(addYears(new Date(), -1));
      return { cur, prev, label: 'so với năm trước' };
    }
    const cur = monthRange(selectedMonth);
    const prev = monthRange(shiftMonthKey(selectedMonth, -1));
    return { cur, prev, label: 'so với tháng trước' };
  }, [period, selectedMonth]);

  const periodTotals = useMemo(
    () => totalsInRange(transactions, ranges.cur.start, ranges.cur.end, walletFilter),
    [transactions, ranges.cur, walletFilter],
  );

  const slices = useMemo(
    () =>
      breakdownByCategory(
        transactions,
        categories,
        pieType,
        ranges.cur.start,
        ranges.cur.end,
        ranges.prev.start,
        ranges.prev.end,
        walletFilter,
      ),
    [transactions, categories, pieType, ranges, walletFilter],
  );

  const expenseSlices = useMemo(
    () =>
      breakdownByCategory(
        transactions,
        categories,
        'expense',
        ranges.cur.start,
        ranges.cur.end,
        ranges.prev.start,
        ranges.prev.end,
        walletFilter,
      ),
    [transactions, categories, ranges, walletFilter],
  );

  const linePoints = useMemo(
    () => monthlySeries(transactions, lineMonths, walletFilter),
    [transactions, lineMonths, walletFilter],
  );

  const weekBars = useMemo(
    () => weeklyExpenseBars(transactions, walletFilter),
    [transactions, walletFilter],
  );

  const insights = useMemo(
    () =>
      user
        ? generateInsights(transactions, categories, selectedMonth, user.currency, walletFilter)
        : [],
    [transactions, categories, selectedMonth, user, walletFilter],
  );

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.text }]}>Báo cáo</Text>
        {period === 'month' && (
          <MonthPicker month={selectedMonth} onChange={setSelectedMonth} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 250);
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Bộ lọc khoảng thời gian: Tuần | Tháng | Năm */}
        <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
          {(
            [
              { key: 'week', label: 'Tuần này' },
              { key: 'month', label: 'Tháng' },
              { key: 'year', label: 'Năm nay' },
            ] as const
          ).map((p) => {
            const active = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  haptics.selection();
                  setPeriod(p.key);
                }}
                style={[styles.segBtn, active && { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    typography.label,
                    { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bộ lọc theo Ví */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}>
          <Pressable
            onPress={() => setWalletFilter(undefined)}
            style={[
              styles.walletChip,
              {
                backgroundColor: !walletFilter ? colors.primarySoft : colors.card,
                borderColor: !walletFilter ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
              Tất cả Ví
            </Text>
          </Pressable>
          {wallets.map((w) => {
            const active = walletFilter === w.id;
            return (
              <Pressable
                key={w.id}
                onPress={() => setWalletFilter(active ? undefined : w.id)}
                style={[
                  styles.walletChip,
                  {
                    backgroundColor: active ? withAlpha(w.color, 0.16) : colors.card,
                    borderColor: active ? w.color : colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons name={w.icon as never} size={16} color={w.color} />
                <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
                  {w.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Tóm tắt Thu / Chi / Chênh lệch kỳ */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Tổng thu</Text>
            <Text style={[typography.bodyMedium, { color: colors.income, fontWeight: '800' }]} numberOfLines={1}>
              {formatCurrency(periodTotals.income, user.currency, { hidden: user.hideBalance })}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Tổng chi</Text>
            <Text style={[typography.bodyMedium, { color: colors.expense, fontWeight: '800' }]} numberOfLines={1}>
              {formatCurrency(periodTotals.expense, user.currency, { hidden: user.hideBalance })}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.small, { color: colors.textSecondary }]}>Dòng tiền ròng</Text>
            <Text
              style={[
                typography.bodyMedium,
                {
                  color: periodTotals.net >= 0 ? colors.primary : colors.danger,
                  fontWeight: '800',
                },
              ]}
              numberOfLines={1}
            >
              {formatCurrency(periodTotals.net, user.currency, { hidden: user.hideBalance, sign: 'always' })}
            </Text>
          </View>
        </View>

        {/* Nhận xét thông minh (Rule-based Insights) */}
        <InsightCard insights={insights} />

        {/* Biểu đồ cơ cấu Pie / Donut */}
        <PieChartCard
          slices={slices}
          currency={user.currency}
          type={pieType}
          onChangeType={setPieType}
        />

        {/* Biểu đồ xu hướng 6 - 12 tháng */}
        <LineChartCard
          points={linePoints}
          currency={user.currency}
          monthsCount={lineMonths}
          onToggleMonths={() => setLineMonths((m) => (m === 6 ? 12 : 6))}
        />

        {/* Biểu đồ cột chi tiêu 7 ngày trong tuần */}
        <BarChartCard
          bars={weekBars.bars}
          average={weekBars.average}
          currency={user.currency}
        />

        {/* Top 5 Danh mục ngốn nhiều tiền nhất & So sánh kỳ trước */}
        <View style={[styles.topCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.h3, { color: colors.text }]}>
            Top 5 danh mục chi tiêu & So sánh kỳ trước
          </Text>
          {expenseSlices.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Chưa có khoản chi tiêu nào trong kỳ này.
            </Text>
          ) : (
            expenseSlices.slice(0, 5).map((s, idx) => (
              <View key={s.categoryId} style={{ gap: 6 }}>
                <View style={styles.topRow}>
                  <View style={[styles.rankBadge, { backgroundColor: withAlpha(s.color, 0.16) }]}>
                    <Text style={[typography.small, { color: s.color, fontWeight: '800' }]}>
                      #{idx + 1}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name={s.icon as never} size={20} color={s.color} />
                  <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600', flex: 1 }]}>
                    {s.name}
                  </Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                      {formatCurrency(s.amount, user.currency, { hidden: user.hideBalance })}
                    </Text>
                    {s.changePercent != null ? (
                      <Text
                        style={[
                          typography.small,
                          {
                            color: s.changePercent > 0 ? colors.danger : colors.income,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {s.changePercent > 0 ? '▲' : '▼'} {Math.abs(Math.round(s.changePercent))}%{' '}
                        {ranges.label}
                      </Text>
                    ) : (
                      <Text style={[typography.small, { color: colors.textMuted }]}>
                        Mới phát sinh ({Math.round(s.percent)}%)
                      </Text>
                    )}
                  </View>
                </View>
                <BudgetProgressBar percent={s.percent} height={7} customColor={s.color} />
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  walletRow: { gap: spacing.sm },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpiCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 2,
  },
  topCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rankBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
});
