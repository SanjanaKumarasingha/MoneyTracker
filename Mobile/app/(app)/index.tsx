import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { fetchWallets } from '@/apis/wallet';
import { fetchGoalsByWallet } from '@/apis/goal';
import { useAuth } from '@/provider/AuthProvider';
import { useAppDispatch } from '@/hooks';
import { logout } from '@/store/userSlice';
import { clearStoredToken } from '@/lib/secureStorage';
import { IGoalWithProgress, IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';
import LiquidGauge from '@/components/LiquidGauge';
import Skeleton from '@/components/Skeleton';

// Sum of a wallet's records: income records add to the balance, expense
// records subtract — mirroring Client/src/pages/WalletPage.tsx's balance
// calculation (and the walletIncome/walletExpense split computed in
// Client/src/provider/RecordDataProvider.tsx).
function getWalletBalance(wallet: IWalletRecordWithCategory): number {
  return (wallet.records ?? []).reduce((acc, record) => {
    if (record.category.type === 'expense') {
      return acc - Number(record.price);
    }
    return acc + Number(record.price);
  }, 0);
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// Wrapped in its own component (rather than computed inline in renderItem)
// so it's legal to run its own goals query per wallet card.
function WalletGaugeCard({ wallet }: { wallet: IWalletRecordWithCategory }) {
  const balance = getWalletBalance(wallet);
  const isNegative = balance < 0;
  const recordCount = (wallet.records ?? []).length;

  const { data: goals } = useQuery<IGoalWithProgress[]>({
    queryKey: ['goals', wallet.id],
    queryFn: () => fetchGoalsByWallet(wallet.id),
  });

  // Only a whole-wallet goal (no category) drives the gauge here; if
  // several are active, the first one found is shown.
  const activeGoal = goals?.find((goal) => !goal.category && goal.progress.isActive);

  if (!activeGoal) {
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.walletName}>{wallet.name}</Text>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyBadgeText}>{wallet.currency}</Text>
          </View>
        </View>
        <Text style={[styles.balance, isNegative && styles.balanceNegative]}>
          {formatCurrency(balance, wallet.currency)}
        </Text>
        <Text style={styles.recordCount}>
          {recordCount} record{recordCount === 1 ? '' : 's'}
        </Text>
      </View>
    );
  }

  const isLimit = activeGoal.type === 'spending_limit';

  return (
    <View style={[styles.card, styles.cardWithGauge]}>
      <LiquidGauge
        percent={activeGoal.progress.percent}
        size={72}
        fillColor={isLimit && activeGoal.progress.status === 'exceeded' ? colors.danger : colors.primary}
        label={`${Math.round(activeGoal.progress.percent)}%`}
      />
      <View style={styles.gaugeCardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.walletName}>{wallet.name}</Text>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyBadgeText}>{wallet.currency}</Text>
          </View>
        </View>
        <Text style={[styles.balance, isNegative && styles.balanceNegative]}>
          {formatCurrency(balance, wallet.currency)}
        </Text>
        <Text style={styles.goalCaption}>
          {isLimit ? 'Limit' : 'Goal'}: {activeGoal.name ?? (isLimit ? 'Spending limit' : 'Save')}{' '}
          {formatCurrency(Number(activeGoal.targetAmount), wallet.currency)}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { userId } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    data: wallets,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const handleLogout = useCallback(async () => {
    await clearStoredToken();
    dispatch(logout());
    // No manual navigation needed: the root layout's Stack.Protected guards
    // react to `isSignedIn` flipping and swap back to the (auth) group.
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Wallets</Text>
          <Text style={styles.headerSubtitle}>All your wallets in one place.</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Log out</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1, 2].map((key) => (
            <View key={key} style={styles.card}>
              <View style={styles.cardRow}>
                <Skeleton width={120} height={16} />
                <Skeleton width={40} height={18} borderRadius={999} />
              </View>
              <Skeleton width={140} height={24} style={{ marginTop: 10 }} />
              <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn&apos;t load your wallets.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : !wallets || wallets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No wallets yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first wallet to start tracking your money.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => router.push('/wallets')}>
            <Text style={styles.retryButtonText}>Go to Wallets</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={wallets}
          keyExtractor={(wallet) => String(wallet.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => <WalletGaugeCard wallet={item} />}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutButtonPressed: {
    backgroundColor: colors.border,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 12,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardWithGauge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gaugeCardBody: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  currencyBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  currencyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  balance: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
  },
  balanceNegative: {
    color: colors.danger,
  },
  recordCount: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  goalCaption: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
});
