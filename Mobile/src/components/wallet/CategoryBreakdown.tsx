import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import {
  ECategoryType,
  IGoalWithProgress,
  IRecordWithCategory,
  IWalletRecordWithCategory,
} from '@/types';
import { EIconName } from '@/types/icon-name.enum';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { getCategoryColor } from '@/theme/categoryColor';
import { getBudgetStatusColor } from '@/utils/goalStatus';
import { getWeekRange, getMonthRange, getYearRange, toDateOnly } from '@/utils/reportPeriods';
import { groupRecordsByDate } from '@/utils/dateGroup';
import { formatCurrency } from '@/utils/currency';
import IconSelector from '@/components/IconSelector';
import PressableScale from '@/components/PressableScale';
import ExpenseIncomeSwitch from '@/components/ExpenseIncomeSwitch';
import CurrencyText from '@/components/CurrencyText';
import PeriodNavigator from '@/components/report/PeriodNavigator';
import DateRangeCalendarModal from '@/components/report/DateRangeCalendarModal';

type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'custom';

const PERIOD_LABELS: Record<PeriodType, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

const PERIOD_NOUN: Record<PeriodType, string> = {
  weekly: 'in the selected week',
  monthly: 'in the selected month',
  yearly: 'in the selected year',
  custom: 'in this range',
};

const PREVIOUS_NOUN: Record<PeriodType, string> = {
  weekly: 'last week',
  monthly: 'last month',
  yearly: 'last year',
  custom: 'the previous period',
};

const MAX_SLICES = 8;
const RADIUS = 60;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Row = {
  categoryId: number;
  name: string;
  icon: EIconName | undefined;
  amount: number;
  previousAmount: number;
  color: string;
};

// A record tagged with which wallet it came from — needed once this
// component can merge records across multiple wallets ("All Wallets" mode),
// since each wallet can have its own currency and the drilldown/txn rows
// need to format with the right one.
type TaggedRecord = IRecordWithCategory & { walletId: number; walletCurrency: string };

type CategoryBreakdownProps = {
  // One wallet (existing per-wallet screens) or several (an "All Wallets"
  // merged view) — either way the breakdown is computed client-side from
  // each wallet's own `.records` (already fetched in full, unbounded) rather
  // than a per-wallet server summary call, so multi-wallet merging is just
  // "concatenate the records" rather than a second data path.
  wallets: IWalletRecordWithCategory[];
  goals: IGoalWithProgress[];
  onEditRecord: (record: IRecordWithCategory) => void;
  onDeleteRecord: (record: IRecordWithCategory) => void;
  onEditGoal: (goal: IGoalWithProgress) => void;
  // Analytics owns its own "Spending Breakdown" header above this
  // component now, so it hides this component's own copy to avoid a
  // duplicate title; wallet/[id].tsx still wants it.
  hideTitle?: boolean;
};

function describePeriod(periodType: PeriodType, range: { start: string; end: string }): string {
  const start = new Date(range.start);
  const end = new Date(range.end);
  if (periodType === 'yearly') return start.getUTCFullYear().toString();
  if (periodType === 'monthly') {
    return start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

// The equivalent immediately-preceding period, for the "vs last month"-style
// trend comparisons — mirrors each period type's own range function rather
// than a fixed day offset, so e.g. "previous month" is a full calendar month
// even when months have different lengths.
function getPreviousRange(
  periodType: PeriodType,
  referenceDate: Date,
  customStart: Date,
  customEnd: Date,
): { start: string; end: string } {
  if (periodType === 'weekly') {
    return getWeekRange(new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  }
  if (periodType === 'yearly') {
    return getYearRange(new Date(Date.UTC(referenceDate.getUTCFullYear() - 1, 0, 1)));
  }
  if (periodType === 'custom') {
    const start = customStart <= customEnd ? customStart : customEnd;
    const end = customStart <= customEnd ? customEnd : customStart;
    const lengthMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const prevStart = new Date(prevEnd.getTime() - lengthMs);
    return { start: toDateOnly(prevStart), end: toDateOnly(prevEnd) };
  }
  return getMonthRange(new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - 1, 1)));
}

// The category-analysis half of the old Report tab — donut + ranked
// category list, and tapping a category drills into its actual
// transactions for the selected period. Goals aren't shown as their own
// section — a goal tied to a category shows as a small status badge right
// on that category's row instead.
export default function CategoryBreakdown({ wallets, goals, onEditRecord, onDeleteRecord, onEditGoal, hideTitle }: CategoryBreakdownProps) {
  const [breakdownType, setBreakdownType] = useState<ECategoryType>(ECategoryType.EXPENSE);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // A representative currency for the aggregate totals when merging
  // multiple wallets — same convention Home/Plan already use for their
  // own cross-wallet aggregates rather than pretending to convert currencies.
  const currency = wallets[0]?.currency ?? 'USD';

  const allRecords = useMemo<TaggedRecord[]>(() => {
    const merged: TaggedRecord[] = [];
    wallets.forEach((wallet) => {
      (wallet.records ?? []).forEach((record) => {
        if (!record.category) return;
        merged.push({ ...record, walletId: wallet.id, walletCurrency: wallet.currency });
      });
    });
    return merged;
  }, [wallets]);

  const goalForCategory = (categoryId: number): IGoalWithProgress | undefined =>
    goals.find((g) => g.category?.id === categoryId);

  const minYear = useMemo(() => {
    const currentYear = new Date().getUTCFullYear();
    const years = allRecords.map((r) => new Date(r.date).getUTCFullYear());
    if (years.length === 0) return currentYear;
    return Math.min(currentYear, ...years);
  }, [allRecords]);
  const maxYear = new Date().getUTCFullYear();

  const range = useMemo(() => {
    if (periodType === 'weekly') return getWeekRange(referenceDate);
    if (periodType === 'yearly') return getYearRange(referenceDate);
    if (periodType === 'custom') {
      const start = customStart <= customEnd ? customStart : customEnd;
      const end = customStart <= customEnd ? customEnd : customStart;
      return { start: toDateOnly(start), end: toDateOnly(end) };
    }
    return getMonthRange(referenceDate);
  }, [periodType, referenceDate, customStart, customEnd]);

  const previousRange = useMemo(
    () => getPreviousRange(periodType, referenceDate, customStart, customEnd),
    [periodType, referenceDate, customStart, customEnd],
  );

  useEffect(() => {
    setSelectedCategoryId(null);
  }, [breakdownType, range.start, range.end]);

  const breakdown = useMemo(() => {
    const current = new Map<number, { name: string; icon: EIconName | undefined; amount: number }>();
    const previous = new Map<number, number>();

    allRecords.forEach((record) => {
      if (!record.category || record.category.type !== breakdownType) return;
      const price = Number(record.price);
      if (record.date >= range.start && record.date <= range.end) {
        const existing = current.get(record.category.id);
        current.set(record.category.id, {
          name: record.category.name,
          icon: record.category.icon,
          amount: (existing?.amount ?? 0) + price,
        });
      } else if (record.date >= previousRange.start && record.date <= previousRange.end) {
        previous.set(record.category.id, (previous.get(record.category.id) ?? 0) + price);
      }
    });

    const filtered = Array.from(current.entries())
      .map(([categoryId, v]) => ({ categoryId, ...v, previousAmount: previous.get(categoryId) ?? 0 }))
      .sort((a, b) => b.amount - a.amount);

    const top = filtered.slice(0, MAX_SLICES);
    const rest = filtered.slice(MAX_SLICES);
    const restTotal = rest.reduce((sum, c) => sum + c.amount, 0);
    const restPrevious = rest.reduce((sum, c) => sum + c.previousAmount, 0);

    const rows: Row[] = top.map((c) => ({ ...c, color: getCategoryColor(c.categoryId) }));
    if (restTotal > 0) {
      rows.push({
        categoryId: -1,
        name: 'Other',
        icon: undefined,
        amount: restTotal,
        previousAmount: restPrevious,
        color: getCategoryColor(-1),
      });
    }

    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return { rows, total };
  }, [allRecords, breakdownType, range, previousRange]);

  const selectedCategory = breakdown.rows.find((r) => r.categoryId === selectedCategoryId) ?? null;

  const drilldownRecords = useMemo(() => {
    if (!selectedCategory || selectedCategory.categoryId < 0) return [];
    return allRecords
      .filter((r) => r.category?.id === selectedCategory.categoryId && r.date >= range.start && r.date <= range.end)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.id - a.id;
      });
  }, [allRecords, selectedCategory, range]);

  const groupedDrilldown = useMemo(() => groupRecordsByDate(drilldownRecords), [drilldownRecords]);

  const openCategory = (categoryId: number) => {
    if (categoryId < 0) return; // "Other" is a folded bucket, not a real category to drill into.
    setSelectedCategoryId(categoryId);
  };

  const trendDiff = selectedCategory ? selectedCategory.amount - selectedCategory.previousAmount : 0;
  const selectedGoal = selectedCategory ? goalForCategory(selectedCategory.categoryId) : undefined;

  return (
    <View>
      {!hideTitle && <Text style={styles.headerTitle}>Spending Breakdown</Text>}

      {selectedCategory ? (
        <View>
          <Pressable style={styles.backRow} onPress={() => setSelectedCategoryId(null)}>
            <Ionicons name="chevron-back" size={16} color={colors.primaryDark} />
            <Text style={styles.backRowText}>All categories</Text>
          </Pressable>

          <View style={[styles.drillHero, { backgroundColor: selectedCategory.color }]}>
            <Text style={styles.drillHeroLabel}>
              {selectedCategory.name} · {PERIOD_LABELS[periodType]}
            </Text>
            <CurrencyText
              amount={selectedCategory.amount}
              currency={currency}
              containerStyle={styles.drillHeroAmountRow}
              mainStyle={styles.drillHeroAmount}
              decimalStyle={styles.drillHeroAmountDecimal}
            />
            <Text style={styles.drillHeroTrend}>
              {trendDiff === 0 ? 'flat' : `${trendDiff > 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(trendDiff), currency)}`} vs {PREVIOUS_NOUN[periodType]}
            </Text>
            {selectedGoal && (
              <Pressable style={styles.drillGoalBadge} onPress={() => onEditGoal(selectedGoal)}>
                <Text style={styles.drillGoalBadgeText}>
                  Goal: {Math.round(Math.min(100, selectedGoal.progress.percent))}% of {formatCurrency(Number(selectedGoal.targetAmount), currency)}
                </Text>
              </Pressable>
            )}
          </View>

          {drilldownRecords.length === 0 ? (
            <Text style={styles.emptyText}>No {selectedCategory.name} records {PERIOD_NOUN[periodType]}.</Text>
          ) : (
            <View style={{ gap: 14 }}>
              {groupedDrilldown.map((group) => (
                <View key={group.label} style={{ gap: 8 }}>
                  <Text style={styles.dateGroupLabel}>{group.label}</Text>
                  {group.records.map((record, index) => {
                    const tagged = record as TaggedRecord;
                    return (
                      <Animated.View key={record.id} entering={FadeInDown.delay(index * 30)}>
                        <Swipeable
                          overshootRight={false}
                          onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                          renderRightActions={() => (
                            <Pressable
                              style={styles.swipeDelete}
                              onPress={() => onDeleteRecord(record)}
                              accessibilityLabel="Delete transaction"
                            >
                              <Ionicons name="trash-outline" size={20} color="#fff" />
                            </Pressable>
                          )}
                        >
                          <PressableScale style={styles.txnRow} onPress={() => onEditRecord(record)}>
                            <View style={[styles.txnIcon, { backgroundColor: selectedCategory.color }]}>
                              {record.category && <IconSelector name={record.category.icon} size={15} color="#fff" />}
                            </View>
                            <View style={styles.txnMeta}>
                              <Text style={styles.txnName}>{record.remarks || record.category?.name || 'Deleted category'}</Text>
                            </View>
                            <Text style={[styles.txnAmount, breakdownType === 'expense' ? styles.txnExpense : styles.txnIncome]}>
                              {breakdownType === 'expense' ? '-' : '+'}
                              {formatCurrency(Number(record.price), tagged.walletCurrency)}
                            </Text>
                          </PressableScale>
                        </Swipeable>
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View>
          {/* One cohesive, always-visible filter card — period-type pills on
              top, the < Month Year > stepper beneath — replacing the old
              tap-to-expand summary row so there's exactly one filtering
              control, not a collapsed one hiding another. */}
          <View style={styles.filterCard}>
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

            {periodType === 'custom' ? (
              <Pressable style={styles.customDateRow} onPress={() => setCalendarVisible(true)}>
                <View style={styles.customDateBox}>
                  <Text style={styles.customDateLabel}>From</Text>
                  <Text style={styles.customDateValue}>{customStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                <View style={styles.customDateBox}>
                  <Text style={styles.customDateLabel}>To</Text>
                  <Text style={styles.customDateValue}>{customEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
              </Pressable>
            ) : (
              <PeriodNavigator
                periodType={periodType}
                value={referenceDate}
                onChange={setReferenceDate}
                minYear={minYear}
                maxYear={maxYear}
              />
            )}
          </View>
          <DateRangeCalendarModal
            visible={calendarVisible}
            initialStart={customStart}
            initialEnd={customEnd}
            onClose={() => setCalendarVisible(false)}
            onConfirm={(start, end) => {
              setCustomStart(start);
              setCustomEnd(end);
              setCalendarVisible(false);
            }}
          />

          <View style={styles.toggleWrap}>
            <ExpenseIncomeSwitch value={breakdownType} onChange={setBreakdownType} />
          </View>

          {breakdown.rows.length === 0 ? (
            <Text style={styles.emptyText}>
              No {breakdownType} records {PERIOD_NOUN[periodType]}.
            </Text>
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
                            onPress={() => openCategory(row.categoryId)}
                          />
                        );
                        cumulative += dash;
                        return el;
                      });
                    })()}
                  </G>
                </Svg>
                <View style={styles.donutCenter} pointerEvents="none">
                  <Text style={styles.donutCenterLabel}>Total {breakdownType === 'expense' ? 'Expenses' : 'Income'}</Text>
                  <CurrencyText
                    amount={breakdown.total}
                    currency={currency}
                    containerStyle={styles.donutCenterFigureRow}
                    mainStyle={styles.donutCenterFigure}
                    decimalStyle={styles.donutCenterFigureDecimal}
                  />
                </View>
              </View>

              <View style={{ gap: 8 }}>
                {/* Semantic direction color — every row here is already the
                    same breakdownType (the toggle above filters to one side
                    at a time), so the amount and its share-of-total bar read
                    as rose for expenses / emerald for income, while the icon
                    badge keeps its per-category identity color (as a soft
                    pastel tint) so categories stay visually distinguishable
                    from each other. */}
                {breakdown.rows.map((row) => {
                  const directionColor = breakdownType === ECategoryType.EXPENSE ? colors.danger : colors.success;
                  const percent = breakdown.total > 0 ? (row.amount / breakdown.total) * 100 : 0;
                  const change =
                    row.previousAmount > 0
                      ? ((row.amount - row.previousAmount) / row.previousAmount) * 100
                      : row.amount > 0 ? 100 : 0;
                  const isBad = breakdownType === 'expense' ? change > 0 : change < 0;
                  const trendLabel =
                    row.previousAmount === 0 && row.amount === 0
                      ? `flat vs ${PREVIOUS_NOUN[periodType]}`
                      : `${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs ${PREVIOUS_NOUN[periodType]}`;
                  const rowGoal = goalForCategory(row.categoryId);
                  const trendColor = isBad ? colors.danger : colors.success;

                  return (
                    <Pressable key={row.categoryId} style={styles.catRow} onPress={() => openCategory(row.categoryId)}>
                      <View style={styles.catRowTop}>
                        <View style={[styles.catDot, { backgroundColor: `${row.color}33` }]}>
                          {row.icon ? (
                            <IconSelector name={row.icon} size={13} color={row.color} />
                          ) : (
                            <Ionicons name="ellipsis-horizontal" size={13} color={row.color} />
                          )}
                        </View>
                        <View style={styles.catMeta}>
                          <Text style={styles.catName}>{row.name}</Text>
                          <Text style={styles.catPercent}>{percent.toFixed(1)}% of total</Text>
                        </View>
                        <View style={styles.catAmounts}>
                          <Text style={styles.catAmount}>{formatCurrency(row.amount, currency)}</Text>
                          <View style={[styles.catTrendTag, { backgroundColor: `${trendColor}1A` }]}>
                            <Text style={[styles.catTrendText, { color: trendColor }]}>{trendLabel}</Text>
                          </View>
                        </View>
                        {row.categoryId >= 0 && <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />}
                      </View>
                      <View style={styles.catTrack}>
                        <View style={[styles.catFillWrap, { width: `${percent}%` }]}>
                          <LinearGradient
                            colors={[row.color, `${directionColor}A6`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        </View>
                      </View>
                      {rowGoal && (
                        <Pressable
                          style={[styles.goalBadge, { backgroundColor: getBudgetStatusColor(rowGoal.progress.percent) + '22' }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            onEditGoal(rowGoal);
                          }}
                        >
                          <Ionicons name="flag" size={11} color={getBudgetStatusColor(rowGoal.progress.percent)} />
                          <Text style={[styles.goalBadgeText, { color: getBudgetStatusColor(rowGoal.progress.percent) }]}>
                            {Math.round(Math.min(100, rowGoal.progress.percent))}% of {formatCurrency(Number(rowGoal.targetAmount), currency)} goal
                          </Text>
                        </Pressable>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  goalBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  drillGoalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  drillGoalBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#fff',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 999,
    padding: 4,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  periodChipActive: {
    backgroundColor: colors.primary,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  periodChipTextActive: {
    color: '#fff',
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customDateBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  donutCenterFigureRow: {
    marginTop: 2,
  },
  donutCenterFigure: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  donutCenterFigureDecimal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  catRow: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  catRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catDot: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
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
    gap: 3,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  catTrendTag: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catTrendText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  catTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  catFillWrap: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  backRowText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  drillHero: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  drillHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  drillHeroAmountRow: {
    marginTop: 4,
  },
  drillHeroAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  drillHeroAmountDecimal: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  drillHeroTrend: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  dateGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDelete: {
    width: 72,
    marginLeft: spacing.sm,
    borderRadius: radius.xl,
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
