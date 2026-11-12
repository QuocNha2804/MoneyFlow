import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import type { BackupData } from '../types/models';
import {
  clearAllUserData,
  useAuthStore,
  useBudgetStore,
  useCategoryStore,
  useGoalStore,
  useRecurringStore,
  useTransactionStore,
  useWalletStore,
} from '../store';
import { uuid } from '../store/storage';
import { todayKey } from '../utils/dateHelpers';

/** Lưu bền vững ảnh hóa đơn / avatar vào documentDirectory */
export function persistImageFile(sourceUri: string, folder: 'receipts' | 'avatars' = 'receipts'): string {
  if (!sourceUri || Platform.OS === 'web') return sourceUri;
  try {
    const dir = new Directory(Paths.document, folder);
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
    const dest = new File(dir, `${uuid()}.${ext}`);
    const src = new File(sourceUri);
    src.copySync(dest);
    return dest.uri;
  } catch {
    return sourceUri;
  }
}

export function buildBackupData(userId: string): BackupData | null {
  const user = useAuthStore.getState().users.find((u) => u.id === userId);
  if (!user) return null;
  const { passwordHash: _p, security: _s, ...safeUser } = user;
  return {
    app: 'MoneyFlow',
    version: 1,
    exportedAt: new Date().toISOString(),
    user: safeUser,
    wallets: useWalletStore.getState().wallets.filter((w) => w.userId === userId),
    categories: useCategoryStore.getState().categories.filter((c) => c.userId === userId),
    transactions: useTransactionStore.getState().transactions.filter((t) => t.userId === userId),
    budgets: useBudgetStore.getState().budgets.filter((b) => b.userId === userId),
    goals: useGoalStore.getState().goals.filter((g) => g.userId === userId),
    recurringTemplates: useRecurringStore.getState().recurringTemplates.filter((r) => r.userId === userId),
    quickTemplates: useTransactionStore.getState().quickTemplates.filter((q) => q.userId === userId),
  };
}

async function writeAndShare(filename: string, content: string, mimeType: string): Promise<string> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create({ overwrite: true });
  file.writeSync(content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
  }
  return file.uri;
}

/** Export JSON: đóng gói toàn bộ dữ liệu của user ra file .json */
export async function exportBackupJSON(userId: string): Promise<string> {
  const data = buildBackupData(userId);
  if (!data) throw new Error('Không tìm thấy người dùng');
  const filename = `MoneyFlow_Backup_${todayKey()}.json`;
  return writeAndShare(filename, JSON.stringify(data, null, 2), 'application/json');
}

function csvCell(val: string | number | undefined): string {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

/** Export CSV: chuẩn UTF-8 có BOM (\uFEFF) để đọc tiếng Việt trực tiếp trên Excel */
export async function exportTransactionsCSV(userId: string): Promise<string> {
  const txs = useTransactionStore.getState().transactions.filter((t) => t.userId === userId);
  const cats = new Map(useCategoryStore.getState().categories.map((c) => [c.id, c.name]));
  const wallets = new Map(useWalletStore.getState().wallets.map((w) => [w.id, w.name]));

  const header = ['Ngày', 'Giờ', 'Loại', 'Số tiền', 'Danh mục', 'Ví nguồn', 'Ví đích', 'Ghi chú', 'Tags'];
  const typeLabel = { income: 'Thu nhập', expense: 'Chi tiêu', transfer: 'Chuyển khoản' };
  const rows = txs.map((t) =>
    [
      t.date,
      t.time,
      typeLabel[t.type],
      t.amount,
      t.categoryId ? cats.get(t.categoryId) ?? '' : '',
      wallets.get(t.walletId) ?? '',
      t.toWalletId ? wallets.get(t.toWalletId) ?? '' : '',
      t.note ?? '',
      (t.tags ?? []).join(' '),
    ]
      .map(csvCell)
      .join(','),
  );
  const csv = '\uFEFF' + [header.map(csvCell).join(','), ...rows].join('\r\n');
  const filename = `MoneyFlow_Transactions_${todayKey()}.csv`;
  return writeAndShare(filename, csv, 'text/csv');
}

export function validateBackupSchema(raw: unknown): raw is BackupData {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  return (
    obj.app === 'MoneyFlow' &&
    Array.isArray(obj.wallets) &&
    Array.isArray(obj.categories) &&
    Array.isArray(obj.transactions) &&
    Array.isArray(obj.budgets) &&
    Array.isArray(obj.goals)
  );
}

/** Mở hộp thoại chọn file .json và kiểm tra schema */
export async function pickAndParseBackupJSON(): Promise<BackupData | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  let text = '';
  if (Platform.OS === 'web') {
    const resp = await fetch(asset.uri);
    text = await resp.text();
  } else {
    const file = new File(asset.uri);
    text = file.textSync();
  }
  const parsed = JSON.parse(text);
  if (!validateBackupSchema(parsed)) {
    throw new Error('File không đúng định dạng sao lưu của MoneyFlow.');
  }
  return parsed;
}

/** Khôi phục dữ liệu từ bản sao lưu: Merge (gộp) hoặc Replace (ghi đè toàn bộ) */
export function applyBackupData(userId: string, data: BackupData, mode: 'merge' | 'replace'): void {
  if (mode === 'replace') {
    clearAllUserData(userId);
  }
  const rebind = <T extends { userId: string }>(arr: T[]): T[] =>
    (arr ?? []).map((item) => ({ ...item, userId }));

  useWalletStore.getState().importWallets(rebind(data.wallets));
  useCategoryStore.getState().importCategories(rebind(data.categories));
  useTransactionStore.getState().importTransactions(rebind(data.transactions));
  useTransactionStore.getState().importQuickTemplates(rebind(data.quickTemplates ?? []));
  useBudgetStore.getState().importBudgets(rebind(data.budgets));
  useGoalStore.getState().importGoals(rebind(data.goals));
  useRecurringStore.getState().importRecurring(rebind(data.recurringTemplates ?? []));

  if (data.user?.currency) {
    useAuthStore.getState().setCurrency(data.user.currency);
  }
}
