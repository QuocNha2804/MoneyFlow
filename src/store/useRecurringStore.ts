import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecurringTemplate } from '../types/models';
import { nowISO, persistStorage, uuid } from './storage';

export type RecurringInput = Omit<RecurringTemplate, 'id' | 'createdAt' | 'active'> & { active?: boolean };

interface RecurringState {
  recurringTemplates: RecurringTemplate[];
  addRecurring: (input: RecurringInput) => RecurringTemplate;
  updateRecurring: (id: string, patch: Partial<RecurringTemplate>) => void;
  toggleActive: (id: string) => void;
  removeRecurring: (id: string) => void;
  removeUserData: (userId: string) => void;
  importRecurring: (items: RecurringTemplate[]) => void;
  scaleAmounts: (userId: string, factor: number, round: (n: number) => number) => void;
}

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set, get) => ({
      recurringTemplates: [],
      addRecurring: (input) => {
        const item: RecurringTemplate = {
          active: true,
          ...input,
          id: uuid(),
          createdAt: nowISO(),
        };
        set({ recurringTemplates: [item, ...get().recurringTemplates] });
        return item;
      },
      updateRecurring: (id, patch) =>
        set({
          recurringTemplates: get().recurringTemplates.map((r) =>
            r.id === id ? { ...r, ...patch, id: r.id } : r,
          ),
        }),
      toggleActive: (id) =>
        set({
          recurringTemplates: get().recurringTemplates.map((r) =>
            r.id === id ? { ...r, active: !r.active } : r,
          ),
        }),
      removeRecurring: (id) =>
        set({ recurringTemplates: get().recurringTemplates.filter((r) => r.id !== id) }),
      removeUserData: (userId) =>
        set({ recurringTemplates: get().recurringTemplates.filter((r) => r.userId !== userId) }),
      importRecurring: (items) => {
        const ids = new Set(items.map((i) => i.id));
        set({
          recurringTemplates: [...get().recurringTemplates.filter((r) => !ids.has(r.id)), ...items],
        });
      },
      scaleAmounts: (userId, factor, round) =>
        set({
          recurringTemplates: get().recurringTemplates.map((r) =>
            r.userId === userId
              ? { ...r, template: { ...r.template, amount: round(r.template.amount * factor) } }
              : r,
          ),
        }),
    }),
    { name: 'mf-recurring', storage: persistStorage },
  ),
);
