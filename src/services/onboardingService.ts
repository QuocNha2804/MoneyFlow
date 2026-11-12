import { addMonths } from 'date-fns';
import type { User } from '../types/models';
import {
  BASE_EXPENSE_CATEGORIES,
  BASE_INCOME_CATEGORIES,
  DEFAULT_QUICK_TEMPLATES,
  DEFAULT_WALLETS,
  SUGGESTED_GOALS,
  seedAmount,
} from '../utils/categoryTemplates';
import { toDateKey } from '../utils/dateHelpers';
import { useAuthStore } from '../store/useAuthStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useGoalStore } from '../store/useGoalStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useWalletStore } from '../store/useWalletStore';
import { scheduleDailyReminder } from './notificationService';

/**
 * Khởi tạo dữ liệu mặc định ngay sau khi Đăng ký:
 * - Bộ Ví mặc định (Tiền mặt chứa startingBalance từ Onboarding, Ngân hàng, Ví điện tử)
 * - Bộ Danh mục cơ bản (Thu/Chi)
 * - Bộ Mẫu nhập nhanh 1 chạm (Cà phê, Ăn trưa, Đổ xăng)
 * - 1 Mục tiêu mẫu theo primaryGoal của Onboarding
 * - Lập lịch nhắc ghi chép hàng ngày
 */
export function bootstrapNewUser(user: User): void {
  const { onboarding } = useAuthStore.getState();

  // 1. Ví mặc định
  const createdWallets = DEFAULT_WALLETS.map((w, idx) =>
    useWalletStore.getState().addWallet({
      userId: user.id,
      name: w.name,
      type: w.type,
      initialBalance: idx === 0 ? onboarding.startingBalance || 0 : 0,
      icon: w.icon,
      color: w.color,
      includeInTotal: true,
    }),
  );
  const cashWallet = createdWallets[0];

  // 2. Danh mục Thu / Chi cơ bản
  const createdCats = useCategoryStore.getState().addMany(
    [...BASE_EXPENSE_CATEGORIES, ...BASE_INCOME_CATEGORIES].map((c) => ({
      userId: user.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
      isDefault: true,
    })),
  );

  // 3. Mẫu nhập nhanh 1 chạm (Quick Templates)
  if (cashWallet) {
    for (const q of DEFAULT_QUICK_TEMPLATES) {
      const cat = createdCats.find((c) => c.name === q.categoryName) ?? createdCats[0];
      if (!cat) continue;
      useTransactionStore.getState().addQuickTemplate({
        userId: user.id,
        title: q.title,
        amount: q.amount[user.currency],
        type: 'expense',
        categoryId: cat.id,
        walletId: cashWallet.id,
        note: q.title,
        icon: q.icon,
        color: q.color,
      });
    }
  }

  // 4. Mục tiêu mặc định theo lựa chọn ở Onboarding
  const goalSeed = SUGGESTED_GOALS[user.primaryGoal];
  if (goalSeed) {
    useGoalStore.getState().addGoal({
      userId: user.id,
      type: goalSeed.type,
      name: goalSeed.name,
      icon: goalSeed.icon,
      color: goalSeed.color,
      targetAmount: seedAmount(goalSeed.targetVnd, user.currency),
      initialAmount: 0,
      deadline: toDateKey(addMonths(new Date(), goalSeed.months)),
    });
  }

  // 5. Lập lịch nhắc nhở hàng ngày
  void scheduleDailyReminder(user.notifications.dailyReminder, user.notifications.reminderTime);
}
