import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinancialGoal, GoalType, Transaction } from '../types/models';
import { computeGoalCurrent, goalPercent, newMilestones } from '../utils/goalProjection';
import { nowISO, persistStorage, uuid } from './storage';

export type GoalInput = {
  userId: string;
  type: GoalType;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  initialAmount: number;
  deadline?: string;
};

interface GoalState {
  goals: FinancialGoal[];
  /** Cờ bật hiệu ứng pháo giấy khi vừa hoàn thành 100% mục tiêu */
  confettiGoalName: string | null;
  dismissConfetti: () => void;
  addGoal: (input: GoalInput) => FinancialGoal;
  updateGoal: (id: string, patch: Partial<FinancialGoal>) => void;
  removeGoal: (id: string) => void;
  /** Đồng bộ currentAmount từ danh sách giao dịch và trả về các cột mốc mới đạt */
  syncGoalProgress: (goalId: string, transactions: Transaction[]) => { goal?: FinancialGoal; reached: number[] };
  removeUserData: (userId: string) => void;
  importGoals: (items: FinancialGoal[]) => void;
  scaleAmounts: (userId: string, factor: number, round: (n: number) => number) => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      confettiGoalName: null,
      dismissConfetti: () => set({ confettiGoalName: null }),
      addGoal: (input) => {
        const pct = goalPercent(input.initialAmount, input.targetAmount);
        const initialMilestones = [25, 50, 75, 100].filter((m) => pct >= m);
        const goal: FinancialGoal = {
          id: uuid(),
          userId: input.userId,
          type: input.type,
          name: input.name.trim(),
          icon: input.icon,
          color: input.color,
          targetAmount: input.targetAmount,
          initialAmount: input.initialAmount,
          currentAmount: input.initialAmount,
          deadline: input.deadline,
          milestonesNotified: initialMilestones,
          createdAt: nowISO(),
          completedAt: pct >= 100 ? nowISO() : undefined,
          archived: false,
        };
        set({ goals: [goal, ...get().goals] });
        return goal;
      },
      updateGoal: (id, patch) =>
        set({ goals: get().goals.map((g) => (g.id === id ? { ...g, ...patch, id: g.id } : g)) }),
      removeGoal: (id) => set({ goals: get().goals.filter((g) => g.id !== id) }),
      syncGoalProgress: (goalId, transactions) => {
        const list = get().goals;
        const goal = list.find((g) => g.id === goalId);
        if (!goal) return { reached: [] };
        const currentAmount = computeGoalCurrent(goal, transactions);
        const pct = goalPercent(currentAmount, goal.targetAmount);
        const reached = newMilestones(pct, goal.milestonesNotified);
        const updated: FinancialGoal = {
          ...goal,
          currentAmount,
          milestonesNotified: Array.from(new Set([...goal.milestonesNotified, ...reached])),
          completedAt: pct >= 100 ? goal.completedAt ?? nowISO() : undefined,
        };
        set({
          goals: list.map((g) => (g.id === goalId ? updated : g)),
          ...(reached.includes(100) ? { confettiGoalName: goal.name } : {}),
        });
        return { goal: updated, reached };
      },
      removeUserData: (userId) => set({ goals: get().goals.filter((g) => g.userId !== userId) }),
      importGoals: (items) => {
        const ids = new Set(items.map((i) => i.id));
        set({ goals: [...get().goals.filter((g) => !ids.has(g.id)), ...items] });
      },
      scaleAmounts: (userId, factor, round) =>
        set({
          goals: get().goals.map((g) =>
            g.userId === userId
              ? {
                  ...g,
                  targetAmount: round(g.targetAmount * factor),
                  initialAmount: round(g.initialAmount * factor),
                  currentAmount: round(g.currentAmount * factor),
                }
              : g,
          ),
        }),
    }),
    {
      name: 'mf-goals',
      storage: persistStorage,
      partialize: (s) => ({ goals: s.goals }),
    },
  ),
);
