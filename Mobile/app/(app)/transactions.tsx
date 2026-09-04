import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { fetchWallets } from '@/apis/wallet';
import { deleteRecord } from '@/apis/record';
import { useAuth } from '@/provider/AuthProvider';
import { ECategoryType, ICategory, IRecord, IRecordWithCategory, IWallet, IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { formatCurrency } from '@/utils/currency';
import { groupRecordsByDate } from '@/utils/dateGroup';
import IconSelector from '@/components/IconSelector';
import CurrencyText from '@/components/CurrencyText';
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
  const [filtersExpanded, setFiltersExpanded] = useState(false);
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
      if (typeFilter !== 'all' && entry.category?.type !== typeFilter) return false;
      if (query) {
        const haystack = `${entry.remarks ?? ''} ${entry.category?.name ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [allEntries, walletFilter, typeFilter, search]);

  const { totalIncome, totalExpense } = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => {
        // Transfers move money between the user's own wallets, not real
        // spending/earning — exclude them from this filtered income/expense
        // summary, same as the server excludes them from getWalletSummary.
        if (entry.isTransfer) return acc;
        if (entry.category?.type === 'expense') acc.totalExpense += Number(entry.price);
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
      `Delete "${entry.category?.name ?? 'this transaction'}"${entry.remarks ? ` (${entry.remarks})` : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecordMutation.mutate(entry.id) },
      ],
    );
  };

  const openEdit = (entry: TxnEntry) => {
    // Transfers are a matched pair of records with no real category to
    // edit (see apis/transfer.ts) — editing one side here would desync it
    // from its other half, so the normal edit modal is skipped.
    if (entry.isTransfer) {
      showToast('Transfers can’t be edited — delete and re-create instead.');
      return;
    }
    const { category, wallet, ...rest } = entry;
    setEditRecord(rest);
    setEditCategory(category);
    setEditWallet(wallet);
    setRecordModalVisible(true);
  };

  const walletFilterLabel = walletFilter === 'all' ? 'All wallets' : (wallets ?? []).find((w) => w.id === walletFilter)?.name;
  const activeFilterCount = (walletFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader
        title="Transactions"
        back={{
          onPress: () => router.back(),
          overflow: (
            <Pressable style={styles.filterToggle} onPress={() => setFiltersExpanded((v) => !v)} hitSlop={8}>
              <Text style={styles.filterToggleText} numberOfLines={1}>
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
              <Ionicons name={filtersExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primaryDark} />
            </Pressable>
          ),
        }}
      />

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

      {filtersExpanded && (
        <Animated.View
          entering={FadeInDown.duration(180)}
          exiting={FadeOutUp.duration(140)}
          layout={LinearTransition.springify()}
          style={styles.filterCard}
        >
          <Text style={styles.filterCardLabel}>Wallet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillRow}>
            <Pressable
              style={[styles.filterChip, walletFilter === 'all' && styles.filterChipActive]}
              onPress={() => setWalletFilter('all')}
            >
              <Text style={[styles.filterChipText, walletFilter === 'all' && styles.filterChipTextActive]}>All</Text>
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

          <Text style={[styles.filterCardLabel, styles.filterCardLabelSpaced]}>Type</Text>
          <View style={styles.filterPillRow}>
            <Pressable
              style={[styles.filterChip, typeFilter === 'all' && styles.filterChipActive]}
              onPress={() => setTypeFilter('all')}
            >
              <Text style={[styles.filterChipText, typeFilter === 'all' && styles.filterChipTextActive]}>All</Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, typeFilter === ECategoryType.INCOME && styles.filterChipActive]}
              onPress={() => setTypeFilter(ECategoryType.INCOME)}
            >
              <Text style={[styles.filterChipText, typeFilter === ECategoryType.INCOME && styles.filterChipTextActive]}>Income</Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, typeFilter === ECategoryType.EXPENSE && styles.filterChipActive]}
              onPress={() => setTypeFilter(ECategoryType.EXPENSE)}
            >
              <Text style={[styles.filterChipText, typeFilter === ECategoryType.EXPENSE && styles.filterChipTextActive]}>Expense</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      <Animated.View layout={LinearTransition.springify()} style={styles.summaryCard}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryLabel}>Income{walletFilterLabel && walletFilterLabel !== 'All wallets' ? ` · ${walletFilterLabel}` : ''}</Text>
          <CurrencyText amount={totalIncome} currency={currency} mainStyle={styles.summaryValueIncome} decimalStyle={styles.summaryValueIncomeDecimal} />
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <CurrencyText amount={totalExpense} currency={currency} mainStyle={styles.summaryValueExpense} decimalStyle={styles.summaryValueExpenseDecimal} />
        </View>
      </Animated.View>

      {isLoading ? (
        <View style={styles.scrollContent}>
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} height={72} borderRadius={18} style={{ marginVertical: 4 }} />
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
                const isExpense = entry.category?.type === 'expense';
                const isTransfer = !!entry.isTransfer;
                const cardBg = isTransfer ? '#1E293B' : isExpense ? '#FFF1F2' : '#ECFDF5';
                const iconBg = isTransfer ? 'rgba(255,255,255,0.16)' : isExpense ? 'rgba(220,38,38,0.15)' : 'rgba(22,163,74,0.15)';
                const accentColor = isTransfer ? '#fff' : isExpense ? '#DC2626' : '#16A34A';

                return (
                  <Animated.View key={entry.id} entering={FadeInDown.delay(index * 20)} layout={LinearTransition.springify()}>
                    <Swipeable
                      overshootRight={false}
                      onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      renderRightActions={() => (
                        <Pressable style={styles.swipeDelete} onPress={() => confirmDelete(entry)} accessibilityLabel="Delete transaction">
                          <Ionicons name="trash-outline" size={20} color="#fff" />
                        </Pressable>
                      )}
                    >
                      <PressableScale style={[styles.txnRow, { backgroundColor: cardBg }]} onPress={() => openEdit(entry)}>
                        <View style={[styles.txnIcon, { backgroundColor: iconBg }]}>
                          {entry.category && <IconSelector name={entry.category.icon} size={16} color={accentColor} />}
                        </View>
                        <View style={styles.txnMeta}>
                          <Text style={[styles.txnName, isTransfer && styles.txnNameOnDark]} numberOfLines={1}>
                            {entry.remarks || entry.category?.name || 'Deleted category'}
                          </Text>
                          <View style={styles.txnSubRow}>
                            <Text style={[styles.txnSub, isTransfer && styles.txnSubOnDark]} numberOfLines={1}>
                              {formatDate(entry.date)}
                            </Text>
                            {isTransfer && (
                              <View style={styles.transferBadge}>
                                <Text style={styles.transferBadgeText}>
                                  {entry.transferDirection === 'in' ? 'Received' : 'Sent'}
                                </Text>
                              </View>
                            )}
                            {!isTransfer && walletFilter === 'all' && (
                              <View style={styles.walletTag}>
                                <Text style={styles.walletTagText} numberOfLines={1}>{entry.wallet.name}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={[styles.txnAmount, { color: accentColor }]}>
                          {isExpense ? '-' : '+'}
                          {formatCurrency(Number(entry.price), entry.wallet.currency)}
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
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
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
  filterCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  filterCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  filterCardLabelSpaced: {
    marginTop: spacing.md,
  },
  filterPillRow: {
    flexDirection: 'row',
    gap: 7,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  // A single dual-metric card rather than two separate blocks — mirrors
  // Plan's overview card (stat / divider / stat).
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  summaryStat: {
    flex: 1,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  summaryValueIncome: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
    marginTop: 3,
  },
  summaryValueIncomeDecimal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    opacity: 0.6,
  },
  summaryValueExpense: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.danger,
    marginTop: 3,
  },
  summaryValueExpenseDecimal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    opacity: 0.6,
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
  // iOS-style stacked card — color-coded by type rather than a plain white
  // strip, so the wallet-wide feed still reads at a glance without opening
  // each row.
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 72,
    borderRadius: 18,
    marginVertical: 4,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  swipeDelete: {
    width: 72,
    marginLeft: spacing.sm,
    marginVertical: 4,
    borderRadius: 18,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnMeta: {
    flex: 1,
    minWidth: 0,
  },
  txnName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  txnNameOnDark: {
    color: '#fff',
  },
  txnSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  txnSub: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 1,
  },
  txnSubOnDark: {
    color: 'rgba(255,255,255,0.65)',
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
    maxWidth: 90,
  },
  transferBadge: {
    backgroundColor: 'rgba(37,99,235,0.28)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    flexShrink: 0,
  },
  transferBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
});
