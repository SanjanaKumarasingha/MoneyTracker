import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { addCategory, deleteCategory, updateCategory } from '@/apis/category';
import { updateCategoryOrder } from '@/apis';
import { useAuth } from '@/provider/AuthProvider';
import { ApiError, ECategoryType, ICategory, TCategoryType } from '@/types';
import { EIconName } from '@/types/icon-name.enum';
import { colors } from '@/theme/colors';
import IconSelector from '@/components/IconSelector';
import { showToast } from '@/components/Toast';

type CategoryFormModalProps = {
  visible: boolean;
  mode: 'Create' | 'Edit';
  category: ICategory | null;
  // Only used in Create mode: which section's "+" button opened the modal.
  createType: TCategoryType;
  // The user's current full category order (all ids, both types), so a
  // freshly created/deleted category can be persisted into the order too —
  // mirrors what a manual drag-to-reorder would eventually save.
  categoryOrder: number[];
  onClose: () => void;
};

const ALL_ICONS = Object.values(EIconName);

// Native counterpart to Client/src/components/category/CategoryModal.tsx:
// same concept (name field, icon grid, delete), adapted to a bottom-sheet-
// style RN Modal. The web app splits "enable" toggling into CategoryRow's
// switch — mobile mirrors that in CategoriesScreen's row instead of here.
export default function CategoryFormModal({
  visible,
  mode,
  category,
  createType,
  categoryOrder,
  onClose,
}: CategoryFormModalProps) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<EIconName>(EIconName.MONEY);

  useEffect(() => {
    if (visible) {
      setName(category?.name ?? '');
      setIcon(category?.icon ?? EIconName.MONEY);
    }
  }, [visible, category]);

  const type: TCategoryType =
    mode === 'Edit' && category ? category.type : createType;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  };

  const orderMutation = useMutation({
    mutationFn: updateCategoryOrder,
    onSettled: invalidate,
  });

  const createMutation = useMutation<ICategory, AxiosError<ApiError>, void>({
    mutationFn: () =>
      addCategory({
        name: name.trim(),
        icon,
        type,
        enable: true,
        userId: userId!,
      }),
    onSuccess: (data) => {
      if (userId) {
        orderMutation.mutate({
          id: userId,
          categoryOrder: [...categoryOrder, data.id],
        });
      }
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not create category. Please try again.');
    },
    onSettled: invalidate,
  });

  const updateMutation = useMutation<ICategory, AxiosError<ApiError>, void>({
    mutationFn: () =>
      updateCategory({
        id: category!.id,
        name: name.trim(),
        icon,
        enable: category!.enable,
      }),
    onSuccess: () => onClose(),
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not update category. Please try again.');
    },
    onSettled: invalidate,
  });

  const deleteMutation = useMutation<unknown, AxiosError<ApiError>, void>({
    mutationFn: () => deleteCategory(category!.id),
    onSuccess: () => {
      if (userId && category) {
        orderMutation.mutate({
          id: userId,
          categoryOrder: categoryOrder.filter((id) => id !== category.id),
        });
      }
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not delete category. Please try again.');
    },
    onSettled: invalidate,
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const accentColor = type === ECategoryType.EXPENSE ? colors.danger : colors.success;
  const accentSoft = type === ECategoryType.EXPENSE ? colors.dangerSoft : colors.successSoft;

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!name.trim()) {
      showToast('Please enter a category name.');
      return;
    }

    if (mode === 'Create') {
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (!category) return;
    Alert.alert(
      'Delete category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {mode === 'Create'
                ? `New ${type.charAt(0).toUpperCase() + type.slice(1)} Category`
                : 'Edit category'}
            </Text>
            {mode === 'Edit' && (
              <Pressable onPress={handleDelete} hitSlop={8} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={colors.danger} size="small" />
                ) : (
                  <Text style={styles.deleteLabel}>Delete</Text>
                )}
              </Pressable>
            )}
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Groceries"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Icon</Text>
          <ScrollView style={styles.iconScroll} contentContainerStyle={styles.iconGrid}>
            {ALL_ICONS.map((iconName) => {
              const selected = iconName === icon;
              return (
                <Pressable
                  key={iconName}
                  onPress={() => setIcon(iconName)}
                  style={[
                    styles.iconChip,
                    { backgroundColor: selected ? accentColor : accentSoft },
                  ]}
                >
                  <IconSelector name={iconName} size={18} color={selected ? '#fff' : accentColor} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: accentColor },
                pressed && styles.saveButtonPressed,
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>{mode === 'Create' ? 'Create' : 'Save'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  deleteLabel: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  iconScroll: {
    maxHeight: 220,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonPressed: {
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
