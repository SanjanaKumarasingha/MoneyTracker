import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { FadeInDown } from 'react-native-reanimated';

import { fetchWallets } from '@/apis/wallet';
import { fetchGoalsByWallet } from '@/apis/goal';
import { useAuth } from '@/provider/AuthProvider';
import { IGoalWithProgress, IWalletRecordWithCategory } from '@/types';
import { EGoalType } from '@/types/goal-type.enum';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { getCategoryColor } from '@/theme/categoryColor';
import { getBudgetStatusColor } from '@/utils/goalStatus';
import IconSelector from '@/components/IconSelector';
import Skeleton from '@/components/Skeleton';
import GoalFormModal from '@/components/goal/GoalFormModal';
import ScreenHeader from '@/components/ScreenHeader';
import ErrorState from '@/components/ErrorState';
import PressableScale from '@/components/PressableScale';
import PercentRing from '@/components/PercentRing';

function formatMoney(amount: number): string {
  return amount.toFixed(2);
}

// How far ahead/behind a saving goal is relative to a straight-line pace
// across its current period — e.g. a goal 20% of the way through its month
// "should" be at roughly 20% progress; falling meaningfully short of that
// gets the plain-language alert banner.
function getScheduleGap(goal: IGoalWithProgress): number | null {
  if (goal.type !== EGoalType.SAVING || !goal.progress.isActive) return null;
  const start = new Date(goal.progress.periodStart).getTime();
  const end = new Date(goal.progress.periodEnd).getTime();
  if (end <= start) return null;
  const expectedPercent = Math.min(100, ((Date.now() - start) / (end - start)) * 100);
  return Math.round(expectedPercent - goal.progress.percent);
}


// Aggregates the existing per-wallet Goals API across every wallet the user
// has, since Plan is now a top-level tab rather than something reached
// through a specific wallet. Saving goals render as a full progress card;
// spending-limit goals ("budgets") render as a compact row with a circular
// percentage badge, color-matched to the same categories used in Report.
export default function PlanScreen() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<IGoalWithProgress | null>(null);
  const [pendingWalletId, setPendingWalletId] = useState<number | null>(null);
  const [walletPickerVisible, setWalletPickerVisible] = useState(false);

  const { data: wallets, isLoading: isWalletsLoading } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const walletIds = useMemo(() => (wallets ?? []).map((w) => w.id), [wallets]);

  const {
    data: allGoals,
    isLoading: isGoalsLoading,
    isError: isGoalsError,
    isRefetching: isGoalsRefetching,
    refetch,
  } = useQuery<IGoalWithProgress[]>({
    queryKey: ['allGoals', walletIds],
    queryFn: async () => {
      const results = await Promise.all(walletIds.map((id) => fetchGoalsByWallet(id)));
      return results.flat();
    },
    enabled: walletIds.length > 0,
  });

  const savingGoals = (allGoals ?? []).filter((g) => g.type === EGoalType.SAVING);
  const limitGoals = (allGoals ?? []).filter((g) => g.type === EGoalType.SPENDING_LIMIT);

  const overview = useMemo(() => {
    const savedActual = savingGoals.reduce((sum, g) => sum + g.progress.actual, 0);
    const savedTarget = savingGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const spentActual = limitGoals.reduce((sum, g) => sum + g.progress.actual, 0);
    const spentTarget = limitGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const overBudgetCount = limitGoals.filter((g) => g.progress.status === 'exceeded').length;
    return { savedActual, savedTarget, spentActual, spentTarget, overBudgetCount };
  }, [savingGoals, limitGoals]);

  const invalidateGoals = () => {
    queryClient.invalidateQueries({ queryKey: ['allGoals'] });
  };

  const openAddGoal = () => {
    if (!wallets || wallets.length === 0) {
      Alert.alert('No wallets yet', 'Create a wallet on Home first.');
      return;
    }
    setSelectedGoal(null);
    if (wallets.length === 1) {
      setPendingWalletId(wallets[0].id);
      setModalVisible(true);
      return;
    }
    setWalletPickerVisible(true);
  };

  const pickWalletForGoal = (walletId: number) => {
    setWalletPickerVisible(false);
    setPendingWalletId(walletId);
    setModalVisible(true);
  };

  const openEditGoal = (goal: IGoalWithProgress) => {
    setPendingWalletId(goal.wallet.id);
    setSelectedGoal(goal);
    setModalVisible(true);
  };

  const closeGoalModal = () => {
    setModalVisible(false);
    invalidateGoals();
  };

  const isLoading = isWalletsLoading || isGoalsLoading;
  const isError = isGoalsError;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader
        title="My Plan"
        right={
          <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]} onPress={openAddGoal}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        }
      />

      {isLoading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={140} borderRadius={18} />
          <Skeleton height={60} borderRadius={14} style={{ marginTop: 10 }} />
          <Skeleton height={60} borderRadius={14} style={{ marginTop: 8 }} />
        </View>
      ) : isError ? (
        <ErrorState message="Couldn't load your goals." onRetry={() => refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isGoalsRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
        >
          {(savingGoals.length > 0 || limitGoals.length > 0) && (
            <View style={styles.overviewCard}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewLabel}>Saved</Text>
                <Text style={styles.overviewFigure}>
                  {formatMoney(overview.savedActual)}
                  <Text style={styles.overviewOf}> / {formatMoney(overview.savedTarget)}</Text>
                </Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewLabel}>Budgeted</Text>
                <Text style={styles.overviewFigure}>
                  {formatMoney(overview.spentActual)}
                  <Text style={styles.overviewOf}> / {formatMoney(overview.spentTarget)}</Text>
                </Text>
                {overview.overBudgetCount > 0 && (
                  <Text style={styles.overviewWarning}>
                    {overview.overBudgetCount} over limit
                  </Text>
                )}
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Goals</Text>
          {savingGoals.length === 0 ? (
            <Text style={styles.emptyText}>No saving goals yet. Tap + to set one.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {savingGoals.map((goal, index) => {
                const percent = Math.max(0, Math.min(100, goal.progress.percent));
                const gap = getScheduleGap(goal);
                const remaining = Math.max(0, Number(goal.targetAmount) - goal.progress.actual);

                return (
                  <PressableScale
                    key={goal.id}
                    style={styles.goalCard}
                    onPress={() => openEditGoal(goal)}
                    entering={FadeInDown.delay(index * 40)}
                  >
                    <View style={styles.goalTop}>
                      <View style={styles.goalIcon}>
                        {goal.category ? (
                          <IconSelector name={goal.category.icon} size={16} color={colors.primaryDark} />
                        ) : (
                          <Ionicons name="airplane-outline" size={16} color={colors.primaryDark} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalTitle}>{goal.name || 'Savings goal'}</Text>
                        <Text style={styles.goalSub}>
                          {goal.wallet.name}
                          {goal.category ? ` · ${goal.category.name}` : ''}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.goalAmount}>
                      {formatMoney(goal.progress.actual)}
                      <Text style={styles.goalAmountOf}> of {formatMoney(Number(goal.targetAmount))}</Text>
                    </Text>
                    <View style={styles.goalTrack}>
                      <View style={[styles.goalFill, { width: `${percent}%` }]} />
                    </View>
                    <View style={styles.goalProgressRow}>
                      <Text style={styles.goalProgressLabel}>Your Progress · {Math.round(percent)}%</Text>
                      <Text style={styles.goalProgressLabel}>{formatMoney(remaining)} Left</Text>
                    </View>
                    {gap !== null && gap > 5 && (
                      <View style={styles.goalAlert}>
                        <Text style={styles.goalAlertText}>
                          You&apos;re {gap}% behind schedule and off target
                        </Text>
                      </View>
                    )}
                  </PressableScale>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionTitle}>Budgets</Text>
          {limitGoals.length === 0 ? (
            <Text style={styles.emptyText}>No spending limits yet. Tap + to set one.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {limitGoals.map((goal, index) => {
                const isExceeded = goal.progress.status === 'exceeded';
                const statusColor = getBudgetStatusColor(goal.progress.percent);
                const iconColor = goal.category ? getCategoryColor(goal.category.id) : colors.primary;
                return (
                  <PressableScale
                    key={goal.id}
                    style={styles.budgetRow}
                    onPress={() => openEditGoal(goal)}
                    entering={FadeInDown.delay(index * 40)}
                  >
                    <View style={[styles.budgetIcon, { backgroundColor: iconColor }]}>
                      {goal.category ? (
                        <IconSelector name={goal.category.icon} size={15} color="#fff" />
                      ) : (
                        <Ionicons name="wallet-outline" size={15} color="#fff" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.budgetName}>
                        {goal.name || (goal.category ? goal.category.name : goal.wallet.name)}
                      </Text>
                      <Text style={styles.budgetSub}>
                        {formatMoney(goal.progress.actual)} of {formatMoney(Number(goal.targetAmount))} · {goal.wallet.name}
                        {isExceeded ? ' — exceeded' : ''}
                      </Text>
                    </View>
                    <PercentRing percent={goal.progress.percent} color={statusColor} />
                  </PressableScale>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={walletPickerVisible} transparent animationType="fade" onRequestClose={() => setWalletPickerVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Which wallet is this goal for?</Text>
            {(wallets ?? []).map((w) => (
              <Pressable key={w.id} style={styles.pickerRow} onPress={() => pickWalletForGoal(w.id)}>
                <Text style={styles.pickerRowText}>{w.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
            <Pressable style={styles.pickerCancel} onPress={() => setWalletPickerVisible(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <GoalFormModal
        visible={modalVisible}
        walletId={pendingWalletId ?? 0}
        goal={selectedGoal}
        onClose={closeGoalModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xxl,
    padding: spacing.md,
    ...shadows.card,
  },
  overviewStat: {
    flex: 1,
  },
  overviewDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.primary,
    opacity: 0.25,
    marginHorizontal: 14,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  overviewFigure: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  overviewOf: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  overviewWarning: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  emptyText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  goalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  goalSub: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  goalAmount: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
  },
  goalAmountOf: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  goalTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.dangerSoft,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  goalProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalProgressLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  goalAlert: {
    backgroundColor: colors.danger,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  goalAlertText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '600',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  budgetIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  budgetSub: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    gap: 4,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  pickerCancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  pickerCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
