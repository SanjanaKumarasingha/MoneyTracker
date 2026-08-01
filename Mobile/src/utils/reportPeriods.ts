// Monday-based week numbering (not strict ISO-8601 — this app doesn't need
// certified week-numbering compliance, just a stable "Week N of year Y"
// scheme a user can navigate and land back on the same week every time).

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mondayOnOrBefore(date: Date): Date {
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diffToMonday));
}

export function getWeek1Monday(year: number): Date {
  return mondayOnOrBefore(new Date(Date.UTC(year, 0, 1)));
}

export function getWeekStartByNumber(year: number, weekNumber: number): Date {
  const week1Monday = getWeek1Monday(year);
  return new Date(week1Monday.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
}

export function getWeeksInYear(year: number): number {
  const thisYearStart = getWeek1Monday(year).getTime();
  const nextYearStart = getWeek1Monday(year + 1).getTime();
  return Math.round((nextYearStart - thisYearStart) / (7 * 24 * 60 * 60 * 1000));
}

export function getWeekInfoForDate(date: Date): { year: number; week: number } {
  const year = date.getUTCFullYear();
  const week1Monday = getWeek1Monday(year);
  const diffDays = Math.floor((date.getTime() - week1Monday.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.floor(diffDays / 7) + 1;
  if (week < 1) return getWeekInfoForDate(new Date(Date.UTC(year - 1, 11, 31)));
  if (week > getWeeksInYear(year)) return { year: year + 1, week: 1 };
  return { year, week };
}

export function getWeekRange(date: Date): { start: string; end: string } {
  const monday = mondayOnOrBefore(date);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  return { start: toDateOnly(monday), end: toDateOnly(sunday) };
}

export function getMonthRange(date: Date): { start: string; end: string } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { start: toDateOnly(start), end: toDateOnly(end) };
}

export function getYearRange(date: Date): { start: string; end: string } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
  return { start: toDateOnly(start), end: toDateOnly(end) };
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
