import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Budget } from '../../types/models';
import { getBudgetStatuses, totalBudget } from '../../utils/budgetCalculator';
import { formatCurrency } from '../../utils/currencyFormatter';
import { daysLeftInMonth } from '../../utils/dateHelpers';
import {
  useBudgetStore,
  useCurrentUser,
  useTransactionStore,
  useUserBudgets,
  useUserCategories,
  useUserTransactions,
} from '../../store';
import { budgetLevelColor, radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { MonthPicker } from '../../components/common/MonthPicker';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomButton } from '../../components/common/CustomButton';
import { BudgetProgressBar } from '../../components/budget_goal/BudgetProgressBar';
import { AddBudgetModal } from '../modals/AddBudgetModal';

export function BudgetsScreen() {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const selectedMonth = useTransactionStore((s) => s.selectedMonth);
  const setSelectedMonth = useTransactionStore((s) => s.setSelectedMonth);
  const syncRolloverForMonth = useBudgetStore((s) => s.syncRolloverForMonth);

  const budgets = useUserBudgets(selectedMonth);
  const expenseCategories = useUserCategories('expense');
  const transactions = useUserTransactions();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    if (user) {
      syncRolloverForMonth(user.id, selectedMonth, transactions);
    }
  }, [user, selectedMonth, transactions, syncRolloverForMonth]);

  const statuses = useMemo(
    () =>
      getBudgetStatuses(budgets, transactions, selectedMonth).sort(
        (a, b) => b.percent - a.percent,
      ),
    [budgets, transactions, selectedMonth],
  );

  const summary = useMemo(() => totalBudget(statuses), [statuses]);
  const daysLeft = daysLeftInMonth(selectedMonth);
  const dailyAllowance =
    daysLeft > 0 ? Math.max(0, (summary.limit - summary.spent) / daysLeft) : 0;

  const catMap = useMemo(
    () => new Map(expenseCategories.map((c) => [c.id, c])),
    [expenseCategories],
  );

  // Các danh mục chi tiêu chưa có ngân sách trong tháng
  const availableCategories = useMemo(() => {
    const used = new Set(budgets.map((b) => b.categoryId));
    return expenseCategories.filter((c) => !used.has(c.id));
  }, [budgets, expenseCategories]);

  if (!user) return null;

  const ringSize = 132;
  const strokeWidth = 14;
  const r = (ringSize - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pctClamped = Math.min(100, Math.max(0, summary.percent));
  const ringColor = budgetLevelColor(summary.percent, colors);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.text }]}>Ngân sách</Text>
        <MonthPicker month={selectedMonth} onChange={setSelectedMonth} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Ring Chart tổng quan đầu trang */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.ringWrap}>
            <Svg width={ringSize} height={ringSize}>
              <G rotation={-90} origin={`${ringSize / 2}, ${ringSize / 2}`}>
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={r}
                  stroke={colors.cardAlt}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={r}
                  stroke={ringColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${(pctClamped / 100) * c} ${c}`}
                  strokeLinecap="round"
                  fill="none"
                />
              </G>
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[typography.h2, { color: ringColor }]}>
                {Math.round(summary.percent)}%
              </Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>đã dùng</Text>
            </View>
          </View>

          <View style={styles.summaryRight}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Tổng đã chi / Tổng ngân sách
            </Text>
            <Text style={[typography.h3, { color: colors.text }]}>
              {formatCurrency(summary.spent, user.currency, { hidden: user.hideBalance })}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              trên {formatCurrency(summary.limit, user.currency, { hidden: user.hideBalance })}
            </Text>

            <View style={[styles.dailyBox, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="calendar-today" size={16} color={colors.primaryDark} />
              <Text style={[typography.small, { color: colors.primaryDark, flex: 1 }]}>
                Được tiêu{' '}
                <Text style={{ fontWeight: '800' }}>
                  {formatCurrency(dailyAllowance, user.currency, { hidden: user.hideBalance })}/ngày
                </Text>{' '}
                ({daysLeft} ngày còn lại)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={[typography.h3, { color: colors.text }]}>
            Ngân sách theo danh mục ({statuses.length})
          </Text>
          {availableCategories.length > 0 && (
            <CustomButton
              title="Thêm ngân sách"
              icon="plus"
              small
              onPress={() => {
                setEditingBudget(null);
                setModalVisible(true);
              }}
            />
          )}
        </View>

        {statuses.length === 0 ? (
          <EmptyState
            icon="chart-arc"
            title="Chưa thiết lập ngân sách tháng này"
            description="Đặt hạn mức chi tiêu cho Ăn uống, Mua sắm, Giải trí... để nhận cảnh báo khi chạm mốc 80% và 100%."
            actionLabel="Thêm ngân sách mới"
            onAction={() => {
              setEditingBudget(null);
              setModalVisible(true);
            }}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {statuses.map((st) => {
              const cat = catMap.get(st.budget.categoryId);
              const isOver = st.percent >= 100;
              const isWarn = st.percent >= 80 && st.percent < 100;
              return (
                <Pressable
                  key={st.budget.id}
                  onPress={() => {
                    setEditingBudget(st.budget);
                    setModalVisible(true);
                  }}
                  style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.itemTop}>
                    <View
                      style={[
                        styles.catIcon,
                        { backgroundColor: withAlpha(cat?.color ?? colors.primary, 0.16) },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={(cat?.icon ?? 'shape') as never}
                        size={22}
                        color={cat?.color ?? colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                          {cat?.name ?? 'Danh mục'}
                        </Text>
                        {st.budget.rolloverEnabled && (
                          <View style={[styles.rollBadge, { backgroundColor: colors.primarySoft }]}>
                            <Text style={[typography.small, { color: colors.primaryDark }]}>
                              Rollover
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {formatCurrency(st.spent, user.currency, { hidden: user.hideBalance })} /{' '}
                        {formatCurrency(st.limit, user.currency, { hidden: user.hideBalance })}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        setEditingBudget(st.budget);
                        setModalVisible(true);
                      }}
                      style={styles.editBtn}
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>

                  <BudgetProgressBar percent={st.percent} height={10} />

                  <View style={styles.itemBottom}>
                    {isOver ? (
                      <View style={[styles.alertBadge, { backgroundColor: colors.dangerSoft }]}>
                        <MaterialCommunityIcons name="alert-octagon" size={15} color={colors.danger} />
                        <Text style={[typography.small, { color: colors.danger, fontWeight: '700' }]}>
                          Đã vượt {formatCurrency(Math.abs(st.remaining), user.currency, { hidden: user.hideBalance })}
                        </Text>
                      </View>
                    ) : isWarn ? (
                      <View style={[styles.alertBadge, { backgroundColor: colors.orangeSoft }]}>
                        <Text style={[typography.small, { color: colors.orange, fontWeight: '700' }]}>
                          ⚠️ Sắp vượt ngân sách ({Math.round(st.percent)}%)
                        </Text>
                      </View>
                    ) : (
                      <Text style={[typography.small, { color: colors.income, fontWeight: '600' }]}>
                        An toàn ({Math.round(st.percent)}%)
                      </Text>
                    )}

                    {!isOver && (
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        Còn lại:{' '}
                        <Text style={{ color: colors.text, fontWeight: '700' }}>
                          {formatCurrency(st.remaining, user.currency, { hidden: user.hideBalance })}
                        </Text>
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <AddBudgetModal
        visible={modalVisible}
        month={selectedMonth}
        categories={editingBudget ? expenseCategories : availableCategories}
        editingBudget={editingBudget}
        currency={user.currency}
        onClose={() => setModalVisible(false)}
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
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  ringWrap: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  summaryRight: { flex: 1, gap: 4 },
  dailyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: 6,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rollBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radius.round,
  },
  editBtn: { padding: 4 },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
  },
});
