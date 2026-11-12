import type { Category, CurrencyCode, Transaction } from '../types/models';
import { formatCurrency } from '../utils/currencyFormatter';
import {
  elapsedDaysInMonth,
  lastNMonthKeys,
  monthRange,
  shiftMonthKey,
  shortMonthLabel,
  weekDays,
  WEEKDAY_SHORT,
} from '../utils/dateHelpers';
import { monthTotals, percentChange } from '../utils/transactionHelpers';

export interface CategorySlice {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
  prevAmount: number;
  changePercent: number | null;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface DailyBarPoint {
  date: string;
  label: string;
  amount: number;
}

export interface InsightItem {
  id: string;
  type: 'warning' | 'success' | 'info';
  icon: string;
  text: string;
}

export function breakdownByCategory(
  transactions: Transaction[],
  categories: Category[],
  type: 'income' | 'expense',
  start: string,
  end: string,
  prevStart: string,
  prevEnd: string,
  walletId?: string,
): CategorySlice[] {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const curSums: Record<string, number> = {};
  const prevSums: Record<string, number> = {};
  let total = 0;

  for (const t of transactions) {
    if (t.type !== type || !t.categoryId) continue;
    if (walletId && t.walletId !== walletId) continue;
    if (t.date >= start && t.date <= end) {
      curSums[t.categoryId] = (curSums[t.categoryId] ?? 0) + t.amount;
      total += t.amount;
    } else if (t.date >= prevStart && t.date <= prevEnd) {
      prevSums[t.categoryId] = (prevSums[t.categoryId] ?? 0) + t.amount;
    }
  }

  return Object.entries(curSums)
    .map(([categoryId, amount]) => {
      const cat = catMap.get(categoryId);
      const prevAmount = prevSums[categoryId] ?? 0;
      return {
        categoryId,
        name: cat?.name ?? 'Khác',
        icon: cat?.icon ?? 'shape',
        color: cat?.color ?? '#64748B',
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
        prevAmount,
        changePercent: percentChange(amount, prevAmount),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function monthlySeries(
  transactions: Transaction[],
  monthsCount = 6,
  walletId?: string,
): MonthlyPoint[] {
  const keys = lastNMonthKeys(monthsCount);
  return keys.map((month) => {
    const t = monthTotals(transactions, month, walletId);
    return { month, label: shortMonthLabel(month), income: t.income, expense: t.expense };
  });
}

export function weeklyExpenseBars(
  transactions: Transaction[],
  walletId?: string,
): { bars: DailyBarPoint[]; average: number; total: number } {
  const days = weekDays();
  const sums: Record<string, number> = {};
  for (const d of days) sums[d] = 0;
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (walletId && t.walletId !== walletId) continue;
    if (t.date in sums) sums[t.date] += t.amount;
  }
  const bars = days.map((date, idx) => ({
    date,
    label: WEEKDAY_SHORT[idx],
    amount: sums[date] ?? 0,
  }));
  const total = bars.reduce((s, b) => s + b.amount, 0);
  return { bars, average: total / 7, total };
}

/** Sinh các nhận xét tài chính tự động (Rule-based Insights) */
export function generateInsights(
  transactions: Transaction[],
  categories: Category[],
  month: string,
  currency: CurrencyCode,
  walletId?: string,
): InsightItem[] {
  const insights: InsightItem[] = [];
  const curRange = monthRange(month);
  const prevMonth = shiftMonthKey(month, -1);
  const prevRange = monthRange(prevMonth);

  const curTotals = monthTotals(transactions, month, walletId);
  const elapsed = Math.max(1, elapsedDaysInMonth(month));
  const avgDaily = curTotals.expense / elapsed;

  if (curTotals.expense > 0) {
    insights.push({
      id: 'avg-daily',
      type: 'info',
      icon: 'lightbulb-on-outline',
      text: `💡 Chi tiêu trung bình mỗi ngày của bạn là ${formatCurrency(avgDaily, currency)}.`,
    });
  }

  // Danh mục tăng mạnh nhất so với tháng trước
  const slices = breakdownByCategory(
    transactions,
    categories,
    'expense',
    curRange.start,
    curRange.end,
    prevRange.start,
    prevRange.end,
    walletId,
  );
  const surged = slices
    .filter((s) => s.prevAmount > 0 && (s.changePercent ?? 0) >= 15)
    .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))[0];

  if (surged && surged.changePercent != null) {
    insights.push({
      id: 'cat-surge',
      type: 'warning',
      icon: 'alert-circle-outline',
      text: `⚠️ Tháng này bạn chi cho ${surged.name} nhiều hơn ${Math.round(surged.changePercent)}% so với tháng trước.`,
    });
  } else if (slices[0]) {
    insights.push({
      id: 'top-cat',
      type: 'info',
      icon: 'chart-pie',
      text: `📌 "${slices[0].name}" đang chiếm ${Math.round(slices[0].percent)}% tổng chi tiêu kỳ này (${formatCurrency(slices[0].amount, currency)}).`,
    });
  }

  // So sánh mức tiết kiệm 3 tháng gần nhất
  const m0 = curTotals.net;
  const m1 = monthTotals(transactions, prevMonth, walletId).net;
  const m2 = monthTotals(transactions, shiftMonthKey(month, -2), walletId).net;
  if (m0 > 0 && m0 >= m1 && m0 >= m2) {
    insights.push({
      id: 'best-saving',
      type: 'success',
      icon: 'party-popper',
      text: `🎉 Tuyệt vời! Bạn đã tiết kiệm được nhiều nhất trong 3 tháng qua (${formatCurrency(m0, currency)}).`,
    });
  } else if (curTotals.income > 0 && curTotals.expense > curTotals.income) {
    insights.push({
      id: 'overspend',
      type: 'warning',
      icon: 'trending-down',
      text: `⚠️ Chi tiêu tháng này đang vượt thu nhập ${formatCurrency(curTotals.expense - curTotals.income, currency)}. Hãy cân đối lại nhé!`,
    });
  }

  return insights;
}
