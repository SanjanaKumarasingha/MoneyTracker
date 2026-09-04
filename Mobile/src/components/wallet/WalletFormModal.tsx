import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { createWallet, deleteWallet, updateWallet } from '@/apis/wallet';
import { useAuth } from '@/provider/AuthProvider';
import { ApiError, IWallet } from '@/types';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import CurrencyPicker from '@/components/CurrencyPicker';
import { showToast } from '@/components/Toast';

type WalletFormModalProps = {
  visible: boolean;
  mode: 'Create' | 'Edit';
  wallet: IWallet | null;
  onClose: () => void;
};

// Native counterpart to Client/src/components/wallet/WalletModal.tsx: one
// modal reused for both create and edit, backed by the same mutation shapes
// (optimistic update + invalidate on settle) as the web app.
export default function WalletFormModal({
  visible,
  mode,
  wallet,
  onClose,
}: WalletFormModalProps) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(wallet?.name ?? '');
  const [currency, setCurrency] = useState(wallet?.currency ?? '');

  useEffect(() => {
    if (visible) {
      setName(wallet?.name ?? '');
      setCurrency(wallet?.currency ?? '');
    }
  }, [visible, wallet]);

  const invalidateWallets = () => {
    queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
  };

  const createMutation = useMutation<IWallet, AxiosError<ApiError>, IWallet>({
    mutationFn: (newWallet) =>
      createWallet({ ...newWallet, userId: userId! }),
    onSettled: invalidateWallets,
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not create wallet. Please try again.');
    },
  });

  const updateMutation = useMutation<IWallet, AxiosError<ApiError>, IWallet>({
    mutationFn: updateWallet,
    onSettled: invalidateWallets,
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not update wallet. Please try again.');
    },
  });

  const deleteMutation = useMutation<unknown, AxiosError<ApiError>, number>({
    mutationFn: deleteWallet,
    onSettled: invalidateWallets,
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Could not delete wallet. Please try again.');
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!name.trim()) {
      showToast('Please enter a wallet name.');
      return;
    }
    if (!currency) {
      showToast('Please select a currency.');
      return;
    }

    if (mode === 'Create') {
      createMutation.mutate({ id: 0, name: name.trim(), currency });
    } else if (wallet) {
      updateMutation.mutate({ id: wallet.id, name: name.trim(), currency });
    }
  };

  const handleDelete = () => {
    if (!wallet) return;
    Alert.alert(
      'Delete wallet',
      'Are you sure you want to delete this wallet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(wallet.id),
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{mode === 'Create' ? 'Add new wallet' : 'Edit wallet'}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Everyday spending"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Currency</Text>
          <CurrencyPicker value={currency} onChange={setCurrency} />

          <View style={styles.actions}>
            {mode === 'Edit' && (
              <Pressable
                style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={colors.danger} size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </Pressable>
            )}

            <View style={styles.rightActions}>
              <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
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
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.inputBg,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButtonPressed: {
    backgroundColor: colors.dangerSoft,
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
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
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
