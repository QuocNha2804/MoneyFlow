import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode, QuickTemplate } from '../../types/models';
import { formatCompact } from '../../utils/currencyFormatter';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';

interface QuickTemplateBarProps {
  templates: QuickTemplate[];
  currency: CurrencyCode;
  /** Bấm 1 chạm để ghi nhận ngay giao dịch */
  onQuickCreate: (tpl: QuickTemplate) => void;
  /** Nhấn giữ để mở form đã điền sẵn */
  onPrefillOpen: (tpl: QuickTemplate) => void;
}

export function QuickTemplateBar({
  templates,
  currency,
  onQuickCreate,
  onPrefillOpen,
}: QuickTemplateBarProps) {
  const { colors } = useTheme();
  if (!templates.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={17} color={colors.primary} />
          <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
            Nhập nhanh 1 chạm
          </Text>
        </View>
        <Text style={[typography.small, { color: colors.textMuted }]}>
          Chạm ghi ngay • Giữ để chỉnh
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {templates.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onQuickCreate(t)}
            onLongPress={() => onPrefillOpen(t)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: colors.card,
                borderColor: withAlpha(t.color, 0.35),
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.chipIcon, { backgroundColor: withAlpha(t.color, 0.16) }]}>
              <MaterialCommunityIcons name={t.icon as never} size={16} color={t.color} />
            </View>
            <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
              {t.title}
            </Text>
            <Text style={[typography.caption, { color: t.color, fontWeight: '700' }]}>
              {formatCompact(t.amount, currency)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
