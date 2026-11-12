import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Wallet } from '../types/models';
import { nowISO, persistStorage, uuid } from './storage';

export type WalletInput = Omit<Wallet, 'id' | 'createdAt' | 'archived'> & { archived?: boolean };

interface WalletState {
  wallets: Wallet[];
  addWallet: (input: WalletInput) => Wallet;
  updateWallet: (id: string, patch: Partial<Wallet>) => void;
  toggleArchive: (id: string) => void;
  removeWallet: (id: string) => void;
  /** Điều chỉnh số dư thực tế: thay đổi initialBalance theo chênh lệch */
  adjustBalance: (id: string, currentBalance: number, actualBalance: number) => void;
  removeUserData: (userId: string) => void;
  importWallets: (items: Wallet[]) => void;
  scaleAmounts: (userId: string, factor: number, round: (n: number) => number) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      addWallet: (input) => {
        const wallet: Wallet = { archived: false, ...input, id: uuid(), createdAt: nowISO() };
        set({ wallets: [...get().wallets, wallet] });
        return wallet;
      },
      updateWallet: (id, patch) =>
        set({ wallets: get().wallets.map((w) => (w.id === id ? { ...w, ...patch, id: w.id } : w)) }),
      toggleArchive: (id) =>
        set({ wallets: get().wallets.map((w) => (w.id === id ? { ...w, archived: !w.archived } : w)) }),
      removeWallet: (id) => set({ wallets: get().wallets.filter((w) => w.id !== id) }),
      adjustBalance: (id, currentBalance, actualBalance) => {
        const diff = actualBalance - currentBalance;
        set({
          wallets: get().wallets.map((w) =>
            w.id === id ? { ...w, initialBalance: w.initialBalance + diff } : w,
          ),
        });
      },
      removeUserData: (userId) => set({ wallets: get().wallets.filter((w) => w.userId !== userId) }),
      importWallets: (items) => {
        const ids = new Set(items.map((i) => i.id));
        set({ wallets: [...get().wallets.filter((w) => !ids.has(w.id)), ...items] });
      },
      scaleAmounts: (userId, factor, round) =>
        set({
          wallets: get().wallets.map((w) =>
            w.userId === userId ? { ...w, initialBalance: round(w.initialBalance * factor) } : w,
          ),
        }),
    }),
    { name: 'mf-wallets', storage: persistStorage },
  ),
);
