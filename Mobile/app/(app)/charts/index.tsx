import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';

import { fetchWallets } from '@/apis/wallet';
import { fetchRecords } from '@/apis/record';
import { useAuth } from '@/provider/AuthProvider';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { updateFavWallet } from '@/store/walletSlice';
import { ECategoryType, IRecordWithCategory, IWalletRecordWithCategory } from '@/types';
import { colors } from '@/theme/colors';
import IconSelector from '@/components/IconSelector';

// Validated 8-slot categorical palette (light mode), fixed order — see the
// dataviz skill's references/palette.md. Never cycled/regenerated: once a
// wallet has more distinct categories than slots, the smallest ones are
// folded into a neutral "Other" bucket rather than reusing a hue.
const CATEGORY_PALETTE = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
];
const OTHER_COLOR = '#9ca3af';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const screenWidth = Dimensions.get('window').width;

function formatMoney(amount: number): string {
  return amount.toFixed(2);
}

// Native counterpart to Client/src/pages/Chart.tsx (+ PieChart.tsx / Trend.tsx
// / PercentRow.tsx): a wallet selector, a Breakdown/Trend toggle, a
// category-breakdown doughnut with a percentage legend, and a monthly
// income-vs-expense trend for the current year. Scoped down from the web
// version's date-range/GroupByScale/category-filter controls, which don't
// map cleanly onto a small screen or react-native-chart-kit's simpler API.
export default function ChartsScreen() {
  const { userId } = useAuth();
  const dispatch = useAppDispatch();
  const favWalletId = useAppSelector((state) => state.wallet.id);

  const [viewMode, setViewMode] = useState<'breakdown' | 'trend'>('breakdown');
  const [breakdownType, setBreakdownType] = useState<ECategoryType>(ECategoryType.EXPENSE);

  const { data: wallets, isLoading: isWalletsLoading } = useQuery<IWalletRecordWithCategory[]>({
    queryKey: ['wallets', userId],
    queryFn: () => fetchWallets(userId!),
    enabled: !!userId,
  });

  const favWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return undefined;
    if (favWalletId === 0) return wallets[0];
    return wallets.find((w) => w.id === favWalletId) ?? wallets[0];
  }, [wallets, favWalletId]);

  const { data: records, isLoading: isRecordsLoading } = useQuery<IRecordWithCategory[]>({
    queryKey: ['records', favWallet?.id],
    queryFn: () => fetchRecords(favWallet!.id),
    enabled: !!favWallet?.id,
  });

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

  // ---------- Breakdown ----------
  const breakdown = useMemo(() => {
    const filtered = (records ?? []).filter((r) => r.category.type === breakdownType);
    const byCategory = new Map<
      number,
      { name: string; icon: IRecordWithCategory['category']['icon'] | undefined; total: number }
    >();
    filtered.forEach((r) => {
      const existing = byCategory.get(r.category.id);
      const price = Number(r.price);
      if (existing) {
        existing.total += price;
      } else {
        byCategory.set(r.category.id, { name: r.category.name, icon: r.category.icon, total: price });
      }
    });

    const entries = Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
    const total = entries.reduce((acc, e) => acc + e.total, 0);

    const top = entries.slice(0, CATEGORY_PALETTE.length);
    const rest = entries.slice(CATEGORY_PALETTE.length);
    const restTotal = rest.reduce((acc, e) => acc + e.total, 0);

    const rows = top.map((e, i) => ({ ...e, color: CATEGORY_PALETTE[i] }));
    if (restTotal > 0) {
      rows.push({ name: 'Other', icon: undefined, total: restTotal, color: OTHER_COLOR });
    }

    return { rows, total };
  }, [records, breakdownType]);

  // ---------- Trend ----------
  const currentYear = new Date().getFullYear();
  const trend = useMemo(() => {
    const income = new Array(12).fill(0);
    const expense = new Array(12).fill(0);

    (records ?? []).forEach((r) => {
      const date = new Date(r.date);
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;
      const month = date.getMonth();
      if (r.category.type === ECategoryType.EXPENSE) {
        expense[month] += Number(r.price);
      } else {
        income[month] += Number(r.price);
      }
    });

    const hasData = income.some((v) => v > 0) || expense.some((v) => v > 0);
    return { income, expense, hasData };
  }, [records, currentYear]);

  const isLoading = isWalletsLoading || (isRecordsLoading && !!favWallet);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Charts</Text>
        {favWallet && (
          <Pressable style={styles.walletButton} onPress={openWalletSwitcher}>
            <Text style={styles.walletButtonText}>{favWallet.name}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.primaryDark} />
          </Pressable>
        )}
      </View>

      {isWalletsLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !favWallet ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No wallet yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a wallet on the Wallets tab to see charts here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleOption, viewMode === 'breakdown' && styles.toggleOptionActive]}
              onPress={() => setViewMode('breakdown')}
            >
              <Text style={[styles.toggleText, viewMode === 'breakdown' && styles.toggleTextActive]}>
                Breakdown
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleOption, viewMode === 'trend' && styles.toggleOptionActive]}
              onPress={() => setViewMode('trend')}
            >
              <Text style={[styles.toggleText, viewMode === 'trend' && styles.toggleTextActive]}>
                Trend
              </Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : viewMode === 'breakdown' ? (
            <View>
              <View style={styles.typeToggle}>
                {Object.values(ECategoryType).map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.typeToggleOption, breakdownType === type && styles.typeToggleOptionActive]}
                    onPress={() => setBreakdownType(type)}
                  >
                    <Text
                      style={[styles.typeToggleText, breakdownType === type && styles.typeToggleTextActive]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {breakdown.rows.length === 0 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyTitle}>No records</Text>
                  <Text style={styles.emptySubtitle}>
                    No {breakdownType} records for {favWallet.name} yet.
                  </Text>
                </View>
              ) : (
                <>
                  <PieChart
                    data={breakdown.rows.map((row) => ({
                      name: row.name,
                      population: Math.abs(row.total),
                      color: row.color,
                      legendFontColor: colors.text,
                      legendFontSize: 12,
                    }))}
                    width={screenWidth - 32}
                    height={200}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="12"
                    chartConfig={{
                      color: () => colors.text,
                    }}
                    hasLegend={false}
                  />

                  <View style={styles.legendList}>
                    <View style={styles.legendHeaderRow}>
                      <Text style={styles.legendHeaderLabel}>
                        Total {breakdownType.charAt(0).toUpperCase() + breakdownType.slice(1)}
                      </Text>
                      <Text
                        style={[
                          styles.legendHeaderValue,
                          breakdownType === ECategoryType.EXPENSE ? styles.negativeText : styles.positiveText,
                        ]}
                      >
                        {formatMoney(Math.abs(breakdown.total))}
                      </Text>
                    </View>

                    {breakdown.rows.map((row) => {
                      const percent = breakdown.total ? (Math.abs(row.total) / Math.abs(breakdown.total)) * 100 : 0;
                      return (
                        <View key={row.name} style={styles.legendRow}>
                          <View style={styles.legendRowLeft}>
                            <View style={[styles.legendSwatch, { backgroundColor: row.color }]}>
                              {row.icon ? (
                                <IconSelector name={row.icon} size={14} color="#fff" />
                              ) : (
                                <Ionicons name="ellipsis-horizontal" size={14} color="#fff" />
                              )}
                            </View>
                            <Text style={styles.legendRowName}>{row.name}</Text>
                          </View>
                          <View style={styles.legendRowRight}>
                            <Text style={styles.legendRowValue}>{formatMoney(Math.abs(row.total))}</Text>
                            <Text style={styles.legendRowPercent}>{percent.toFixed(1)}%</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.yearLabel}>{currentYear}</Text>
              {!trend.hasData ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyTitle}>No records this year</Text>
                  <Text style={styles.emptySubtitle}>
                    Add income or expense records in {currentYear} to see the trend.
                  </Text>
                </View>
              ) : (
                <LineChart
                  data={{
                    labels: MONTH_LABELS,
                    datasets: [
                      {
                        data: trend.income.map((v) => Number(v.toFixed(2))),
                        color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
                        strokeWidth: 2,
                      },
                      {
                        data: trend.expense.map((v) => Number(v.toFixed(2))),
                        color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                    legend: ['Income', 'Expense'],
                  }}
                  width={screenWidth - 32}
                  height={240}
                  fromZero
                  bezier
                  chartConfig={{
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(24, 24, 27, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(113, 113, 122, ${opacity})`,
                    propsForDots: { r: '3' },
                  }}
                  style={styles.trendChart}
                />
              )}
            </View>
          )}
        </ScrollView>
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  walletButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeToggleOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeToggleOptionActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeToggleTextActive: {
    color: '#fff',
  },
  legendList: {
    marginTop: 8,
  },
  legendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  legendHeaderLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  legendHeaderValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  positiveText: {
    color: colors.success,
  },
  negativeText: {
    color: colors.danger,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  legendRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  legendSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  legendRowRight: {
    alignItems: 'flex-end',
  },
  legendRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  legendRowPercent: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  trendChart: {
    borderRadius: 12,
  },
});
