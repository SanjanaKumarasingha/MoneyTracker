import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

import { fetchWallets } from '@/apis/wallet';
import { deleteRecord, fetchWalletSummary } from '@/apis/record';
import { fetchGoalsByWallet } from '@/apis/goal';
import { useAuth } from '@/provider/AuthProvider';
import {
  ICategory,
  IGoalWithProgress,
  IRecord,
  IRecordWithCategory,
  IWalletRecordWithCategory,
  IWalletSummary,
} from '@/types';
import { EGoalType } from '@/types/goal-type.enum';
import { colors } from '@/theme/colors';
import { getIncomeRatio, getRatioBand } from '@/utils/ratioBand';
import LiquidGauge from '@/components/LiquidGauge';
import IconSelector from '@/components/IconSelector';
import Skeleton from '@/components/Skeleton';
import WalletFormModal from '@/components/wallet/WalletFormModal';
import RecordFormModal from '@/components/record/RecordFormModal';
import GoalFormModal from '@/components/goal/GoalFormModal';

function getWalletBalance(wallet: IWalletRecordWithCategory): number {
  return (wallet.records ?? []).reduce((acc, record) => {
    if (record.category.type === 'expense') {
      return acc - Number(record.price);
    }
    return acc + Number(record.price);
  }, 0);
}

function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// The screen every wallet name on Home pushes into — no tab bar (see the
// outer Stack in app/(app)/_layout.tsx), just a back arrow, because you're
// inside one wallet's world now. This is where the glass gauge gets a full
// screen instead of competing for space in a small card.
export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const walletId = Number(id);
  const router = useRouter();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: wallets,
    isLoading: isWalletsLoading,
  } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const wallet = useMemo(() => wallets?.find((w) => w.id === walletId), [wallets, walletId]);

  const { data: summary } = useQuery<IWalletSummary>({
    queryKey: ['walletSummary', walletId],
    queryFn: () => fetchWalletSummary(walletId),
    enabled: !!walletId,
  });

  const { data: goals } = useQuery<IGoalWithProgress[]>({
    queryKey: ['goals', walletId],
    queryFn: () => fetchGoalsByWallet(walletId),
    enabled: !!walletId,
  });

  const [editWalletVisible, setEditWalletVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<IRecord | null>(null);
  const [editCategory, setEditCategory] = useState<ICategory | null>(null);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<IGoalWithProgress | null>(null);

  // If the wallet was deleted (from the edit modal below), it will vanish
  // from the refetched list — back out to Home rather than showing a
  // detail screen for a wallet that no longer exists.
  useEffect(() => {
    if (!isWalletsLoading && wallets && !wallet) {
      router.back();
    }
  }, [isWalletsLoading, wallets, wallet, router]);

  // Swipe-to-delete on each transaction row — a faster, more discoverable
  // path than opening the full edit form just to delete something.
  const deleteRecordMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
      queryClient.invalidateQueries({ queryKey: ['walletSummary', walletId] });
      queryClient.invalidateQueries({ queryKey: ['goals', walletId] });
      queryClient.invalidateQueries({ queryKey: ['allGoals'] });
    },
    onError: () => {
      Alert.alert('Could not delete', 'Please try again.');
    },
  });

  const confirmDeleteRecord = (record: IRecordWithCategory) => {
    Alert.alert(
      'Delete transaction',
      `Delete "${record.category.name}"${record.remarks ? ` (${record.remarks})` : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecordMutation.mutate(record.id) },
      ],
    );
  };

  const sortedRecords = useMemo(() => {
    return [...(wallet?.records ?? [])].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.id - a.id;
    });
  }, [wallet]);

  const openCreateRecord = () => {
    setEditRecord(null);
    setEditCategory(null);
    setRecordModalVisible(true);
  };

  const openEditRecord = (record: IRecordWithCategory) => {
    const { category, ...rest } = record;
    setEditRecord(rest);
    setEditCategory(category);
    setRecordModalVisible(true);
  };

  const openCreateGoal = () => {
    setSelectedGoal(null);
    setGoalModalVisible(true);
  };

  const openEditGoal = (goal: IGoalWithProgress) => {
    setSelectedGoal(goal);
    setGoalModalVisible(true);
  };

  if (isWalletsLoading || !wallet) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        <View style={styles.scroll}>
          <Skeleton width={128} height={128} borderRadius={64} style={{ alignSelf: 'center', marginVertical: 20 }} />
          <Skeleton height={60} borderRadius={14} style={{ marginBottom: 12 }} />
          <Skeleton height={54} borderRadius={12} style={{ marginBottom: 8 }} />
          <Skeleton height={54} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  const balance = getWalletBalance(wallet);
  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;
  const ratio = getIncomeRatio(income, expense);
  const band = getRatioBand(ratio);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{wallet.name}</Text>
        <Pressable onPress={() => setEditWalletVisible(true)} hitSlop={10} accessibilityLabel="Edit wallet">
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.gaugeWrap}>
          <LiquidGauge
            size={128}
            percent={ratio}
            colorLight={band.light}
            colorMid={band.mid}
            colorDeep={band.deep}
            label={`${ratio}%`}
          />
          <Text style={styles.gaugeCaption}>
            {ratio >= 60 ? `${ratio}% of income still unspent this month` : `Only ${ratio}% of income left this month`}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={styles.statFigure}>{formatCurrency(balance, wallet.currency)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statFigure}>{formatCurrency(income, wallet.currency)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statFigure}>{formatCurrency(expense, wallet.currency)}</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <Pressable onPress={openCreateGoal} hitSlop={8}>
            <Text style={styles.sectionLink}>Add</Text>
          </Pressable>
        </View>
        {!goals || goals.length === 0 ? (
          <Text style={styles.emptyText}>No goals for this wallet yet.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {goals.map((goal) => {
              const percent = Math.max(0, Math.min(100, goal.progress.percent));
              const isExceeded = goal.progress.status === 'exceeded';
              return (
                <Pressable key={goal.id} style={styles.goalRow} onPress={() => openEditGoal(goal)}>
                  <View style={styles.goalRowTop}>
                    <Text style={styles.goalName}>
                      {goal.name || (goal.category ? goal.category.name : 'Whole wallet')}
                    </Text>
                    <Text style={styles.goalType}>
                      {goal.type === EGoalType.SAVING ? 'Saving' : 'Limit'}
                    </Text>
                  </View>
                  <View style={styles.goalTrack}>
                    <View
                      style={[
                        styles.goalFill,
                        { width: `${percent}%`, backgroundColor: isExceeded ? colors.danger : colors.primary },
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Transactions</Text>
        </View>
        {sortedRecords.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet — tap + to add one.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {sortedRecords.map((record) => {
              const isExpense = record.category.type === 'expense';
              return (
                <Swipeable
                  key={record.id}
                  overshootRight={false}
                  renderRightActions={() => (
                    <Pressable
                      style={styles.swipeDelete}
                      onPress={() => confirmDeleteRecord(record)}
                      accessibilityLabel="Delete transaction"
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                    </Pressable>
                  )}
                >
                  <Pressable style={styles.txnRow} onPress={() => openEditRecord(record)}>
                    <View style={[styles.txnIcon, { backgroundColor: isExpense ? colors.danger : colors.success }]}>
                      <IconSelector name={record.category.icon} size={15} color="#fff" />
                    </View>
                    <View style={styles.txnMeta}>
                      <Text style={styles.txnName}>{record.category.name}</Text>
                      <Text style={styles.txnSub}>
                        {formatDate(record.date)}
                        {record.remarks ? ` · ${record.remarks}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.txnAmount, isExpense ? styles.txnExpense : styles.txnIncome]}>
                      {isExpense ? '-' : '+'}
                      {formatCurrency(Number(record.price), wallet.currency)}
                    </Text>
                  </Pressable>
                </Swipeable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={openCreateRecord}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <WalletFormModal
        visible={editWalletVisible}
        mode="Edit"
        wallet={wallet}
        onClose={() => setEditWalletVisible(false)}
      />
      <RecordFormModal
        visible={recordModalVisible}
        wallet={wallet}
        record={editRecord}
        category={editCategory}
        onClose={() => setRecordModalVisible(false)}
      />
      <GoalFormModal
        visible={goalModalVisible}
        walletId={walletId}
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
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
    gap: 16,
  },
  gaugeWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  gaugeCaption: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statFigure: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  emptyText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  goalRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  goalRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  goalType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  goalTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 999,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDelete: {
    width: 72,
    marginLeft: 8,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnMeta: {
    flex: 1,
  },
  txnName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  txnSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  txnAmount: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  txnExpense: {
    color: colors.danger,
  },
  txnIncome: {
    color: colors.success,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabPressed: {
    backgroundColor: colors.primaryDark,
  },
});
