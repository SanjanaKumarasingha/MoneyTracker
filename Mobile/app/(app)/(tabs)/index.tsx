import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { fetchWallets } from '@/apis/wallet';
import { fetchGoalsByWallet } from '@/apis/goal';
import { profile } from '@/apis';
import { useAuth } from '@/provider/AuthProvider';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { updateFavWallet } from '@/store/walletSlice';
import { IGoalWithProgress, IRecordWithCategory, IUserInfo, IWalletRecordWithCategory } from '@/types';
import { EGoalType } from '@/types/goal-type.enum';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { getCategoryColor } from '@/theme/categoryColor';
import Skeleton from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';
import PressableScale from '@/components/PressableScale';
import PercentRing from '@/components/PercentRing';
import CurrencyText from '@/components/CurrencyText';
import IconSelector from '@/components/IconSelector';
import WalletFormModal from '@/components/wallet/WalletFormModal';
import TransferModal from '@/components/wallet/TransferModal';
import RecordFormModal from '@/components/record/RecordFormModal';
import { formatCurrency } from '@/utils/currency';

// Mirrors the balance calc used throughout the app (Client/src/pages/WalletPage.tsx):
// income records add to the balance, expense records subtract.
function getWalletBalance(wallet: IWalletRecordWithCategory): number {
  return (wallet.records ?? []).reduce((acc, record) => {
    // record.category can be null for records whose category was later
    // deleted (server soft-deletes categories) — skip them rather than
    // crashing the whole Home screen.
    if (!record.category) return acc;
    if (record.category.type === 'expense') {
      return acc - Number(record.price);
    }
    return acc + Number(record.price);
  }, 0);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// One gradient per card position, cycling if there are more wallets than
// colors — a fixed, recognizable "which wallet is this" cue at a glance,
// the same way a real bank's cards each look different. Deep, sophisticated
// tones (Blue/Emerald/Plum) rather than candy-bright ones, so each still
// reads as a distinct wallet identity as a muted fintech surface.
const CARD_GRADIENTS: [string, string][] = [
  [colors.heroFrom, colors.heroTo],
  ['#059669', '#065f46'],
  ['#9d174d', '#500724'],
];

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Home leads with things worth glancing at: balance + trend, a wallet
// carousel, a single-row quick-action grid, a 5-item recent-activity feed,
// cash flow, top spending, a goal teaser, and one insight. The full flat
// chronological transaction list still lives on /transactions (reachable
// via "See All" / the History quick action) — Recent Activity here is a
// glanceable teaser, not a replacement for it.
export default function HomeScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const favoriteWalletId = useAppSelector((state) => state.wallet.id);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);

  // The hero gradient bleeds under the status bar (SafeAreaView below
  // excludes the 'top' edge on purpose), so the default dark status-bar
  // icons are invisible against it — force light icons while Home has
  // focus, and hand back dark icons (for every other screen's light
  // background) once it doesn't.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  const {
    data: wallets,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const walletIds = useMemo(() => (wallets ?? []).map((w) => w.id), [wallets]);
  const { data: allGoals } = useQuery<IGoalWithProgress[]>({
    queryKey: ['allGoals', walletIds],
    queryFn: async () => {
      const results = await Promise.all(walletIds.map((id) => fetchGoalsByWallet(id)));
      return results.flat();
    },
    enabled: walletIds.length > 0,
  });

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = useMemo(() => now.toISOString().slice(0, 7), [now]);
  const lastMonthKey = useMemo(() => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    return d.toISOString().slice(0, 7);
  }, [now]);

  const {
    balance,
    income,
    expense,
    lastMonthIncome,
    lastMonthExpense,
    topCategories,
    currency,
  } = useMemo(() => {
    let balanceTotal = 0;
    let incomeTotal = 0;
    let expenseTotal = 0;
    let lastIncomeTotal = 0;
    let lastExpenseTotal = 0;
    const categoryTotals = new Map<string, { id: number; amount: number }>();

    (wallets ?? []).forEach((wallet) => {
      balanceTotal += getWalletBalance(wallet);
      (wallet.records ?? []).forEach((record) => {
        // Transfers move money between the user's own wallets — they're not
        // real spending/earning, so (like a deleted-category record) they're
        // excluded from this month/last-month income/expense and top-spending
        // breakdown. They still count toward the balance above via
        // getWalletBalance, which is unaffected by this skip.
        if (!record.category || record.isTransfer) return;

        const monthKey = record.date.slice(0, 7);
        const price = Number(record.price);
        if (monthKey === currentMonthKey) {
          if (record.category.type === 'expense') {
            expenseTotal += price;
            const existing = categoryTotals.get(record.category.name);
            categoryTotals.set(record.category.name, {
              id: record.category.id,
              amount: (existing?.amount ?? 0) + price,
            });
          } else {
            incomeTotal += price;
          }
        } else if (monthKey === lastMonthKey) {
          if (record.category.type === 'expense') lastExpenseTotal += price;
          else lastIncomeTotal += price;
        }
      });
    });

    const ranked = Array.from(categoryTotals.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return {
      balance: balanceTotal,
      income: incomeTotal,
      expense: expenseTotal,
      lastMonthIncome: lastIncomeTotal,
      lastMonthExpense: lastExpenseTotal,
      topCategories: ranked,
      currency: wallets?.[0]?.currency ?? 'USD',
    };
  }, [wallets, currentMonthKey, lastMonthKey]);

  const netThisMonth = income - expense;
  const cashFlowMax = Math.max(income, expense, lastMonthIncome, lastMonthExpense, 1);

  const goalTeaser = useMemo(() => {
    const limitGoals = (allGoals ?? []).filter((g) => g.type === EGoalType.SPENDING_LIMIT);
    if (limitGoals.length > 0) {
      return [...limitGoals].sort((a, b) => b.progress.percent - a.progress.percent)[0];
    }
    const savingGoals = (allGoals ?? []).filter((g) => g.type === EGoalType.SAVING);
    return savingGoals[0] ?? null;
  }, [allGoals]);

  // The wallet the quick-action row's "Add" and "Stats" buttons target —
  // whichever wallet the user was last viewing, falling back to the first
  // one, so those actions land somewhere meaningful without asking.
  const targetWallet = useMemo(
    () => (wallets ?? []).find((w) => w.id === favoriteWalletId) ?? wallets?.[0],
    [wallets, favoriteWalletId],
  );

  type ActivityItem = { record: IRecordWithCategory; currency: string };
  const recentActivity = useMemo<ActivityItem[]>(() => {
    const all: ActivityItem[] = [];
    (wallets ?? []).forEach((wallet) => {
      (wallet.records ?? []).forEach((record) => {
        // Same guard as the balance/aggregate calcs above — skip records
        // whose category was soft-deleted server-side.
        if (!record.category) return;
        all.push({ record, currency: wallet.currency });
      });
    });
    return all
      .sort((a, b) => {
        if (a.record.date !== b.record.date) return a.record.date < b.record.date ? 1 : -1;
        return b.record.id - a.record.id;
      })
      .slice(0, 5);
  }, [wallets]);

  const openWallet = (walletId: number) => {
    dispatch(updateFavWallet(walletId));
    router.push(`/wallet/${walletId}`);
  };

  const requireWallet = (action: () => void) => {
    if (!wallets || wallets.length === 0) {
      Alert.alert('No wallets yet', 'Create a wallet on Home first.');
      return;
    }
    action();
  };

  const openAddRecord = () => requireWallet(() => setRecordModalVisible(true));
  const openStats = () => requireWallet(() => openWallet(targetWallet!.id));

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <LinearGradient
        colors={[colors.heroFrom, colors.heroTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 6 }]}
      >
        <View style={styles.heroTop}>
          <Text style={styles.greeting}>
            {greetingForHour(now.getHours())}, <Text style={styles.greetingName}>{user?.username ?? '—'}</Text>
          </Text>
        </View>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            {isLoading ? (
              <Skeleton width={140} height={28} style={{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            ) : (
              <CurrencyText
                amount={balance}
                currency={currency}
                mainStyle={styles.balanceFigure}
                decimalStyle={styles.balanceFigureDecimal}
              />
            )}
          </View>
          {!isLoading && (
            <View style={styles.trendBadge}>
              <Ionicons name={netThisMonth >= 0 ? 'trending-up' : 'trending-down'} size={12} color="#fff" />
              <Text style={styles.trendBadgeText}>
                {netThisMonth >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netThisMonth), currency)} this month
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
      >
        <View>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Your Wallets</Text>
            {(wallets?.length ?? 0) > 1 && <Text style={styles.sectionHint}>swipe →</Text>}
          </View>

          {isLoading ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton height={116} borderRadius={18} style={{ flex: 1 }} />
              <Skeleton height={116} borderRadius={18} style={{ flex: 1 }} />
            </View>
          ) : isError ? (
            <ErrorState message="Couldn't load your wallets." onRetry={() => refetch()} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.walletScroller}
              contentContainerStyle={styles.walletScrollerContent}
            >
              {(wallets ?? []).map((wallet, index) => (
                <PressableScale
                  key={wallet.id}
                  style={styles.walletCard}
                  onPress={() => openWallet(wallet.id)}
                >
                  <LinearGradient
                    colors={CARD_GRADIENTS[index % CARD_GRADIENTS.length]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.walletCardTop}>
                    <Text style={styles.walletCardName} numberOfLines={1}>{wallet.name}</Text>
                    <View style={styles.walletCardChip} />
                  </View>
                  <CurrencyText
                    amount={getWalletBalance(wallet)}
                    currency={wallet.currency}
                    mainStyle={styles.walletCardBalance}
                    decimalStyle={styles.walletCardBalanceDecimal}
                  />
                  <Text style={styles.walletCardMeta}>
                    {wallet.currency} · {wallet.records?.length ?? 0} record{wallet.records?.length === 1 ? '' : 's'}
                  </Text>
                </PressableScale>
              ))}

              <PressableScale style={[styles.walletCard, styles.walletCardAdd]} onPress={() => setWalletModalVisible(true)}>
                <Ionicons name="add" size={22} color={colors.primaryDark} />
                <Text style={styles.walletCardAddText}>Add Wallet</Text>
              </PressableScale>
            </ScrollView>
          )}
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionItem} onPress={() => setTransferModalVisible(true)}>
            <View style={styles.actionCircle}>
              <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Transfer</Text>
          </Pressable>
          <Pressable style={styles.actionItem} onPress={openAddRecord}>
            <View style={styles.actionCircle}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Add</Text>
          </Pressable>
          <Pressable style={styles.actionItem} onPress={openStats}>
            <View style={styles.actionCircle}>
              <Ionicons name="stats-chart" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Stats</Text>
          </Pressable>
          <Pressable style={styles.actionItem} onPress={() => router.push('/transactions')}>
            <View style={styles.actionCircle}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>History</Text>
          </Pressable>
        </View>

        {!isLoading && !isError && (
          <>
            <View style={styles.card}>
              <View style={styles.sectionRowTight}>
                <Text style={styles.activityTitle}>Recent Activity</Text>
                <Pressable onPress={() => router.push('/transactions')} hitSlop={8}>
                  <Text style={styles.seeAllLink}>See All</Text>
                </Pressable>
              </View>
              {recentActivity.length === 0 ? (
                <Text style={styles.emptyActivityText}>No recent activity yet.</Text>
              ) : (
                <View style={{ gap: 12 }}>
                  {recentActivity.map(({ record, currency: recordCurrency }) => {
                    const isExpense = record.category!.type === 'expense';
                    const signColor = isExpense ? '#E11D48' : '#059669';
                    const tint = getCategoryColor(record.category!.id);
                    return (
                      <View key={record.id} style={styles.activityRow}>
                        <View style={[styles.activityIconBadge, { backgroundColor: `${tint}22` }]}>
                          <IconSelector name={record.category!.icon} size={16} color={tint} />
                        </View>
                        <View style={styles.activityMeta}>
                          <Text style={styles.activityName} numberOfLines={1}>
                            {record.remarks || record.category!.name}
                          </Text>
                          <Text style={styles.activityDate}>{formatDateLabel(record.date)}</Text>
                        </View>
                        <View style={styles.activityAmountWrap}>
                          <Text style={[styles.activitySign, { color: signColor }]}>{isExpense ? '-' : '+'}</Text>
                          <CurrencyText
                            amount={Number(record.price)}
                            currency={recordCurrency}
                            mainStyle={[styles.activityAmount, { color: signColor }]}
                            decimalStyle={[styles.activityAmountDecimal, { color: signColor }]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.sectionRowTight}>
                <Text style={styles.sectionTitle}>Cash Flow</Text>
              </View>
              <View style={styles.cashflowLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.legendText}>Expense</Text>
                </View>
              </View>
              <View style={styles.cashflowBars}>
                <View style={styles.cfGroup}>
                  <View style={styles.cfPair}>
                    <View style={[styles.cfBar, { height: Math.max(4, (lastMonthIncome / cashFlowMax) * 56), backgroundColor: colors.success }]} />
                    <View style={[styles.cfBar, { height: Math.max(4, (lastMonthExpense / cashFlowMax) * 56), backgroundColor: colors.danger }]} />
                  </View>
                  <Text style={styles.cfMonth}>{MONTH_NAMES[(now.getMonth() + 11) % 12].slice(0, 3)}</Text>
                </View>
                <View style={styles.cfGroup}>
                  <View style={styles.cfPair}>
                    <View style={[styles.cfBar, { height: Math.max(4, (income / cashFlowMax) * 56), backgroundColor: colors.success }]} />
                    <View style={[styles.cfBar, { height: Math.max(4, (expense / cashFlowMax) * 56), backgroundColor: colors.danger }]} />
                  </View>
                  <Text style={styles.cfMonth}>{MONTH_NAMES[now.getMonth()].slice(0, 3)}</Text>
                </View>
              </View>
            </View>

            {topCategories.length > 0 && (
              <View style={styles.card}>
                <View style={styles.sectionRowTight}>
                  <Text style={styles.sectionTitle}>Top Spending — {MONTH_NAMES[now.getMonth()]}</Text>
                </View>
                {topCategories.map((cat) => (
                  <View key={cat.id} style={styles.catMiniRow}>
                    <View style={[styles.catMiniDot, { backgroundColor: getCategoryColor(cat.id) }]} />
                    <Text style={styles.catMiniName} numberOfLines={1}>{cat.name}</Text>
                    <View style={styles.catMiniTrack}>
                      <View
                        style={[
                          styles.catMiniFill,
                          { width: `${(cat.amount / topCategories[0].amount) * 100}%`, backgroundColor: getCategoryColor(cat.id) },
                        ]}
                      />
                    </View>
                    <Text style={styles.catMiniAmount} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(cat.amount, currency)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={styles.goalTeaser}
              onPress={() => router.push('/plan')}
            >
              {goalTeaser ? (
                <>
                  <PercentRing
                    percent={goalTeaser.progress.percent}
                    color={goalTeaser.progress.status === 'exceeded' ? colors.danger : colors.success}
                    size={46}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTeaserTitle}>
                      {goalTeaser.name || (goalTeaser.category ? `${goalTeaser.category.name} ${goalTeaser.type === EGoalType.SAVING ? 'goal' : 'limit'}` : 'Wallet goal')}
                    </Text>
                    <Text style={styles.goalTeaserSub}>
                      {formatCurrency(goalTeaser.progress.actual, currency)} of {formatCurrency(Number(goalTeaser.targetAmount), currency)} used
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.insightIcon}>
                    <Ionicons name="flag-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTeaserTitle}>No goals set yet</Text>
                    <Text style={styles.goalTeaserSub}>Set a savings goal or spending limit on the Plan tab.</Text>
                  </View>
                </>
              )}
            </Pressable>

            <View style={[styles.card, styles.insightCard]}>
              <View style={styles.insightIcon}>
                <Ionicons name="bulb-outline" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                {topCategories.length > 0 ? (
                  <>
                    <Text style={styles.insightTitle}>{topCategories[0].name} is your biggest expense this month</Text>
                    <Text style={styles.insightBody}>
                      {formatCurrency(topCategories[0].amount, currency)}
                      {expense > 0 ? ` — ${Math.round((topCategories[0].amount / expense) * 100)}% of this month's spending.` : '.'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.insightTitle}>No spending yet this month</Text>
                    <Text style={styles.insightBody}>Add a record to start seeing insights here.</Text>
                  </>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <WalletFormModal
        visible={walletModalVisible}
        mode="Create"
        wallet={null}
        onClose={() => setWalletModalVisible(false)}
      />
      <TransferModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
      />
      <RecordFormModal
        visible={recordModalVisible}
        wallet={targetWallet}
        record={null}
        category={null}
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
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: 6,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13.5,
    fontWeight: '600',
  },
  greetingName: {
    color: '#fff',
    fontWeight: '800',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  balanceFigure: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 3,
  },
  balanceFigureDecimal: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '700',
  },
  // A neutral translucent "glass" pill rather than a green/red-tinted one —
  // the trending-up/down icon already carries the direction, so the pill
  // itself stays a consistent brand-glass surface either way.
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 3,
  },
  trendBadgeText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionRowTight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  sectionHint: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textFaint,
  },
  walletScroller: {
    marginHorizontal: -spacing.xl,
  },
  walletScrollerContent: {
    paddingHorizontal: spacing.xl,
    gap: 12,
  },
  walletCard: {
    width: 200,
    height: 116,
    borderRadius: 18,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  walletCardAdd: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  walletCardAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  walletCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  walletCardName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#fff',
    opacity: 0.92,
    flexShrink: 1,
    marginRight: 8,
  },
  walletCardChip: {
    width: 24,
    height: 17,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  walletCardBalance: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  walletCardBalanceDecimal: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  walletCardMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.md,
    ...shadows.card,
  },
  cashflowLegend: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  cashflowBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 74,
    gap: 18,
  },
  cfGroup: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  cfPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 56,
  },
  cfBar: {
    width: 16,
    borderRadius: 5,
  },
  cfMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  catMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  catMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  catMiniName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    width: 82,
    flexShrink: 0,
  },
  catMiniTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  catMiniFill: {
    height: '100%',
    borderRadius: 999,
  },
  catMiniAmount: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    width: 78,
    textAlign: 'right',
    flexShrink: 0,
  },
  goalTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.md,
    ...shadows.card,
  },
  goalTeaserTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
  },
  goalTeaserSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  insightCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  insightBody: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  // Single-row, 4-icon quick-action grid — soft ice-blue circles with deep
  // royal-blue icons, replacing the old stacked/conditional button row.
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyActivityText: {
    fontSize: 12.5,
    color: colors.textMuted,
    paddingVertical: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activityIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityMeta: {
    flex: 1,
    minWidth: 0,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  activityDate: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  activityAmountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  activitySign: {
    fontSize: 13,
    fontWeight: '800',
  },
  activityAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  activityAmountDecimal: {
    fontSize: 10,
    fontWeight: '700',
  },
});
