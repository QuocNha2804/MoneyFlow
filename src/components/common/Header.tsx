import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hitSlop, radius, spacing, typography, useTheme } from '../../theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function Header({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  rightElement,
  style,
}: HeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { borderBottomColor: colors.divider }, style]}>
      <View style={styles.left}>
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={hitSlop}
            style={[styles.iconBtn, { backgroundColor: colors.cardAlt }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        )}
        <View style={styles.titles}>
          <Text style={[typography.h2, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightElement ? (
        rightElement
      ) : rightIcon && onRightPress ? (
        <Pressable
          onPress={onRightPress}
          hitSlop={hitSlop}
          style={[styles.iconBtn, { backgroundColor: colors.cardAlt }]}
        >
          <MaterialCommunityIcons name={rightIcon as never} size={22} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  titles: { flex: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
