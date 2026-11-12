import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, CategoryType } from '../types/models';
import { nowISO, persistStorage, uuid } from './storage';

export type CategoryInput = {
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault?: boolean;
};

interface CategoryState {
  categories: Category[];
  addCategory: (input: CategoryInput) => Category;
  addMany: (inputs: CategoryInput[]) => Category[];
  updateCategory: (id: string, patch: Partial<Category>) => void;
  toggleArchive: (id: string) => void;
  removeCategory: (id: string) => void;
  /** Sắp xếp lại thứ tự theo mảng id */
  reorder: (orderedIds: string[]) => void;
  /** Tìm danh mục theo tên (không phân biệt hoa thường) hoặc tạo mới */
  ensureCategory: (input: CategoryInput) => string;
  removeUserData: (userId: string) => void;
  importCategories: (items: Category[]) => void;
}

function nextOrder(list: Category[], userId: string, type: CategoryType): number {
  const same = list.filter((c) => c.userId === userId && c.type === type);
  return same.length ? Math.max(...same.map((c) => c.order)) + 1 : 0;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: [],
      addCategory: (input) => {
        const list = get().categories;
        const cat: Category = {
          id: uuid(),
          userId: input.userId,
          name: input.name.trim(),
          icon: input.icon,
          color: input.color,
          type: input.type,
          isDefault: input.isDefault ?? false,
          order: nextOrder(list, input.userId, input.type),
          archived: false,
          createdAt: nowISO(),
        };
        set({ categories: [...list, cat] });
        return cat;
      },
      addMany: (inputs) => {
        let list = [...get().categories];
        const created: Category[] = [];
        for (const input of inputs) {
          const exists = list.find(
            (c) =>
              c.userId === input.userId &&
              c.type === input.type &&
              c.name.toLowerCase() === input.name.trim().toLowerCase(),
          );
          if (exists) {
            if (exists.archived) {
              list = list.map((c) => (c.id === exists.id ? { ...c, archived: false } : c));
            }
            continue;
          }
          const cat: Category = {
            id: uuid(),
            userId: input.userId,
            name: input.name.trim(),
            icon: input.icon,
            color: input.color,
            type: input.type,
            isDefault: input.isDefault ?? false,
            order: nextOrder(list, input.userId, input.type),
            archived: false,
            createdAt: nowISO(),
          };
          list.push(cat);
          created.push(cat);
        }
        set({ categories: list });
        return created;
      },
      updateCategory: (id, patch) =>
        set({ categories: get().categories.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)) }),
      toggleArchive: (id) =>
        set({ categories: get().categories.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)) }),
      removeCategory: (id) => set({ categories: get().categories.filter((c) => c.id !== id) }),
      reorder: (orderedIds) => {
        const pos = new Map(orderedIds.map((id, i) => [id, i]));
        set({
          categories: get().categories.map((c) => (pos.has(c.id) ? { ...c, order: pos.get(c.id)! } : c)),
        });
      },
      ensureCategory: (input) => {
        const found = get().categories.find(
          (c) =>
            c.userId === input.userId &&
            c.type === input.type &&
            c.name.toLowerCase() === input.name.trim().toLowerCase(),
        );
        if (found) {
          if (found.archived) get().updateCategory(found.id, { archived: false });
          return found.id;
        }
        return get().addCategory(input).id;
      },
      removeUserData: (userId) => set({ categories: get().categories.filter((c) => c.userId !== userId) }),
      importCategories: (items) => {
        const ids = new Set(items.map((i) => i.id));
        set({ categories: [...get().categories.filter((c) => !ids.has(c.id)), ...items] });
      },
    }),
    { name: 'mf-categories', storage: persistStorage },
  ),
);
