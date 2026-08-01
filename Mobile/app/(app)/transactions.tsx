import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { fetchWallets } from '@/apis/wallet';
import { deleteRecord } from '@/apis/record';
import { useAuth } from '@/provider/AuthProvider';
import { ECategoryType, ICategory, IRecord, IRecordWithCategory, IWallet, IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { groupRecordsByDate } from '@/utils/dateGroup';
import IconSelector from '@/components/IconSelector';
import Skeleton from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';
import PressableScale from '@/components/PressableScale';
import { showToast } from '@/components/Toast';
import ScreenHeader from '@/components/ScreenHeader';
import RecordFormModal from '@/components/record/RecordFormModal';

type TypeFilter = 'all' | ECategoryType.INCOME | ECategoryType.EXPENSE;
type TxnEntry = IRecordWithCategory & { wallet: IWallet };

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// Every transaction across every wallet, in one searchable, filterable
// ledger — the flat chronological view that used to live on the Wallet
// Detail screen before that screen became category-first (see
// wallet/[id].tsx + CategoryBreakdown). Reached from Home's "All
// Transactions" quick action, or from a specific wallet's "All
// transactions" link (which pre-selects that wallet's filter chip).
export default function TransactionsScreen() {
  const { walletId: initialWalletId } = useLocalSearchParams<{ walletId?: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [walletFilter, setWalletFilter] = useState<number | 'all'>(
    initialWalletId ? Number(initialWalletId) : 'all',
  );
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [editRecord, setEditRecord] = useState<IRecord | null>(null);
  const [editCategory, setEditCategory] = useState<ICategory | null>(null);
  const [editWallet, setEditWallet] = useState<IWallet | null>(null);
  const [recordModalVisible, setRecordModalVisible] = useState(false);

  const {
    data: wallets,
    isLoading,
    isError,
    refetch,
  } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const currency = wallets?.[0]?.currency ?? 'USD';

  const allEntries = useMemo<TxnEntry[]>(() => {
    const entries: TxnEntry[] = [];
    (wallets ?? []).forEach((wallet) => {
      (wallet.records ?? []).forEach((record) => {
        entries.push({ ...record, wallet });
      });
    });
    entries.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.id - a.id;
    });
    return entries;
  }, [wallets]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allEntries.filter((entry) => {
      if (walletFilter !== 'all' && entry.wallet.id !== walletFilter) return false;
      if (typeFilter !== 'all' && entry.category.type !== typeFilter) return false;
      if (query) {
        const haystack = `${entry.remarks ?? ''} ${entry.category.name}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [allEntries, walletFilter, typeFilter, search]);

  const { totalIncome, totalExpense } = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        if (entry.category.type === 'expense') acc.totalExpense += Number(entry.price);
        else acc.totalIncome += Number(entry.price);
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 },
    );
  }, [filteredEntries]);

  const grouped = useMemo(() => groupRecordsByDate(filteredEntries), [filteredEntries]);

  const deleteRecordMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
      queryClient.invalidateQueries({ queryKey: ['walletSummary'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['allGoals'] });
    },
    onError: () => showToast('Could not delete. Please try again.'),
  });

  const confirmDelete = (entry: TxnEntry) => {
    Alert.alert(
      'Delete transaction',
      `Delete "${entry.category.name}"${entry.remarks ? ` (${entry.remarks})` : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecordMutation.mutate(entry.id) },
      ],
    );
  };

  const openEdit = (entry: TxnEntry) => {
    const { category, wallet, ...rest } = entry;
    setEditRecord(rest);
    setEditCategory(category);
    setEditWallet(wallet);
    setRecordModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader title="Transactions" back={{ onPress: () => router.back() }} />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search remarks, category…"
          placeholderTextColor={colors.textFaint}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        <Pressable
          style={[styles.filterChip, walletFilter === 'all' && styles.filterChipActive]}
          onPress={() => setWalletFilter('all')}
        >
          <Text style={[styles.filterChipText, walletFilter === 'all' && styles.filterChipTextActive]}>All Wallets</Text>
        </Pressable>
        {(wallets ?? []).map((w) => (
          <Pressable
            key={w.id}
            style={[styles.filterChip, walletFilter === w.id && styles.filterChipActive]}
            onPress={() => setWalletFilter(w.id)}
          >
            <Text style={[styles.filterChipText, walletFilter === w.id && styles.filterChipTextActive]}>{w.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.filterRowContent}>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <Pressable
            style={[styles.filterChip, typeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setTypeFilter('all')}
          >
            <Text style={[styles.filterChipText, typeFilter === 'all' && styles.filterChipTextActive]}>All Types</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, typeFilter === ECategoryType.INCOME && styles.filterChipIncomeActive]}
            onPress={() => setTypeFilter(ECategoryType.INCOME)}
          >
            <Text style={[styles.filterChipText, typeFilter === ECategoryType.INCOME && styles.filterChipTextActive]}>Income</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, typeFilter === ECategoryType.EXPENSE && styles.filterChipExpenseActive]}
            onPress={() => setTypeFilter(ECategoryType.EXPENSE)}
          >
            <Text style={[styles.filterChipText, typeFilter === ECategoryType.EXPENSE && styles.filterChipTextActive]}>Expense</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Income (filtered)</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{formatMoney(totalIncome, currency)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Expense (filtered)</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatMoney(totalExpense, currency)}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.scrollContent}>
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} height={58} borderRadius={14} style={{ marginBottom: 8 }} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState message="Couldn't load your transactions." onRetry={() => refetch()} />
      ) : filteredEntries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No transactions found</Text>
          <Text style={styles.emptySubtitle}>Try a different wallet, type, or search term.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {grouped.map((group) => (
            <View key={group.label} style={{ gap: 8, marginBottom: 14 }}>
              <Text style={styles.dateGroupLabel}>{group.label}</Text>
              {group.records.map((entry, index) => {
                const isExpense = entry.category.type === 'expense';
                return (
                  <Animated.View key={entry.id} entering={FadeInDown.delay(index * 20)}>
                    <Swipeable
                      overshootRight={false}
                      onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      renderRightActions={() => (
                        <Pressable style={styles.swipeDelete} onPress={() => confirmDelete(entry)} accessibilityLabel="Delete transaction">
                          <Ionicons name="trash-outline" size={20} color="#fff" />
                        </Pressable>
                      )}
                    >
                      <PressableScale style={styles.txnRow} onPress={() => openEdit(entry)}>
                        <View style={[styles.txnIcon, { backgroundColor: isExpense ? colors.danger : colors.success }]}>
                          <IconSelector name={entry.category.icon} size={15} color="#fff" />
                        </View>
                        <View style={styles.txnMeta}>
                          <Text style={styles.txnName} numberOfLines={1}>{entry.remarks || entry.category.name}</Text>
                          <View style={styles.txnSubRow}>
                            <Text style={styles.txnSub} numberOfLines={1}>{formatDate(entry.date)} · {entry.category.name}</Text>
                            {walletFilter === 'all' && (
                              <View style={styles.walletTag}>
                                <Text style={styles.walletTagText}>{entry.wallet.name}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={[styles.txnAmount, isExpense ? styles.txnExpense : styles.txnIncome]}>
                          {isExpense ? '-' : '+'}
                          {formatMoney(Number(entry.price), entry.wallet.currency)}
                        </Text>
                      </PressableScale>
                    </Swipeable>
                  </Animated.View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      <RecordFormModal
        visible={recordModalVisible}
        wallet={editWallet ?? undefined}
        record={editRecord}
        category={editCategory}
        onClose={() => setRecordModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  filterRow: {
    flexGrow: 0,
  },
  filterRowContent: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  filterChipActive: {
    backgroundColor: colors.text,
  },
  filterChipIncomeActive: {
    backgroundColor: colors.success,
  },
  filterChipExpenseActive: {
    backgroundColor: colors.danger,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  dateGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDelete: {
    width: 72,
    marginLeft: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnMeta: {
    flex: 1,
    minWidth: 0,
  },
  txnName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  txnSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  txnSub: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 1,
  },
  walletTag: {
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    flexShrink: 0,
  },
  walletTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  txnAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 0,
  },
  txnExpense: {
    color: colors.danger,
  },
  txnIncome: {
    color: colors.success,
  },
});
