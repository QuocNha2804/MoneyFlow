import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Wallet, WalletType } from '../../types/models';
import type { MainStackScreenProps } from '../../types/navigation';
import { WALLET_TYPES } from '../../utils/categoryTemplates';
import { currencySymbol, formatCurrency, parseAmountInput } from '../../utils/currencyFormatter';
import { computeWalletBalances } from '../../utils/transactionHelpers';
import {
  useCurrentUser,
  useUserTransactions,
  useUserWallets,
  useWalletStore,
} from '../../store';
import { haptics } from '../../utils/haptics';
import { palette, radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';

export function ManageWalletsScreen({ navigation }: MainStackScreenProps<'ManageWallets'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const wallets = useUserWallets(true);
  const transactions = useUserTransactions();

  const addWallet = useWalletStore((s) => s.addWallet);
  const updateWallet = useWalletStore((s) => s.updateWallet);
  const toggleArchive = useWalletStore((s) => s.toggleArchive);
  const adjustBalance = useWalletStore((s) => s.adjustBalance);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [icon, setIcon] = useState('cash');
  const [color, setColor] = useState(palette[0]);
  const [balanceText, setBalanceText] = useState('0');
  const [includeInTotal, setIncludeInTotal] = useState(true);

  const balances = useMemo(
    () => computeWalletBalances(wallets, transactions),
    [wallets, transactions],
  );

  if (!user) return null;

  const openAdd = () => {
    setEditing(null);
    setName('');
    setType('bank');
    setIcon('bank');
    setColor(palette[6]);
    setBalanceText('0');
    setIncludeInTotal(true);
    setShowModal(true);
  };

  const openEdit = (w: Wallet) => {
    setEditing(w);
    setName(w.name);
    setType(w.type);
    setIcon(w.icon);
    setColor(w.color);
    setBalanceText(String(balances[w.id] ?? w.initialBalance));
    setIncludeInTotal(w.includeInTotal);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const enteredBalance = parseAmountInput(balanceText, user.currency);
    if (editing) {
      updateWallet(editing.id, {
        name: name.trim(),
        type,
        icon,
        color,
        includeInTotal,
      });
      const currentBal = balances[editing.id] ?? editing.initialBalance;
      if (Math.abs(enteredBalance - currentBal) > 0.001) {
        adjustBalance(editing.id, currentBal, enteredBalance);
      }
    } else {
      addWallet({
        userId: user.id,
        name: name.trim(),
        type,
        initialBalance: enteredBalance,
        icon,
        color,
        includeInTotal,
      });
    }
    haptics.success();
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header
        title="Quản lý Ví & Nguồn tiền"
        onBack={() => navigation.goBack()}
        rightIcon="plus"
        onRightPress={openAdd}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {wallets.map((w) => {
          const bal = balances[w.id] ?? 0;
          return (
            <Pressable
              key={w.id}
              onPress={() => openEdit(w)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: w.archived ? 0.55 : 1,
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: withAlpha(w.color, 0.16) }]}>
                <MaterialCommunityIcons name={w.icon as never} size={24} color={w.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                    {w.name}
                  </Text>
                  {!w.includeInTotal && (
                    <Text style={[typography.small, { color: colors.textMuted }]}>
                      (Không cộng tổng)
                    </Text>
                  )}
                  {w.archived && (
                    <Text style={[typography.small, { color: colors.orange }]}>Đã ẩn</Text>
                  )}
                </View>
                <Text style={[typography.h3, { color: bal < 0 ? colors.danger : colors.primary }]}>
                  {formatCurrency(bal, user.currency)}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  haptics.selection();
                  toggleArchive(w.id);
                }}
                style={styles.archiveBtn}
              >
                <MaterialCommunityIcons
                  name={w.archived ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </Pressable>
          );
        })}

        <CustomButton title="Thêm Ví mới" icon="plus" onPress={openAdd} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowModal(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[typography.h2, { color: colors.text }]}>
              {editing ? 'Chỉnh sửa Ví' : 'Thêm Ví mới'}
            </Text>

            <Text style={[typography.label, { color: colors.text }]}>Tên Ví</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="VD: Vietcombank, MoMo, Thẻ tín dụng..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />

            <Text style={[typography.label, { color: colors.text }]}>Loại Ví</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
              {WALLET_TYPES.map((wt) => {
                const active = type === wt.key;
                return (
                  <Pressable
                    key={wt.key}
                    onPress={() => {
                      setType(wt.key);
                      setIcon(wt.icon);
                    }}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: active ? colors.primary : colors.cardAlt,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={wt.icon as never}
                      size={16}
                      color={active ? '#FFFFFF' : colors.text}
                    />
                    <Text
                      style={[
                        typography.small,
                        { color: active ? '#FFFFFF' : colors.text, fontWeight: '700' },
                      ]}
                    >
                      {wt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[typography.label, { color: colors.text }]}>
              {editing ? 'Điều chỉnh số dư thực tế' : 'Số dư khởi điểm'} ({currencySymbol(user.currency)})
            </Text>
            <TextInput
              value={balanceText}
              onChangeText={setBalanceText}
              keyboardType="numeric"
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.primary, borderColor: colors.border, fontWeight: '700' }]}
            />

            <Text style={[typography.label, { color: colors.text }]}>Màu sắc</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {palette.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setColor(p)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: p, borderWidth: color === p ? 3 : 0, borderColor: colors.text },
                  ]}
                />
              ))}
            </ScrollView>

            <View style={styles.switchRow}>
              <Text style={[typography.bodyMedium, { color: colors.text, flex: 1 }]}>
                Cộng vào Tổng tài sản trên Home
              </Text>
              <Switch
                value={includeInTotal}
                onValueChange={setIncludeInTotal}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={includeInTotal ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <CustomButton title="Hủy" variant="outline" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
              <CustomButton title="Lưu Ví" onPress={handleSave} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  archiveBtn: { padding: 6 },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 410,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.round,
  },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
