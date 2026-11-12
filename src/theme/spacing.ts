import { Dimensions, PixelRatio } from 'react-native';

const { width } = Dimensions.get('window');
const BASE_WIDTH = 390;

/** Scale nhẹ theo bề rộng màn hình, kẹp trong khoảng an toàn để không vỡ layout trên tablet / máy nhỏ */
export function scale(size: number): number {
  const ratio = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.15);
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
}

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  round: 999,
};

/** Bề rộng tối đa của nội dung (tablet / màn hình lớn) */
export const MAX_CONTENT_WIDTH = 680;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
