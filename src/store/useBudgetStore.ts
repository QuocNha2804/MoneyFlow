import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Budget, Transaction } from '../types/models';
import { computeRolloverAmount, previousMonth } from '../utils/budgetCalculator';
import { nowISO, persistStorage, uuid } from './storage';

export type BudgetInput = {
  userId: string;
  categoryId: string;
  month: string;
  limit: number;
  rolloverEnabled?: boolean;
};

interface BudgetState {
  budgets: Budget[];
  /** Tạo mới hoặc cập nhật hạn mức ngân sách của danh mục trong tháng */
  upsertBudget: (input: BudgetInput, transactions: Transaction[]) => Budget;
  updateBudget: (id: string, patch: Partial<Budget>) => void;
  removeBudget: (id: string) => void;
  markNotified: (id: string, level: 80 | 100) => void;
  /** Tự động tạo ngân sách tháng mới với số dư rollover cho các danh mục bật rollover ở tháng trước */
  syncRolloverForMonth: (userId: string, month: string, transactions: Transaction[]) => void;
  removeUserData: (userId: string) => void;
  importBudgets: (items: Budget[]) => void;
  scaleAmounts: (userId: string, factor: number, round: (n: number) => number) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      upsertBudget: (input, transactions) => {
        const list = get().budgets;
        const prev = list.find(
          (b) =>
            b.userId === input.userId &&
            b.categoryId === input.categoryId &&
            b.month === previousMonth(input.month),
        );
        const rolloverEnabled = input.rolloverEnabled ?? prev?.rolloverEnabled ?? false;
        const rolloverAmount = rolloverEnabled ? computeRolloverAmount(prev, transactions) : 0;
        const existing = list.find(
          (b) => b.userId === input.userId && b.categoryId === input.categoryId && b.month === input.month,
        );
        if (existing) {
          const updated: Budget = {
            ...existing,
            limit: input.limit,
            rolloverEnabled,
            rolloverAmount,
          };
          set({ budgets: list.map((b) => (b.id === existing.id ? updated : b)) });
          return updated;
        }
        const created: Budget = {
          id: uuid(),
          userId: input.userId,
          categoryId: input.categoryId,
          month: input.month,
          limit: input.limit,
          rolloverEnabled,
          rolloverAmount,
          notified80: false,
          notified100: false,
          createdAt: nowISO(),
        };
        set({ budgets: [...list, created] });
        return created;
      },
      updateBudget: (id, patch) =>
        set({ budgets: get().budgets.map((b) => (b.id === id ? { ...b, ...patch, id: b.id } : b)) }),
      removeBudget: (id) => set({ budgets: get().budgets.filter((b) => b.id !== id) }),
      markNotified: (id, level) =>
        set({
          budgets: get().budgets.map((b) =>
            b.id === id ? { ...b, ...(level === 80 ? { notified80: true } : { notified100: true }) } : b,
          ),
        }),
      syncRolloverForMonth: (userId, month, transactions) => {
        const prevMonth = previousMonth(month);
        const list = get().budgets;
        const prevRollovers = list.filter(
          (b) => b.userId === userId && b.month === prevMonth && b.rolloverEnabled,
        );
        if (!prevRollovers.length) return;
        let next = [...list];
        let changed = false;
        for (const prev of prevRollovers) {
          const rolloverAmount = computeRolloverAmount(prev, transactions);
          const cur = next.find(
            (b) => b.userId === userId && b.categoryId === prev.categoryId && b.month === month,
          );
          if (cur) {
            if (cur.rolloverEnabled && cur.rolloverAmount !== rolloverAmount) {
              next = next.map((b) => (b.id === cur.id ? { ...b, rolloverAmount } : b));
              changed = true;
            }
          } else {
            next.push({
              id: uuid(),
              userId,
              categoryId: prev.categoryId,
              month,
              limit: prev.limit,
              rolloverEnabled: true,
              rolloverAmount,
              notified80: false,
              notified100: false,
              createdAt: nowISO(),
            });
            changed = true;
          }
        }
        if (changed) set({ budgets: next });
      },
      removeUserData: (userId) => set({ budgets: get().budgets.filter((b) => b.userId !== userId) }),
      importBudgets: (items) => {
        const ids = new Set(items.map((i) => i.id));
        set({ budgets: [...get().budgets.filter((b) => !ids.has(b.id)), ...items] });
      },
      scaleAmounts: (userId, factor, round) =>
        set({
          budgets: get().budgets.map((b) =>
            b.userId === userId
              ? { ...b, limit: round(b.limit * factor), rolloverAmount: round(b.rolloverAmount * factor) }
              : b,
          ),
        }),
    }),
    { name: 'mf-budgets', storage: persistStorage },
  ),
);
