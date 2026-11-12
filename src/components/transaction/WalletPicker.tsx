import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode, Wallet } from '../../types/models';
import { formatCompact } from '../../utils/currencyFormatter';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';

interface WalletPickerProps {
  wallets: Wallet[];
  balances: Record<string, number>;
  currency: CurrencyCode;
  isTransfer: boolean;
  walletId: string;
  toWalletId?: string;
  onChangeWallet: (id: string) => void;
  onChangeToWallet?: (id: string) => void;
}

export function WalletPicker({
  wallets,
  balances,
  currency,
  isTransfer,
  walletId,
  toWalletId,
  onChangeWallet,
  onChangeToWallet,
}: WalletPickerProps) {
  const { colors } = useTheme();

  const renderRow = (
    label: string,
    selected: string | undefined,
    onSelect: (id: string) => void,
    disabledId?: string,
  ) => (
    <View style={styles.block}>
      <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {wallets.map((w) => {
          const active = w.id === selected;
          const disabled = w.id === disabledId;
          return (
            <Pressable
              key={w.id}
              disabled={disabled}
              onPress={() => {
                haptics.selection();
                onSelect(w.id);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? withAlpha(w.color, 0.16) : colors.card,
                  borderColor: active ? w.color : colors.border,
                  opacity: disabled ? 0.4 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons name={w.icon as never} size={18} color={w.color} />
              <View>
                <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
                  {w.name}
                </Text>
                <Text style={[typography.small, { color: colors.textSecondary }]}>
                  {formatCompact(balances[w.id] ?? 0, currency)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {renderRow(isTransfer ? 'Từ Ví nguồn' : 'Nguồn tiền / Ví', walletId, onChangeWallet)}
      {isTransfer && onChangeToWallet
        ? renderRow('Đến Ví đích', toWalletId, onChangeToWallet, walletId)
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  block: { gap: spacing.xs },
  row: { gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
});
