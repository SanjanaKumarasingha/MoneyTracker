import React, { useEffect, useMemo, useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';

import { fetchCategories } from '@/apis/category';
import { createGoal, deleteGoal, updateGoal } from '@/apis/goal';
import { useAuth } from '@/provider/AuthProvider';
import {
  ApiError,
  ICategory,
  ICreateGoal,
  IGoalWithProgress,
} from '@/types';
import { EGoalType } from '@/types/goal-type.enum';
import { EGoalPeriodType } from '@/types/goal-period-type.enum';
import { colors } from '@/theme/colors';
import IconSelector from '@/components/IconSelector';

type GoalFormModalProps = {
  visible: boolean;
  walletId: number;
  goal: IGoalWithProgress | null;
  onClose: () => void;
};

const PERIOD_LABELS: Record<EGoalPeriodType, string> = {
  [EGoalPeriodType.WEEKLY]: 'Weekly',
  [EGoalPeriodType.MONTHLY]: 'Monthly',
  [EGoalPeriodType.YEARLY]: 'Yearly',
  [EGoalPeriodType.CUSTOM]: 'Custom range',
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Goals can target the whole wallet or one specific category within it. The
// category picker is filtered to match the goal's type (SAVING sums INCOME
// records, SPENDING_LIMIT sums EXPENSE records) so a chosen category can
// never mismatch the side the server actually sums against.
export default function GoalFormModal({
  visible,
  walletId,
  goal,
  onClose,
}: GoalFormModalProps) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!goal;

  const [name, setName] = useState('');
  const [type, setType] = useState<EGoalType>(EGoalType.SPENDING_LIMIT);
  const [periodType, setPeriodType] = useState<EGoalPeriodType>(EGoalPeriodType.MONTHLY);
  const [amountInput, setAmountInput] = useState('');
  const [scope, setScope] = useState<'wallet' | 'category'>('wallet');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(goal?.name ?? '');
    setType(goal?.type ?? EGoalType.SPENDING_LIMIT);
    setPeriodType(goal?.periodType ?? EGoalPeriodType.MONTHLY);
    setAmountInput(goal?.targetAmount ? String(goal.targetAmount) : '');
    setScope(goal?.category ? 'category' : 'wallet');
    setCategoryId(goal?.category?.id ?? null);
    setStartDate(goal?.startDate ? new Date(goal.startDate) : new Date());
    setEndDate(goal?.endDate ? new Date(goal.endDate) : new Date());
  }, [visible, goal]);

  const { data: categories } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: visible,
  });

  const relevantCategoryType = type === EGoalType.SAVING ? 'income' : 'expense';
  const categoryOptions = useMemo(
    () => (categories ?? []).filter((c) => c.type === relevantCategoryType),
    [categories, relevantCategoryType],
  );

  // If the goal type changes, the previously-selected category may no
  // longer be a valid option (wrong side) — clear it rather than silently
  // keeping a mismatched selection.
  useEffect(() => {
    if (categoryId && !categoryOptions.some((c) => c.id === categoryId)) {
      setCategoryId(null);
    }
  }, [categoryOptions, categoryId]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['goals', walletId] });
  };

  const createMutation = useMutation<unknown, AxiosError<ApiError>, Partial<ICreateGoal>>({
    mutationFn: createGoal,
    onSettled: invalidate,
    onSuccess: onClose,
    onError: (error) => {
      const message = error.response?.data.message;
      Alert.alert('Could not create goal', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
    },
  });

  const updateMutation = useMutation<unknown, AxiosError<ApiError>, Parameters<typeof updateGoal>[0]>({
    mutationFn: updateGoal,
    onSettled: invalidate,
    onSuccess: onClose,
    onError: (error) => {
      const message = error.response?.data.message;
      Alert.alert('Could not update goal', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
    },
  });

  const deleteMutation = useMutation<unknown, AxiosError<ApiError>, number>({
    mutationFn: deleteGoal,
    onSettled: invalidate,
    onSuccess: onClose,
    onError: (error) => {
      const message = error.response?.data.message;
      Alert.alert('Could not delete goal', Array.isArray(message) ? message.join('\n') : message ?? 'Please try again.');
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    const amount = Number(amountInput);
    if (!amountInput || Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Amount required', 'Please enter a target amount greater than 0.');
      return;
    }
    if (scope === 'category' && !categoryId) {
      Alert.alert('Category required', 'Please select a category, or switch to "Whole wallet".');
      return;
    }
    if (periodType === EGoalPeriodType.CUSTOM && endDate.getTime() <= startDate.getTime()) {
      Alert.alert('Invalid dates', 'The end date must be after the start date.');
      return;
    }

    const shared = {
      name: name.trim() || null,
      type,
      periodType,
      targetAmount: amount,
      startDate: toIsoDate(startDate),
      endDate: periodType === EGoalPeriodType.CUSTOM ? toIsoDate(endDate) : null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: goal.id, ...shared });
    } else {
      createMutation.mutate({
        ...shared,
        userId: userId!,
        walletId,
        categoryId: scope === 'category' && categoryId ? categoryId : undefined,
      });
    }
  };

  const handleDelete = () => {
    if (!goal) return;
    Alert.alert(
      'Delete goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(goal.id) },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Text style={styles.title}>{isEditing ? 'Edit goal' : 'New goal'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </View>

          {!isEditing && (
            <>
              <Text style={styles.label}>Applies to</Text>
              <View style={styles.segmented}>
                {(['wallet', 'category'] as const).map((option) => (
                  <Pressable
                    key={option}
                    style={[styles.segmentedOption, scope === option && styles.segmentedOptionActive]}
                    onPress={() => setScope(option)}
                  >
                    <Text style={[styles.segmentedText, scope === option && styles.segmentedTextActive]}>
                      {option === 'wallet' ? 'Whole wallet' : 'Specific category'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {isEditing && (
            <Text style={styles.scopeReadout}>
              {goal.category ? `Category: ${goal.category.name}` : 'Whole wallet'}
            </Text>
          )}

          {!isEditing && scope === 'category' && (
            <View style={styles.categoryGrid}>
              {categoryOptions.map((c) => {
                const selected = categoryId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  >
                    <IconSelector name={c.icon} size={16} color={selected ? '#fff' : colors.text} />
                    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
              {categoryOptions.length === 0 && (
                <Text style={styles.noCategories}>
                  No {relevantCategoryType} categories yet.
                </Text>
              )}
            </View>
          )}

          <Text style={styles.label}>Goal type</Text>
          <View style={styles.segmented}>
            {(Object.values(EGoalType) as EGoalType[]).map((option) => (
              <Pressable
                key={option}
                style={[styles.segmentedOption, type === option && styles.segmentedOptionActive]}
                onPress={() => setType(option)}
              >
                <Text style={[styles.segmentedText, type === option && styles.segmentedTextActive]}>
                  {option === EGoalType.SAVING ? 'Saving' : 'Spending limit'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Name (optional)</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Save for Japan trip"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Target amount</Text>
          <TextInput
            style={styles.input}
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Period</Text>
          <View style={styles.periodGrid}>
            {(Object.values(EGoalPeriodType) as EGoalPeriodType[]).map((option) => (
              <Pressable
                key={option}
                style={[styles.periodChip, periodType === option && styles.periodChipActive]}
                onPress={() => setPeriodType(option)}
              >
                <Text style={[styles.periodChipText, periodType === option && styles.periodChipTextActive]}>
                  {PERIOD_LABELS[option]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            {periodType === EGoalPeriodType.CUSTOM ? 'Starts on' : 'Renews from'}
          </Text>
          <Pressable style={styles.dateValueBox} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateValueText}>{formatDateLabel(startDate.toISOString())}</Text>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
              onChange={(event, selectedDate) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (event.type === 'dismissed') {
                  setShowStartPicker(false);
                  return;
                }
                if (selectedDate) setStartDate(selectedDate);
                if (Platform.OS === 'android') setShowStartPicker(false);
              }}
            />
          )}

          {periodType === EGoalPeriodType.CUSTOM && (
            <>
              <Text style={styles.label}>Ends on</Text>
              <Pressable style={styles.dateValueBox} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateValueText}>{formatDateLabel(endDate.toISOString())}</Text>
              </Pressable>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  themeVariant="light"
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (event.type === 'dismissed') {
                      setShowEndPicker(false);
                      return;
                    }
                    if (selectedDate) setEndDate(selectedDate);
                    if (Platform.OS === 'android') setShowEndPicker(false);
                  }}
                />
              )}
            </>
          )}

          <View style={styles.actionsRow}>
            {isEditing && (
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={colors.danger} size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Delete</Text>
                )}
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>{isEditing ? 'Save' : 'Create'}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 60,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 14,
    marginBottom: 6,
  },
  scopeReadout: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
    marginBottom: 4,
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
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentedOptionActive: {
    backgroundColor: colors.primary,
  },
  segmentedText: {
    fontWeight: '600',
    color: colors.textMuted,
    fontSize: 13,
  },
  segmentedTextActive: {
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  noCategories: {
    color: colors.textMuted,
    fontSize: 13,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  periodChipTextActive: {
    color: '#fff',
  },
  dateValueBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 24,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
