import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode } from '../../types/models';
import type { CategorySlice } from '../../services/analyticsService';
import { formatCompact, formatCurrency } from '../../utils/currencyFormatter';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';

interface PieChartCardProps {
  slices: CategorySlice[];
  currency: CurrencyCode;
  type: 'expense' | 'income';
  onChangeType: (t: 'expense' | 'income') => void;
}

export function PieChartCard({ slices, currency, type, onChangeType }: PieChartCardProps) {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const total = slices.reduce((s, x) => s + x.amount, 0);
  const activeSlice = slices.find((s) => s.categoryId === selectedId);

  const size = 164;
  const strokeWidth = 24;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  let acc = 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.text }]}>Cơ cấu theo danh mục</Text>
        <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
          {(['expense', 'income'] as const).map((t) => {
            const active = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  haptics.selection();
                  setSelectedId(null);
                  onChangeType(t);
                }}
                style={[
                  styles.segBtn,
                  active && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    typography.small,
                    { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                  ]}
                >
                  {t === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {total <= 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="chart-donut" size={38} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Chưa có dữ liệu trong kỳ này
          </Text>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.chartWrap}>
            <Svg width={size} height={size}>
              <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={colors.cardAlt}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {slices.map((s) => {
                  const pct = s.amount / total;
                  const len = pct * c;
                  const offset = -acc * c;
                  acc += pct;
                  const isSel = selectedId === s.categoryId;
                  return (
                    <Circle
                      key={s.categoryId}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      stroke={s.color}
                      strokeWidth={isSel ? strokeWidth + 5 : strokeWidth}
                      strokeDasharray={`${Math.max(1, len - 2)} ${c}`}
                      strokeDashoffset={offset}
                      fill="none"
                      onPress={() => {
                        haptics.selection();
                        setSelectedId(isSel ? null : s.categoryId);
                      }}
                    />
                  );
                })}
              </G>
            </Svg>
            <View style={styles.centerText} pointerEvents="none">
              <Text style={[typography.small, { color: colors.textSecondary }]} numberOfLines={1}>
                {activeSlice ? activeSlice.name : type === 'expense' ? 'Tổng chi' : 'Tổng thu'}
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '800' }]} numberOfLines={1}>
                {formatCompact(activeSlice ? activeSlice.amount : total, currency)}
              </Text>
              {activeSlice && (
                <Text style={[typography.small, { color: activeSlice.color, fontWeight: '700' }]}>
                  {Math.round(activeSlice.percent)}%
                </Text>
              )}
            </View>
          </View>

          <View style={styles.legend}>
            {slices.slice(0, 6).map((s) => {
              const isSel = selectedId === s.categoryId;
              return (
                <Pressable
                  key={s.categoryId}
                  onPress={() => {
                    haptics.selection();
                    setSelectedId(isSel ? null : s.categoryId);
                  }}
                  style={[
                    styles.legendRow,
                    isSel && { backgroundColor: withAlpha(s.color, 0.12) },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <Text style={[typography.caption, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '700' }]}>
                    {Math.round(s.percent)}%
                  </Text>
                  <Text style={[typography.caption, { color: colors.text, fontWeight: '700', minWidth: 68, textAlign: 'right' }]}>
                    {formatCompact(s.amount, currency)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {activeSlice && (
        <View style={[styles.detailBar, { backgroundColor: colors.cardAlt }]}>
          <MaterialCommunityIcons name={activeSlice.icon as never} size={18} color={activeSlice.color} />
          <Text style={[typography.caption, { color: colors.text, flex: 1 }]}>
            {activeSlice.name}:{' '}
            <Text style={{ fontWeight: '700' }}>
              {formatCurrency(activeSlice.amount, currency)}
            </Text>{' '}
            ({activeSlice.percent.toFixed(1)}%)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.round,
    padding: 3,
  },
  segBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.round,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  body: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  chartWrap: {
    width: 164,
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 96,
  },
  legend: { flex: 1, minWidth: 165, gap: 4 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  detailBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
});
