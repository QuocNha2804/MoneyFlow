import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode, Wallet } from '../../types/models';
import { formatCurrency } from '../../utils/currencyFormatter';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';

interface WalletHorizontalListProps {
  wallets: Wallet[];
  balances: Record<string, number>;
  currency: CurrencyCode;
  hideBalance: boolean;
  onManagePress: () => void;
  onWalletPress?: (wallet: Wallet) => void;
}

export function WalletHorizontalList({
  wallets,
  balances,
  currency,
  hideBalance,
  onManagePress,
  onWalletPress,
}: WalletHorizontalListProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[typography.h3, { color: colors.text }]}>Ví & Nguồn tiền</Text>
        <Pressable onPress={onManagePress} style={styles.manageBtn}>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            Quản lý Ví
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {wallets.map((w) => {
          const bal = balances[w.id] ?? 0;
          return (
            <Pressable
              key={w.id}
              onPress={() => (onWalletPress ? onWalletPress(w) : onManagePress())}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: withAlpha(w.color, 0.16) }]}>
                  <MaterialCommunityIcons name={w.icon as never} size={20} color={w.color} />
                </View>
                {!w.includeInTotal && (
                  <MaterialCommunityIcons name="eye-off-outline" size={14} color={colors.textMuted} />
                )}
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {w.name}
              </Text>
              <Text
                style={[
                  typography.bodyMedium,
                  { color: bal < 0 ? colors.danger : colors.text, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {formatCurrency(bal, currency, { hidden: hideBalance })}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onManagePress}
          style={[
            styles.addCard,
            { borderColor: colors.primary, backgroundColor: colors.primarySoft },
          ]}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.primaryDark, fontWeight: '700' }]}>
            Thêm Ví
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  scroll: { gap: spacing.sm, paddingRight: spacing.md },
  card: {
    minWidth: 145,
    maxWidth: 180,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    minWidth: 100,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
