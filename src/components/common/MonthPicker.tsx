import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hitSlop, radius, spacing, typography, useTheme } from '../../theme';
import { currentMonthKey, monthLabel, shiftMonthKey } from '../../utils/dateHelpers';
import { haptics } from '../../utils/haptics';

interface MonthPickerProps {
  month: string;
  onChange: (month: string) => void;
  compact?: boolean;
}

export function MonthPicker({ month, onChange, compact }: MonthPickerProps) {
  const { colors } = useTheme();
  const isCurrent = month === currentMonthKey();

  const shift = (delta: number) => {
    haptics.selection();
    onChange(shiftMonthKey(month, delta));
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.cardAlt }]}>
      <Pressable onPress={() => shift(-1)} hitSlop={hitSlop} style={styles.arrow}>
        <MaterialCommunityIcons name="chevron-left" size={20} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={() => {
          if (!isCurrent) {
            haptics.selection();
            onChange(currentMonthKey());
          }
        }}
        style={styles.center}
      >
        <MaterialCommunityIcons name="calendar-month-outline" size={15} color={colors.primary} />
        <Text
          style={[
            compact ? typography.caption : typography.label,
            { color: colors.text, fontWeight: '700' },
          ]}
        >
          {monthLabel(month)}
        </Text>
      </Pressable>
      <Pressable onPress={() => shift(1)} hitSlop={hitSlop} style={styles.arrow}>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.round,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  arrow: { padding: 4 },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.xs,
  },
});
