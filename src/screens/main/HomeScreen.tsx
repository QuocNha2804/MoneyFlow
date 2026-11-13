import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { QuickTemplate, TransactionType } from '../../types/models';
import type { TabScreenProps } from '../../types/navigation';
import { getBudgetStatuses } from '../../utils/budgetCalculator';
import { formatCurrency } from '../../utils/currencyFormatter';
import {
  dayLabel,
  greeting,
  monthRange,
  nowTime,
  shiftMonthKey,
  todayKey,
} from '../../utils/dateHelpers';
import {
  computeNetWorth,
  computeWalletBalances,
  filterTransactions,
  groupByDay,
  monthTotals,
  percentChange,
} from '../../utils/transactionHelpers';
import { runRecurringBackfill } from '../../services/recurringService';
import { deleteTransactionFlow, saveTransactionFlow } from '../../services/transactionActions';
import {
  useAuthStore,
  useCurrentUser,
  useTransactionStore,
  useUserBudgets,
  useUserCategories,
  useUserQuickTemplates,
  useUserTransactions,
  useUserWallets,
} from '../../store';
import { haptics } from '../../utils/haptics';
import { hitSlop, radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { MonthPicker } from '../../components/common/MonthPicker';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { BalanceCard } from '../../components/home/BalanceCard';
import { WalletHorizontalList } from '../../components/home/WalletHorizontalList';
import { QuickTemplateBar } from '../../components/home/QuickTemplateBar';
import { ExpandableFAB } from '../../components/home/ExpandableFAB';
import { TransactionCard } from '../../components/home/TransactionCard';
import { BudgetProgressBar } from '../../components/budget_goal/BudgetProgressBar';
import { SuggestedCategoriesModal } from '../modals/SuggestedCategoriesModal';

const FILTER_CHIPS: { key: TransactionType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'income', label: 'Thu nhập' },
  { key: 'expense', label: 'Chi tiêu' },
  { key: 'transfer', label: 'Chuyển khoản' },
];

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const toggleHideBalance = useAuthStore((s) => s.toggleHideBalance);
  const selectedMonth = useTransactionStore((s) => s.selectedMonth);
  const setSelectedMonth = useTransactionStore((s) => s.setSelectedMonth);

  const wallets = useUserWallets();
  const allWallets = useUserWallets(true);
  const categories = useUserCategories(undefined, true);
  const transactions = useUserTransactions();
  const quickTemplates = useUserQuickTemplates();
  const budgets = useUserBudgets(selectedMonth);

  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  const balances = useMemo(
    () => computeWalletBalances(allWallets, transactions),
    [allWallets, transactions],
  );
  const netWorth = useMemo(() => computeNetWorth(wallets, balances), [wallets, balances]);

  const curMonthTotals = useMemo(
    () => monthTotals(transactions, selectedMonth),
    [transactions, selectedMonth],
  );
  const prevMonthTotals = useMemo(
    () => monthTotals(transactions, shiftMonthKey(selectedMonth, -1)),
    [transactions, selectedMonth],
  );
  const expenseChange = useMemo(
    () => percentChange(curMonthTotals.expense, prevMonthTotals.expense),
    [curMonthTotals.expense, prevMonthTotals.expense],
  );

  // Top 4 ngân sách có tỷ lệ sử dụng cao nhất
  const topBudgets = useMemo(() => {
    return getBudgetStatuses(budgets, transactions, selectedMonth)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);
  }, [budgets, transactions, selectedMonth]);

  // Giao dịch trong tháng đang chọn
  const dayGroups = useMemo(() => {
    const { start, end } = monthRange(selectedMonth);
    const filtered = filterTransactions(transactions, {
      type: typeFilter,
      fromDate: start,
      toDate: end,
    });
    return groupByDay(filtered);
  }, [transactions, selectedMonth, typeFilter]);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const walletMap = useMemo(() => new Map(allWallets.map((w) => [w.id, w])), [allWallets]);

  if (!user) return null;

  const onRefresh = () => {
    setRefreshing(true);
    runRecurringBackfill(user.id);
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleQuickCreate = async (tpl: QuickTemplate) => {
    await saveTransactionFlow({
      userId: user.id,
      amount: tpl.amount,
      type: tpl.type,
      categoryId: tpl.categoryId,
      walletId: tpl.walletId || wallets[0]?.id || '',
      note: tpl.note || tpl.title,
      date: todayKey(),
      time: nowTime(),
    });
  };

  const avatarIsUri = user.avatar && !user.avatar.startsWith('preset:');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header: Lời chào + Tìm kiếm + Lịch + Avatar */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {greeting()},
          </Text>
          <Text style={[typography.h2, { color: colors.text }]} numberOfLines={1}>
            {user.fullName} 👋
          </Text>
        </View>

        <MonthPicker month={selectedMonth} onChange={setSelectedMonth} compact />

        <Pressable
          onPress={() => navigation.navigate('Calendar')}
          hitSlop={hitSlop}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name="calendar-check-outline" size={20} color={colors.primary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Search')}
          hitSlop={hitSlop}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={[styles.avatar, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
        >
          {avatarIsUri ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
          ) : (
            <Text style={[typography.bodyMedium, { color: colors.primaryDark, fontWeight: '800' }]}>
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Thẻ Tổng tài sản & Dòng tiền tháng */}
        <BalanceCard
          netWorth={netWorth}
          monthIncome={curMonthTotals.income}
          monthExpense={curMonthTotals.expense}
          expenseChangePercent={expenseChange}
          currency={user.currency}
          hideBalance={user.hideBalance}
          onToggleHide={toggleHideBalance}
        />

        {/* Danh sách Ví ngang */}
        <WalletHorizontalList
          wallets={wallets}
          balances={balances}
          currency={user.currency}
          hideBalance={user.hideBalance}
          onManagePress={() => navigation.navigate('ManageWallets')}
        />

        {/* Thanh nhập nhanh 1 chạm */}
        <QuickTemplateBar
          templates={quickTemplates}
          currency={user.currency}
          onQuickCreate={handleQuickCreate}
          onPrefillOpen={(tpl) =>
            navigation.navigate('AddTransaction', { templateId: tpl.id, type: tpl.type })
          }
        />

        {/* Ngân sách tiêu biểu */}
        {topBudgets.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.h3, { color: colors.text }]}>Ngân sách tiêu biểu</Text>
              <Pressable onPress={() => navigation.navigate('Budgets')}>
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                  Xem tất cả →
                </Text>
              </Pressable>
            </View>
            <View style={{ gap: spacing.md }}>
              {topBudgets.map((st) => {
                const cat = catMap.get(st.budget.categoryId);
                return (
                  <View key={st.budget.id} style={{ gap: 5 }}>
                    <View style={styles.budgetRow}>
                      <View style={styles.budgetLeft}>
                        <MaterialCommunityIcons
                          name={(cat?.icon ?? 'shape') as never}
                          size={18}
                          color={cat?.color ?? colors.primary}
                        />
                        <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
                          {cat?.name ?? 'Danh mục'}
                        </Text>
                      </View>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {formatCurrency(st.spent, user.currency, { hidden: user.hideBalance })} /{' '}
                        {formatCurrency(st.limit, user.currency, { hidden: user.hideBalance })} (
                        {Math.round(st.percent)}%)
                      </Text>
                    </View>
                    <BudgetProgressBar percent={st.percent} />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Bộ lọc nhanh & Danh sách giao dịch gần đây */}
        <View style={styles.txSectionHeader}>
          <Text style={[typography.h3, { color: colors.text }]}>Giao dịch trong tháng</Text>
          <Pressable onPress={() => navigation.navigate('Calendar')}>
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              Xem Lịch →
            </Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_CHIPS.map((chip) => {
            const active = typeFilter === chip.key;
            return (
              <Pressable
                key={chip.key}
                onPress={() => {
                  haptics.selection();
                  setTypeFilter(chip.key);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {dayGroups.length === 0 ? (
          <EmptyState
            icon="notebook-plus-outline"
            title="Chưa có giao dịch nào"
            description="Bắt đầu ghi lại các khoản thu nhập và chi tiêu để theo dõi dòng tiền của bạn."
            actionLabel="Thêm giao dịch đầu tiên"
            onAction={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {dayGroups.map((g) => (
              <View key={g.date} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <Text style={[typography.label, { color: colors.textSecondary, fontWeight: '700' }]}>
                    {dayLabel(g.date)}
                  </Text>
                  <View style={styles.dayTotals}>
                    {g.income > 0 && (
                      <Text style={[typography.small, { color: colors.income, fontWeight: '700' }]}>
                        +{formatCurrency(g.income, user.currency, { hidden: user.hideBalance, sign: 'never' })}
                      </Text>
                    )}
                    {g.expense > 0 && (
                      <Text style={[typography.small, { color: colors.expense, fontWeight: '700' }]}>
                        -{formatCurrency(g.expense, user.currency, { hidden: user.hideBalance, sign: 'never' })}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={[styles.dayCardList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {g.items.map((t, idx) => (
                    <React.Fragment key={t.id}>
                      {idx > 0 && (
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                      )}
                      <TransactionCard
                        transaction={t}
                        category={t.categoryId ? catMap.get(t.categoryId) : undefined}
                        wallet={walletMap.get(t.walletId)}
                        toWallet={t.toWalletId ? walletMap.get(t.toWalletId) : undefined}
                        currency={user.currency}
                        hideBalance={user.hideBalance}
                        onPress={() =>
                          navigation.navigate('TransactionDetail', { transactionId: t.id })
                        }
                        onEdit={() =>
                          navigation.navigate('AddTransaction', { transactionId: t.id })
                        }
                        onDelete={() => setDeletingTxId(t.id)}
                        onTagPress={(tag) => navigation.navigate('Search', { tag })}
                      />
                    </React.Fragment>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Nút nổi FAB mở rộng 3 lựa chọn */}
      <ExpandableFAB
        onSelect={(type) => navigation.navigate('AddTransaction', { type })}
      />

      {/* Modal gợi ý bộ danh mục sau khi đăng ký */}
      <SuggestedCategoriesModal />

      {/* Xác nhận xóa giao dịch */}
      <ConfirmDialog
        visible={!!deletingTxId}
        title="Xóa giao dịch?"
        message="Bạn có chắc chắn muốn xóa giao dịch này không?"
        confirmText="Xóa"
        onCancel={() => setDeletingTxId(null)}
        onConfirm={() => {
          if (deletingTxId) deleteTransactionFlow(deletingTxId);
          setDeletingTxId(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  sectionCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -spacing.xs,
  },
  filterRow: { gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  dayGroup: { gap: 6 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayTotals: { flexDirection: 'row', gap: spacing.sm },
  dayCardList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.md },
});
