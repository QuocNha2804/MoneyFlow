export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  onPrimary: string;
  gradient: [string, string, ...string[]];
  background: string;
  surface: string;
  card: string;
  cardAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  transfer: string;
  transferSoft: string;
  warning: string;
  warningSoft: string;
  orange: string;
  orangeSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  shadow: string;
  tabBar: string;
  inputBg: string;
  skeleton: string;
}

export const lightColors: ThemeColors = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#4ADE80',
  primarySoft: '#DCFCE7',
  onPrimary: '#FFFFFF',
  gradient: ['#22C55E', '#16A34A', '#0F7A3A'],
  background: '#F3F7F4',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F0F5F1',
  text: '#0F172A',
  textSecondary: '#5B6B7C',
  textMuted: '#94A3B8',
  border: '#E3EAE5',
  divider: '#EDF2EE',
  income: '#16A34A',
  incomeSoft: '#DCFCE7',
  expense: '#EF4444',
  expenseSoft: '#FEE2E2',
  transfer: '#3B82F6',
  transferSoft: '#DBEAFE',
  warning: '#EAB308',
  warningSoft: '#FEF9C3',
  orange: '#F97316',
  orangeSoft: '#FFEDD5',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  overlay: 'rgba(15, 23, 42, 0.45)',
  shadow: '#0F3D22',
  tabBar: '#FFFFFF',
  inputBg: '#F3F7F4',
  skeleton: '#E5ECE7',
};

export const darkColors: ThemeColors = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  primarySoft: '#123222',
  onPrimary: '#FFFFFF',
  gradient: ['#16A34A', '#0F7A3A', '#064E2B'],
  background: '#0A110D',
  surface: '#111A15',
  card: '#131D18',
  cardAlt: '#1A2620',
  text: '#F1F5F3',
  textSecondary: '#A3B1AA',
  textMuted: '#6B7B73',
  border: '#22312A',
  divider: '#1C2923',
  income: '#22C55E',
  incomeSoft: '#12301F',
  expense: '#F87171',
  expenseSoft: '#3A1717',
  transfer: '#60A5FA',
  transferSoft: '#172A45',
  warning: '#FACC15',
  warningSoft: '#3A3210',
  orange: '#FB923C',
  orangeSoft: '#3D2412',
  danger: '#F87171',
  dangerSoft: '#3A1717',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  tabBar: '#111A15',
  inputBg: '#1A2620',
  skeleton: '#1F2B25',
};

/** Bảng màu chọn cho danh mục / ví / mục tiêu */
export const palette = [
  '#16A34A',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#78716C',
  '#64748B',
];

/** Màu ngân sách theo mức sử dụng */
export function budgetLevelColor(percent: number, c: ThemeColors): string {
  if (percent >= 100) return c.danger;
  if (percent >= 90) return c.orange;
  if (percent >= 70) return c.warning;
  return c.income;
}

/** Thêm alpha vào mã màu hex (#RRGGBB) */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  if (hex.length === 7) return `${hex}${a}`;
  return hex;
}
