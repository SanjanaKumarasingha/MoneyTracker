import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { fetchWallets } from '@/apis/wallet';
import { useAuth } from '@/provider/AuthProvider';
import { useAppDispatch } from '@/hooks';
import { logout } from '@/store/userSlice';
import { clearStoredToken } from '@/lib/secureStorage';
import { IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';

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

export default function HomeScreen() {
  const { userId } = useAuth();
  const dispatch = useAppDispatch();

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
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
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
            Create a wallet from the web app to start tracking your money here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={wallets}
          keyExtractor={(wallet) => String(wallet.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const balance = getWalletBalance(item);
            const isNegative = balance < 0;
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.walletName}>{item.name}</Text>
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencyBadgeText}>{item.currency}</Text>
                  </View>
                </View>
                <Text style={[styles.balance, isNegative && styles.balanceNegative]}>
                  {formatCurrency(balance, item.currency)}
                </Text>
                <Text style={styles.recordCount}>
                  {(item.records ?? []).length} record
                  {(item.records ?? []).length === 1 ? '' : 's'}
                </Text>
              </View>
            );
          }}
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
});
