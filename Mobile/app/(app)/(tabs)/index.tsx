import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { fetchWallets } from '@/apis/wallet';
import { profile } from '@/apis';
import { useAuth } from '@/provider/AuthProvider';
import { IRecordWithCategory, IUserInfo, IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';
import IconSelector from '@/components/IconSelector';
import Skeleton from '@/components/Skeleton';
import WalletFormModal from '@/components/wallet/WalletFormModal';

// Mirrors the balance calc used throughout the app (Client/src/pages/WalletPage.tsx):
// income records add to the balance, expense records subtract.
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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type RecentEntry = IRecordWithCategory & { walletName: string };

// Home has exactly two jobs: "how am I doing overall" (one total balance,
// this month's income/expenses) and "which wallet do I want" (a plain named
// list — no numbers, no gauges; that detail lives on the wallet's own
// screen). Recent activity gives a last glance at what just happened
// without needing to open a specific wallet.
export default function HomeScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [walletModalVisible, setWalletModalVisible] = useState(false);

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

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = useMemo(() => now.toISOString().slice(0, 7), [now]);

  const { balance, income, expense, recent, currency } = useMemo(() => {
    let balanceTotal = 0;
    let incomeTotal = 0;
    let expenseTotal = 0;
    const allRecords: RecentEntry[] = [];

    (wallets ?? []).forEach((wallet) => {
      balanceTotal += getWalletBalance(wallet);
      (wallet.records ?? []).forEach((record) => {
        if (record.date.slice(0, 7) === currentMonthKey) {
          if (record.category.type === 'expense') {
            expenseTotal += Number(record.price);
          } else {
            incomeTotal += Number(record.price);
          }
        }
        allRecords.push({ ...record, walletName: wallet.name });
      });
    });

    allRecords.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.id - a.id;
    });

    return {
      balance: balanceTotal,
      income: incomeTotal,
      expense: expenseTotal,
      recent: allRecords.slice(0, 4),
      currency: wallets?.[0]?.currency ?? 'USD',
    };
  }, [wallets, currentMonthKey]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <LinearGradient
        colors={[colors.heroFrom, colors.heroTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 6 }]}
      >
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.username ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.monthPill}>
            <Text style={styles.monthPillText}>{MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</Text>
          </View>
          <View style={styles.bell}>
            <Ionicons name="notifications-outline" size={16} color="#fff" />
          </View>
        </View>
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          {isLoading ? (
            <Skeleton width={160} height={32} style={{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          ) : (
            <Text style={styles.balanceFigure}>{formatCurrency(balance, currency)}</Text>
          )}
          <Text style={styles.balanceDelta}>
            {wallets?.length ?? 0} wallet{wallets?.length === 1 ? '' : 's'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.summaryRow}>
            <Skeleton height={64} borderRadius={16} style={{ flex: 1 }} />
            <Skeleton height={64} borderRadius={16} style={{ flex: 1 }} />
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="arrow-down" size={14} color={colors.success} />
              </View>
              <Text style={styles.summaryLabel}>Income ({MONTH_NAMES[now.getMonth()].slice(0, 3)})</Text>
              <Text style={styles.summaryFigure}>{formatCurrency(income, currency)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="arrow-up" size={14} color={colors.danger} />
              </View>
              <Text style={styles.summaryLabel}>Expenses ({MONTH_NAMES[now.getMonth()].slice(0, 3)})</Text>
              <Text style={styles.summaryFigure}>{formatCurrency(expense, currency)}</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Your Wallets</Text>
        </View>

        {isLoading ? (
          <View style={{ gap: 8 }}>
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} height={58} borderRadius={14} />
            ))}
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Couldn&apos;t load your wallets.</Text>
            <Pressable style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {(wallets ?? []).map((wallet) => (
              <Pressable
                key={wallet.id}
                style={({ pressed }) => [styles.walletRow, pressed && styles.walletRowPressed]}
                onPress={() => router.push(`/wallet/${wallet.id}`)}
              >
                <View style={styles.walletIcon}>
                  <Text style={styles.walletIconText}>{wallet.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.walletLabel}>{wallet.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Pressable>
            ))}

            <Pressable
              style={({ pressed }) => [styles.walletRow, styles.walletRowAdd, pressed && styles.walletRowPressed]}
              onPress={() => setWalletModalVisible(true)}
            >
              <View style={[styles.walletIcon, styles.walletIconAdd]}>
                <Ionicons name="add" size={18} color={colors.primaryDark} />
              </View>
              <Text style={[styles.walletLabel, styles.walletLabelAdd]}>Add Wallet</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && recent.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <View style={{ gap: 8 }}>
              {recent.map((record) => {
                const isExpense = record.category.type === 'expense';
                return (
                  <View key={record.id} style={styles.txnRow}>
                    <View
                      style={[
                        styles.txnIcon,
                        { backgroundColor: isExpense ? colors.danger : colors.success },
                      ]}
                    >
                      <IconSelector name={record.category.icon} size={15} color="#fff" />
                    </View>
                    <View style={styles.txnMeta}>
                      <Text style={styles.txnName}>{record.category.name}</Text>
                      <Text style={styles.txnSub}>{record.walletName}</Text>
                    </View>
                    <Text style={[styles.txnAmount, isExpense ? styles.txnExpense : styles.txnIncome]}>
                      {isExpense ? '-' : '+'}
                      {formatCurrency(Number(record.price), currency)}
                    </Text>
                  </View>
                );
              })}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  monthPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  monthPillText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  bell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceBlock: {
    alignItems: 'center',
    paddingTop: 6,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12.5,
    fontWeight: '600',
  },
  balanceFigure: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  balanceDelta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  summaryIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryFigure: {
    fontSize: 15,
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
  centered: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  walletRowPressed: {
    backgroundColor: colors.primarySoft,
  },
  walletRowAdd: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  walletIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIconAdd: {
    backgroundColor: '#fff',
  },
  walletIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  walletLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  walletLabelAdd: {
    color: colors.primaryDark,
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
});
