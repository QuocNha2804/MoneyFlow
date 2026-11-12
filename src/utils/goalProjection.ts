import { addDays, differenceInCalendarDays } from 'date-fns';
import type { FinancialGoal, Transaction } from '../types/models';
import { parseDateKey, toDateKey, todayKey } from './dateHelpers';

export const GOAL_MILESTONES = [25, 50, 75, 100];

/** Giao dịch nạp/trả liên kết mục tiêu */
export function goalTransactions(goal: FinancialGoal, transactions: Transaction[]): Transaction[] {
  return transactions
    .filter((t) => t.goalId === goal.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

/** currentAmount = initialAmount + tổng các giao dịch nạp liên kết (derived) */
export function computeGoalCurrent(goal: FinancialGoal, transactions: Transaction[]): number {
  let sum = goal.initialAmount;
  for (const t of transactions) if (t.goalId === goal.id) sum += t.amount;
  return sum;
}

export function goalPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, (current / target) * 100);
}

export interface GoalProjection {
  /** Trung bình nạp mỗi tháng (30 ngày) */
  avgPerMonth: number;
  remaining: number;
  projectedDate?: string;
  /** Số ngày sớm (+) / trễ (-) so với deadline */
  diffDaysVsDeadline?: number;
  /** Số tiền cần nạp mỗi tháng để kịp deadline */
  requiredPerMonth?: number;
  daysLeft?: number;
  completed: boolean;
}

export function projectGoal(goal: FinancialGoal, transactions: Transaction[]): GoalProjection {
  const current = computeGoalCurrent(goal, transactions);
  const remaining = Math.max(0, goal.targetAmount - current);
  const deposits = transactions.filter((t) => t.goalId === goal.id);
  const completed = remaining <= 0;

  const firstDate = deposits.length
    ? deposits.reduce((min, t) => (t.date < min ? t.date : min), deposits[0].date)
    : goal.createdAt.slice(0, 10);
  const totalDeposited = deposits.reduce((s, t) => s + t.amount, 0);
  const elapsedDays = Math.max(30, differenceInCalendarDays(new Date(), parseDateKey(firstDate)) + 1);
  const avgPerDay = totalDeposited / elapsedDays;
  const avgPerMonth = avgPerDay * 30;

  const result: GoalProjection = { avgPerMonth, remaining, completed };

  if (goal.deadline) {
    const daysLeft = differenceInCalendarDays(parseDateKey(goal.deadline), new Date());
    result.daysLeft = daysLeft;
    const monthsLeft = Math.max(1, daysLeft / 30);
    result.requiredPerMonth = remaining > 0 ? remaining / monthsLeft : 0;
  }

  if (!completed && avgPerDay > 0) {
    const daysNeeded = Math.ceil(remaining / avgPerDay);
    const projected = addDays(new Date(), daysNeeded);
    result.projectedDate = toDateKey(projected);
    if (goal.deadline) {
      result.diffDaysVsDeadline = differenceInCalendarDays(parseDateKey(goal.deadline), projected);
    }
  } else if (completed) {
    result.projectedDate = goal.completedAt?.slice(0, 10) ?? todayKey();
  }
  return result;
}

/** Trả về các mốc mới vừa đạt (chưa thông báo) */
export function newMilestones(percent: number, notified: number[]): number[] {
  return GOAL_MILESTONES.filter((m) => percent >= m && !notified.includes(m));
}
