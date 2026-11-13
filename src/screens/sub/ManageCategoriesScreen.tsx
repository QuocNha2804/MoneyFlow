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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Category, CategoryType } from '../../types/models';
import type { MainStackScreenProps } from '../../types/navigation';
import { ICON_CHOICES } from '../../utils/categoryTemplates';
import {
  useCategoryStore,
  useCurrentUser,
  useUserCategories,
} from '../../store';
import { haptics } from '../../utils/haptics';
import { palette, radius, spacing, typography, useTheme, withAlpha } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';

export function ManageCategoriesScreen({
  navigation,
  route,
}: MainStackScreenProps<'ManageCategories'>) {
  const { colors } = useTheme();
  const user = useCurrentUser();
  const [type, setType] = useState<CategoryType>(route.params?.type ?? 'expense');
  const categories = useUserCategories(type, true);

  const addCategory = useCategoryStore((s) => s.addCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);
  const toggleArchive = useCategoryStore((s) => s.toggleArchive);
  const reorder = useCategoryStore((s) => s.reorder);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('shape-outline');
  const [color, setColor] = useState(palette[0]);

  if (!user) return null;

  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    const ids = categories.map((c) => c.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    haptics.selection();
    reorder(ids);
  };

  const openAdd = () => {
    setEditing(null);
    setName('');
    setIcon('shape-outline');
    setColor(palette[0]);
    setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setIcon(c.icon);
    setColor(c.color);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      updateCategory(editing.id, { name: name.trim(), icon, color });
    } else {
      addCategory({ userId: user.id, name: name.trim(), icon, color, type });
    }
    haptics.success();
    setShowModal(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Header
        title="Quản lý Danh mục"
        onBack={() => navigation.goBack()}
        rightIcon="plus"
        onRightPress={openAdd}
      />

      <View style={styles.tabWrap}>
        <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
          {(['expense', 'income'] as const).map((t) => {
            const active = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.segBtn, active && { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[
                    typography.label,
                    { color: active ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
                  ]}
                >
                  {t === 'expense' ? 'Danh mục Chi tiêu' : 'Danh mục Thu nhập'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {categories.map((c, idx) => (
          <View
            key={c.id}
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: c.archived ? 0.5 : 1,
              },
            ]}
          >
            <Pressable
              onPress={() => openEdit(c)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}
            >
              <View style={[styles.iconBox, { backgroundColor: withAlpha(c.color, 0.16) }]}>
                <MaterialCommunityIcons name={c.icon as never} size={22} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyMedium, { color: colors.text, fontWeight: '600' }]}>
                  {c.name}
                </Text>
                {c.archived && (
                  <Text style={[typography.small, { color: colors.orange }]}>Đã ẩn</Text>
                )}
              </View>
            </Pressable>

            <Pressable onPress={() => moveItem(idx, -1)} style={styles.ctrlBtn}>
              <MaterialCommunityIcons name="arrow-up" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => moveItem(idx, 1)} style={styles.ctrlBtn}>
              <MaterialCommunityIcons name="arrow-down" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => toggleArchive(c.id)} style={styles.ctrlBtn}>
              <MaterialCommunityIcons
                name={c.archived ? 'eye-outline' : 'eye-off-outline'}
                size={19}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        ))}

        <CustomButton title="Thêm danh mục mới" icon="plus" onPress={openAdd} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowModal(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[typography.h2, { color: colors.text }]}>
              {editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tên danh mục"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Màu sắc</Text>
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
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Biểu tượng</Text>
            <ScrollView style={{ maxHeight: 170 }} contentContainerStyle={styles.iconGrid}>
              {ICON_CHOICES.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={[
                    styles.iconOption,
                    { backgroundColor: icon === ic ? color : colors.cardAlt },
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
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <CustomButton title="Hủy" variant="outline" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
              <CustomButton title="Lưu" onPress={handleSave} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  segment: { flexDirection: 'row', borderRadius: radius.lg, padding: 4 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.md, alignItems: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtn: { padding: 6 },
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
    paddingVertical: 10,
    ...typography.body,
  },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
