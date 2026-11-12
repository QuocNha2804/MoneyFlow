import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import type { CurrencyCode } from '../../types/models';
import type { MonthlyPoint } from '../../services/analyticsService';
import { formatCompact } from '../../utils/currencyFormatter';
import { radius, spacing, typography, useTheme } from '../../theme';

interface LineChartCardProps {
  points: MonthlyPoint[];
  currency: CurrencyCode;
  monthsCount: 6 | 12;
  onToggleMonths: () => void;
}

export function LineChartCard({
  points,
  currency,
  monthsCount,
  onToggleMonths,
}: LineChartCardProps) {
  const { colors } = useTheme();
  const w = 320;
  const h = 165;
  const padL = 42;
  const padR = 14;
  const padT = 16;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const maxVal = Math.max(
    1,
    ...points.map((p) => Math.max(p.income, p.expense)),
  );

  const xOf = (i: number) =>
    points.length <= 1 ? padL + plotW / 2 : padL + (i / (points.length - 1)) * plotW;
  const yOf = (v: number) => padT + plotH - (v / maxVal) * plotH;

  const incomePoly = points.map((p, i) => `${xOf(i)},${yOf(p.income)}`).join(' ');
  const expensePoly = points.map((p, i) => `${xOf(i)},${yOf(p.expense)}`).join(' ');

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[typography.h3, { color: colors.text }]}>Xu hướng Thu vs Chi</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.income }]} />
              <Text style={[typography.small, { color: colors.textSecondary }]}>Thu nhập</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.expense }]} />
              <Text style={[typography.small, { color: colors.textSecondary }]}>Chi tiêu</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={onToggleMonths}
          style={[styles.toggleBtn, { backgroundColor: colors.cardAlt }]}
        >
          <Text style={[typography.small, { color: colors.primary, fontWeight: '700' }]}>
            {monthsCount} tháng
          </Text>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
          {[0, 0.5, 1].map((ratio) => {
            const y = padT + plotH * (1 - ratio);
            return (
              <React.Fragment key={ratio}>
                <Line
                  x1={padL}
                  y1={y}
                  x2={w - padR}
                  y2={y}
                  stroke={colors.divider}
                  strokeDasharray="3 3"
                />
                <SvgText
                  x={padL - 4}
                  y={y + 4}
                  fontSize="9"
                  fill={colors.textMuted}
                  textAnchor="end"
                >
                  {formatCompact(maxVal * ratio, currency)}
                </SvgText>
              </React.Fragment>
            );
          })}

          <Polyline
            fill="none"
            stroke={colors.income}
            strokeWidth="2.5"
            points={incomePoly}
          />
          <Polyline
            fill="none"
            stroke={colors.expense}
            strokeWidth="2.5"
            points={expensePoly}
          />

          {points.map((p, i) => {
            const showLabel = monthsCount === 6 || i % 2 === 0 || i === points.length - 1;
            return (
              <React.Fragment key={p.month}>
                <Circle cx={xOf(i)} cy={yOf(p.income)} r="3.5" fill={colors.income} />
                <Circle cx={xOf(i)} cy={yOf(p.expense)} r="3.5" fill={colors.expense} />
                {showLabel && (
                  <SvgText
                    x={xOf(i)}
                    y={h - 8}
                    fontSize="9.5"
                    fill={colors.textSecondary}
                    textAnchor="middle"
                  >
                    {p.label}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  legendRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.round,
  },
});
