import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchWallets } from '@/apis/wallet';
import { fetchGoalsByWallet } from '@/apis/goal';
import { deleteRecord } from '@/apis/record';
import { useAuth } from '@/provider/AuthProvider';
import { useAppDispatch } from '@/hooks';
import { updateFavWallet } from '@/store/walletSlice';
import { ICategory, IGoalWithProgress, IRecord, IRecordWithCategory, IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import Skeleton from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';
import BrandLogo from '@/components/BrandLogo';
import { showToast } from '@/components/Toast';
import CategoryBreakdown from '@/components/wallet/CategoryBreakdown';
import RecordFormModal from '@/components/record/RecordFormModal';
import GoalFormModal from '@/components/goal/GoalFormModal';

const ALL_WALLETS = 'all' as const;
type WalletFilter = number | typeof ALL_WALLETS;

// The Analytics tab is a thin shell around the existing CategoryBreakdown
// (period pills + donut + category rows) — it already has the whole
// "Time Controls" / "Donut Outflow" / "Category Outflow Rows" feature set
// this screen needs, scoped to whichever wallet(s) are selected via the
// pill row below (CategoryBreakdown merges records client-side, so "All
// Wallets" is just passing it every wallet instead of one).
export default function AnalyticsScreen() {
  const { userId } = useAuth();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [walletFilter, setWalletFilter] = useState<WalletFilter>(ALL_WALLETS);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<IRecord | null>(null);
  const [editCategory, setEditCategory] = useState<ICategory | null>(null);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<IGoalWithProgress | null>(null);

  const {
    data: wallets,
    isLoading: isWalletsLoading,
    isError: isWalletsError,
    isRefetching,
    refetch,
  } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const activeWallets = (wallets ?? []).filter((w) => walletFilter === ALL_WALLETS || w.id === walletFilter);
  // Goals are wallet-scoped server-side — only fetch them for a single
  // selected wallet; "All Wallets" skips goal badges on the category rows
  // rather than fan out N requests for a secondary detail.
  const goalsWalletId = walletFilter === ALL_WALLETS ? undefined : walletFilter;

  const { data: goals } = useQuery<IGoalWithProgress[]>({
    queryKey: ['goals', goalsWalletId],
    queryFn: () => fetchGoalsByWallet(goalsWalletId!),
    enabled: !!goalsWalletId,
  });

  const deleteRecordMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['allGoals'] });
    },
    onError: () => {
      showToast('Could not delete. Please try again.');
    },
  });

  const confirmDeleteRecord = (record: IRecordWithCategory) => {
    Alert.alert(
      'Delete transaction',
      `Delete "${record.category?.name ?? 'this transaction'}"${record.remarks ? ` (${record.remarks})` : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecordMutation.mutate(record.id) },
      ],
    );
  };

  const openEditRecord = (record: IRecordWithCategory) => {
    const { category, ...rest } = record;
    setEditRecord(rest);
    setEditCategory(category);
    setRecordModalVisible(true);
  };

  const openEditGoal = (goal: IGoalWithProgress) => {
    setSelectedGoal(goal);
    setGoalModalVisible(true);
  };

  const selectWallet = (filter: WalletFilter) => {
    setWalletFilter(filter);
    if (filter !== ALL_WALLETS) dispatch(updateFavWallet(filter));
  };

  const recordModalWallet = activeWallets[0] ?? wallets?.[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Spending Breakdown</Text>
        <BrandLogo size={34} />
      </View>

      {isWalletsError ? (
        <ErrorState message="Couldn't load your wallets." onRetry={() => refetch()} />
      ) : isWalletsLoading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={160} borderRadius={80} style={{ alignSelf: 'center', width: 160, marginTop: 12 }} />
        </View>
      ) : !wallets || wallets.length === 0 ? (
        <View style={styles.scrollContent}>
          <Text style={styles.emptyText}>Create a wallet on Home to see spending analytics.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletTabs}
          >
            <Pressable
              style={[styles.walletTab, walletFilter === ALL_WALLETS && styles.walletTabActive]}
              onPress={() => selectWallet(ALL_WALLETS)}
            >
              <Text style={[styles.walletTabText, walletFilter === ALL_WALLETS && styles.walletTabTextActive]}>
                All Wallets
              </Text>
            </Pressable>
            {wallets.map((w) => (
              <Pressable
                key={w.id}
                style={[styles.walletTab, w.id === walletFilter && styles.walletTabActive]}
                onPress={() => selectWallet(w.id)}
              >
                <Text style={[styles.walletTabText, w.id === walletFilter && styles.walletTabTextActive]} numberOfLines={1}>
                  {w.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <CategoryBreakdown
            wallets={activeWallets}
            goals={goals ?? []}
            onEditRecord={openEditRecord}
            onDeleteRecord={confirmDeleteRecord}
            onEditGoal={openEditGoal}
            hideTitle
          />
        </ScrollView>
      )}

      <RecordFormModal
        visible={recordModalVisible}
        wallet={recordModalWallet}
        record={editRecord}
        category={editCategory}
        onClose={() => setRecordModalVisible(false)}
      />
      <GoalFormModal
        visible={goalModalVisible}
        walletId={selectedGoal?.wallet.id ?? recordModalWallet?.id ?? 0}
        goal={selectedGoal}
        onClose={() => setGoalModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  walletTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: spacing.md,
  },
  walletTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  walletTabActive: {
    backgroundColor: colors.primary,
  },
  walletTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
    maxWidth: 140,
  },
  walletTabTextActive: {
    color: '#fff',
  },
});
