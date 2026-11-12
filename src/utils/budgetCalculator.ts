import type { Budget, Transaction } from '../types/models';
import { monthRange, shiftMonthKey } from './dateHelpers';

export type BudgetLevel = 'safe' | 'warning' | 'danger' | 'over';

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  /** Hạn mức hiệu lực = limit + rolloverAmount */
  limit: number;
  percent: number;
  remaining: number;
  level: BudgetLevel;
}

/** Tổng chi (spent) động của danh mục trong tháng — derived state, không lưu trữ */
export function computeSpent(
  transactions: Transaction[],
  categoryId: string,
  month: string,
): number {
  const { start, end } = monthRange(month);
  let sum = 0;
  for (const t of transactions) {
    if (t.type === 'expense' && t.categoryId === categoryId && t.date >= start && t.date <= end) {
      sum += t.amount;
    }
  }
  return sum;
}

/** Map categoryId → spent cho cả tháng (1 lần duyệt) */
export function spentByCategory(transactions: Transaction[], month: string): Record<string, number> {
  const { start, end } = monthRange(month);
  const map: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'expense' && t.categoryId && t.date >= start && t.date <= end) {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    }
  }
  return map;
}

export function levelOf(percent: number): BudgetLevel {
  if (percent >= 100) return 'over';
  if (percent >= 90) return 'danger';
  if (percent >= 70) return 'warning';
  return 'safe';
}

export function budgetStatus(budget: Budget, spent: number): BudgetStatus {
  const limit = Math.max(0, budget.limit + (budget.rolloverEnabled ? budget.rolloverAmount : 0));
  const percent = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
  return { budget, spent, limit, percent, remaining: limit - spent, level: levelOf(percent) };
}

export function getBudgetStatuses(
  budgets: Budget[],
  transactions: Transaction[],
  month: string,
): BudgetStatus[] {
  const spentMap = spentByCategory(transactions, month);
  return budgets
    .filter((b) => b.month === month)
    .map((b) => budgetStatus(b, spentMap[b.categoryId] ?? 0));
}

export function totalBudget(statuses: BudgetStatus[]): { limit: number; spent: number; percent: number } {
  const limit = statuses.reduce((s, x) => s + x.limit, 0);
  const spent = statuses.reduce((s, x) => s + x.spent, 0);
  return { limit, spent, percent: limit > 0 ? (spent / limit) * 100 : 0 };
}

/** Số tiền dư của tháng trước được cộng dồn sang tháng này (chỉ khi còn dư) */
export function computeRolloverAmount(prevBudget: Budget | undefined, transactions: Transaction[]): number {
  if (!prevBudget) return 0;
  const spent = computeSpent(transactions, prevBudget.categoryId, prevBudget.month);
  const effective = prevBudget.limit + (prevBudget.rolloverEnabled ? prevBudget.rolloverAmount : 0);
  return Math.max(0, effective - spent);
}

export function previousMonth(month: string): string {
  return shiftMonthKey(month, -1);
}
