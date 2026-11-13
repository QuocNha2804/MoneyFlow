import React from 'react';
import { Pressable, ScrollView, Switch, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RecurringFrequency } from '../../types/models';
import type { MainStackScreenProps } from '../../types/navigation';
import { formatCurrency } from '../../utils/currencyFormatter';
import { formatDisplayDate } from '../../utils/dateHelpers';
import {
  useCurrentUser,
  useRecurringStore,
  useUserCategories,
  useUserRecurring,
  useUserWallets,
} from '../../store';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { Header } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  yearly: 'Hàng năm',
};

export function RecurringListScreen({ navigation }: MainStackScreenProps<'RecurringList'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const list = useUserRecurring();
  const categories = useUserCategories(undefined, true);
  const wallets = useUserWallets(true);
  const toggleActive = useRecurringStore((s) => s.toggleActive);
  const removeRecurring = useRecurringStore((s) => s.removeRecurring);

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header
        title="Giao dịch định kỳ"
        subtitle="Tự động sinh bù khi bạn mở ứng dụng"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {list.length === 0 ? (
          <EmptyState
            icon="autorenew"
            title="Chưa có giao dịch định kỳ"
            description="Khi thêm giao dịch (VD: Tiền nhà, Lương, Spotify...), hãy chọn mục 'Lặp lại định kỳ' để hệ thống tự động ghi chép."
            actionLabel="Tạo giao dịch định kỳ"
            onAction={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          />
        ) : (
          list.map((r) => {
            const cat = categories.find((c) => c.id === r.template.categoryId);
            const wallet = wallets.find((w) => w.id === r.template.walletId);
            const color = cat?.color ?? colors.primary;
            return (
              <View
                key={r.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.topRow}>
                  <View style={[styles.iconBox, { backgroundColor: withAlpha(color, 0.16) }]}>
                    <MaterialCommunityIcons
                      name={(cat?.icon ?? 'autorenew') as never}
                      size={22}
                      color={color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                      {r.template.note || cat?.name || 'Giao dịch định kỳ'}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {FREQ_LABEL[r.frequency]} • Ví: {wallet?.name ?? '—'}
                    </Text>
                  </View>
                  <Switch
                    value={r.active}
                    onValueChange={() => toggleActive(r.id)}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={r.active ? colors.primary : '#f4f3f4'}
                  />
                </View>

                <View style={styles.bottomRow}>
                  <View>
                    <Text
                      style={[
                        typography.h3,
                        {
                          color: r.template.type === 'income' ? colors.income : colors.expense,
                        },
                      ]}
                    >
                      {formatCurrency(r.template.amount, user.currency)}
                    </Text>
                    <Text style={[typography.small, { color: colors.textSecondary }]}>
                      Lần chạy tiếp theo: {formatDisplayDate(r.nextRunDate)}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeRecurring(r.id)} style={styles.delBtn}>
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  delBtn: { padding: 6 },
});
