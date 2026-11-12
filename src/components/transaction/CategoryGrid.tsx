import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Category, CategoryType } from '../../types/models';
import { ICON_CHOICES } from '../../utils/categoryTemplates';
import { haptics } from '../../utils/haptics';
import { palette, radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { CustomButton } from '../common/CustomButton';

interface CategoryGridProps {
  categories: Category[];
  selectedId?: string;
  type: CategoryType;
  onSelect: (categoryId: string) => void;
  onQuickCreate: (name: string, icon: string, color: string) => Category;
  onOpenManage?: () => void;
}

export function CategoryGrid({
  categories,
  selectedId,
  type,
  onSelect,
  onQuickCreate,
  onOpenManage,
}: CategoryGridProps) {
  const { colors } = useTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('shape-outline');
  const [color, setColor] = useState(palette[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const created = onQuickCreate(name.trim(), icon, color);
    setShowCreate(false);
    setName('');
    onSelect(created.id);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[typography.label, { color: colors.text, fontWeight: '700' }]}>
          Danh mục {type === 'income' ? 'thu nhập' : 'chi tiêu'}
        </Text>
        {onOpenManage && (
          <Pressable onPress={onOpenManage}>
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              Quản lý
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        {categories.map((c) => {
          const active = c.id === selectedId;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                haptics.selection();
                onSelect(c.id);
              }}
              style={[
                styles.item,
                {
                  backgroundColor: active ? withAlpha(c.color, 0.16) : colors.card,
                  borderColor: active ? c.color : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: active ? c.color : withAlpha(c.color, 0.15) },
                ]}
              >
                <MaterialCommunityIcons
                  name={c.icon as never}
                  size={20}
                  color={active ? '#FFFFFF' : c.color}
                />
              </View>
              <Text
                style={[
                  typography.small,
                  {
                    color: active ? colors.text : colors.textSecondary,
                    fontWeight: active ? '700' : '500',
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={1}
              >
                {c.name}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setShowCreate(true)}
          style={[
            styles.item,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
              borderStyle: 'dashed',
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
          </View>
          <Text style={[typography.small, { color: colors.primaryDark, fontWeight: '700' }]}>
            Thêm mới
          </Text>
        </Pressable>
      </View>

      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowCreate(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[typography.h3, { color: colors.text }]}>Tạo danh mục nhanh</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tên danh mục (VD: Trà sữa)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Màu sắc</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
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
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Biểu tượng</Text>
            <ScrollView style={{ maxHeight: 150 }} contentContainerStyle={styles.iconGrid}>
              {ICON_CHOICES.slice(0, 36).map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: icon === ic ? color : colors.cardAlt,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={ic as never}
                    size={20}
                    color={icon === ic ? '#FFFFFF' : colors.text}
                  />
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <CustomButton title="Hủy" variant="outline" onPress={() => setShowCreate(false)} style={{ flex: 1 }} />
              <CustomButton title="Tạo" onPress={handleCreate} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    width: '23%',
    minWidth: 74,
    flexGrow: 1,
    maxWidth: '25%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1.2,
    gap: 5,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    ...typography.body,
  },
  colorRow: { gap: spacing.sm, paddingVertical: 4 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconOption: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
