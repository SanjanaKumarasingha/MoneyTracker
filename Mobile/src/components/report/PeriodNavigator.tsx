import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import {
  MONTH_NAMES,
  getWeekInfoForDate,
  getWeekRange,
  getWeekStartByNumber,
  getWeeksInYear,
} from '@/utils/reportPeriods';

type NavigatorPeriodType = 'weekly' | 'monthly' | 'yearly';

type PeriodNavigatorProps = {
  periodType: NavigatorPeriodType;
  value: Date;
  onChange: (date: Date) => void;
  minYear: number;
  maxYear: number;
};

function formatWeekLabel(date: Date): string {
  const { year, week } = getWeekInfoForDate(date);
  const { start, end } = getWeekRange(date);
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startLabel = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = endDate.toLocaleDateString(undefined, { day: 'numeric' });
  return `Week ${week} · ${startLabel}–${endLabel}, ${year}`;
}

function formatMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatYearLabel(date: Date): string {
  return `${date.getUTCFullYear()}`;
}

// Caps forward navigation at the period containing "today" — no point
// letting a user browse into a guaranteed-empty future week/month/year.
function stepDate(periodType: NavigatorPeriodType, date: Date, direction: 1 | -1): Date {
  if (periodType === 'weekly') {
    return new Date(date.getTime() + direction * 7 * 24 * 60 * 60 * 1000);
  }
  if (periodType === 'yearly') {
    return new Date(Date.UTC(date.getUTCFullYear() + direction, 0, 1));
  }
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + direction, 1));
  return next;
}

function isAtOrPastCurrentPeriod(periodType: NavigatorPeriodType, date: Date): boolean {
  const now = new Date();
  if (periodType === 'yearly') return date.getUTCFullYear() >= now.getUTCFullYear();
  if (periodType === 'monthly') {
    return date.getUTCFullYear() > now.getUTCFullYear()
      || (date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() >= now.getUTCMonth());
  }
  const { year, week } = getWeekInfoForDate(date);
  const nowInfo = getWeekInfoForDate(now);
  return year > nowInfo.year || (year === nowInfo.year && week >= nowInfo.week);
}

// Strictly-after-now checks for individual grid cells in the picker sheet —
// the current month/week itself must stay selectable, only ones after it
// are disabled (there's no data to show for the future).
function isMonthStrictlyFuture(year: number, month: number): boolean {
  const now = new Date();
  return year > now.getUTCFullYear() || (year === now.getUTCFullYear() && month > now.getUTCMonth());
}

function isWeekStrictlyFuture(year: number, week: number): boolean {
  const nowInfo = getWeekInfoForDate(new Date());
  return year > nowInfo.year || (year === nowInfo.year && week > nowInfo.week);
}

export default function PeriodNavigator({ periodType, value, onChange, minYear, maxYear }: PeriodNavigatorProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [browseYear, setBrowseYear] = useState(value.getUTCFullYear());

  const label = periodType === 'weekly' ? formatWeekLabel(value)
    : periodType === 'monthly' ? formatMonthLabel(value)
    : formatYearLabel(value);

  const canStepForward = !isAtOrPastCurrentPeriod(periodType, value);

  const openSheet = () => {
    setBrowseYear(value.getUTCFullYear());
    setSheetVisible(true);
  };

  const weeksInBrowseYear = useMemo(() => getWeeksInYear(browseYear), [browseYear]);

  // Monthly gets its own inline, always-visible controls instead of the
  // tap-to-open sheet — a year stepper plus a horizontal sliding strip of
  // month chips you can swipe straight to, no popup in the way.
  if (periodType === 'monthly') {
    const year = value.getUTCFullYear();
    return (
      <View>
        <View style={styles.row}>
          <Pressable
            onPress={() => onChange(new Date(Date.UTC(year - 1, value.getUTCMonth(), 1)))}
            hitSlop={8}
            style={[styles.arrowButton, year <= minYear && styles.arrowButtonDisabled]}
            disabled={year <= minYear}
            accessibilityLabel="Previous year"
          >
            <Ionicons name="chevron-back" size={18} color={year <= minYear ? colors.textFaint : colors.primaryDark} />
          </Pressable>

          <Text style={styles.labelText} numberOfLines={1}>{label}</Text>

          <Pressable
            onPress={() => year < maxYear && onChange(new Date(Date.UTC(year + 1, value.getUTCMonth(), 1)))}
            hitSlop={8}
            style={[styles.arrowButton, year >= maxYear && styles.arrowButtonDisabled]}
            disabled={year >= maxYear}
            accessibilityLabel="Next year"
          >
            <Ionicons name="chevron-forward" size={18} color={year < maxYear ? colors.primaryDark : colors.textFaint} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.monthSlider}
          contentContainerStyle={styles.monthSliderContent}
        >
          {MONTH_NAMES.map((name, index) => {
            const isSelected = value.getUTCMonth() === index;
            const isFuture = isMonthStrictlyFuture(year, index);
            return (
              <Pressable
                key={name}
                disabled={isFuture}
                style={[styles.monthChip, isSelected && styles.monthChipActive, isFuture && styles.monthCellDisabled]}
                onPress={() => onChange(new Date(Date.UTC(year, index, 1)))}
              >
                <Text style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}>{name.slice(0, 3)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(stepDate(periodType, value, -1))}
        hitSlop={8}
        style={styles.arrowButton}
        accessibilityLabel="Previous period"
      >
        <Ionicons name="chevron-back" size={18} color={colors.primaryDark} />
      </Pressable>

      <Pressable onPress={openSheet} style={styles.labelButton}>
        <Text style={styles.labelText} numberOfLines={1}>{label}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.primaryDark} />
      </Pressable>

      <Pressable
        onPress={() => canStepForward && onChange(stepDate(periodType, value, 1))}
        hitSlop={8}
        style={[styles.arrowButton, !canStepForward && styles.arrowButtonDisabled]}
        disabled={!canStepForward}
        accessibilityLabel="Next period"
      >
        <Ionicons name="chevron-forward" size={18} color={canStepForward ? colors.primaryDark : colors.textFaint} />
      </Pressable>

      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              {periodType === 'weekly' ? 'Pick a week' : 'Pick a year'}
            </Text>

            {periodType === 'weekly' && (
              <View style={styles.yearStepperRow}>
                <Pressable
                  onPress={() => setBrowseYear((y) => Math.max(minYear, y - 1))}
                  hitSlop={8}
                  disabled={browseYear <= minYear}
                >
                  <Ionicons name="chevron-back" size={20} color={browseYear <= minYear ? colors.textFaint : colors.primaryDark} />
                </Pressable>
                <Text style={styles.yearStepperText}>{browseYear}</Text>
                <Pressable
                  onPress={() => setBrowseYear((y) => Math.min(maxYear, y + 1))}
                  hitSlop={8}
                  disabled={browseYear >= maxYear}
                >
                  <Ionicons name="chevron-forward" size={20} color={browseYear >= maxYear ? colors.textFaint : colors.primaryDark} />
                </Pressable>
              </View>
            )}

            {periodType === 'weekly' && (
              <ScrollView style={styles.weekList}>
                {Array.from({ length: weeksInBrowseYear }, (_, i) => i + 1).map((weekNumber) => {
                  const weekStart = getWeekStartByNumber(browseYear, weekNumber);
                  const info = getWeekInfoForDate(value);
                  const isSelected = info.year === browseYear && info.week === weekNumber;
                  const isFuture = isWeekStrictlyFuture(browseYear, weekNumber);
                  const { start, end } = getWeekRange(weekStart);
                  const startLabel = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  const endLabel = new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  return (
                    <Pressable
                      key={weekNumber}
                      disabled={isFuture}
                      style={[styles.weekRow, isSelected && styles.weekRowActive, isFuture && styles.weekRowDisabled]}
                      onPress={() => {
                        onChange(weekStart);
                        setSheetVisible(false);
                      }}
                    >
                      <Text style={[styles.weekRowText, isSelected && styles.weekRowTextActive]}>Week {weekNumber}</Text>
                      <Text style={[styles.weekRowSub, isSelected && styles.weekRowTextActive]}>{startLabel} – {endLabel}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {periodType === 'yearly' && (
              <ScrollView style={styles.weekList}>
                {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((year) => {
                  const isSelected = value.getUTCFullYear() === year;
                  return (
                    <Pressable
                      key={year}
                      style={[styles.weekRow, isSelected && styles.weekRowActive]}
                      onPress={() => {
                        onChange(new Date(Date.UTC(year, 0, 1)));
                        setSheetVisible(false);
                      }}
                    >
                      <Text style={[styles.weekRowText, isSelected && styles.weekRowTextActive]}>{year}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  arrowButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  arrowButtonDisabled: {
    backgroundColor: colors.background,
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    maxWidth: '70%',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    maxHeight: '75%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  yearStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  yearStepperText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  monthCellDisabled: {
    opacity: 0.4,
  },
  monthSlider: {
    marginTop: spacing.sm,
  },
  monthSliderContent: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  monthChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadows.card,
  },
  monthChipActive: {
    backgroundColor: colors.primary,
  },
  monthChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  monthChipTextActive: {
    color: '#fff',
  },
  weekList: {
    maxHeight: 380,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  weekRowActive: {
    backgroundColor: colors.primary,
  },
  weekRowDisabled: {
    opacity: 0.4,
  },
  weekRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  weekRowSub: {
    fontSize: 12.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  weekRowTextActive: {
    color: '#fff',
  },
});
