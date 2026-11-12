import type { RecurringFrequency } from '../types/models';
import { GOAL_DEPOSIT_CATEGORY } from '../utils/categoryTemplates';
import { monthKeyOfDate, nowTime, parseDateKey, todayKey } from '../utils/dateHelpers';
import { haptics } from '../utils/haptics';
import {
  getCurrentUser,
  useCategoryStore,
  useGoalStore,
  useRecurringStore,
  useTransactionStore,
  type TransactionInput,
} from '../store';
import {
  checkBudgetThresholds,
  notifyGoalMilestones,
  rescheduleSummaryNotifications,
} from './notificationService';
import { computeNextDate } from './recurringService';

export interface SaveTransactionOptions {
  /** Nếu bật lặp lại định kỳ, tạo thêm RecurringTemplate */
  recurringFrequency?: RecurringFrequency | null;
  /** Lưu thành mẫu nhập nhanh (Quick Template) */
  saveQuickTemplate?: boolean;
  quickTemplateTitle?: string;
}

/**
 * Thực thi trọn vẹn luồng sau khi thêm / sửa giao dịch:
 * 1. Cập nhật store giao dịch (tự động kéo theo số dư ví, ngân sách động)
 * 2. Tạo RecurringTemplate / QuickTemplate nếu được chọn
 * 3. Đồng bộ tiến độ mục tiêu (goalId) + bắn thông báo mốc 25/50/75/100% + Confetti
 * 4. Kiểm tra ngưỡng ngân sách 80% / 100%
 * 5. Cập nhật lịch thông báo tổng kết tuần / tháng
 * 6. Haptic feedback
 */
export async function saveTransactionFlow(
  input: TransactionInput,
  editingId?: string,
  prevGoalId?: string,
  opts: SaveTransactionOptions = {},
): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  const txStore = useTransactionStore.getState();
  if (editingId) {
    txStore.updateTransaction(editingId, input);
  } else {
    txStore.addTransaction(input);
  }

  // Tạo mẫu định kỳ nếu người dùng bật khi thêm mới
  if (!editingId && opts.recurringFrequency) {
    const d = parseDateKey(input.date);
    useRecurringStore.getState().addRecurring({
      userId: user.id,
      template: {
        amount: input.amount,
        type: input.type,
        categoryId: input.categoryId,
        walletId: input.walletId,
        toWalletId: input.toWalletId,
        note: input.note,
        tags: input.tags,
        goalId: input.goalId,
      },
      frequency: opts.recurringFrequency,
      dayOfWeek: d.getDay(),
      dayOfMonth: d.getDate(),
      startDate: input.date,
      lastRunDate: input.date,
      nextRunDate: computeNextDate(input.date, {
        frequency: opts.recurringFrequency,
        dayOfMonth: d.getDate(),
      }),
      active: true,
    });
  }

  // Tạo mẫu nhập nhanh nếu chọn checkbox
  if (opts.saveQuickTemplate && input.type !== 'transfer' && input.categoryId) {
    const cat = useCategoryStore.getState().categories.find((c) => c.id === input.categoryId);
    txStore.addQuickTemplate({
      userId: user.id,
      title: (opts.quickTemplateTitle || input.note || cat?.name || 'Mẫu nhanh').slice(0, 24),
      amount: input.amount,
      type: input.type,
      categoryId: input.categoryId,
      walletId: input.walletId,
      note: input.note,
      icon: cat?.icon ?? 'flash',
      color: cat?.color ?? '#16A34A',
    });
  }

  const userTxs = useTransactionStore.getState().transactions.filter((t) => t.userId === user.id);

  // Đồng bộ mục tiêu liên kết
  if (prevGoalId && prevGoalId !== input.goalId) {
    useGoalStore.getState().syncGoalProgress(prevGoalId, userTxs);
  }
  if (input.goalId) {
    const { goal, reached } = useGoalStore.getState().syncGoalProgress(input.goalId, userTxs);
    if (goal && reached.length) {
      await notifyGoalMilestones(user, goal, reached, user.currency);
    }
  }

  // Kiểm tra ngân sách tháng
  let budgetAlert: 'over100' | 'over80' | null = null;
  if (input.type === 'expense' && input.categoryId) {
    const cats = useCategoryStore.getState().categories.filter((c) => c.userId === user.id);
    budgetAlert = await checkBudgetThresholds(
      user,
      input.categoryId,
      monthKeyOfDate(input.date),
      userTxs,
      cats,
    );
  }

  // Cập nhật lịch tổng kết tuần / tháng
  void rescheduleSummaryNotifications(user, userTxs);

  if (budgetAlert === 'over100') haptics.warning();
  else haptics.success();
}

export function deleteTransactionFlow(transactionId: string): void {
  const user = getCurrentUser();
  if (!user) return;
  const tx = useTransactionStore.getState().transactions.find((t) => t.id === transactionId);
  if (!tx) return;
  useTransactionStore.getState().removeTransaction(transactionId);
  const userTxs = useTransactionStore.getState().transactions.filter((t) => t.userId === user.id);
  if (tx.goalId) {
    useGoalStore.getState().syncGoalProgress(tx.goalId, userTxs);
  }
  void rescheduleSummaryNotifications(user, userTxs);
  haptics.medium();
}

/** Nạp tiền tiết kiệm / Thanh toán nợ cho mục tiêu */
export async function depositToGoalFlow(
  goalId: string,
  walletId: string,
  amount: number,
  note?: string,
): Promise<void> {
  const user = getCurrentUser();
  const goal = useGoalStore.getState().goals.find((g) => g.id === goalId);
  if (!user || !goal || amount <= 0) return;
  const seed = GOAL_DEPOSIT_CATEGORY[goal.type];
  const categoryId = useCategoryStore.getState().ensureCategory({
    userId: user.id,
    name: seed.name,
    icon: seed.icon,
    color: seed.color,
    type: 'expense',
  });
  await saveTransactionFlow({
    userId: user.id,
    amount,
    type: 'expense',
    categoryId,
    walletId,
    goalId: goal.id,
    note: note?.trim() || `${goal.type === 'saving' ? 'Nạp' : 'Trả nợ'}: ${goal.name}`,
    date: todayKey(),
    time: nowTime(),
  });
}
