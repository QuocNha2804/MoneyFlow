import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import type { MainStackScreenProps } from '../../types/navigation';
import { formatCurrency } from '../../utils/currencyFormatter';
import { formatDisplayDate, todayKey } from '../../utils/dateHelpers';
import { deleteTransactionFlow } from '../../services/transactionActions';
import { sortTransactionsDesc } from '../../utils/transactionHelpers';
import {
  useCurrentUser,
  useUserCategories,
  useUserTransactions,
  useUserWallets,
} from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { TransactionCard } from '../../components/home/TransactionCard';

export function CalendarScreen({ navigation }: MainStackScreenProps<'Calendar'>) {
  const { colors, isDark } = useTheme();
  const user = useCurrentUser();
  const transactions = useUserTransactions();
  const categories = useUserCategories(undefined, true);
  const wallets = useUserWallets(true);

  const today = todayKey();
  const [selectedDate, setSelectedDate] = useState(today);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  // Tính thu/chi theo từng ngày để đánh dấu chấm màu & tô nền nhẹ
  const markedDates = useMemo(() => {
    const byDate: Record<string, { income: number; expense: number }> = {};
    for (const t of transactions) {
      if (!byDate[t.date]) byDate[t.date] = { income: 0, expense: 0 };
      if (t.type === 'income') byDate[t.date].income += t.amount;
      else if (t.type === 'expense') byDate[t.date].expense += t.amount;
    }

    const marks: Record<string, object> = {};
    for (const [date, s] of Object.entries(byDate)) {
      const hasInc = s.income > 0;
      const hasExp = s.expense > 0;
      if (!hasInc && !hasExp) continue;
      // Chấm màu: Xanh lá (có thu), Đỏ (có chi), Vàng (có cả hai)
      const dotColor = hasInc && hasExp ? colors.warning : hasInc ? colors.income : colors.expense;
      // Nền nhẹ: Ngày dương (Thu >= Chi) xanh nhạt, Ngày âm (Chi > Thu) đỏ nhạt
      const bg = s.income >= s.expense ? colors.incomeSoft : colors.expenseSoft;
      marks[date] = {
        marked: true,
        dotColor,
        customStyles: {
          container: {
            backgroundColor: date === selectedDate ? colors.primary : bg,
            borderRadius: 10,
          },
          text: {
            color: date === selectedDate ? '#FFFFFF' : colors.text,
            fontWeight: '600',
          },
        },
      };
    }

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
      customStyles: {
        container: {
          backgroundColor: colors.primary,
          borderRadius: 10,
        },
        text: { color: '#FFFFFF', fontWeight: '700' },
      },
    };
    return marks;
  }, [transactions, selectedDate, colors]);

  const dayTxs = useMemo(
    () => sortTransactionsDesc(transactions.filter((t) => t.date === selectedDate)),
    [transactions, selectedDate],
  );

  const daySummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of dayTxs) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [dayTxs]);

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header
        title="Lịch & Nhật ký Thu Chi"
        subtitle="Chọn ngày trong quá khứ để check-in ghi bù"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.calCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Calendar
            key={isDark ? 'dark' : 'light'}
            current={selectedDate}
            maxDate={today}
            markingType="custom"
            markedDates={markedDates}
            onDayPress={(day) => {
              if (day.dateString > today) {
                Alert.alert(
                  'Ngày tương lai',
                  'Giao dịch thường không chọn ngày tương lai. Hãy dùng tính năng Lặp lại định kỳ (Recurring) cho giao dịch tương lai.',
                );
                return;
              }
              haptics.selection();
              setSelectedDate(day.dateString);
            }}
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.textSecondary,
              dayTextColor: colors.text,
              todayTextColor: colors.primary,
              monthTextColor: colors.text,
              arrowColor: colors.primary,
              textDisabledColor: colors.textMuted,
            }}
          />

          <View style={styles.legendRow}>
            <LegendDot color={colors.income} label="Thu nhập" />
            <LegendDot color={colors.expense} label="Chi tiêu" />
            <LegendDot color={colors.warning} label="Cả thu & chi" />
          </View>
        </View>

        {/* Chi tiết ngày được chọn */}
        <View style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dayHeader}>
            <Text style={[typography.h3, { color: colors.text }]}>
              {formatDisplayDate(selectedDate, true)}
            </Text>
            <CustomButton
              title="Thêm giao dịch cho ngày này"
              icon="plus"
              small
              onPress={() => navigation.navigate('AddTransaction', { date: selectedDate })}
            />
          </View>

          <View style={styles.kpiRow}>
            <View style={[styles.kpi, { backgroundColor: colors.incomeSoft }]}>
              <Text style={[typography.small, { color: colors.income }]}>Tổng Thu</Text>
              <Text style={[typography.bodyMedium, { color: colors.income, fontWeight: '700' }]}>
                {formatCurrency(daySummary.income, user.currency)}
              </Text>
            </View>
            <View style={[styles.kpi, { backgroundColor: colors.expenseSoft }]}>
              <Text style={[typography.small, { color: colors.expense }]}>Tổng Chi</Text>
              <Text style={[typography.bodyMedium, { color: colors.expense, fontWeight: '700' }]}>
                {formatCurrency(daySummary.expense, user.currency)}
              </Text>
            </View>
            <View style={[styles.kpi, { backgroundColor: colors.cardAlt }]}>
              <Text style={[typography.small, { color: colors.textSecondary }]}>Chênh lệch</Text>
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: daySummary.net >= 0 ? colors.primary : colors.danger,
                    fontWeight: '700',
                  },
                ]}
              >
                {formatCurrency(daySummary.net, user.currency, { sign: 'always' })}
              </Text>
            </View>
          </View>

          {dayTxs.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md }]}>
              Không có giao dịch nào trong ngày này.
            </Text>
          ) : (
            <View style={{ gap: 6 }}>
              {dayTxs.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  category={t.categoryId ? catMap.get(t.categoryId) : undefined}
                  wallet={walletMap.get(t.walletId)}
                  toWallet={t.toWalletId ? walletMap.get(t.toWalletId) : undefined}
                  currency={user.currency}
                  onPress={() => navigation.navigate('TransactionDetail', { transactionId: t.id })}
                  onEdit={() => navigation.navigate('AddTransaction', { transactionId: t.id })}
                  onDelete={() => deleteTransactionFlow(t.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={[typography.small, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  calCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dayCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  kpiRow: { flexDirection: 'row', gap: spacing.sm },
  kpi: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});
