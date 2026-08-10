import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { fetchWalletSummary } from '@/apis/record';
import {
  ECategoryType,
  IGoalWithProgress,
  IRecordWithCategory,
  IWalletRecordWithCategory,
  IWalletSummary,
  IWalletSummaryCategory,
} from '@/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { getCategoryColor } from '@/theme/categoryColor';
import { getBudgetStatusColor } from '@/utils/goalStatus';
import { getWeekRange, getMonthRange, getYearRange, toDateOnly } from '@/utils/reportPeriods';
import { groupRecordsByDate } from '@/utils/dateGroup';
import IconSelector from '@/components/IconSelector';
import Skeleton from '@/components/Skeleton';
import PressableScale from '@/components/PressableScale';
import InfinityToggle from '@/components/InfinityToggle';
import PeriodNavigator from '@/components/report/PeriodNavigator';
import DateRangeCalendarModal from '@/components/report/DateRangeCalendarModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

function formatMoney(amount: number): string {
  return amount.toFixed(2);
}

type Row = IWalletSummaryCategory & { color: string };

type CategoryBreakdownProps = {
  wallet: IWalletRecordWithCategory;
  goals: IGoalWithProgress[];
  onEditRecord: (record: IRecordWithCategory) => void;
  onDeleteRecord: (record: IRecordWithCategory) => void;
  onEditGoal: (goal: IGoalWithProgress) => void;
};

function animateLayoutChange() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

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

// The category-analysis half of the old Report tab, reparented onto a
// specific wallet (it was always scoped to one wallet via a switcher
// anyway) — donut + ranked category list, and tapping a category now drills
// into its actual transactions for the selected period instead of just
// highlighting the slice. Only the period-type controls (Weekly/Monthly/
// Yearly/Custom + the navigator/calendar) collapse behind a tap — the
// expense/income toggle, donut, category list, and drilldown detail always
// stay visible, since those are the actual "spending breakdown" content,
// not configuration for it. Goals aren't shown as their own section
// anymore — a goal tied to a category shows as a small status badge right
// on that category's row instead, since "how's my Food budget doing" is a
// question about Food, not a separate list to cross-reference.
export default function CategoryBreakdown({ wallet, goals, onEditRecord, onDeleteRecord, onEditGoal }: CategoryBreakdownProps) {
  const [periodControlsExpanded, setPeriodControlsExpanded] = useState(false);
  const [breakdownType, setBreakdownType] = useState<ECategoryType>(ECategoryType.EXPENSE);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const togglePeriodControls = () => {
    animateLayoutChange();
    setPeriodControlsExpanded((v) => !v);
  };

  const goalForCategory = (categoryId: number): IGoalWithProgress | undefined =>
    goals.find((g) => g.category?.id === categoryId);

  const minYear = useMemo(() => {
    const currentYear = new Date().getUTCFullYear();
    const years = (wallet.records ?? []).map((r) => new Date(r.date).getUTCFullYear());
    if (years.length === 0) return currentYear;
    return Math.min(currentYear, ...years);
  }, [wallet.records]);
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

  const { data: summary, isLoading } = useQuery<IWalletSummary>({
    queryKey: ['walletSummary', wallet.id, range.start, range.end],
    queryFn: () => fetchWalletSummary(wallet.id, range),
  });

  useEffect(() => {
    setSelectedCategoryId(null);
  }, [breakdownType, range.start, range.end]);

  const breakdown = useMemo(() => {
    const filtered = (summary?.categories ?? [])
      .filter((c) => c.type === breakdownType)
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
        icon: undefined as never,
        type: breakdownType,
        amount: restTotal,
        previousAmount: restPrevious,
        color: getCategoryColor(-1),
      });
    }

    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return { rows, total };
  }, [summary, breakdownType]);

  const selectedCategory = breakdown.rows.find((r) => r.categoryId === selectedCategoryId) ?? null;

  const drilldownRecords = useMemo(() => {
    if (!selectedCategory || selectedCategory.categoryId < 0) return [];
    return (wallet.records ?? [])
      .filter((r) => r.category?.id === selectedCategory.categoryId && r.date >= range.start && r.date <= range.end)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.id - a.id;
      });
  }, [wallet.records, selectedCategory, range]);

  const groupedDrilldown = useMemo(() => groupRecordsByDate(drilldownRecords), [drilldownRecords]);

  const openCategory = (categoryId: number) => {
    if (categoryId < 0) return; // "Other" is a folded bucket, not a real category to drill into.
    setSelectedCategoryId(categoryId);
  };

  const trendDiff = selectedCategory ? selectedCategory.amount - selectedCategory.previousAmount : 0;
  const selectedGoal = selectedCategory ? goalForCategory(selectedCategory.categoryId) : undefined;

  return (
    <View>
      <Text style={styles.headerTitle}>Spending Breakdown</Text>

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
            <Text style={styles.drillHeroAmount}>{formatMoney(selectedCategory.amount)}</Text>
            <Text style={styles.drillHeroTrend}>
              {trendDiff === 0 ? 'flat' : `${trendDiff > 0 ? '↑' : '↓'} ${formatMoney(Math.abs(trendDiff))}`} vs {PREVIOUS_NOUN[periodType]}
            </Text>
            {selectedGoal && (
              <Pressable style={styles.drillGoalBadge} onPress={() => onEditGoal(selectedGoal)}>
                <Text style={styles.drillGoalBadgeText}>
                  Goal: {Math.round(Math.min(100, selectedGoal.progress.percent))}% of {formatMoney(Number(selectedGoal.targetAmount))}
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
                  {group.records.map((record, index) => (
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
                            {formatMoney(Number(record.price))}
                          </Text>
                        </PressableScale>
                      </Swipeable>
                    </Animated.View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View>
          <Pressable style={styles.periodSummaryRow} onPress={togglePeriodControls}>
            <Text style={styles.periodSummaryText}>
              {PERIOD_LABELS[periodType]} · {describePeriod(periodType, range)}
            </Text>
            <Ionicons name={periodControlsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primaryDark} />
          </Pressable>

          {periodControlsExpanded && (
            <View>
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
          )}
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
            <InfinityToggle
              value={breakdownType === ECategoryType.EXPENSE ? 'left' : 'right'}
              onChange={(side) => setBreakdownType(side === 'left' ? ECategoryType.EXPENSE : ECategoryType.INCOME)}
              leftLabel="Expense"
              rightLabel="Income"
              leftColor={colors.danger}
              rightColor={colors.success}
            />
          </View>

          {isLoading ? (
            <Skeleton height={160} borderRadius={80} style={{ alignSelf: 'center', width: 160, marginTop: 12 }} />
          ) : breakdown.rows.length === 0 ? (
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
                  <Text style={styles.donutCenterFigure}>{formatMoney(breakdown.total)}</Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                {breakdown.rows.map((row) => {
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

                  return (
                    <Pressable key={row.categoryId} style={styles.catRow} onPress={() => openCategory(row.categoryId)}>
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
                          <Text style={[styles.catTrend, { color: isBad ? colors.danger : colors.success }]}>{trendLabel}</Text>
                        </View>
                        {row.categoryId >= 0 && <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />}
                      </View>
                      <View style={styles.catTrack}>
                        <View style={[styles.catFill, { width: `${percent}%`, backgroundColor: row.color }]} />
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
                            {Math.round(Math.min(100, rowGoal.progress.percent))}% of {formatMoney(Number(rowGoal.targetAmount))} goal
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
  periodSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  periodSummaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
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
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  customDateBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
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
    borderRadius: radius.xl,
    padding: spacing.md,
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
    width: 28,
    height: 28,
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
  drillHeroAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
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
    borderRadius: radius.xl,
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
