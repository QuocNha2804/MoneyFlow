export type CurrencyCode = 'VND' | 'USD' | 'EUR';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type PrimaryGoalType = 'saving' | 'debt' | 'house' | 'travel' | 'emergency';
export type WalletType = 'cash' | 'bank' | 'credit' | 'ewallet' | 'other';
export type CategoryType = 'income' | 'expense';
export type GoalType = 'saving' | 'debt';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ThemeMode = 'light' | 'dark' | 'system';

// 1. Người dùng & Cài đặt (User)
export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string; // Băm SHA-256 qua expo-crypto
  avatar?: string; // uri ảnh trong documentDirectory hoặc "preset:<key>"
  currency: CurrencyCode;
  primaryGoal: PrimaryGoalType;
  hasCompletedOnboarding: boolean;
  hideBalance: boolean; // Chế độ ẩn số dư (******)
  security: {
    biometricEnabled: boolean;
    pinCode?: string; // Mã PIN 4 số (lưu dạng hash SHA-256)
  };
  notifications: {
    dailyReminder: boolean;
    reminderTime: string; // Mặc định "21:00"
    budgetAlert: boolean;
    weeklySummary: boolean;
    monthlySummary: boolean;
    goalMilestone: boolean;
  };
  createdAt: string; // ISO String
}

// 2. Ví / Nguồn tiền
export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  icon: string;
  color: string;
  includeInTotal: boolean;
  archived: boolean;
  createdAt: string;
}

// 3. Danh mục Thu / Chi
export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault: boolean;
  order: number;
  archived: boolean;
  createdAt: string;
}

// 4. Giao dịch
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  walletId: string;
  toWalletId?: string;
  goalId?: string;
  note?: string;
  tags?: string[];
  receiptUri?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

// 5. Mẫu nhập nhanh 1 chạm
export interface QuickTemplate {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  walletId: string;
  note?: string;
  icon: string;
  color: string;
}

// 6. Ngân sách tháng
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // "YYYY-MM"
  limit: number;
  rolloverEnabled: boolean;
  rolloverAmount: number;
  notified80: boolean;
  notified100: boolean;
  createdAt: string;
}

// 7. Mục tiêu tài chính
export interface FinancialGoal {
  id: string;
  userId: string;
  type: GoalType;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  initialAmount: number;
  currentAmount: number;
  deadline?: string;
  milestonesNotified: number[];
  createdAt: string;
  completedAt?: string;
  archived: boolean;
}

// 8. Giao dịch định kỳ
export interface RecurringTemplate {
  id: string;
  userId: string;
  template: {
    amount: number;
    type: TransactionType;
    categoryId?: string;
    walletId: string;
    toWalletId?: string;
    note?: string;
    tags?: string[];
    goalId?: string;
  };
  frequency: RecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  lastRunDate?: string;
  nextRunDate: string;
  active: boolean;
  createdAt: string;
}

// Cấu hình khởi tạo từ Onboarding (lưu trước khi đăng ký)
export interface OnboardingConfig {
  hasCompletedOnboarding: boolean;
  currency: CurrencyCode;
  primaryGoal: PrimaryGoalType;
  startingBalance: number;
  defaultReminderTime: string;
  notificationsGranted?: boolean;
}

// Cấu trúc file sao lưu JSON
export interface BackupData {
  app: 'MoneyFlow';
  version: number;
  exportedAt: string;
  user: Omit<User, 'passwordHash' | 'security'>;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  recurringTemplates: RecurringTemplate[];
  quickTemplates: QuickTemplate[];
}

export interface TransactionFilters {
  type?: TransactionType | 'all';
  keyword?: string;
  tag?: string;
  minAmount?: number;
  maxAmount?: number;
  categoryIds?: string[];
  walletIds?: string[];
  fromDate?: string;
  toDate?: string;
}
