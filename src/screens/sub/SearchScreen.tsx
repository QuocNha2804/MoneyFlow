import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TransactionType } from '../../types/models';
import type { MainStackScreenProps } from '../../types/navigation';
import { formatCurrency, parseAmountInput } from '../../utils/currencyFormatter';
import { filterTransactions, sortTransactionsDesc } from '../../utils/transactionHelpers';
import { deleteTransactionFlow } from '../../services/transactionActions';
import {
  useCurrentUser,
  useUserCategories,
  useUserTransactions,
  useUserWallets,
} from '../../store';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { Header } from '../../components/common/Header';
import { TransactionCard } from '../../components/home/TransactionCard';

export function SearchScreen({ navigation, route }: MainStackScreenProps<'Search'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const transactions = useUserTransactions();
  const categories = useUserCategories(undefined, true);
  const wallets = useUserWallets(true);

  const [keyword, setKeyword] = useState(route.params?.tag ?? '');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  const results = useMemo(() => {
    if (!user) return [];
    const minAmount = minText.trim() ? parseAmountInput(minText, user.currency) : undefined;
    const maxAmount = maxText.trim() ? parseAmountInput(maxText, user.currency) : undefined;
    const isHashtag = keyword.trim().startsWith('#');
    return sortTransactionsDesc(
      filterTransactions(
        transactions,
        {
          type,
          keyword: isHashtag ? undefined : keyword,
          tag: isHashtag ? keyword.trim() : undefined,
          minAmount,
          maxAmount,
          categoryIds: selectedCats.length ? selectedCats : undefined,
          walletIds: selectedWallets.length ? selectedWallets : undefined,
        },
        categories,
        wallets,
      ),
    );
  }, [user, transactions, type, keyword, minText, maxText, selectedCats, selectedWallets, categories, wallets]);

  const totalSum = useMemo(
    () => results.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    [results],
  );

  if (!user) return null;

  const toggleIn = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header
        title="Tìm kiếm nâng cao"
        onBack={() => navigation.goBack()}
        rightIcon="tune-variant"
        onRightPress={() => setShowFilters((v) => !v)}
      />

      <View style={styles.topArea}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm ghi chú, danh mục hoặc #hashtag..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {keyword ? (
            <Pressable onPress={() => setKeyword('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {showFilters && (
          <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.typeRow}>
              {(
                [
                  { key: 'all', label: 'Tất cả' },
                  { key: 'expense', label: 'Chi tiêu' },
                  { key: 'income', label: 'Thu nhập' },
                  { key: 'transfer', label: 'Chuyển khoản' },
                ] as const
              ).map((t) => {
                const active = type === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setType(t.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.cardAlt,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.small,
                        { color: active ? '#FFFFFF' : colors.text, fontWeight: '700' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '700' }]}>
              Khoảng số tiền
            </Text>
            <View style={styles.rangeRow}>
              <TextInput
                value={minText}
                onChangeText={setMinText}
                keyboardType="numeric"
                placeholder="Từ số tiền"
                placeholderTextColor={colors.textMuted}
                style={[styles.rangeInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              />
              <Text style={{ color: colors.textSecondary }}>—</Text>
              <TextInput
                value={maxText}
                onChangeText={setMaxText}
                keyboardType="numeric"
                placeholder="Đến số tiền"
                placeholderTextColor={colors.textMuted}
                style={[styles.rangeInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              />
            </View>

            <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '700' }]}>
              Lọc theo Ví
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {wallets.map((w) => {
                const active = selectedWallets.includes(w.id);
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => setSelectedWallets((p) => toggleIn(p, w.id))}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? withAlpha(w.color, 0.2) : colors.cardAlt,
                        borderColor: active ? w.color : 'transparent',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text style={[typography.small, { color: colors.text, fontWeight: '600' }]}>
                      {w.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[typography.small, { color: colors.textSecondary, fontWeight: '700' }]}>
              Lọc theo Danh mục
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {categories.map((c) => {
                const active = selectedCats.includes(c.id);
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedCats((p) => toggleIn(p, c.id))}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? withAlpha(c.color, 0.2) : colors.cardAlt,
                        borderColor: active ? c.color : 'transparent',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text style={[typography.small, { color: colors.text, fontWeight: '600' }]}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.summaryBar}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Tìm thấy <Text style={{ fontWeight: '700', color: colors.text }}>{results.length}</Text>{' '}
            giao dịch
          </Text>
          <Text
            style={[
              typography.caption,
              {
                color: totalSum >= 0 ? colors.income : colors.expense,
                fontWeight: '700',
              },
            ]}
          >
            Tổng ròng: {formatCurrency(totalSum, user.currency, { sign: 'always' })}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        <FlashList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: spacing.xs }}>
              <TransactionCard
                transaction={item}
                category={item.categoryId ? catMap.get(item.categoryId) : undefined}
                wallet={walletMap.get(item.walletId)}
                toWallet={item.toWalletId ? walletMap.get(item.toWalletId) : undefined}
                currency={user.currency}
                onPress={() =>
                  navigation.navigate('TransactionDetail', { transactionId: item.id })
                }
                onEdit={() =>
                  navigation.navigate('AddTransaction', { transactionId: item.id })
                }
                onDelete={() => deleteTransactionFlow(item.id)}
                onTagPress={(tg) => setKeyword(tg)}
              />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topArea: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  searchInput: { flex: 1, ...typography.body },
  filterPanel: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
  },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    ...typography.caption,
  },
  hRow: { gap: 6, paddingVertical: 2 },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
