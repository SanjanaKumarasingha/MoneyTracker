import { DateTime } from 'luxon';

// Shared date-range model for anything that needs "this week / this month /
// this year / a custom span" - Records (list + sheet) today. RecordDataProvider's
// GroupByScale grouping can't express a custom range (it matches a record's
// formatted bucket key against "now"'s), so ranges live here as plain
// inclusive yyyy-MM-dd bounds instead, which also compare correctly as
// strings against Record.date (a DATE column, serialized as 'yyyy-MM-dd').

export type PeriodScale = 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all';

export interface PeriodRange {
  /** Inclusive, yyyy-MM-dd. */
  start: string;
  /** Inclusive, yyyy-MM-dd. */
  end: string;
  label: string;
}

export interface CustomRange {
  from: string;
  to: string;
}

export const PERIOD_SCALE_LABELS: Record<PeriodScale, string> = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
  custom: 'Custom',
  all: 'All time',
};

const ISO = 'yyyy-LL-dd';

const unit = (scale: 'week' | 'month' | 'quarter' | 'year') => scale;

function labelFor(scale: PeriodScale, start: DateTime, end: DateTime): string {
  switch (scale) {
    case 'week': {
      const sameYear = start.year === end.year;
      return `${start.toFormat(sameYear ? 'LLL d' : 'LLL d, yyyy')} – ${end.toFormat('LLL d, yyyy')}`;
    }
    case 'month':
      return start.toFormat('LLLL yyyy');
    case 'quarter':
      return `Q${start.quarter} ${start.year}`;
    case 'year':
      return start.toFormat('yyyy');
    default:
      return `${start.toFormat('LLL d, yyyy')} – ${end.toFormat('LLL d, yyyy')}`;
  }
}

/**
 * Resolve a scale + "how many periods back/forward from now" offset into a
 * concrete inclusive range. Weeks run Monday-Sunday (luxon's ISO default).
 * Returns null for 'all' (no filtering) and for an incomplete/invalid custom
 * range (the caller treats that as "not filtered yet" rather than "empty").
 */
export function getPeriodRange(
  scale: PeriodScale,
  offset = 0,
  custom?: CustomRange,
): PeriodRange | null {
  if (scale === 'all') return null;

  if (scale === 'custom') {
    if (!custom?.from || !custom?.to) return null;
    const from = DateTime.fromFormat(custom.from, ISO);
    const to = DateTime.fromFormat(custom.to, ISO);
    if (!from.isValid || !to.isValid || to < from) return null;
    return { start: custom.from, end: custom.to, label: labelFor('custom', from, to) };
  }

  const anchor = DateTime.now().plus({ [`${unit(scale)}s`]: offset });
  const start = anchor.startOf(scale);
  const end = anchor.endOf(scale);
  return { start: start.toFormat(ISO), end: end.toFormat(ISO), label: labelFor(scale, start, end) };
}

/** Whether a record date (yyyy-MM-dd, optionally with a time suffix) falls in `range`. */
export function isDateInRange(date: string, range: PeriodRange | null): boolean {
  if (!range) return true;
  const day = date.slice(0, 10);
  return day >= range.start && day <= range.end;
}

/** "Today" / "Yesterday" / "Mon, Sep 14" - for grouping headers and activity rows. */
export function relativeDayLabel(date: string): string {
  const day = DateTime.fromFormat(date.slice(0, 10), ISO);
  if (!day.isValid) return date;
  const today = DateTime.now().startOf('day');
  const diff = Math.round(day.diff(today, 'days').days);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  return day.toFormat(day.year === today.year ? 'ccc, LLL d' : 'ccc, LLL d, yyyy');
}
