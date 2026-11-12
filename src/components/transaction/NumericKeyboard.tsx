import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode } from '../../types/models';
import { currencySymbol, formatCurrency, roundAmount } from '../../utils/currencyFormatter';
import { evaluateExpression, hasOperator, prettyExpression } from '../../utils/mathEvaluator';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';

interface NumericKeyboardProps {
  expression: string;
  currency: CurrencyCode;
  onChangeExpression: (expr: string) => void;
  onDone?: () => void;
}

const KEYS: string[][] = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['000', '0', '.', '+'],
];

export function NumericKeyboard({
  expression,
  currency,
  onChangeExpression,
  onDone,
}: NumericKeyboardProps) {
  const { colors } = useTheme();
  const value = roundAmount(evaluateExpression(expression), currency);
  const showPreview = hasOperator(expression);

  const pressKey = (k: string) => {
    haptics.light();
    const cur = expression === '0' ? '' : expression;
    const isOp = ['+', '-', '×', '÷'].includes(k);
    if (isOp) {
      if (!cur) return;
      const last = cur[cur.length - 1];
      if (['+', '-', '×', '÷', '.'].includes(last)) {
        onChangeExpression(cur.slice(0, -1) + k);
      } else {
        onChangeExpression(cur + k);
      }
      return;
    }
    if (k === '.') {
      const parts = cur.split(/[+\-×÷]/);
      const lastNum = parts[parts.length - 1] ?? '';
      if (lastNum.includes('.')) return;
      onChangeExpression((cur || '0') + '.');
      return;
    }
    onChangeExpression((cur + k).slice(0, 22));
  };

  const backspace = () => {
    haptics.light();
    const next = expression.slice(0, -1);
    onChangeExpression(next || '0');
  };

  const clear = () => {
    haptics.selection();
    onChangeExpression('0');
  };

  const evaluateNow = () => {
    haptics.selection();
    onChangeExpression(String(Math.max(0, value)));
    onDone?.();
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
      <View style={[styles.display, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text
            style={[typography.h1, { color: colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {prettyExpression(expression || '0')}{' '}
            <Text style={[typography.h3, { color: colors.textSecondary }]}>
              {currencySymbol(currency)}
            </Text>
          </Text>
          {showPreview && (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              = {formatCurrency(value, currency)}
            </Text>
          )}
        </View>
        <Pressable onPress={clear} style={[styles.smallBtn, { backgroundColor: colors.cardAlt }]}>
          <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '700' }]}>
            AC
          </Text>
        </Pressable>
        <Pressable onPress={backspace} style={[styles.smallBtn, { backgroundColor: colors.cardAlt }]}>
          <MaterialCommunityIcons name="backspace-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((k) => {
              const isOp = ['+', '-', '×', '÷'].includes(k);
              return (
                <Pressable
                  key={k}
                  onPress={() => pressKey(k)}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: isOp ? colors.primarySoft : colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.h3,
                      { color: isOp ? colors.primaryDark : colors.text, fontWeight: '700' },
                    ]}
                  >
                    {k}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {showPreview && (
        <Pressable
          onPress={evaluateNow}
          style={[styles.equalBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[typography.bodyMedium, { color: '#FFFFFF', fontWeight: '700' }]}>
            Tính = {formatCurrency(value, currency)}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    gap: spacing.sm,
  },
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  smallBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  key: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equalBtn: {
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
});
