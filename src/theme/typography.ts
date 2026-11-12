import { TextStyle } from 'react-native';
import { scale } from './spacing';

export const fontSize = {
  xs: scale(11),
  sm: scale(12.5),
  md: scale(14),
  base: scale(15),
  lg: scale(17),
  xl: scale(20),
  xxl: scale(24),
  display: scale(30),
  hero: scale(36),
};

export const fontWeight: Record<'regular' | 'medium' | 'semibold' | 'bold' | 'heavy', TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export const typography = {
  hero: { fontSize: fontSize.hero, fontWeight: fontWeight.heavy, letterSpacing: -0.5 } as TextStyle,
  h1: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, letterSpacing: -0.3 } as TextStyle,
  h2: { fontSize: fontSize.xl, fontWeight: fontWeight.bold } as TextStyle,
  h3: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold } as TextStyle,
  body: { fontSize: fontSize.base, fontWeight: fontWeight.regular } as TextStyle,
  bodyMedium: { fontSize: fontSize.base, fontWeight: fontWeight.medium } as TextStyle,
  label: { fontSize: fontSize.md, fontWeight: fontWeight.medium } as TextStyle,
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.regular } as TextStyle,
  small: { fontSize: fontSize.xs, fontWeight: fontWeight.medium } as TextStyle,
};
