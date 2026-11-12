import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuickTemplate, Transaction } from '../types/models';
import { currentMonthKey } from '../utils/dateHelpers';
import { nowISO, persistStorage, uuid } from './storage';

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
export type QuickTemplateInput = Omit<QuickTemplate, 'id'>;

interface TransactionState {
  transactions: Transaction[];
  quickTemplates: QuickTemplate[];
  selectedMonth: string; // "YYYY-MM"
  setSelectedMonth: (month: string) => void;
  addTransaction: (input: TransactionInput) => Transaction;
  addManyTransactions: (inputs: TransactionInput[]) => Transaction[];
  updateTransaction: (id: string, patch: Partial<TransactionInput>) => void;
  removeTransaction: (id: string) => void;
  addQuickTemplate: (input: QuickTemplateInput) => QuickTemplate;
  updateQuickTemplate: (id: string, patch: Partial<QuickTemplate>) => void;
  removeQuickTemplate: (id: string) => void;
  removeUserData: (userId: string) => void;
  importTransactions: (items: Transaction[]) => void;
  importQuickTemplates: (items: QuickTemplate[]) => void;
  scaleAmounts: (userId: string, factor: number, round: (n: number) => number) => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      quickTemplates: [],
      selectedMonth: currentMonthKey(),
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
      addTransaction: (input) => {
        const now = nowISO();
        const tx: Transaction = { ...input, id: uuid(), createdAt: now, updatedAt: now };
        set({ transactions: [tx, ...get().transactions] });
        return tx;
      },
      addManyTransactions: (inputs) => {
        if (!inputs.length) return [];
        const now = nowISO();
        const created = inputs.map((input) => ({ ...input, id: uuid(), createdAt: now, updatedAt: now }));
        set({ transactions: [...created, ...get().transactions] });
        return created;
      },
      updateTransaction: (id, patch) => {
        const now = nowISO();
        set({
          transactions: get().transactions.map((t) =>
            t.id === id ? { ...t, ...patch, id: t.id, updatedAt: now } : t,
          ),
        });
      },
      removeTransaction: (id) =>
        set({ transactions: get().transactions.filter((t) => t.id !== id) }),
      addQuickTemplate: (input) => {
        const tpl: QuickTemplate = { ...input, id: uuid() };
        set({ quickTemplates: [...get().quickTemplates, tpl] });
        return tpl;
      },
      updateQuickTemplate: (id, patch) =>
        set({
          quickTemplates: get().quickTemplates.map((q) => (q.id === id ? { ...q, ...patch, id: q.id } : q)),
        }),
      removeQuickTemplate: (id) =>
        set({ quickTemplates: get().quickTemplates.filter((q) => q.id !== id) }),
      removeUserData: (userId) =>
        set({
          transactions: get().transactions.filter((t) => t.userId !== userId),
          quickTemplates: get().quickTemplates.filter((q) => q.userId !== userId),
        }),
      importTransactions: (items) => {
        const ids = new Set(items.map((i) => i.id));
        set({ transactions: [...get().transactions.filter((t) => !ids.has(t.id)), ...items] });
      },
      importQuickTemplates: (items) => {
        const ids = new Set(items.map((i) => i.id));
        set({ quickTemplates: [...get().quickTemplates.filter((q) => !ids.has(q.id)), ...items] });
      },
      scaleAmounts: (userId, factor, round) =>
        set({
          transactions: get().transactions.map((t) =>
            t.userId === userId ? { ...t, amount: round(t.amount * factor) } : t,
          ),
          quickTemplates: get().quickTemplates.map((q) =>
            q.userId === userId ? { ...q, amount: round(q.amount * factor) } : q,
          ),
        }),
    }),
    {
      name: 'mf-transactions',
      storage: persistStorage,
      partialize: (s) => ({ transactions: s.transactions, quickTemplates: s.quickTemplates }),
    },
  ),
);
