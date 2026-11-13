import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CurrencyCode } from '../../types/models';
import { CURRENCIES, defaultRate, ratePair } from '../../utils/currencyFormatter';
import { switchCurrency } from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';

interface CurrencySwitchModalProps {
  visible: boolean;
  currentCurrency: CurrencyCode;
  onClose: () => void;
}

export function CurrencySwitchModal({
  visible,
  currentCurrency,
  onClose,
}: CurrencySwitchModalProps) {
  const { colors } = useTheme();
  const [target, setTarget] = useState<CurrencyCode>(currentCurrency === 'VND' ? 'USD' : 'VND');
  const [mode, setMode] = useState<'symbol' | 'convert'>('symbol');
  const [rateText, setRateText] = useState('25400');

  useEffect(() => {
    const next = currentCurrency === 'VND' ? 'USD' : 'VND';
    setTarget(next);
    setRateText(String(defaultRate(currentCurrency, next)));
  }, [currentCurrency, visible]);

  const pair = ratePair(currentCurrency, target);

  const handleSelectTarget = (code: CurrencyCode) => {
    if (code === currentCurrency) return;
    setTarget(code);
    setRateText(String(defaultRate(currentCurrency, code)));
  };

  const handleConfirm = () => {
    const r = parseFloat(rateText.replace(/,/g, '')) || defaultRate(currentCurrency, target);
    switchCurrency(target, mode === 'convert', r);
    haptics.success();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[typography.h2, { color: colors.text }]}>Chuyển đổi tiền tệ</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Đơn vị hiện tại: <Text style={{ fontWeight: '700' }}>{currentCurrency}</Text>. Chọn đơn
            vị muốn chuyển sang:
          </Text>

          <View style={styles.currencyRow}>
            {CURRENCIES.filter((c) => c.code !== currentCurrency).map((c) => {
              const active = target === c.code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => handleSelectTarget(c.code)}
                  style={[
                    styles.currBtn,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.cardAlt,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{c.flag}</Text>
                  <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                    {c.code} ({c.symbol})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
            Phương án chuyển đổi:
          </Text>

          <Pressable
            onPress={() => setMode('symbol')}
            style={[
              styles.option,
              {
                backgroundColor: mode === 'symbol' ? colors.primarySoft : colors.cardAlt,
                borderColor: mode === 'symbol' ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={mode === 'symbol' ? 'radiobox-marked' : 'radiobox-blank'}
              size={22}
              color={mode === 'symbol' ? colors.primary : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                1. Chỉ đổi ký hiệu hiển thị
              </Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>
                Giữ nguyên các con số (VD: 50.000 giữ nguyên giá trị 50,000).
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setMode('convert')}
            style={[
              styles.option,
              {
                backgroundColor: mode === 'convert' ? colors.primarySoft : colors.cardAlt,
                borderColor: mode === 'convert' ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={mode === 'convert' ? 'radiobox-marked' : 'radiobox-blank'}
              size={22}
              color={mode === 'convert' ? colors.primary : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '700' }]}>
                2. Quy đổi toàn bộ dữ liệu theo tỷ giá
              </Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>
                Tự động tính lại số dư ví, giao dịch, ngân sách và mục tiêu.
              </Text>
            </View>
          </Pressable>

          {mode === 'convert' && (
            <View style={[styles.rateBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[typography.caption, { color: colors.text }]}>1 {pair.base} =</Text>
              <TextInput
                value={rateText}
                onChangeText={setRateText}
                keyboardType="numeric"
                style={[styles.rateInput, { color: colors.primary }]}
              />
              <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
                {pair.quote}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <CustomButton title="Hủy" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <CustomButton title="Áp dụng" onPress={handleConfirm} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 410,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  currencyRow: { flexDirection: 'row', gap: spacing.sm },
  currBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  rateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rateInput: {
    flex: 1,
    ...typography.h3,
    paddingVertical: 4,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
