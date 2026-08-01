import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Haptics from 'expo-haptics';

import { profile } from '@/apis';
import { fetchCategories } from '@/apis/category';
import { createRecord, deleteRecord, getRemarks, updateRecord } from '@/apis/record';
import { useAuth } from '@/provider/AuthProvider';
import {
  ApiError,
  ECategoryType,
  ICategory,
  ICreateRecord,
  IRecord,
  IUserInfo,
  IWallet,
} from '@/types';
import { colors } from '@/theme/colors';
import IconSelector from '@/components/IconSelector';
import Calculator from '@/components/calculator/Calculator';
import { showToast } from '@/components/Toast';
import { safeEvaluate } from '@/utils/calc';

type RecordFormModalProps = {
  visible: boolean;
  wallet: IWallet | undefined;
  record: IRecord | null;
  category: ICategory | null;
  onClose: () => void;
};

const emptyRecord = (): IRecord => ({
  id: 0,
  price: 0,
  remarks: '',
  date: new Date().toISOString(),
});

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Native counterpart to Client/src/components/record/RecordModal.tsx: same
// concept (category type toggle -> category grid -> date -> calculator
// keypad amount entry -> remarks), adapted to RN idioms (a full-screen
// Modal instead of a web dialog, a native DateTimePicker instead of
// react-datepicker).
export default function RecordFormModal({
  visible,
  wallet,
  record,
  category,
  onClose,
}: RecordFormModalProps) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [editRecord, setEditRecord] = useState<IRecord>(record ?? emptyRecord());
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(category);
  const [categoryType, setCategoryType] = useState<ECategoryType>(
    category?.type === 'income' ? ECategoryType.INCOME : ECategoryType.EXPENSE,
  );
  const [amountInput, setAmountInput] = useState<string>(
    record && record.price ? String(record.price) : '',
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      const initial = record ?? emptyRecord();
      setEditRecord(initial);
      setSelectedCategory(category ?? null);
      setCategoryType(category?.type === 'income' ? ECategoryType.INCOME : ECategoryType.EXPENSE);
      setAmountInput(initial.price ? String(initial.price) : '');
    }
  }, [visible, record, category]);

  const { data: categories } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: visible,
  });

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: visible && !!userId,
  });

  const { data: remarkSuggestions } = useQuery<string[]>({
    queryKey: ['remarks', selectedCategory?.id],
    queryFn: () => getRemarks(selectedCategory!.id),
    enabled: visible && !!selectedCategory?.id,
  });

  // Sort categories by the user's saved categoryOrder, mirroring
  // RecordModal.tsx's effect, then filter down to the active type.
  const sortedCategories = useMemo(() => {
    if (!categories || !user) return [];
    const byId = new Map(categories.map((c) => [c.id, c]));
    const ordered: ICategory[] = [];
    user.categoryOrder.forEach((id) => {
      const found = byId.get(Number(id));
      if (found) ordered.push(found);
    });
    // Include any categories missing from categoryOrder so nothing is hidden.
    categories.forEach((c) => {
      if (!ordered.some((o) => o.id === c.id)) ordered.push(c);
    });
    return ordered;
  }, [categories, user]);

  const categoriesForType = sortedCategories.filter((c) => c.type === categoryType);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
    if (wallet) {
      queryClient.invalidateQueries({ queryKey: ['records', wallet.id] });
      // Report's month/week/year breakdown and any goal progress are both
      // derived server-side from records — without these, they'd keep
      // showing pre-edit numbers until an unrelated refetch happened to
      // touch them. (Wallet Detail's own stats are computed client-side
      // from the wallets query, already covered by the invalidation above.)
      queryClient.invalidateQueries({ queryKey: ['walletSummary', wallet.id] });
      queryClient.invalidateQueries({ queryKey: ['goals', wallet.id] });
      queryClient.invalidateQueries({ queryKey: ['allGoals'] });
    }
  };

  const createMutation = useMutation<IRecord, AxiosError<ApiError>, ICreateRecord>({
    mutationFn: createRecord,
    onSettled: invalidate,
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not save record. Please try again.');
    },
  });

  const updateMutation = useMutation<IRecord, AxiosError<ApiError>, IRecord>({
    mutationFn: updateRecord,
    onSettled: invalidate,
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not update record. Please try again.');
    },
  });

  const deleteMutation = useMutation<unknown, AxiosError<ApiError>, number>({
    mutationFn: deleteRecord,
    onSettled: invalidate,
    onSuccess: () => {
      setConfirmDeleteVisible(false);
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not delete record. Please try again.');
    },
  });

  const updateCalc = (key: string) => {
    if (key === '=') {
      setAmountInput((prev) => {
        const result = safeEvaluate(prev);
        return result === null ? prev : String(result);
      });
      return;
    }
    if (key === 'AC') {
      setAmountInput('');
      return;
    }
    if (key === 'DE') {
      setAmountInput((prev) => prev.slice(0, -1));
      return;
    }
    setAmountInput((prev) => prev + key);
  };

  useEffect(() => {
    const numeric = Number(amountInput);
    if (amountInput !== '' && !Number.isNaN(numeric)) {
      setEditRecord((prev) => ({ ...prev, price: numeric }));
    } else if (amountInput === '') {
      setEditRecord((prev) => ({ ...prev, price: 0 }));
    }
  }, [amountInput]);

  const isEditing = editRecord.id !== 0;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (closeAfter: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!editRecord.price) {
      showToast('Please enter the expense/income amount.');
      return;
    }
    if (!wallet) {
      showToast('Please create or select a wallet first.');
      return;
    }
    if (!selectedCategory) {
      showToast('Please select a category.');
      return;
    }

    try {
      if (!isEditing) {
        await createMutation.mutateAsync({
          ...editRecord,
          wallet,
          category: selectedCategory,
        });
        if (closeAfter) {
          onClose();
        } else {
          // Create-and-continue: reset the form for the next entry.
          setEditRecord(emptyRecord());
          setAmountInput('');
        }
      } else {
        await updateMutation.mutateAsync({ ...editRecord });
        if (closeAfter) onClose();
      }
    } catch {
      // Errors are surfaced via the mutation's onError handler.
    }
  };

  const handleDeleteConfirmed = () => {
    deleteMutation.mutate(editRecord.id);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {isEditing ? 'Update' : 'New'}{' '}
            {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
        </View>

        <View style={styles.typeToggle}>
          {Object.values(ECategoryType).map((type) => (
            <Pressable
              key={type}
              style={[
                styles.typeToggleOption,
                categoryType === type && styles.typeToggleOptionActive,
              ]}
              onPress={() => setCategoryType(type)}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  categoryType === type && styles.typeToggleTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View
          style={[
            styles.categoryPanel,
            categoryType === ECategoryType.EXPENSE ? styles.categoryPanelExpense : styles.categoryPanelIncome,
          ]}
        >
          <View style={styles.categoryGrid}>
            {categoriesForType.map((c) => {
              const selected = selectedCategory?.id === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCategory(c)}
                  style={[
                    styles.categoryChip,
                    categoryType === ECategoryType.EXPENSE
                      ? selected
                        ? styles.categoryChipExpenseActive
                        : styles.categoryChipExpense
                      : selected
                        ? styles.categoryChipIncomeActive
                        : styles.categoryChipIncome,
                  ]}
                >
                  <IconSelector
                    name={c.icon}
                    size={16}
                    color={selected ? '#fff' : categoryType === ECategoryType.EXPENSE ? colors.danger : colors.success}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color: selected
                          ? '#fff'
                          : categoryType === ECategoryType.EXPENSE
                            ? colors.danger
                            : colors.success,
                      },
                    ]}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
            {categoriesForType.length === 0 && (
              <Text style={styles.noCategories}>No categories of this type yet.</Text>
            )}
          </View>
        </View>

        <View style={styles.walletDateRow}>
          <View style={styles.walletBox}>
            <Text style={styles.fieldLabel}>Wallet</Text>
            <Text style={styles.walletValue}>{wallet ? `${wallet.name} (${wallet.currency})` : 'None'}</Text>
          </View>
          <View style={styles.dateBox}>
            <View style={styles.dateLabelRow}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Pressable
                onPress={() => setEditRecord((prev) => ({ ...prev, date: new Date().toISOString() }))}
              >
                <Text style={styles.todayLink}>Today?</Text>
              </Pressable>
            </View>
            <Pressable style={styles.dateValueBox} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.walletValue}>{formatDateLabel(editRecord.date)}</Text>
            </Pressable>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={Number.isNaN(new Date(editRecord.date).getTime()) ? new Date() : new Date(editRecord.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            themeVariant="light"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (event.type === 'dismissed') {
                setShowDatePicker(false);
                return;
              }
              if (selectedDate) {
                setEditRecord((prev) => ({ ...prev, date: selectedDate.toISOString() }));
              }
              if (Platform.OS === 'android') setShowDatePicker(false);
            }}
          />
        )}
        {showDatePicker && Platform.OS === 'ios' && (
          <Pressable style={styles.dateDoneButton} onPress={() => setShowDatePicker(false)}>
            <Text style={styles.dateDoneButtonText}>Done</Text>
          </Pressable>
        )}

        <View style={styles.amountDisplay}>
          <Text style={styles.amountCurrency}>{wallet?.currency ?? ''}</Text>
          <Text style={styles.amountText} numberOfLines={1}>
            {amountInput.length > 0 ? amountInput : '0'}
          </Text>
        </View>

        <Calculator onKeyPress={updateCalc} />

        <Text style={styles.fieldLabel}>Remarks</Text>
        <TextInput
          style={styles.remarksInput}
          value={editRecord.remarks}
          onChangeText={(text) => setEditRecord((prev) => ({ ...prev, remarks: text }))}
          placeholder="Optional note"
          placeholderTextColor={colors.textMuted}
        />

        {remarkSuggestions && remarkSuggestions.length > 0 && (
          <View style={styles.remarkChips}>
            {remarkSuggestions.map((remark) => (
              <Pressable
                key={remark}
                style={styles.remarkChip}
                onPress={() => setEditRecord((prev) => ({ ...prev, remarks: remark }))}
              >
                <Text style={styles.remarkChipText}>{remark}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.actionsRow}>
          {isEditing ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              onPress={() => setConfirmDeleteVisible(true)}
            >
              <Text style={styles.secondaryButtonText}>Delete</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              onPress={() => handleSubmit(false)}
              disabled={isSaving}
            >
              <Text style={styles.secondaryButtonText}>Create and continue</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={() => handleSubmit(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>{isEditing ? 'Update' : 'Create'}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={confirmDeleteVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Delete this record?</Text>
            <Text style={styles.confirmMessage}>This action cannot be undone.</Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancel} onPress={() => setConfirmDeleteVisible(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmDelete} onPress={handleDeleteConfirmed} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  typeToggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeToggleOptionActive: {
    backgroundColor: colors.primary,
  },
  typeToggleText: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeToggleTextActive: {
    color: '#fff',
  },
  categoryPanel: {
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  categoryPanelExpense: {
    backgroundColor: colors.dangerSoft,
  },
  categoryPanelIncome: {
    backgroundColor: colors.successSoft,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  categoryChipExpense: {
    backgroundColor: '#fff',
  },
  categoryChipExpenseActive: {
    backgroundColor: colors.danger,
  },
  categoryChipIncome: {
    backgroundColor: '#fff',
  },
  categoryChipIncomeActive: {
    backgroundColor: colors.success,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noCategories: {
    color: colors.textMuted,
    fontSize: 13,
    padding: 8,
  },
  walletDateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  walletBox: {
    flex: 1,
  },
  dateBox: {
    flex: 1,
  },
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  todayLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  walletValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  dateValueBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
  },
  dateDoneButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  amountDisplay: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountCurrency: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginTop: 12,
  },
  remarkChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  remarkChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  remarkChipText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
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
    color: colors.text,
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    width: '100%',
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  confirmMessage: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  confirmCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmCancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  confirmDelete: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#fff',
    fontWeight: '700',
  },
});
