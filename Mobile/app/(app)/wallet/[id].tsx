import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { fetchWallets } from '@/apis/wallet';
import { deleteRecord } from '@/apis/record';
import { fetchGoalsByWallet } from '@/apis/goal';
import { useAuth } from '@/provider/AuthProvider';
import {
  ICategory,
  IGoalWithProgress,
  IRecord,
  IRecordWithCategory,
  IWalletRecordWithCategory,
} from '@/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import Skeleton from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';
import { showToast } from '@/components/Toast';
import WalletFormModal from '@/components/wallet/WalletFormModal';
import RecordFormModal from '@/components/record/RecordFormModal';
import GoalFormModal from '@/components/goal/GoalFormModal';
import ScreenHeader from '@/components/ScreenHeader';
import CategoryBreakdown from '@/components/wallet/CategoryBreakdown';

function getWalletBalance(wallet: IWalletRecordWithCategory): number {
  return (wallet.records ?? []).reduce((acc, record) => {
    // record.category can be null for records whose category was later
    // deleted (server soft-deletes categories) — skip them rather than
    // crashing the whole wallet detail screen.
    if (!record.category) return acc;
    if (record.category.type === 'expense') {
      return acc - Number(record.price);
    }
    return acc + Number(record.price);
  }, 0);
}

// All-time totals, matching getWalletBalance's scope — these three stat
// cards are a lifetime overview; the CategoryBreakdown below has its own
// period picker for month/week/year/custom-scoped analysis.
function getWalletIncomeExpense(wallet: IWalletRecordWithCategory): { income: number; expense: number } {
  return (wallet.records ?? []).reduce(
    (acc, record) => {
      if (!record.category) return acc;
      if (record.category.type === 'expense') {
        acc.expense += Number(record.price);
      } else {
        acc.income += Number(record.price);
      }
      return acc;
    },
    { income: 0, expense: 0 },
  );
}

function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// The screen every wallet name on Home pushes into — no tab bar (see the
// outer Stack in app/(app)/_layout.tsx), just a back arrow, because you're
// inside one wallet's world now. Merges what used to be two separate
// screens (this Wallet Detail screen, and the standalone Report tab): the
// Balance/Income/Expenses stat row stays wallet-lifetime, and
// CategoryBreakdown below adds Report's period-scoped donut + category
// drilldown, now scoped to this one wallet instead of needing its own
// wallet switcher. Goals no longer get their own section here — a goal
// tied to a category surfaces as a badge on that category's row inside
// CategoryBreakdown instead. The flat chronological transaction list that
// used to live here moved to the cross-wallet /transactions screen — "view
// every transaction across every wallet" and "analyze one wallet's
// spending by category" are different enough jobs that they don't both
// belong on one screen anymore.
export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const walletId = Number(id);
  const router = useRouter();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: wallets,
    isLoading: isWalletsLoading,
    isError: isWalletsError,
    isRefetching: isWalletsRefetching,
    refetch: refetchWallets,
  } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const wallet = useMemo(() => wallets?.find((w) => w.id === walletId), [wallets, walletId]);

  // Drag the gauge/summary area left/right to hop straight to the next or
  // previous wallet (in the same order Home lists them) without a trip
  // back through Home in between — the header title above is what tells
  // you which wallet you landed on. Restricted to this one region (rather
  // than the whole scroll view) so it can't fight the transaction rows'
  // own Swipeable-to-delete gesture or the ScrollView's vertical scroll.
  const walletOrder = useMemo(() => (wallets ?? []).map((w) => w.id), [wallets]);
  const currentWalletIndex = walletOrder.indexOf(walletId);

  const navigateToWallet = useCallback(
    (direction: 1 | -1) => {
      if (walletOrder.length < 2 || currentWalletIndex === -1) return;
      const nextIndex = (currentWalletIndex + direction + walletOrder.length) % walletOrder.length;
      const nextId = walletOrder[nextIndex];
      if (nextId !== undefined && nextId !== walletId) {
        router.replace(`/wallet/${nextId}`);
      }
    },
    [walletOrder, currentWalletIndex, walletId, router],
  );

  const SWIPE_THRESHOLD = 70;
  const dragX = useSharedValue(0);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      dragX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX <= -SWIPE_THRESHOLD) {
        runOnJS(navigateToWallet)(1);
      } else if (e.translationX >= SWIPE_THRESHOLD) {
        runOnJS(navigateToWallet)(-1);
      }
      dragX.value = withSpring(0, { damping: 18, stiffness: 180 });
    });

  // One-time bounce on first mount so the swipe-to-switch-wallet gesture is
  // discoverable without needing a static, easy-to-miss hint icon.
  const bounceX = useSharedValue(0);
  const hintPulse = useSharedValue(0);

  useEffect(() => {
    if (walletOrder.length < 2) return;
    bounceX.value = withDelay(
      400,
      withSequence(
        withTiming(-16, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(10, { duration: 180 }),
        withTiming(0, { duration: 220 }),
      ),
    );
    hintPulse.value = withDelay(
      400,
      withSequence(
        withTiming(1, { duration: 220 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 }),
      ),
    );
    // Only meant to play once when this wallet screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value * 0.4 + bounceX.value }],
  }));
  const leftHintStyle = useAnimatedStyle(() => ({
    opacity: Math.max(Math.min(1, Math.max(0, dragX.value / 60)), hintPulse.value),
  }));
  const rightHintStyle = useAnimatedStyle(() => ({
    opacity: Math.max(Math.min(1, Math.max(0, -dragX.value / 60)), hintPulse.value),
  }));

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

  // Swipe-to-delete on each transaction row (used inside CategoryBreakdown's
  // drilldown) — a faster, more discoverable path than opening the full
  // edit form just to delete something.
  const deleteRecordMutation = useMutation({
    mutationFn: deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
      queryClient.invalidateQueries({ queryKey: ['walletSummary', walletId] });
      queryClient.invalidateQueries({ queryKey: ['goals', walletId] });
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

  const openEditGoal = (goal: IGoalWithProgress) => {
    setSelectedGoal(goal);
    setGoalModalVisible(true);
  };

  if (isWalletsError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        <ErrorState message="Couldn't load this wallet." onRetry={() => refetchWallets()} />
      </SafeAreaView>
    );
  }

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
  const { income, expense } = getWalletIncomeExpense(wallet);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader
        title={wallet.name}
        back={{
          onPress: () => router.back(),
          overflow: (
            <Pressable onPress={() => setEditWalletVisible(true)} hitSlop={10} accessibilityLabel="Edit wallet">
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isWalletsRefetching} onRefresh={() => refetchWallets()} tintColor={colors.primary} />
        }
      >
        <View style={styles.swipeArea}>
          {walletOrder.length > 1 && (
            <>
              <Animated.View style={[styles.swipeHint, styles.swipeHintLeft, leftHintStyle]} pointerEvents="none">
                <Ionicons name="chevron-back" size={18} color={colors.primaryDark} />
              </Animated.View>
              <Animated.View style={[styles.swipeHint, styles.swipeHintRight, rightHintStyle]} pointerEvents="none">
                <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
              </Animated.View>
            </>
          )}
          <GestureDetector gesture={swipeGesture}>
            <Animated.View style={[styles.swipeContent, dragStyle]}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Balance</Text>
                  <Text style={styles.statFigure}>{formatCurrency(balance, wallet.currency)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Income</Text>
                  <Text style={[styles.statFigure, styles.statFigureIncome]}>{formatCurrency(income, wallet.currency)}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Expenses</Text>
                  <Text style={[styles.statFigure, styles.statFigureExpense]}>{formatCurrency(expense, wallet.currency)}</Text>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>

        <CategoryBreakdown
          wallet={wallet}
          goals={goals ?? []}
          onEditRecord={openEditRecord}
          onDeleteRecord={confirmDeleteRecord}
          onEditGoal={openEditGoal}
        />
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
  scroll: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  swipeArea: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  swipeContent: {
    gap: 16,
  },
  swipeHint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  swipeHintLeft: {
    left: 0,
  },
  swipeHintRight: {
    right: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.card,
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
  statFigureIncome: {
    color: colors.success,
  },
  statFigureExpense: {
    color: colors.danger,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
  fabPressed: {
    backgroundColor: colors.primaryDark,
  },
});
