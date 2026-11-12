import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '../types/models';
import { persistStorage } from './storage';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: (systemIsDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      toggle: (systemIsDark) => {
        const { mode } = get();
        const isDark = mode === 'system' ? systemIsDark : mode === 'dark';
        set({ mode: isDark ? 'light' : 'dark' });
      },
    }),
    { name: 'mf-theme', storage: persistStorage },
  ),
);
