import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TransactionType } from '../../types/models';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';

interface ExpandableFABProps {
  onSelect: (type: TransactionType) => void;
}

const ACTIONS: { type: TransactionType; label: string; icon: string; colorKey: 'expense' | 'income' | 'transfer' }[] = [
  { type: 'transfer', label: 'Chuyển khoản giữa các ví', icon: 'swap-horizontal', colorKey: 'transfer' },
  { type: 'income', label: 'Thêm Thu nhập', icon: 'plus-circle-outline', colorKey: 'income' },
  { type: 'expense', label: 'Thêm Chi tiêu', icon: 'minus-circle-outline', colorKey: 'expense' },
];

export function ExpandableFAB({ onSelect }: ExpandableFABProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const toggle = () => {
    haptics.light();
    const next = !open;
    setOpen(next);
    progress.value = next ? withSpring(1, { damping: 14, stiffness: 160 }) : withTiming(0, { duration: 180 });
  };

  const handleSelect = (type: TransactionType) => {
    haptics.selection();
    setOpen(false);
    progress.value = withTiming(0, { duration: 150 });
    onSelect(type);
  };

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 45}deg` }],
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 20 }, { scale: 0.9 + progress.value * 0.1 }],
  }));

  return (
    <>
      {open && <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={toggle} />}
      <View style={styles.container} pointerEvents="box-none">
        {open && (
          <Animated.View style={[styles.menu, menuStyle]}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.type}
                onPress={() => handleSelect(a.type)}
                style={[styles.actionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
                  {a.label}
                </Text>
                <View style={[styles.actionIcon, { backgroundColor: colors[a.colorKey] }]}>
                  <MaterialCommunityIcons name={a.icon as never} size={20} color="#FFFFFF" />
                </View>
              </Pressable>
            ))}
          </Animated.View>
        )}

        <Pressable
          onPress={toggle}
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <Animated.View style={rotateStyle}>
            <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
  },
  container: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    alignItems: 'flex-end',
    zIndex: 30,
  },
  menu: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: radius.round,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
});
