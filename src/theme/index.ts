import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { darkColors, lightColors, ThemeColors } from './colors';

export * from './colors';
export * from './spacing';
export * from './typography';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
