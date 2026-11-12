import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { budgetLevelColor, radius, useTheme } from '../../theme';

interface BudgetProgressBarProps {
  percent: number;
  height?: number;
  customColor?: string;
}

export function BudgetProgressBar({ percent, height = 8, customColor }: BudgetProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0));
  const widthVal = useSharedValue(clamped);

  useEffect(() => {
    widthVal.value = withTiming(clamped, { duration: 400 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped]);

  const fillColor = customColor ?? budgetLevelColor(percent, colors);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthVal.value}%`,
  }));

  return (
    <View style={[styles.track, { height, backgroundColor: colors.cardAlt }]}>
      <Animated.View style={[styles.fill, { height, backgroundColor: fillColor }, barStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: radius.round,
  },
});
