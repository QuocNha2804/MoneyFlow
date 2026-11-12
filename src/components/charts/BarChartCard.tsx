import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import type { CurrencyCode } from '../../types/models';
import type { DailyBarPoint } from '../../services/analyticsService';
import { formatCompact, formatCurrency } from '../../utils/currencyFormatter';
import { todayKey } from '../../utils/dateHelpers';
import { radius, spacing, typography, useTheme } from '../../theme';

interface BarChartCardProps {
  bars: DailyBarPoint[];
  average: number;
  currency: CurrencyCode;
}

export function BarChartCard({ bars, average, currency }: BarChartCardProps) {
  const { colors } = useTheme();
  const today = todayKey();
  const w = 320;
  const h = 155;
  const padL = 16;
  const padR = 16;
  const padT = 18;
  const padB = 26;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const maxVal = Math.max(1, ...bars.map((b) => b.amount), average);
  const avgY = padT + plotH - (average / maxVal) * plotH;
  const slotW = plotW / Math.max(1, bars.length);
  const barW = Math.min(24, slotW * 0.55);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.text }]}>Chi tiêu 7 ngày trong tuần</Text>
        <Text style={[typography.small, { color: colors.textSecondary }]}>
          TB: {formatCurrency(average, currency)}/ngày
        </Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
          <Line
            x1={padL}
            y1={padT + plotH}
            x2={w - padR}
            y2={padT + plotH}
            stroke={colors.divider}
          />
          {average > 0 && (
            <Line
              x1={padL}
              y1={avgY}
              x2={w - padR}
              y2={avgY}
              stroke={colors.warning}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}

          {bars.map((b, i) => {
            const bh = Math.max(3, (b.amount / maxVal) * plotH);
            const x = padL + i * slotW + (slotW - barW) / 2;
            const y = padT + plotH - bh;
            const isToday = b.date === today;
            return (
              <React.Fragment key={b.date}>
                <Rect
                  x={x}
                  y={y}
                  width={barW}
                  height={bh}
                  rx={6}
                  fill={isToday ? colors.primary : b.amount > average && average > 0 ? colors.orange : colors.primaryLight}
                />
                {b.amount > 0 && (
                  <SvgText
                    x={x + barW / 2}
                    y={Math.max(11, y - 4)}
                    fontSize="8.5"
                    fill={colors.textSecondary}
                    textAnchor="middle"
                  >
                    {formatCompact(b.amount, currency)}
                  </SvgText>
                )}
                <SvgText
                  x={x + barW / 2}
                  y={h - 7}
                  fontSize="10"
                  fontWeight={isToday ? 'bold' : 'normal'}
                  fill={isToday ? colors.primary : colors.textSecondary}
                  textAnchor="middle"
                >
                  {b.label}
                </SvgText>
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
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
