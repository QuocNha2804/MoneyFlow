import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PRIMARY_GOALS, SUGGESTED_CATEGORIES } from '../../utils/categoryTemplates';
import { useAuthStore, useCategoryStore, useCurrentUser } from '../../store';
import { haptics } from '../../utils/haptics';
import { radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';

export function SuggestedCategoriesModal() {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const visible = useAuthStore((s) => s.showSuggestedModal);
  const setVisible = useAuthStore((s) => s.setShowSuggestedModal);
  const addMany = useCategoryStore((s) => s.addMany);

  const goalKey = user?.primaryGoal ?? 'saving';
  const goalMeta = PRIMARY_GOALS.find((g) => g.key === goalKey) ?? PRIMARY_GOALS[0];
  const suggestions = SUGGESTED_CATEGORIES[goalKey] ?? [];

  const [selectedNames, setSelectedNames] = useState<string[]>(() =>
    suggestions.map((s) => s.name),
  );

  if (!visible || !user) return null;

  const toggle = (name: string) => {
    haptics.selection();
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleApply = () => {
    const chosen = suggestions.filter((s) => selectedNames.includes(s.name));
    if (chosen.length) {
      addMany(
        chosen.map((c) => ({
          userId: user.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type,
          isDefault: true,
        })),
      );
    }
    haptics.success();
    setVisible(false);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.badge, { backgroundColor: withAlpha(goalMeta.color, 0.16) }]}>
            <MaterialCommunityIcons name={goalMeta.icon as never} size={26} color={goalMeta.color} />
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
            Bộ danh mục gợi ý cho “{goalMeta.label}”
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
            Dựa trên mục tiêu ưu tiên bạn đã chọn, hãy tích chọn các danh mục muốn thêm vào sổ:
          </Text>

          <ScrollView style={{ maxHeight: 260, width: '100%' }} contentContainerStyle={styles.list}>
            {suggestions.map((s) => {
              const checked = selectedNames.includes(s.name);
              return (
                <Pressable
                  key={s.name}
                  onPress={() => toggle(s.name)}
                  style={[
                    styles.item,
                    {
                      backgroundColor: checked ? withAlpha(s.color, 0.14) : colors.cardAlt,
                      borderColor: checked ? s.color : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: withAlpha(s.color, 0.18) }]}>
                    <MaterialCommunityIcons name={s.icon as never} size={20} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
                      {s.name}
                    </Text>
                    <Text style={[typography.small, { color: colors.textSecondary }]}>
                      {s.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={22}
                    color={checked ? s.color : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <CustomButton
              title="Bỏ qua"
              variant="outline"
              onPress={() => setVisible(false)}
              style={{ flex: 1 }}
            />
            <CustomButton
              title={`Thêm (${selectedNames.length})`}
              onPress={handleApply}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
});
