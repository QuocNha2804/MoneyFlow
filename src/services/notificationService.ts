import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Category, CurrencyCode, FinancialGoal, Transaction, User } from '../types/models';
import { formatCurrency } from '../utils/currencyFormatter';
import { currentMonthKey, monthRange, weekRange } from '../utils/dateHelpers';
import { getBudgetStatuses } from '../utils/budgetCalculator';
import { totalsInRange } from '../utils/transactionHelpers';
import { useBudgetStore } from '../store/useBudgetStore';

const DAILY_ID = 'mf-daily-reminder';
const WEEKLY_ID = 'mf-weekly-summary';
const MONTHLY_ID = 'mf-monthly-summary';
const CHANNEL_ID = 'moneyflow-default';

let initialized = false;

export async function initNotificationHandler(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'MoneyFlow',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  } catch {
    // Web hoặc thiết bị không hỗ trợ
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await initNotificationHandler();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

async function safeCancel(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
}

async function fireImmediate(title: string, body: string): Promise<void> {
  try {
    await initNotificationHandler();
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    // ignore
  }
}

/** Lập lịch nhắc ghi chép hàng ngày theo giờ người dùng chọn (mặc định 21:00) */
export async function scheduleDailyReminder(enabled: boolean, timeStr = '21:00'): Promise<void> {
  await safeCancel(DAILY_ID);
  if (!enabled) return;
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
  try {
    await initNotificationHandler();
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: {
        title: '💰 Nhắc ghi chép MoneyFlow',
        body: 'Hôm nay bạn đã ghi lại chi tiêu chưa? Ghi nhanh 30 giây nhé!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: Math.min(23, Math.max(0, h)),
        minute: Math.min(59, Math.max(0, m)),
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // ignore
  }
}

function nextSunday20(): Date {
  const now = new Date();
  const d = new Date(now);
  const day = d.getDay(); // 0 = Chủ nhật
  const daysAhead = day === 0 && d.getHours() < 20 ? 0 : (7 - day) % 7 || 7;
  d.setDate(d.getDate() + daysAhead);
  d.setHours(20, 0, 0, 0);
  return d;
}

function endOfMonth20(): Date {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 20, 0, 0, 0);
  if (last <= now) {
    return new Date(now.getFullYear(), now.getMonth() + 2, 0, 20, 0, 0, 0);
  }
  return last;
}

/** Cập nhật lịch thông báo tổng kết tuần (CN 20:00) & cuối tháng (20:00) với số liệu mới nhất */
export async function rescheduleSummaryNotifications(
  user: User,
  transactions: Transaction[],
): Promise<void> {
  await safeCancel(WEEKLY_ID);
  await safeCancel(MONTHLY_ID);

  if (user.notifications.weeklySummary) {
    const w = weekRange();
    const wt = totalsInRange(transactions, w.start, w.end);
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: WEEKLY_ID,
        content: {
          title: '📊 Tổng kết tuần của bạn',
          body: `Tuần này bạn đã chi ${formatCurrency(wt.expense, user.currency)}, thu ${formatCurrency(wt.income, user.currency)}. Xem báo cáo chi tiết →`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nextSunday20(),
          channelId: CHANNEL_ID,
        },
      });
    } catch {
      // ignore
    }
  }

  if (user.notifications.monthlySummary) {
    const m = monthRange(currentMonthKey());
    const mt = totalsInRange(transactions, m.start, m.end);
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: MONTHLY_ID,
        content: {
          title: '📅 Tổng kết tháng MoneyFlow',
          body: `Tổng kết tháng: Thu ${formatCurrency(mt.income, user.currency)}, Chi ${formatCurrency(mt.expense, user.currency)}, Tiết kiệm ${formatCurrency(mt.net, user.currency)}`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: endOfMonth20(),
          channelId: CHANNEL_ID,
        },
      });
    } catch {
      // ignore
    }
  }
}

/** Kiểm tra ngân sách của danh mục sau khi thêm/sửa giao dịch; bắn cảnh báo 80% và 100% đúng 1 lần/tháng */
export async function checkBudgetThresholds(
  user: User,
  categoryId: string | undefined,
  month: string,
  transactions: Transaction[],
  categories: Category[],
): Promise<'over100' | 'over80' | null> {
  if (!categoryId) return null;
  const budgets = useBudgetStore
    .getState()
    .budgets.filter((b) => b.userId === user.id && b.categoryId === categoryId && b.month === month);
  if (!budgets.length) return null;
  const statuses = getBudgetStatuses(budgets, transactions, month);
  const st = statuses[0];
  if (!st) return null;
  const catName = categories.find((c) => c.id === categoryId)?.name ?? 'Danh mục';
  const pctRound = Math.round(st.percent);

  if (st.percent >= 100 && !st.budget.notified100) {
    useBudgetStore.getState().markNotified(st.budget.id, 100);
    useBudgetStore.getState().markNotified(st.budget.id, 80);
    if (user.notifications.budgetAlert) {
      const over = formatCurrency(Math.abs(st.remaining), user.currency);
      await fireImmediate(
        '🚨 Đã vượt ngân sách!',
        `Bạn đã dùng ${pctRound}% ngân sách ${catName} tháng này (vượt ${over}).`,
      );
    }
    return 'over100';
  }

  if (st.percent >= 80 && !st.budget.notified80) {
    useBudgetStore.getState().markNotified(st.budget.id, 80);
    if (user.notifications.budgetAlert) {
      await fireImmediate(
        '⚠️ Cảnh báo ngân sách',
        `⚠️ Bạn đã dùng ${pctRound}% ngân sách ${catName} tháng này.`,
      );
    }
    return 'over80';
  }
  return null;
}

export async function notifyGoalMilestones(
  user: User,
  goal: FinancialGoal,
  reached: number[],
  currency: CurrencyCode,
): Promise<void> {
  if (!reached.length || !user.notifications.goalMilestone) return;
  const top = Math.max(...reached);
  const cur = formatCurrency(goal.currentAmount, currency);
  const target = formatCurrency(goal.targetAmount, currency);
  const title = top >= 100 ? '🎉 Hoàn thành mục tiêu!' : `🎯 Đạt mốc ${top}% mục tiêu!`;
  const body =
    top >= 100
      ? `Chúc mừng! Bạn đã hoàn thành "${goal.name}" (${cur}/${target}).`
      : `"${goal.name}" đã đạt ${top}% (${cur}/${target}). Tiếp tục phát huy nhé!`;
  await fireImmediate(title, body);
}
