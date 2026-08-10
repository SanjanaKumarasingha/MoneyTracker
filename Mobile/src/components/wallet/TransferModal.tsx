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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { fetchWallets } from '@/apis/wallet';
import { transferBetweenWallets } from '@/apis/transfer';
import { useAuth } from '@/provider/AuthProvider';
import { ApiError, IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';
import { showToast } from '@/components/Toast';

type TransferModalProps = {
  visible: boolean;
  onClose: () => void;
  defaultFromWalletId?: number;
};

// Mirrors Client/src/pages/WalletPage.tsx / Home's getWalletBalance — sums a
// wallet's records, subtracting expense-shaped ones. Transfer records count
// too, since their synthetic category correctly reflects which side moved
// the money (see Server/src/records/transfer-category.util.ts).
function getBalance(wallet: IWalletRecordWithCategory): number {
  return (wallet.records ?? []).reduce((acc, record) => {
    if (!record.category) return acc;
    return record.category.type === 'expense'
      ? acc - Number(record.price)
      : acc + Number(record.price);
  }, 0);
}

function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

// Native counterpart to Client/src/components/wallet/TransferModal.tsx —
// same wallet-card-pick UX (from/to lists you tap), backed by the same
// POST /records/transfer endpoint.
export default function TransferModal({
  visible,
  onClose,
  defaultFromWalletId,
}: TransferModalProps) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallets = [] } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const [fromWalletId, setFromWalletId] = useState<number | null>(null);
  const [toWalletId, setToWalletId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (visible) {
      setFromWalletId(defaultFromWalletId ?? wallets[0]?.id ?? null);
      setToWalletId(null);
      setAmount('');
      setRemarks('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);
  const toOptions = useMemo(
    () => wallets.filter((w) => w.id !== fromWalletId),
    [wallets, fromWalletId],
  );

  const transferMutation = useMutation<
    unknown,
    AxiosError<ApiError>,
    { fromWalletId: number; toWalletId: number; amount: number; date: string; remarks?: string }
  >({
    mutationFn: transferBetweenWallets,
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data.message;
      showToast(Array.isArray(message) ? message.join('\n') : message ?? 'Transfer failed. Please try again.');
    },
  });

  const amountNumber = Number(amount);
  const canSubmit =
    fromWalletId != null &&
    toWalletId != null &&
    fromWalletId !== toWalletId &&
    amountNumber > 0;

  const handleSubmit = () => {
    if (!canSubmit || fromWalletId == null || toWalletId == null) {
      showToast('Pick a source wallet, a destination wallet, and an amount.');
      return;
    }
    transferMutation.mutate({
      fromWalletId,
      toWalletId,
      amount: amountNumber,
      date: todayDateOnly(),
      remarks: remarks.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Ionicons name="swap-horizontal" size={18} color={colors.text} />
            <Text style={styles.title}>Transfer between wallets</Text>
          </View>

          {wallets.length < 2 ? (
            <Text style={styles.emptyText}>
              You need at least two wallets to transfer money between them.
            </Text>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Transfer From</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_GAP}
                contentContainerStyle={styles.cardRow}
              >
                {wallets.map((wallet) => (
                  <WalletOption
                    key={wallet.id}
                    wallet={wallet}
                    selected={fromWalletId === wallet.id}
                    onPress={() => {
                      setFromWalletId(wallet.id);
                      if (toWalletId === wallet.id) setToWalletId(null);
                    }}
                  />
                ))}
              </ScrollView>

              <Text style={styles.label}>Transfer To</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_GAP}
                contentContainerStyle={styles.cardRow}
              >
                {toOptions.map((wallet) => (
                  <WalletOption
                    key={wallet.id}
                    wallet={wallet}
                    selected={toWalletId === wallet.id}
                    onPress={() => setToWalletId(wallet.id)}
                  />
                ))}
              </ScrollView>

              <Text style={styles.label}>Amount{fromWallet ? ` (${fromWallet.currency})` : ''}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Remarks (optional)</Text>
              <TextInput
                style={styles.input}
                value={remarks}
                onChangeText={setRemarks}
                placeholder={
                  fromWallet && toWallet
                    ? `Transfer from ${fromWallet.name} to ${toWallet.name}`
                    : undefined
                }
                placeholderTextColor={colors.textMuted}
              />
            </ScrollView>
          )}

          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            {wallets.length >= 2 && (
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  (!canSubmit || transferMutation.isPending) && styles.saveButtonDisabled,
                  pressed && canSubmit && styles.saveButtonPressed,
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit || transferMutation.isPending}
              >
                {transferMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Transfer</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const CARD_WIDTH = 190;
const CARD_GAP = 10;

// One big card per wallet, swipeable horizontally — mirrors a bank app's
// "Account Transfer" picker (name + currency chip up top, a divider, then
// the balance) rather than a plain row, so both sides of the transfer stay
// glanceable while picking. Matches Client/src/components/wallet/TransferModal.tsx.
function WalletOption({
  wallet,
  selected,
  onPress,
}: {
  wallet: IWalletRecordWithCategory;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.walletCard, selected && styles.walletCardSelected]}
      onPress={onPress}
    >
      <View style={styles.walletCardTop}>
        <Text
          style={[styles.walletCardName, selected && styles.walletCardNameSelected]}
          numberOfLines={1}
        >
          {wallet.name}
        </Text>
        <View style={[styles.walletCardChip, selected && styles.walletCardChipSelected]}>
          <Text style={[styles.walletCardChipText, selected && styles.walletCardChipTextSelected]}>
            {wallet.currency}
          </Text>
        </View>
      </View>

      <View style={[styles.walletCardDivider, selected && styles.walletCardDividerSelected]} />

      <View>
        <Text style={[styles.walletCardLabel, selected && styles.walletCardLabelSelected]}>
          AVAILABLE BALANCE
        </Text>
        <Text style={[styles.walletCardBalance, selected && styles.walletCardBalanceSelected]}>
          {formatCurrency(getBalance(wallet), wallet.currency)}
        </Text>
      </View>
    </Pressable>
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
    maxHeight: '85%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    maxHeight: 420,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 6,
  },
  cardRow: {
    gap: CARD_GAP,
    paddingVertical: 2,
    paddingRight: 4,
  },
  walletCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
  },
  walletCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  walletCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  walletCardName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  walletCardNameSelected: {
    color: '#fff',
  },
  walletCardChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.primarySoft,
  },
  walletCardChipSelected: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  walletCardChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  walletCardChipTextSelected: {
    color: '#fff',
  },
  walletCardDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  walletCardDividerSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  walletCardLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textFaint,
    marginBottom: 2,
  },
  walletCardLabelSelected: {
    color: 'rgba(255,255,255,0.75)',
  },
  walletCardBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  walletCardBalanceSelected: {
    color: '#fff',
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 92,
    alignItems: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
