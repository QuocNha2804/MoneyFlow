import { addDays, addMonths, addWeeks, addYears } from 'date-fns';
import type { RecurringTemplate } from '../types/models';
import { nowTime, parseDateKey, toDateKey, todayKey } from '../utils/dateHelpers';
import { useRecurringStore } from '../store/useRecurringStore';
import { useTransactionStore, type TransactionInput } from '../store/useTransactionStore';
import { useGoalStore } from '../store/useGoalStore';

export function computeNextDate(fromDateKey: string, tpl: Pick<RecurringTemplate, 'frequency' | 'dayOfMonth'>): string {
  const d = parseDateKey(fromDateKey);
  switch (tpl.frequency) {
    case 'daily':
      return toDateKey(addDays(d, 1));
    case 'weekly':
      return toDateKey(addWeeks(d, 1));
    case 'monthly': {
      const next = addMonths(d, 1);
      if (tpl.dayOfMonth) {
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(tpl.dayOfMonth, maxDay));
      }
      return toDateKey(next);
    }
    case 'yearly':
      return toDateKey(addYears(d, 1));
  }
}

/**
 * Động cơ sinh bù giao dịch định kỳ (Backfill Engine):
 * Quét tất cả mẫu đang bật của user, chạy while (nextRunDate <= today)
 * để tạo đủ các giao dịch của những ngày không mở app.
 */
export function runRecurringBackfill(userId: string): number {
  const today = todayKey();
  const { recurringTemplates, updateRecurring } = useRecurringStore.getState();
  const userTemplates = recurringTemplates.filter((r) => r.userId === userId && r.active);
  if (!userTemplates.length) return 0;

  const toCreate: TransactionInput[] = [];
  const touchedGoals = new Set<string>();

  for (const r of userTemplates) {
    let next = r.nextRunDate;
    let last = r.lastRunDate;
    let active: boolean = r.active;
    let safety = 0;

    while (next <= today && safety < 400) {
      safety++;
      if (r.endDate && next > r.endDate) {
        active = false;
        break;
      }
      toCreate.push({
        userId,
        amount: r.template.amount,
        type: r.template.type,
        categoryId: r.template.categoryId,
        walletId: r.template.walletId,
        toWalletId: r.template.toWalletId,
        goalId: r.template.goalId,
        note: r.template.note ? `${r.template.note} (Định kỳ)` : 'Giao dịch định kỳ',
        tags: r.template.tags,
        date: next,
        time: nowTime(),
        recurringId: r.id,
      });
      if (r.template.goalId) touchedGoals.add(r.template.goalId);
      last = next;
      next = computeNextDate(next, r);
      if (r.endDate && next > r.endDate) {
        active = false;
        break;
      }
    }

    if (last !== r.lastRunDate || next !== r.nextRunDate || active !== r.active) {
      updateRecurring(r.id, { lastRunDate: last, nextRunDate: next, active });
    }
  }

  if (toCreate.length) {
    useTransactionStore.getState().addManyTransactions(toCreate);
    const allTx = useTransactionStore.getState().transactions.filter((t) => t.userId === userId);
    for (const gid of touchedGoals) {
      useGoalStore.getState().syncGoalProgress(gid, allTx);
    }
  }
  return toCreate.length;
}
