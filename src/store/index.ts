import { useMemo } from 'react';
import { useAuthStore } from './useAuthStore';
import { useWalletStore } from './useWalletStore';
import { useCategoryStore } from './useCategoryStore';
import { useTransactionStore } from './useTransactionStore';
import { useBudgetStore } from './useBudgetStore';
import { useGoalStore } from './useGoalStore';
import { useRecurringStore } from './useRecurringStore';
import type { CategoryType, CurrencyCode } from '../types/models';
import { conversionFactor, roundAmount } from '../utils/currencyFormatter';

export * from './useAuthStore';
export * from './useWalletStore';
export * from './useCategoryStore';
export * from './useTransactionStore';
export * from './useBudgetStore';
export * from './useGoalStore';
export * from './useRecurringStore';
export * from './useThemeStore';

export function useCurrentUser() {
  const users = useAuthStore((s) => s.users);
  const id = useAuthStore((s) => s.currentUserId);
  return useMemo(() => users.find((u) => u.id === id), [users, id]);
}

export function useUserWallets(includeArchived = false) {
  const userId = useAuthStore((s) => s.currentUserId);
  const all = useWalletStore((s) => s.wallets);
  return useMemo(
    () => all.filter((w) => w.userId === userId && (includeArchived || !w.archived)),
    [all, userId, includeArchived],
  );
}

export function useUserCategories(type?: CategoryType, includeArchived = false) {
  const userId = useAuthStore((s) => s.currentUserId);
  const all = useCategoryStore((s) => s.categories);
  return useMemo(
    () =>
      all
        .filter(
          (c) =>
            c.userId === userId &&
            (!type || c.type === type) &&
            (includeArchived || !c.archived),
        )
        .sort((a, b) => a.order - b.order),
    [all, userId, type, includeArchived],
  );
}

export function useUserTransactions() {
  const userId = useAuthStore((s) => s.currentUserId);
  const all = useTransactionStore((s) => s.transactions);
  return useMemo(() => all.filter((t) => t.userId === userId), [all, userId]);
}

export function useUserQuickTemplates() {
  const userId = useAuthStore((s) => s.currentUserId);
  const all = useTransactionStore((s) => s.quickTemplates);
  return useMemo(() => all.filter((q) => q.userId === userId), [all, userId]);
}

export function useUserBudgets(month?: string) {
  const userId = useAuthStore((s) => s.currentUserId);
  const all = useBudgetStore((s) => s.budgets);
  return useMemo(
    () => all.filter((b) => b.userId === userId && (!month || b.month === month)),
    [all, userId, month],
  );
}

export function useUserGoals() {
  const userId = useAuthStore((s) => s.currentUserId);
  const all = useGoalStore((s) => s.goals);
  return useMemo(() => all.filter((g) => g.userId === userId && !g.archived), [all, userId]);
}

export function useUserRecurring() {
  const userId = useAuthStore((s) => s.currentUserId);
  const all = useRecurringStore((s) => s.recurringTemplates);
  return useMemo(() => all.filter((r) => r.userId === userId), [all, userId]);
}

/** Xóa toàn bộ dữ liệu của người dùng đang đăng nhập (Reset) */
export function clearAllUserData(userId: string) {
  useWalletStore.getState().removeUserData(userId);
  useCategoryStore.getState().removeUserData(userId);
  useTransactionStore.getState().removeUserData(userId);
  useBudgetStore.getState().removeUserData(userId);
  useGoalStore.getState().removeUserData(userId);
  useRecurringStore.getState().removeUserData(userId);
}

/** Đổi đơn vị tiền tệ: chỉ đổi ký hiệu hoặc quy đổi toàn bộ theo tỷ giá */
export function switchCurrency(toCurrency: CurrencyCode, convert: boolean, rate = 1) {
  const user = useAuthStore.getState().users.find((u) => u.id === useAuthStore.getState().currentUserId);
  if (!user || user.currency === toCurrency) return;
  if (convert) {
    const factor = conversionFactor(user.currency, toCurrency, rate);
    const round = (n: number) => roundAmount(n, toCurrency);
    useWalletStore.getState().scaleAmounts(user.id, factor, round);
    useTransactionStore.getState().scaleAmounts(user.id, factor, round);
    useBudgetStore.getState().scaleAmounts(user.id, factor, round);
    useGoalStore.getState().scaleAmounts(user.id, factor, round);
    useRecurringStore.getState().scaleAmounts(user.id, factor, round);
  }
  useAuthStore.getState().setCurrency(toCurrency);
}
