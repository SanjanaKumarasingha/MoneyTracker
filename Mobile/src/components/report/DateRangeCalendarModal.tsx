import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { toDateOnly } from '@/utils/reportPeriods';

type DateRangeCalendarModalProps = {
  visible: boolean;
  initialStart: Date;
  initialEnd: Date;
  onClose: () => void;
  onConfirm: (start: Date, end: Date) => void;
};

// Range-select on one calendar grid: tap a start day, tap an end day, the
// whole span highlights — replaces two separate native OS date pickers.
export default function DateRangeCalendarModal({
  visible,
  initialStart,
  initialEnd,
  onClose,
  onConfirm,
}: DateRangeCalendarModalProps) {
  const [start, setStart] = useState<string | null>(toDateOnly(initialStart));
  const [end, setEnd] = useState<string | null>(toDateOnly(initialEnd));

  const handleDayPress = (day: DateData) => {
    if (!start || (start && end)) {
      setStart(day.dateString);
      setEnd(null);
      return;
    }
    if (day.dateString < start) {
      setEnd(start);
      setStart(day.dateString);
    } else {
      setEnd(day.dateString);
    }
  };

  const markedDates = useMemo(() => {
    if (!start) return {};
    if (!end) {
      return { [start]: { startingDay: true, endingDay: true, color: colors.primary } };
    }
    const marks: Record<string, { color: string; startingDay?: boolean; endingDay?: boolean }> = {};
    const cursor = new Date(start);
    const endDate = new Date(end);
    while (toDateOnly(cursor) <= end) {
      const key = toDateOnly(cursor);
      marks[key] = {
        color: colors.primary,
        startingDay: key === start,
        endingDay: key === end,
      };
      cursor.setDate(cursor.getDate() + 1);
    }
    return marks;
  }, [start, end]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>
            {!start ? 'Pick a start date' : !end ? 'Now pick an end date' : 'Date range selected'}
          </Text>
          <Calendar
            markingType="period"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            maxDate={toDateOnly(new Date())}
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.textMuted,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#fff',
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textFaint,
              arrowColor: colors.primaryDark,
              monthTextColor: colors.text,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
            }}
          />
          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, !(start && end) && styles.primaryButtonDisabled]}
              disabled={!(start && end)}
              onPress={() => {
                if (start && end) onConfirm(new Date(start), new Date(end));
              }}
            >
              <Text style={styles.primaryButtonText}>Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
