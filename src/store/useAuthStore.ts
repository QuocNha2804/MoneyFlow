import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrencyCode, OnboardingConfig, PrimaryGoalType, User } from '../types/models';
import { nowISO, persistStorage, uuid } from './storage';

const DEFAULT_ONBOARDING: OnboardingConfig = {
  hasCompletedOnboarding: false,
  currency: 'VND',
  primaryGoal: 'saving',
  startingBalance: 0,
  defaultReminderTime: '21:00',
};

export interface RegisterPayload {
  fullName: string;
  email: string;
  passwordHash: string;
}

interface AuthState {
  users: User[];
  currentUserId: string | null;
  onboarding: OnboardingConfig;
  /** Cờ khóa màn hình (không persist) — bật khi mở lại app nếu user có bật PIN / sinh trắc học */
  isLocked: boolean;
  /** Cờ hiện Modal gợi ý danh mục ngay sau khi đăng ký */
  showSuggestedModal: boolean;
  completeOnboarding: (cfg: Omit<OnboardingConfig, 'hasCompletedOnboarding'>) => void;
  registerUser: (payload: RegisterPayload) => User;
  loginUser: (userId: string) => void;
  logout: () => void;
  updateCurrentUser: (patch: Partial<User>) => void;
  updatePasswordByEmail: (email: string, passwordHash: string) => boolean;
  toggleHideBalance: () => void;
  setCurrency: (currency: CurrencyCode) => void;
  setSecurity: (patch: Partial<User['security']>) => void;
  setNotifications: (patch: Partial<User['notifications']>) => void;
  setLocked: (locked: boolean) => void;
  setShowSuggestedModal: (show: boolean) => void;
  findByEmail: (email: string) => User | undefined;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUserId: null,
      onboarding: DEFAULT_ONBOARDING,
      isLocked: false,
      showSuggestedModal: false,
      completeOnboarding: (cfg) =>
        set({ onboarding: { ...cfg, hasCompletedOnboarding: true } }),
      registerUser: ({ fullName, email, passwordHash }) => {
        const { onboarding, users } = get();
        const user: User = {
          id: uuid(),
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          avatar: 'preset:leaf',
          currency: onboarding.currency ?? ('VND' as CurrencyCode),
          primaryGoal: onboarding.primaryGoal ?? ('saving' as PrimaryGoalType),
          hasCompletedOnboarding: true,
          hideBalance: false,
          security: { biometricEnabled: false },
          notifications: {
            dailyReminder: true,
            reminderTime: onboarding.defaultReminderTime || '21:00',
            budgetAlert: true,
            weeklySummary: true,
            monthlySummary: true,
            goalMilestone: true,
          },
          createdAt: nowISO(),
        };
        set({
          users: [...users, user],
          currentUserId: user.id,
          isLocked: false,
          showSuggestedModal: true,
        });
        return user;
      },
      loginUser: (userId) => set({ currentUserId: userId, isLocked: false }),
      logout: () => set({ currentUserId: null, isLocked: false, showSuggestedModal: false }),
      updateCurrentUser: (patch) => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;
        set({
          users: users.map((u) => (u.id === currentUserId ? { ...u, ...patch, id: u.id } : u)),
        });
      },
      updatePasswordByEmail: (email, passwordHash) => {
        const clean = email.trim().toLowerCase();
        const found = get().users.find((u) => u.email.toLowerCase() === clean);
        if (!found) return false;
        set({
          users: get().users.map((u) => (u.id === found.id ? { ...u, passwordHash } : u)),
        });
        return true;
      },
      toggleHideBalance: () => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;
        set({
          users: users.map((u) =>
            u.id === currentUserId ? { ...u, hideBalance: !u.hideBalance } : u,
          ),
        });
      },
      setCurrency: (currency) => get().updateCurrentUser({ currency }),
      setSecurity: (patch) => {
        const u = get().users.find((x) => x.id === get().currentUserId);
        if (!u) return;
        get().updateCurrentUser({ security: { ...u.security, ...patch } });
      },
      setNotifications: (patch) => {
        const u = get().users.find((x) => x.id === get().currentUserId);
        if (!u) return;
        get().updateCurrentUser({ notifications: { ...u.notifications, ...patch } });
      },
      setLocked: (isLocked) => set({ isLocked }),
      setShowSuggestedModal: (showSuggestedModal) => set({ showSuggestedModal }),
      findByEmail: (email) => {
        const clean = email.trim().toLowerCase();
        return get().users.find((u) => u.email.toLowerCase() === clean);
      },
    }),
    {
      name: 'mf-auth',
      storage: persistStorage,
      partialize: (s) => ({
        users: s.users,
        currentUserId: s.currentUserId,
        onboarding: s.onboarding,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.currentUserId) return;
        const u = state.users.find((x) => x.id === state.currentUserId);
        if (u && (u.security.biometricEnabled || u.security.pinCode)) {
          state.setLocked(true);
        }
      },
    },
  ),
);

export function getCurrentUser(): User | undefined {
  const { users, currentUserId } = useAuthStore.getState();
  return users.find((u) => u.id === currentUserId);
}
