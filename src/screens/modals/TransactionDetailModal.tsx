import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MainStackScreenProps } from '../../types/navigation';
import { formatCurrency } from '../../utils/currencyFormatter';
import { formatDisplayDate } from '../../utils/dateHelpers';
import { deleteTransactionFlow } from '../../services/transactionActions';
import {
  useCurrentUser,
  useUserCategories,
  useUserGoals,
  useUserTransactions,
  useUserWallets,
} from '../../store';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export function TransactionDetailModal({
  navigation,
  route,
}: MainStackScreenProps<'TransactionDetail'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const transactions = useUserTransactions();
  const categories = useUserCategories(undefined, true);
  const wallets = useUserWallets(true);
  const goals = useUserGoals();

  const [zoomImage, setZoomImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tx = transactions.find((t) => t.id === route.params.transactionId);
  if (!user || !tx) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Header title="Chi tiết giao dịch" onBack={() => navigation.goBack()} />
        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Giao dịch không còn tồn tại.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cat = categories.find((c) => c.id === tx.categoryId);
  const wallet = wallets.find((w) => w.id === tx.walletId);
  const toWallet = wallets.find((w) => w.id === tx.toWalletId);
  const goal = goals.find((g) => g.id === tx.goalId);

  const isTransfer = tx.type === 'transfer';
  const mainColor =
    tx.type === 'income' ? colors.income : tx.type === 'expense' ? colors.expense : colors.transfer;
  const prefix = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header title="Chi tiết giao dịch" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: withAlpha(cat?.color ?? mainColor, 0.16) },
            ]}
          >
            <MaterialCommunityIcons
              name={(isTransfer ? 'swap-horizontal' : cat?.icon ?? 'cash') as never}
              size={32}
              color={cat?.color ?? mainColor}
            />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {isTransfer ? 'Chuyển khoản giữa các ví' : cat?.name ?? 'Danh mục'}
          </Text>
          <Text style={[typography.hero, { color: mainColor }]}>
            { `${prefix}${formatCurrency(tx.amount, user.currency, { sign: 'never' })}` }
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {formatDisplayDate(tx.date, true)} • {tx.time}
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow
            label={isTransfer ? 'Từ Ví nguồn' : 'Nguồn tiền / Ví'}
            value={wallet?.name ?? '—'}
            icon={wallet?.icon ?? 'wallet-outline'}
          />
          {isTransfer && (
            <InfoRow
              label="Đến Ví đích"
              value={toWallet?.name ?? '—'}
              icon={toWallet?.icon ?? 'wallet-outline'}
            />
          )}
          {goal && (
            <InfoRow
              label="Mục tiêu liên kết"
              value={goal.name}
              icon={goal.icon}
            />
          )}
          {tx.note ? <InfoRow label="Ghi chú" value={tx.note} icon="text" /> : null}
          {tx.tags && tx.tags.length > 0 ? (
            <InfoRow label="Hashtags" value={tx.tags.join('  ')} icon="pound" />
          ) : null}
        </View>

        {tx.receiptUri ? (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
              Ảnh hóa đơn (chạm để phóng to)
            </Text>
            <Pressable onPress={() => setZoomImage(true)}>
              <Image
                source={{ uri: tx.receiptUri }}
                style={styles.receipt}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.actions}>
          <CustomButton
            title="Sửa giao dịch"
            icon="pencil-outline"
            variant="secondary"
            onPress={() => {
              navigation.replace('AddTransaction', { transactionId: tx.id });
            }}
            style={{ flex: 1 }}
          />
          <CustomButton
            title="Xóa"
            icon="trash-can-outline"
            variant="danger"
            onPress={() => setConfirmDelete(true)}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>

      <Modal visible={zoomImage} transparent animationType="fade" onRequestClose={() => setZoomImage(false)}>
        <Pressable style={styles.zoomBackdrop} onPress={() => setZoomImage(false)}>
          {tx.receiptUri ? (
            <Image source={{ uri: tx.receiptUri }} style={styles.zoomImg} resizeMode="contain" />
          ) : null}
          <View style={styles.closeZoom}>
            <MaterialCommunityIcons name="close-circle" size={36} color="#FFFFFF" />
          </View>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={confirmDelete}
        title="Xóa giao dịch này?"
        message="Số dư ví, ngân sách tháng và tiến độ mục tiêu sẽ được tự động cập nhật lại."
        confirmText="Xóa"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteTransactionFlow(tx.id);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <MaterialCommunityIcons name={icon as never} size={18} color={colors.primary} />
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  infoCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  receipt: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  zoomImg: { width: '100%', height: '85%' },
  closeZoom: { position: 'absolute', top: 48, right: 24 },
});
