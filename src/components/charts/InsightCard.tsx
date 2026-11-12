import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { InsightItem } from '../../services/analyticsService';
import { radius, spacing, typography, useTheme } from '../../theme';

interface InsightCardProps {
  insights: InsightItem[];
}

export function InsightCard({ insights }: InsightCardProps) {
  const { colors } = useTheme();
  if (!insights.length) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="auto-fix" size={18} color={colors.primary} />
        <Text style={[typography.h3, { color: colors.text }]}>Nhận xét thông minh</Text>
      </View>
      {insights.map((ins) => {
        const bg =
          ins.type === 'warning'
            ? colors.warningSoft
            : ins.type === 'success'
              ? colors.incomeSoft
              : colors.primarySoft;
        const fg =
          ins.type === 'warning'
            ? colors.orange
            : ins.type === 'success'
              ? colors.income
              : colors.primary;
        return (
          <View key={ins.id} style={[styles.item, { backgroundColor: bg }]}>
            <MaterialCommunityIcons name={ins.icon as never} size={20} color={fg} />
            <Text style={[typography.caption, { color: colors.text, flex: 1, fontWeight: '500' }]}>
              {ins.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
