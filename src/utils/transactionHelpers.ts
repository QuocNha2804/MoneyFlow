import type { Transaction, TransactionFilters, Wallet, Category } from '../types/models';
import { monthRange } from './dateHelpers';

export function sortTransactionsDesc(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    const k = (b.date + b.time).localeCompare(a.date + a.time);
    return k !== 0 ? k : b.createdAt.localeCompare(a.createdAt);
  });
}

/** Số dư thực tế của từng ví = initialBalance + thu − chi ± chuyển khoản */
export function computeWalletBalances(wallets: Wallet[], transactions: Transaction[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const w of wallets) map[w.id] = w.initialBalance;
  for (const t of transactions) {
    if (t.type === 'income') {
      if (t.walletId in map) map[t.walletId] += t.amount;
    } else if (t.type === 'expense') {
      if (t.walletId in map) map[t.walletId] -= t.amount;
    } else {
      if (t.walletId in map) map[t.walletId] -= t.amount;
      if (t.toWalletId && t.toWalletId in map) map[t.toWalletId] += t.amount;
    }
  }
  return map;
}

export function computeNetWorth(wallets: Wallet[], balances: Record<string, number>): number {
  return wallets
    .filter((w) => w.includeInTotal && !w.archived)
    .reduce((s, w) => s + (balances[w.id] ?? 0), 0);
}

export interface PeriodTotals {
  income: number;
  expense: number;
  net: number;
}

export function totalsInRange(transactions: Transaction[], start: string, end: string, walletId?: string): PeriodTotals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.date < start || t.date > end) continue;
    if (walletId && t.walletId !== walletId) continue;
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

export function monthTotals(transactions: Transaction[], month: string, walletId?: string): PeriodTotals {
  const { start, end } = monthRange(month);
  return totalsInRange(transactions, start, end, walletId);
}

/** % thay đổi so với kỳ trước (null nếu kỳ trước = 0) */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export interface DayGroup {
  date: string;
  income: number;
  expense: number;
  items: Transaction[];
}

export function groupByDay(list: Transaction[]): DayGroup[] {
  const sorted = sortTransactionsDesc(list);
  const groups: DayGroup[] = [];
  let cur: DayGroup | null = null;
  for (const t of sorted) {
    if (!cur || cur.date !== t.date) {
      cur = { date: t.date, income: 0, expense: 0, items: [] };
      groups.push(cur);
    }
    cur.items.push(t);
    if (t.type === 'income') cur.income += t.amount;
    else if (t.type === 'expense') cur.expense += t.amount;
  }
  return groups;
}

/** Tách hashtag từ chuỗi: "#dulich #congty" → ["#dulich", "#congty"] */
export function parseTags(text: string): string[] {
  const matches = text.match(/#[^\s#,.;:!?()[\]{}"']+/g) ?? [];
  return Array.from(new Set(matches.map((t) => t.toLowerCase())));
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function filterTransactions(
  list: Transaction[],
  f: TransactionFilters,
  categories?: Category[],
  wallets?: Wallet[],
): Transaction[] {
  const kw = f.keyword?.trim() ? normalizeText(f.keyword.trim()) : '';
  const tag = f.tag?.trim().toLowerCase();
  const catMap = categories ? new Map(categories.map((c) => [c.id, normalizeText(c.name)])) : null;
  const walletMap = wallets ? new Map(wallets.map((w) => [w.id, normalizeText(w.name)])) : null;
  return list.filter((t) => {
    if (f.type && f.type !== 'all' && t.type !== f.type) return false;
    if (f.minAmount != null && t.amount < f.minAmount) return false;
    if (f.maxAmount != null && t.amount > f.maxAmount) return false;
    if (f.categoryIds?.length && (!t.categoryId || !f.categoryIds.includes(t.categoryId))) return false;
    if (f.walletIds?.length && !f.walletIds.includes(t.walletId) && !(t.toWalletId && f.walletIds.includes(t.toWalletId)))
      return false;
    if (f.fromDate && t.date < f.fromDate) return false;
    if (f.toDate && t.date > f.toDate) return false;
    if (tag) {
      const want = tag.startsWith('#') ? tag : `#${tag}`;
      if (!t.tags?.some((x) => x.toLowerCase() === want)) return false;
    }
    if (kw) {
      const hay = [
        t.note ?? '',
        (t.tags ?? []).join(' '),
        t.categoryId && catMap ? catMap.get(t.categoryId) ?? '' : '',
        walletMap ? walletMap.get(t.walletId) ?? '' : '',
      ]
        .map(normalizeText)
        .join(' ');
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
}
