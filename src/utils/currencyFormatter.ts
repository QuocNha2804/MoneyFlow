import type { CurrencyCode } from '../types/models';

export const HIDDEN_MASK = '******';

export const CURRENCIES: { code: CurrencyCode; name: string; symbol: string; flag: string; locale: string }[] = [
  { code: 'VND', name: 'Việt Nam Đồng', symbol: '₫', flag: '🇻🇳', locale: 'vi-VN' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', locale: 'en-IE' },
];

export function currencyInfo(code: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function currencySymbol(code: CurrencyCode): string {
  return currencyInfo(code).symbol;
}

export function currencyDecimals(code: CurrencyCode): number {
  return code === 'VND' ? 0 : 2;
}

export function roundAmount(amount: number, code: CurrencyCode): number {
  const f = Math.pow(10, currencyDecimals(code));
  return Math.round(amount * f) / f;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(code: CurrencyCode): Intl.NumberFormat | null {
  const key = code;
  if (formatterCache.has(key)) return formatterCache.get(key)!;
  try {
    const info = currencyInfo(code);
    const f = new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: currencyDecimals(code),
      maximumFractionDigits: currencyDecimals(code),
    });
    formatterCache.set(key, f);
    return f;
  } catch {
    return null;
  }
}

function groupDigits(intPart: string, sep: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Định dạng thủ công (fallback khi Intl không khả dụng) */
function manualFormat(abs: number, code: CurrencyCode): string {
  const dec = currencyDecimals(code);
  const fixed = abs.toFixed(dec);
  const [i, d] = fixed.split('.');
  if (code === 'VND') return `${groupDigits(i, '.')} ₫`;
  const sym = currencySymbol(code);
  return `${sym}${groupDigits(i, ',')}${d ? `.${d}` : ''}`;
}

export interface FormatOptions {
  hidden?: boolean;
  /** Hiển thị dấu +/- phía trước */
  sign?: 'auto' | 'always' | 'never';
  compact?: boolean;
}

export function formatCurrency(amount: number, code: CurrencyCode, opts: FormatOptions = {}): string {
  if (opts.hidden) return HIDDEN_MASK;
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  let body: string;
  if (opts.compact) {
    body = formatCompact(abs, code);
  } else {
    const f = getFormatter(code);
    body = f ? f.format(abs).replace(/\u00A0/g, ' ') : manualFormat(abs, code);
  }
  const signMode = opts.sign ?? 'auto';
  if (signMode === 'never') return body;
  if (signMode === 'always') return `${safe < 0 ? '-' : '+'}${body}`;
  return safe < 0 ? `-${body}` : body;
}

/** Rút gọn số lớn: 1,2 tr / 15 k (VND) hoặc $1.2K / $3.4M */
export function formatCompact(amount: number, code: CurrencyCode): string {
  const abs = Math.abs(amount);
  const neg = amount < 0 ? '-' : '';
  if (code === 'VND') {
    if (abs >= 1_000_000_000) return `${neg}${trim(abs / 1_000_000_000)} tỷ`;
    if (abs >= 1_000_000) return `${neg}${trim(abs / 1_000_000)} tr`;
    if (abs >= 1_000) return `${neg}${trim(abs / 1_000)}k`;
    return `${neg}${Math.round(abs)}`;
  }
  const sym = currencySymbol(code);
  if (abs >= 1_000_000) return `${neg}${sym}${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${neg}${sym}${trim(abs / 1_000)}K`;
  return `${neg}${sym}${trim(abs)}`;
}

function trim(n: number): string {
  const r = Math.round(n * 10) / 10;
  return (Number.isInteger(r) ? r.toString() : r.toFixed(1)).replace('.', ',');
}

/** Định dạng số (không ký hiệu) cho ô nhập: 1500000 → "1.500.000" */
export function formatPlainNumber(amount: number, code: CurrencyCode): string {
  if (!Number.isFinite(amount)) return '0';
  const dec = currencyDecimals(code);
  const rounded = roundAmount(amount, code);
  const [i, d] = Math.abs(rounded).toFixed(dec).split('.');
  const sep = code === 'VND' ? '.' : ',';
  const decSep = code === 'VND' ? ',' : '.';
  const body = groupDigits(i, sep) + (d && parseInt(d, 10) !== 0 ? decSep + d : '');
  return rounded < 0 ? `-${body}` : body;
}

/** Parse chuỗi người dùng nhập ("1.500.000", "1,250.50") thành số */
export function parseAmountInput(text: string, code: CurrencyCode): number {
  if (!text) return 0;
  let s = text.replace(/[^\d.,-]/g, '');
  if (code === 'VND') {
    s = s.replace(/[.,]/g, '');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Thứ tự giá trị tiền tệ để hiển thị tỷ giá thân thiện: 1 EUR = X USD, 1 USD = X VND */
const CURRENCY_RANK: Record<CurrencyCode, number> = { VND: 0, USD: 1, EUR: 2 };

export const DEFAULT_RATES: Record<string, number> = {
  'USD-VND': 25400,
  'EUR-VND': 27500,
  'EUR-USD': 1.08,
};

/** Trả về cặp (base, quote) sao cho câu hỏi tỷ giá luôn là "1 base = X quote" với X > 1 */
export function ratePair(from: CurrencyCode, to: CurrencyCode): { base: CurrencyCode; quote: CurrencyCode } {
  return CURRENCY_RANK[from] > CURRENCY_RANK[to] ? { base: from, quote: to } : { base: to, quote: from };
}

export function defaultRate(from: CurrencyCode, to: CurrencyCode): number {
  const { base, quote } = ratePair(from, to);
  return DEFAULT_RATES[`${base}-${quote}`] ?? 1;
}

/** Hệ số nhân để quy đổi số tiền từ `from` sang `to` với tỷ giá "1 base = rate quote" */
export function conversionFactor(from: CurrencyCode, to: CurrencyCode, rate: number): number {
  if (from === to || rate <= 0) return 1;
  const { base } = ratePair(from, to);
  return from === base ? rate : 1 / rate;
}
