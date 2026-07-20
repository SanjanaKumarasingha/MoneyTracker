import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

import { fetchWallets } from '@/apis/wallet';
import { fetchWalletSummary } from '@/apis/record';
import { useAuth } from '@/provider/AuthProvider';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { updateFavWallet } from '@/store/walletSlice';
import { IWalletRecordWithCategory, IWalletSummary, IWalletSummaryCategory } from '@/types';
import { ECategoryType } from '@/types';
import { colors } from '@/theme/colors';
import IconSelector from '@/components/IconSelector';
import Skeleton from '@/components/Skeleton';
import InfinityToggle from '@/components/InfinityToggle';

type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'custom';

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ISO week: Monday through Sunday containing `date`.
function getWeekRange(date: Date) {
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diffToMonday));
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  return { start: toDateOnly(monday), end: toDateOnly(sunday) };
}

function getMonthRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { start: toDateOnly(start), end: toDateOnly(end) };
}

function getYearRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
  return { start: toDateOnly(start), end: toDateOnly(end) };
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

const PERIOD_NOUN: Record<PeriodType, string> = {
  weekly: 'this week',
  monthly: 'this month',
  yearly: 'this year',
  custom: 'in this range',
};

const PREVIOUS_NOUN: Record<PeriodType, string> = {
  weekly: 'last week',
  monthly: 'last month',
  yearly: 'last year',
  custom: 'the previous period',
};

// Validated 8-slot categorical palette, fixed order — once a wallet has
// more distinct categories than slots, the smallest ones fold into a
// neutral "Other" bucket rather than reusing a hue. Mirrors the old
// Charts screen's CATEGORY_PALETTE.
const PALETTE = [
  colors.catTransport,
  colors.catRestaurant,
  colors.catHealth,
  colors.catEducation,
  colors.catShopping,
  colors.catBills,
  '#eda100',
  '#e34948',
];
const OTHER_COLOR = colors.catOther;

const RADIUS = 66;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatMoney(amount: number): string {
  return amount.toFixed(2);
}

type Row = IWalletSummaryCategory & { color: string };

// Replaces the old pie-chart Charts tab: a donut + ranked category list,
// each row with its own mini progress bar and a trend vs. last month —
// sourced from the server's monthly summary (accurate totals, not the
// 6-record-capped record list the old screen used).
export default function ReportScreen() {
  const { userId } = useAuth();
  const dispatch = useAppDispatch();
  const favWalletId = useAppSelector((state) => state.wallet.id);
  const [breakdownType, setBreakdownType] = useState<ECategoryType>(ECategoryType.EXPENSE);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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

  const range = useMemo(() => {
    const now = new Date();
    if (periodType === 'weekly') return getWeekRange(now);
    if (periodType === 'yearly') return getYearRange(now);
    if (periodType === 'custom') {
      const start = customStart <= customEnd ? customStart : customEnd;
      const end = customStart <= customEnd ? customEnd : customStart;
      return { start: toDateOnly(start), end: toDateOnly(end) };
    }
    return getMonthRange(now);
  }, [periodType, customStart, customEnd]);

  const { data: summary, isLoading: isSummaryLoading } = useQuery<IWalletSummary>({
    queryKey: ['walletSummary', favWallet?.id, range.start, range.end],
    queryFn: () => fetchWalletSummary(favWallet!.id, range),
    enabled: !!favWallet?.id,
  });

  const breakdown = useMemo(() => {
    const filtered = (summary?.categories ?? [])
      .filter((c) => c.type === breakdownType)
      .sort((a, b) => b.amount - a.amount);

    const top = filtered.slice(0, PALETTE.length);
    const rest = filtered.slice(PALETTE.length);
    const restTotal = rest.reduce((sum, c) => sum + c.amount, 0);
    const restPrevious = rest.reduce((sum, c) => sum + c.previousAmount, 0);

    const rows: Row[] = top.map((c, i) => ({ ...c, color: PALETTE[i] }));
    if (restTotal > 0) {
      rows.push({
        categoryId: -1,
        name: 'Other',
        icon: undefined as never,
        type: breakdownType,
        amount: restTotal,
        previousAmount: restPrevious,
        color: OTHER_COLOR,
      });
    }

    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return { rows, total };
  }, [summary, breakdownType]);

  const openWalletSwitcher = () => {
    if (!wallets || wallets.length === 0) return;
    const walletButtons: { text: string; onPress: () => void; style?: 'cancel' }[] = wallets.map((w) => ({
      text: `${w.name} (${w.currency})${w.id === favWallet?.id ? ' ✓' : ''}`,
      onPress: () => dispatch(updateFavWallet(w.id)),
    }));
    walletButtons.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' });
    Alert.alert('Select wallet', undefined, walletButtons);
  };

  const isLoading = isWalletsLoading || (isSummaryLoading && !!favWallet);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report</Text>
        {favWallet && (
          <Pressable style={styles.walletButton} onPress={openWalletSwitcher}>
            <Text style={styles.walletButtonText}>{favWallet.name}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.primaryDark} />
          </Pressable>
        )}
      </View>

      {isWalletsLoading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={200} borderRadius={100} style={{ alignSelf: 'center', width: 200 }} />
        </View>
      ) : !favWallet ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No wallet yet</Text>
          <Text style={styles.emptySubtitle}>Create a wallet on Home to see reports here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.periodRow}>
            {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((type) => (
              <Pressable
                key={type}
                style={[styles.periodChip, periodType === type && styles.periodChipActive]}
                onPress={() => setPeriodType(type)}
              >
                <Text style={[styles.periodChipText, periodType === type && styles.periodChipTextActive]}>
                  {PERIOD_LABELS[type]}
                </Text>
              </Pressable>
            ))}
          </View>

          {periodType === 'custom' && (
            <View style={styles.customDateRow}>
              <Pressable style={styles.customDateBox} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.customDateLabel}>From</Text>
                <Text style={styles.customDateValue}>{customStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </Pressable>
              <Pressable style={styles.customDateBox} onPress={() => setShowEndPicker(true)}>
                <Text style={styles.customDateLabel}>To</Text>
                <Text style={styles.customDateValue}>{customEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </Pressable>
            </View>
          )}
          {showStartPicker && (
            <DateTimePicker
              value={customStart}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
              onChange={(event, selectedDate) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (event.type === 'dismissed') { setShowStartPicker(false); return; }
                if (selectedDate) setCustomStart(selectedDate);
                if (Platform.OS === 'android') setShowStartPicker(false);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={customEnd}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
              onChange={(event, selectedDate) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (event.type === 'dismissed') { setShowEndPicker(false); return; }
                if (selectedDate) setCustomEnd(selectedDate);
                if (Platform.OS === 'android') setShowEndPicker(false);
              }}
            />
          )}

          <View style={styles.toggleWrap}>
            <InfinityToggle
              value={breakdownType === ECategoryType.EXPENSE ? 'left' : 'right'}
              onChange={(side) => setBreakdownType(side === 'left' ? ECategoryType.EXPENSE : ECategoryType.INCOME)}
              leftLabel="Expense"
              rightLabel="Income"
              leftColor={colors.danger}
              rightColor={colors.success}
            />
          </View>

          <Text style={styles.sectionTitle}>{breakdownType === 'expense' ? 'Expenses' : 'Income'} Report</Text>

          {isLoading ? (
            <Skeleton height={180} borderRadius={90} style={{ alignSelf: 'center', width: 180, marginTop: 12 }} />
          ) : breakdown.rows.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>No records</Text>
              <Text style={styles.emptySubtitle}>
                No {breakdownType} records for {favWallet.name} {PERIOD_NOUN[periodType]}.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.donutWrap}>
                <Svg width={(RADIUS + STROKE) * 2} height={(RADIUS + STROKE) * 2}>
                  <G rotation={-90} originX={RADIUS + STROKE} originY={RADIUS + STROKE}>
                    {(() => {
                      let cumulative = 0;
                      return breakdown.rows.map((row) => {
                        const fraction = breakdown.total > 0 ? row.amount / breakdown.total : 0;
                        const dash = fraction * CIRCUMFERENCE;
                        const el = (
                          <Circle
                            key={row.categoryId}
                            cx={RADIUS + STROKE}
                            cy={RADIUS + STROKE}
                            r={RADIUS}
                            stroke={row.color}
                            strokeWidth={STROKE}
                            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                            strokeDashoffset={-cumulative}
                            fill="transparent"
                          />
                        );
                        cumulative += dash;
                        return el;
                      });
                    })()}
                  </G>
                </Svg>
                <View style={styles.donutCenter} pointerEvents="none">
                  <Text style={styles.donutCenterLabel}>
                    Total {breakdownType === 'expense' ? 'Expenses' : 'Income'}
                  </Text>
                  <Text style={styles.donutCenterFigure}>{formatMoney(breakdown.total)}</Text>
                </View>
              </View>

              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>All {breakdownType === 'expense' ? 'Expenses' : 'Income'}</Text>
                <Text style={styles.sectionValue}>{formatMoney(breakdown.total)}</Text>
              </View>

              <View style={{ gap: 8 }}>
                {breakdown.rows.map((row) => {
                  const percent = breakdown.total > 0 ? (row.amount / breakdown.total) * 100 : 0;
                  const change =
                    row.previousAmount > 0
                      ? ((row.amount - row.previousAmount) / row.previousAmount) * 100
                      : row.amount > 0
                        ? 100
                        : 0;
                  const isBad = breakdownType === 'expense' ? change > 0 : change < 0;
                  const trendLabel =
                    row.previousAmount === 0 && row.amount === 0
                      ? `flat vs ${PREVIOUS_NOUN[periodType]}`
                      : `${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs ${PREVIOUS_NOUN[periodType]}`;

                  return (
                    <View key={row.categoryId} style={styles.catRow}>
                      <View style={styles.catRowTop}>
                        <View style={[styles.catDot, { backgroundColor: row.color }]}>
                          {row.icon ? (
                            <IconSelector name={row.icon} size={13} color="#fff" />
                          ) : (
                            <Ionicons name="ellipsis-horizontal" size={13} color="#fff" />
                          )}
                        </View>
                        <View style={styles.catMeta}>
                          <Text style={styles.catName}>{row.name}</Text>
                          <Text style={styles.catPercent}>{percent.toFixed(1)}% of total</Text>
                        </View>
                        <View style={styles.catAmounts}>
                          <Text style={styles.catAmount}>{formatMoney(row.amount)}</Text>
                          <Text style={[styles.catTrend, { color: isBad ? colors.danger : colors.success }]}>
                            {trendLabel}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.catTrack}>
                        <View style={[styles.catFill, { width: `${percent}%`, backgroundColor: row.color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
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
    gap: 14,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  periodChipTextActive: {
    color: '#fff',
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customDateBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customDateLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  customDateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  toggleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  donutCenterFigure: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  catRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  catRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catDot: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catMeta: {
    flex: 1,
    minWidth: 0,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  catPercent: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  catAmounts: {
    alignItems: 'flex-end',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  catTrend: {
    fontSize: 10,
    fontWeight: '600',
  },
  catTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 999,
  },
});
