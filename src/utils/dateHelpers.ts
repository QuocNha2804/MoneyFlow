import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDaysInMonth,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';

export const DATE_FMT = 'yyyy-MM-dd';
export const MONTH_FMT = 'yyyy-MM';

export function toDateKey(d: Date): string {
  return format(d, DATE_FMT);
}

export function toMonthKey(d: Date): string {
  return format(d, MONTH_FMT);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function currentMonthKey(): string {
  return toMonthKey(new Date());
}

export function nowTime(): string {
  return format(new Date(), 'HH:mm');
}

/** Parse "YYYY-MM-DD" theo giờ địa phương */
export function parseDateKey(key: string): Date {
  const d = parseISO(key);
  return isValid(d) ? d : new Date();
}

/** Parse "YYYY-MM" → ngày đầu tháng */
export function parseMonthKey(key: string): Date {
  const d = parse(key, MONTH_FMT, new Date());
  return isValid(d) ? d : startOfMonth(new Date());
}

export function combineDateTime(dateKey: string, time: string): Date {
  const d = parseDateKey(dateKey);
  const [h, m] = (time || '00:00').split(':').map((x) => parseInt(x, 10) || 0);
  d.setHours(h, m, 0, 0);
  return d;
}

export function shiftMonthKey(key: string, delta: number): string {
  return toMonthKey(addMonths(parseMonthKey(key), delta));
}

export function monthKeyOfDate(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `Tháng ${parseInt(m, 10)}/${y}`;
}

export function shortMonthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `T${parseInt(m, 10)}/${y.slice(2)}`;
}

export function monthRange(key: string): { start: string; end: string } {
  const d = parseMonthKey(key);
  return { start: toDateKey(startOfMonth(d)), end: toDateKey(endOfMonth(d)) };
}

/** Tuần tính từ Thứ 2 → Chủ nhật */
export function weekRange(ref: Date = new Date()): { start: string; end: string } {
  return {
    start: toDateKey(startOfWeek(ref, { weekStartsOn: 1 })),
    end: toDateKey(endOfWeek(ref, { weekStartsOn: 1 })),
  };
}

export function yearRange(ref: Date = new Date()): { start: string; end: string } {
  return { start: toDateKey(startOfYear(ref)), end: toDateKey(endOfYear(ref)) };
}

export function weekDays(ref: Date = new Date()): string[] {
  const start = startOfWeek(ref, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)));
}

export const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function lastNMonthKeys(n: number, ref: Date = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => toMonthKey(subMonths(ref, n - 1 - i)));
}

export function isInRange(dateKey: string, start: string, end: string): boolean {
  return dateKey >= start && dateKey <= end;
}

/** "Hôm nay", "Hôm qua", hoặc "Thứ 6, 15/11/2026" */
export function dayLabel(dateKey: string): string {
  const today = todayKey();
  if (dateKey === today) return 'Hôm nay';
  if (dateKey === toDateKey(addDays(new Date(), -1))) return 'Hôm qua';
  return formatDisplayDate(dateKey, true);
}

export function formatDisplayDate(dateKey: string, withWeekday = false): string {
  const d = parseDateKey(dateKey);
  if (withWeekday) {
    const wd = format(d, 'EEEE', { locale: vi });
    return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${format(d, 'dd/MM/yyyy')}`;
  }
  return format(d, 'dd/MM/yyyy');
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'Chào buổi sáng';
  if (h >= 11 && h < 13) return 'Chào buổi trưa';
  if (h >= 13 && h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function daysUntil(dateKey: string): number {
  return differenceInCalendarDays(parseDateKey(dateKey), new Date());
}

export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(parseDateKey(b), parseDateKey(a));
}

/** Số ngày còn lại trong tháng (tính cả hôm nay). Tháng quá khứ = 0, tháng tương lai = số ngày cả tháng */
export function daysLeftInMonth(monthKey: string): number {
  const cur = currentMonthKey();
  const d = parseMonthKey(monthKey);
  if (monthKey < cur) return 0;
  if (monthKey > cur) return getDaysInMonth(d);
  return getDaysInMonth(d) - new Date().getDate() + 1;
}

export function daysInMonthKey(monthKey: string): number {
  return getDaysInMonth(parseMonthKey(monthKey));
}

/** Số ngày đã trôi qua trong tháng (để tính trung bình/ngày) */
export function elapsedDaysInMonth(monthKey: string): number {
  const cur = currentMonthKey();
  if (monthKey < cur) return daysInMonthKey(monthKey);
  if (monthKey > cur) return 0;
  return new Date().getDate();
}

export { addDays, addWeeks, addMonths, addYears, format, getDaysInMonth };
