import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { fetchWallets } from '@/apis/wallet';
import { fetchRecords } from '@/apis/record';
import { useAuth } from '@/provider/AuthProvider';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { updateFavWallet } from '@/store/walletSlice';
import { ICategory, IRecord, IRecordWithCategory, IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';
import IconSelector from '@/components/IconSelector';
import RecordFormModal from '@/components/record/RecordFormModal';
import Skeleton from '@/components/Skeleton';

function formatMoney(amount: number): string {
  return amount.toFixed(2);
}

function formatDateHeading(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function RecordsScreen() {
  const { userId } = useAuth();
  const dispatch = useAppDispatch();
  const favWalletId = useAppSelector((state) => state.wallet.id);

  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<IRecord | null>(null);
  const [editCategory, setEditCategory] = useState<ICategory | null>(null);

  const {
    data: wallets,
    isLoading: isWalletsLoading,
  } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  // Mirrors Client/src/provider/RecordDataProvider.tsx's default-to-first-
  // wallet behaviour: an unset (0) or stale favourite id falls back to the
  // first wallet returned for the user.
  const favWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return undefined;
    if (favWalletId === 0) return wallets[0];
    return wallets.find((w) => w.id === favWalletId) ?? wallets[0];
  }, [wallets, favWalletId]);

  const {
    data: records,
    isLoading: isRecordsLoading,
    isFetching,
    refetch,
  } = useQuery<IRecordWithCategory[]>({
    queryKey: ['records', favWallet?.id],
    queryFn: () => fetchRecords(favWallet!.id),
    enabled: !!favWallet?.id,
  });

  const { income, expense, total } = useMemo(() => {
    return (records ?? []).reduce(
      (acc, record) => {
        if (record.category.type === 'expense') {
          acc.expense += Number(record.price);
        } else {
          acc.income += Number(record.price);
        }
        acc.total = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, total: 0 },
    );
  }, [records]);

  // Group by date, most-recent day first.
  const sections = useMemo(() => {
    const groups = new Map<string, IRecordWithCategory[]>();
    (records ?? []).forEach((record) => {
      const list = groups.get(record.date) ?? [];
      list.push(record);
      groups.set(record.date, list);
    });

    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
      .map(([date, items]) => {
        const dayTotal = items.reduce((acc, r) => {
          const price = r.category.type === 'expense' ? -Number(r.price) : Number(r.price);
          return acc + price;
        }, 0);
        return { title: date, dayTotal, data: items };
      });
  }, [records]);

  const isLoading = isWalletsLoading || (isRecordsLoading && !!favWallet);

  const openCreateModal = () => {
    setEditRecord(null);
    setEditCategory(null);
    setModalVisible(true);
  };

  const openEditModal = (record: IRecordWithCategory) => {
    const { category, ...rest } = record;
    setEditRecord(rest);
    setEditCategory(category);
    setModalVisible(true);
  };

  const openWalletSwitcher = () => {
    if (!wallets || wallets.length === 0) return;
    const walletButtons: { text: string; onPress: () => void; style?: 'cancel' | 'destructive' | 'default' }[] =
      wallets.map((w) => ({
        text: `${w.name} (${w.currency})${w.id === favWallet?.id ? ' ✓' : ''}`,
        onPress: () => dispatch(updateFavWallet(w.id)),
      }));
    walletButtons.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' });

    Alert.alert('Select wallet', undefined, walletButtons);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {isWalletsLoading ? (
        <View style={styles.listContent}>
          <Skeleton height={140} borderRadius={14} style={{ marginTop: 12 }} />
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} height={54} borderRadius={12} style={{ marginTop: 10 }} />
          ))}
        </View>
      ) : !favWallet ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No wallet yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a wallet on the Wallets tab to start tracking records.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Pressable style={styles.switchButton} onPress={openWalletSwitcher} hitSlop={8}>
              <Ionicons name="settings-outline" size={18} color="#fff" />
            </Pressable>
            <Text style={styles.summaryWalletName}>{favWallet.name}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>{formatMoney(income)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expense</Text>
              <Text style={styles.summaryValue}>{formatMoney(expense)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelStrong}>Balance</Text>
              <Text style={styles.summaryValueStrong}>{formatMoney(total)}</Text>
            </View>
            <Text style={styles.summaryCurrency}>{favWallet.currency}</Text>
          </View>

          {isLoading ? (
            <View style={styles.listContent}>
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} height={54} borderRadius={12} style={{ marginBottom: 10 }} />
              ))}
            </View>
          ) : !records || records.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No records yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to add your first income or expense.
              </Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled={false}
              refreshControl={
                <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
              }
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderDate}>{formatDateHeading(section.title)}</Text>
                  <Text
                    style={[
                      styles.sectionHeaderTotal,
                      section.dayTotal < 0 ? styles.negativeText : styles.positiveText,
                    ]}
                  >
                    {section.dayTotal < 0 ? '-' : ''}
                    {formatMoney(Math.abs(section.dayTotal))}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => {
                const isExpense = item.category.type === 'expense';
                return (
                  <Pressable
                    style={({ pressed }) => [styles.recordRow, pressed && styles.recordRowPressed]}
                    onPress={() => openEditModal(item)}
                  >
                    <View style={styles.recordLeft}>
                      <View
                        style={[
                          styles.recordIcon,
                          { backgroundColor: isExpense ? colors.danger : colors.success },
                        ]}
                      >
                        <IconSelector name={item.category.icon} size={16} color="#fff" />
                      </View>
                      <View style={styles.recordTextGroup}>
                        <Text style={styles.recordCategory}>{item.category.name}</Text>
                        {!!item.remarks && <Text style={styles.recordRemarks}>{item.remarks}</Text>}
                      </View>
                    </View>
                    <Text style={[styles.recordAmount, isExpense ? styles.negativeText : styles.positiveText]}>
                      {isExpense ? '-' : '+'}
                      {formatMoney(Number(item.price))}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={openCreateModal}>
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        </>
      )}

      <RecordFormModal
        visible={modalVisible}
        wallet={favWallet}
        record={editRecord}
        category={editCategory}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  switchButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
  },
  summaryWalletName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#fef3c7',
    fontSize: 13,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryLabelStrong: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryValueStrong: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryCurrency: {
    position: 'absolute',
    bottom: 4,
    right: 12,
    color: 'rgba(255,255,255,0.18)',
    fontSize: 42,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionHeaderDate: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  sectionHeaderTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  recordRowPressed: {
    backgroundColor: colors.primarySoft,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTextGroup: {
    flexShrink: 1,
  },
  recordCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  recordRemarks: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  recordAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  positiveText: {
    color: colors.success,
  },
  negativeText: {
    color: colors.danger,
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
