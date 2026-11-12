import React, { useEffect } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGoalStore } from '../../store';
import { palette, radius, spacing, typography, useTheme } from '../../theme';
import { CustomButton } from '../common/CustomButton';

const { width, height } = Dimensions.get('window');
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: ((i * 47) % 100) * (width / 100),
  delay: (i % 7) * 90,
  color: palette[i % palette.length],
  size: 8 + (i % 5) * 2,
}));

function ConfettiPiece({ x, delay, color, size }: { x: number; delay: number; color: string; size: number }) {
  const y = useSharedValue(-30);
  const rot = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withTiming(height + 40, { duration: 2400, easing: Easing.out(Easing.quad) }),
    );
    rot.value = withDelay(delay, withTiming(360 * 3, { duration: 2400 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x }, { translateY: y.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size * 1.6,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function ConfettiOverlay() {
  const { colors } = useTheme();
  const goalName = useGoalStore((s) => s.confettiGoalName);
  const dismiss = useGoalStore((s) => s.dismissConfetti);

  if (!goalName) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={dismiss}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {PIECES.map((p) => (
            <ConfettiPiece key={p.id} x={p.x} delay={p.delay} color={p.color} size={p.size} />
          ))}
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.trophy, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="trophy-award" size={44} color={colors.primary} />
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
            🎉 Chúc mừng hoàn thành!
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            Bạn đã đạt 100% mục tiêu{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>“{goalName}”</Text>. Sự kỷ
            luật tài chính của bạn thật tuyệt vời!
          </Text>
          <CustomButton title="Tuyệt vời!" onPress={dismiss} style={{ width: '100%' }} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  trophy: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
