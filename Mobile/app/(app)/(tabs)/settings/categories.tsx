import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
} from 'react-native-draggable-flatlist';

import { fetchCategories, updateCategory } from '@/apis/category';
import { profile, updateCategoryOrder } from '@/apis';
import { useAuth } from '@/provider/AuthProvider';
import { ECategoryType, ICategory, IUserInfo } from '@/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import IconSelector from '@/components/IconSelector';
import CategoryFormModal from '@/components/category/CategoryFormModal';
import Skeleton from '@/components/Skeleton';
import ScreenHeader from '@/components/ScreenHeader';
import ErrorState from '@/components/ErrorState';

// Native counterpart to Client/src/pages/CategoryPage.tsx: same concept
// (two type sections, drag to reorder, tap a row to edit/delete, "+" to
// create), but using react-native-draggable-flatlist's Nestable* components
// (built specifically for "several drag lists inside one scrollable
// screen") instead of @dnd-kit, and Alert.alert for delete confirmation
// instead of a custom ConfirmDialog.
export default function CategoriesScreen() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'Create' | 'Edit'>('Create');
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null);
  const [createType, setCreateType] = useState<ECategoryType>(ECategoryType.EXPENSE);

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError,
    refetch,
  } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  };

  // The persisted order, plus any categories the user hasn't reordered yet
  // (e.g. freshly created ones) appended at the end so nothing is hidden —
  // mirrors the same fallback used in RecordFormModal.tsx's sortedCategories.
  const { orderedCategories, categoryOrder } = useMemo(() => {
    if (!categories) return { orderedCategories: [] as ICategory[], categoryOrder: [] as number[] };

    const byId = new Map(categories.map((c) => [c.id, c]));
    const order = user?.categoryOrder ?? [];
    const ordered: ICategory[] = [];

    order.forEach((id) => {
      const found = byId.get(Number(id));
      if (found) ordered.push(found);
    });
    categories.forEach((c) => {
      if (!ordered.some((o) => o.id === c.id)) ordered.push(c);
    });

    return { orderedCategories: ordered, categoryOrder: ordered.map((c) => c.id) };
  }, [categories, user]);

  const incomeCategories = orderedCategories.filter((c) => c.type === ECategoryType.INCOME);
  const expenseCategories = orderedCategories.filter((c) => c.type === ECategoryType.EXPENSE);

  const reorderMutation = useMutation<
    IUserInfo,
    unknown,
    { id: number; categoryOrder: number[] },
    { previousUser?: IUserInfo }
  >({
    mutationFn: updateCategoryOrder,
    onMutate: async ({ categoryOrder: newOrder }) => {
      await queryClient.cancelQueries({ queryKey: ['user', userId] });
      const previousUser = queryClient.getQueryData<IUserInfo>(['user', userId]);
      if (previousUser) {
        queryClient.setQueryData<IUserInfo>(['user', userId], {
          ...previousUser,
          categoryOrder: newOrder,
        });
      }
      return { previousUser };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousUser) {
        queryClient.setQueryData(['user', userId], ctx.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });

  // Reordering happens within one type's sub-list; splice that type's ids
  // back into the full order at the positions they previously occupied so
  // the other type's ordering is left untouched. Mirrors
  // CategoryPage.tsx's handleDragEnd (arrayMove + persist via mutation).
  const persistReorder = (newTypeOrder: ICategory[], type: ECategoryType) => {
    if (!userId) return;
    const newIds = newTypeOrder.map((c) => c.id);
    let idx = 0;
    const byId = new Map(orderedCategories.map((c) => [c.id, c]));
    const nextOrder = categoryOrder.map((id) => {
      const cat = byId.get(id);
      if (cat && cat.type === type) {
        return newIds[idx++];
      }
      return id;
    });
    reorderMutation.mutate({ id: userId, categoryOrder: nextOrder });
  };

  const toggleEnableMutation = useMutation<ICategory, unknown, ICategory>({
    mutationFn: (cat) =>
      updateCategory({ id: cat.id, name: cat.name, icon: cat.icon, enable: !cat.enable }),
    onSettled: invalidate,
  });

  const openCreateModal = (type: ECategoryType) => {
    setSelectedCategory(null);
    setCreateType(type);
    setModalMode('Create');
    setModalVisible(true);
  };

  const openEditModal = (category: ICategory) => {
    setSelectedCategory(category);
    setModalMode('Edit');
    setModalVisible(true);
  };

  const renderRow = ({ item, drag, isActive }: RenderItemParams<ICategory>) => {
    const isExpense = item.type === ECategoryType.EXPENSE;
    return (
      <Pressable
        style={[
          styles.row,
          isActive && shadows.raised,
          { backgroundColor: isActive ? colors.primarySoft : colors.card },
        ]}
        onLongPress={() => {
          Haptics.selectionAsync();
          drag();
        }}
        onPress={() => openEditModal(item)}
        delayLongPress={200}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="reorder-three-outline" size={18} color={colors.textMuted} />
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: isExpense ? colors.danger : colors.success },
            ]}
          >
            <IconSelector name={item.icon} size={16} color="#fff" />
          </View>
          <Text style={[styles.rowName, !item.enable && styles.rowNameDisabled]}>{item.name}</Text>
        </View>
        <Switch
          value={item.enable}
          onValueChange={() => toggleEnableMutation.mutate(item)}
          trackColor={{ false: colors.border, true: colors.primarySoft }}
          thumbColor={item.enable ? colors.primary : '#fff'}
        />
      </Pressable>
    );
  };

  const renderSection = (title: string, type: ECategoryType, data: ICategory[]) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={() => openCreateModal(type)}
          accessibilityLabel={`Add ${title.toLowerCase()} category`}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </Pressable>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>
            No {title.toLowerCase()} categories yet. Tap + to add one.
          </Text>
        </View>
      ) : (
        <NestableDraggableFlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRow}
          onDragEnd={({ data: newData }) => persistReorder(newData, type)}
          activationDistance={0}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader
        title="Categories"
        subtitle="Long-press and drag to reorder. Tap a category to edit it."
      />

      {isCategoriesLoading ? (
        <View style={styles.scrollContent}>
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} height={46} borderRadius={12} style={{ marginBottom: 6 }} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState message="Couldn't load your categories." onRetry={() => refetch()} />
      ) : (
        <NestableScrollContainer contentContainerStyle={styles.scrollContent}>
          {renderSection('Income', ECategoryType.INCOME, incomeCategories)}
          {renderSection('Expense', ECategoryType.EXPENSE, expenseCategories)}
        </NestableScrollContainer>
      )}

      <CategoryFormModal
        visible={modalVisible}
        mode={modalMode}
        category={selectedCategory}
        createType={createType}
        categoryOrder={categoryOrder}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  section: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  emptySection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  emptySectionText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: 6,
    ...shadows.card,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  rowNameDisabled: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
