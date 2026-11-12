import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode } from '../../types/models';
import { formatCurrency } from '../../utils/currencyFormatter';
import { haptics } from '../../utils/haptics';
import { hitSlop, radius, spacing, typography, useTheme } from '../../theme';

interface BalanceCardProps {
  netWorth: number;
  monthIncome: number;
  monthExpense: number;
  expenseChangePercent: number | null;
  currency: CurrencyCode;
  hideBalance: boolean;
  onToggleHide: () => void;
}

/** Hook chạy số đếm lên mượt (Count-up animation) */
function useCountUp(target: number, duration = 450): number {
  const [val, setVal] = useState(target);
  useEffect(() => {
    const start = val;
    const diff = target - start;
    if (Math.abs(diff) < 0.01) {
      setVal(target);
      return;
    }
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(start + diff * eased);
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export function BalanceCard({
  netWorth,
  monthIncome,
  monthExpense,
  expenseChangePercent,
  currency,
  hideBalance,
  onToggleHide,
}: BalanceCardProps) {
  const { colors } = useTheme();
  const animNetWorth = useCountUp(netWorth);
  const cashflow = monthIncome - monthExpense;

  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name="bank-outline" size={16} color="rgba(255,255,255,0.85)" />
          <Text style={styles.topLabel}>Tổng tài sản hiện có</Text>
        </View>
        <Pressable
          onPress={() => {
            haptics.selection();
            onToggleHide();
          }}
          hitSlop={hitSlop}
          style={styles.eyeBtn}
        >
          <MaterialCommunityIcons
            name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <Text style={styles.netWorth} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(animNetWorth, currency, { hidden: hideBalance })}
      </Text>

      <View style={styles.cashflowRow}>
        <View style={styles.cashflowPill}>
          <Text style={styles.cashflowLabel}>Dòng tiền tháng:</Text>
          <Text style={styles.cashflowValue}>
            {formatCurrency(cashflow, currency, { hidden: hideBalance, sign: 'always' })}
          </Text>
        </View>
        {expenseChangePercent != null && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor:
                  expenseChangePercent <= 0 ? 'rgba(255,255,255,0.22)' : 'rgba(239,68,68,0.35)',
              },
            ]}
          >
            <Text style={styles.trendText}>
              {expenseChangePercent > 0 ? '▲' : '▼'} {Math.abs(Math.round(expenseChangePercent))}% vs tháng trước
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(74, 222, 128, 0.25)' }]}>
            <MaterialCommunityIcons name="arrow-down-left" size={18} color="#86EFAC" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Tổng thu tháng</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {formatCurrency(monthIncome, currency, { hidden: hideBalance })}
            </Text>
          </View>
        </View>

        <View style={styles.vDivider} />

        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(248, 113, 113, 0.28)' }]}>
            <MaterialCommunityIcons name="arrow-up-right" size={18} color="#FCA5A5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Tổng chi tháng</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {formatCurrency(monthExpense, currency, { hidden: hideBalance })}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#0F3D22',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  decorCircle1: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    left: -20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '600',
  },
  eyeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  netWorth: {
    ...typography.hero,
    color: '#FFFFFF',
    marginTop: 4,
  },
  cashflowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cashflowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  cashflowLabel: { ...typography.small, color: 'rgba(255,255,255,0.8)' },
  cashflowValue: { ...typography.small, color: '#FFFFFF', fontWeight: '700' },
  trendBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  trendText: { ...typography.small, color: '#FFFFFF', fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginVertical: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginHorizontal: spacing.md,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { ...typography.small, color: 'rgba(255,255,255,0.78)' },
  statValue: { ...typography.bodyMedium, color: '#FFFFFF', fontWeight: '700' },
});
