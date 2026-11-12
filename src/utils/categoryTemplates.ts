import type { CategoryType, CurrencyCode, GoalType, PrimaryGoalType, WalletType } from '../types/models';

export interface CategorySeed {
  name: string;
  icon: string; // MaterialCommunityIcons
  color: string;
  type: CategoryType;
}

export interface WalletSeed {
  name: string;
  type: WalletType;
  icon: string;
  color: string;
}

export interface GoalSeed {
  type: GoalType;
  name: string;
  icon: string;
  color: string;
  /** Số tiền mục tiêu tính theo VND, sẽ quy đổi theo tiền tệ */
  targetVnd: number;
  months: number;
}

export const PRIMARY_GOALS: { key: PrimaryGoalType; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'saving', label: 'Tiết kiệm', icon: 'piggy-bank', color: '#16A34A', desc: 'Tích lũy đều đặn mỗi tháng' },
  { key: 'debt', label: 'Trả nợ', icon: 'credit-card-off-outline', color: '#EF4444', desc: 'Thoát nợ thẻ tín dụng, khoản vay' },
  { key: 'house', label: 'Mua nhà', icon: 'home-heart', color: '#F97316', desc: 'Tích lũy cho tổ ấm mơ ước' },
  { key: 'travel', label: 'Du lịch', icon: 'airplane', color: '#0EA5E9', desc: 'Lên kế hoạch cho chuyến đi' },
  { key: 'emergency', label: 'Quỹ dự phòng', icon: 'shield-check', color: '#8B5CF6', desc: 'An tâm trước biến cố bất ngờ' },
];

export const DEFAULT_WALLETS: WalletSeed[] = [
  { name: 'Tiền mặt', type: 'cash', icon: 'cash', color: '#16A34A' },
  { name: 'Ngân hàng', type: 'bank', icon: 'bank', color: '#3B82F6' },
  { name: 'Ví điện tử', type: 'ewallet', icon: 'wallet', color: '#EC4899' },
];

export const WALLET_TYPES: { key: WalletType; label: string; icon: string }[] = [
  { key: 'cash', label: 'Tiền mặt', icon: 'cash' },
  { key: 'bank', label: 'Ngân hàng', icon: 'bank' },
  { key: 'credit', label: 'Thẻ tín dụng', icon: 'credit-card' },
  { key: 'ewallet', label: 'Ví điện tử', icon: 'wallet' },
  { key: 'other', label: 'Khác', icon: 'safe' },
];

export const BASE_EXPENSE_CATEGORIES: CategorySeed[] = [
  { name: 'Ăn uống', icon: 'silverware-fork-knife', color: '#F97316', type: 'expense' },
  { name: 'Cà phê', icon: 'coffee', color: '#A16207', type: 'expense' },
  { name: 'Di chuyển', icon: 'car', color: '#0EA5E9', type: 'expense' },
  { name: 'Mua sắm', icon: 'shopping', color: '#EC4899', type: 'expense' },
  { name: 'Hóa đơn', icon: 'receipt', color: '#6366F1', type: 'expense' },
  { name: 'Nhà cửa', icon: 'home', color: '#14B8A6', type: 'expense' },
  { name: 'Giải trí', icon: 'gamepad-variant', color: '#8B5CF6', type: 'expense' },
  { name: 'Sức khỏe', icon: 'heart-pulse', color: '#EF4444', type: 'expense' },
  { name: 'Giáo dục', icon: 'school', color: '#3B82F6', type: 'expense' },
  { name: 'Gia đình', icon: 'account-group', color: '#F59E0B', type: 'expense' },
  { name: 'Quà tặng', icon: 'gift', color: '#D946EF', type: 'expense' },
  { name: 'Khác', icon: 'dots-horizontal-circle', color: '#64748B', type: 'expense' },
];

export const BASE_INCOME_CATEGORIES: CategorySeed[] = [
  { name: 'Lương', icon: 'cash-multiple', color: '#16A34A', type: 'income' },
  { name: 'Thưởng', icon: 'trophy', color: '#EAB308', type: 'income' },
  { name: 'Kinh doanh', icon: 'storefront', color: '#0EA5E9', type: 'income' },
  { name: 'Đầu tư', icon: 'chart-line', color: '#8B5CF6', type: 'income' },
  { name: 'Được tặng', icon: 'hand-heart', color: '#EC4899', type: 'income' },
  { name: 'Thu nhập khác', icon: 'plus-circle', color: '#64748B', type: 'income' },
];

/** Bộ danh mục gợi ý theo mục tiêu tài chính đã chọn ở Onboarding */
export const SUGGESTED_CATEGORIES: Record<PrimaryGoalType, CategorySeed[]> = {
  saving: [
    { name: 'Gửi tiết kiệm', icon: 'piggy-bank', color: '#16A34A', type: 'expense' },
    { name: 'Đầu tư chứng khoán', icon: 'finance', color: '#6366F1', type: 'expense' },
    { name: 'Vàng & tích sản', icon: 'gold', color: '#EAB308', type: 'expense' },
    { name: 'Lãi tiết kiệm', icon: 'percent', color: '#10B981', type: 'income' },
    { name: 'Thu nhập phụ', icon: 'briefcase-plus', color: '#0EA5E9', type: 'income' },
  ],
  debt: [
    { name: 'Trả góp thẻ tín dụng', icon: 'credit-card-clock', color: '#EF4444', type: 'expense' },
    { name: 'Trả nợ vay', icon: 'bank-transfer-out', color: '#DC2626', type: 'expense' },
    { name: 'Lãi vay', icon: 'percent-circle', color: '#F97316', type: 'expense' },
    { name: 'Phí ngân hàng', icon: 'bank-minus', color: '#78716C', type: 'expense' },
    { name: 'Trả góp mua sắm', icon: 'cart-arrow-right', color: '#F43F5E', type: 'expense' },
  ],
  house: [
    { name: 'Tiền thuê nhà', icon: 'home-city', color: '#14B8A6', type: 'expense' },
    { name: 'Tiền đặt cọc nhà', icon: 'home-lock', color: '#0EA5E9', type: 'expense' },
    { name: 'Nội thất', icon: 'sofa', color: '#A16207', type: 'expense' },
    { name: 'Sửa chữa nhà', icon: 'hammer-wrench', color: '#F97316', type: 'expense' },
    { name: 'Điện nước', icon: 'water-pump', color: '#3B82F6', type: 'expense' },
  ],
  travel: [
    { name: 'Vé máy bay', icon: 'airplane', color: '#0EA5E9', type: 'expense' },
    { name: 'Khách sạn', icon: 'bed', color: '#8B5CF6', type: 'expense' },
    { name: 'Ăn uống du lịch', icon: 'food-variant', color: '#F97316', type: 'expense' },
    { name: 'Quà lưu niệm', icon: 'gift-open', color: '#EC4899', type: 'expense' },
    { name: 'Tham quan', icon: 'map-marker-radius', color: '#10B981', type: 'expense' },
    { name: 'Di chuyển du lịch', icon: 'bus', color: '#6366F1', type: 'expense' },
  ],
  emergency: [
    { name: 'Quỹ dự phòng', icon: 'shield-check', color: '#8B5CF6', type: 'expense' },
    { name: 'Bảo hiểm', icon: 'shield-account', color: '#3B82F6', type: 'expense' },
    { name: 'Y tế khẩn cấp', icon: 'hospital-box', color: '#EF4444', type: 'expense' },
    { name: 'Sửa chữa đột xuất', icon: 'tools', color: '#F97316', type: 'expense' },
  ],
};

export const SUGGESTED_GOALS: Record<PrimaryGoalType, GoalSeed> = {
  saving: { type: 'saving', name: 'Tiết kiệm 6 tháng', icon: 'piggy-bank', color: '#16A34A', targetVnd: 30_000_000, months: 6 },
  debt: { type: 'debt', name: 'Trả hết nợ thẻ tín dụng', icon: 'credit-card-off-outline', color: '#EF4444', targetVnd: 20_000_000, months: 10 },
  house: { type: 'saving', name: 'Mua nhà', icon: 'home-heart', color: '#F97316', targetVnd: 500_000_000, months: 60 },
  travel: { type: 'saving', name: 'Du lịch Nhật Bản', icon: 'airplane', color: '#0EA5E9', targetVnd: 50_000_000, months: 12 },
  emergency: { type: 'saving', name: 'Quỹ khẩn cấp', icon: 'shield-check', color: '#8B5CF6', targetVnd: 60_000_000, months: 12 },
};

export interface QuickTemplateSeed {
  title: string;
  icon: string;
  color: string;
  categoryName: string;
  amount: Record<CurrencyCode, number>;
}

export const DEFAULT_QUICK_TEMPLATES: QuickTemplateSeed[] = [
  { title: 'Cà phê', icon: 'coffee', color: '#A16207', categoryName: 'Cà phê', amount: { VND: 35000, USD: 4, EUR: 3.5 } },
  { title: 'Ăn trưa', icon: 'noodles', color: '#F97316', categoryName: 'Ăn uống', amount: { VND: 45000, USD: 12, EUR: 10 } },
  { title: 'Đổ xăng', icon: 'gas-station', color: '#0EA5E9', categoryName: 'Di chuyển', amount: { VND: 70000, USD: 40, EUR: 50 } },
];

/** Quy đổi giá trị VND mẫu sang tiền tệ người dùng */
export function seedAmount(vnd: number, currency: CurrencyCode): number {
  if (currency === 'USD') return Math.round(vnd / 25400);
  if (currency === 'EUR') return Math.round(vnd / 27500);
  return vnd;
}

/** Tên danh mục hệ thống dùng cho nạp mục tiêu */
export const GOAL_DEPOSIT_CATEGORY: Record<GoalType, CategorySeed> = {
  saving: { name: 'Tiết kiệm', icon: 'piggy-bank', color: '#16A34A', type: 'expense' },
  debt: { name: 'Trả nợ', icon: 'cash-refund', color: '#EF4444', type: 'expense' },
};

/** Bộ icon để chọn cho danh mục / ví / mục tiêu */
export const ICON_CHOICES: string[] = [
  'silverware-fork-knife', 'coffee', 'noodles', 'food-variant', 'cupcake', 'glass-cocktail',
  'car', 'gas-station', 'bus', 'motorbike', 'taxi', 'airplane', 'train',
  'shopping', 'cart', 'tshirt-crew', 'shoe-heel', 'lipstick', 'diamond-stone',
  'receipt', 'flash', 'water', 'wifi', 'cellphone', 'television',
  'home', 'home-city', 'sofa', 'hammer-wrench', 'tools',
  'gamepad-variant', 'movie-open', 'music', 'ticket', 'basketball', 'dumbbell',
  'heart-pulse', 'hospital-box', 'pill', 'tooth', 'spa',
  'school', 'book-open-variant', 'laptop', 'baby-face-outline', 'dog', 'cat',
  'account-group', 'gift', 'hand-heart', 'party-popper', 'ring',
  'cash-multiple', 'cash', 'bank', 'credit-card', 'wallet', 'piggy-bank', 'safe',
  'chart-line', 'finance', 'trophy', 'storefront', 'briefcase', 'percent',
  'shield-check', 'umbrella', 'beach', 'map-marker-radius', 'bed', 'camera',
  'home-heart', 'car-sports', 'island', 'credit-card-off-outline', 'dots-horizontal-circle',
];
