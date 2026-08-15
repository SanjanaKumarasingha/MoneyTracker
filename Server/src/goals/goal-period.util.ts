import { GoalPeriodType } from '../enums';
import { Goal } from './entities/goal.entity';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PeriodWindow {
  periodStart: Date;
  periodEnd: Date;
  isActive: boolean;
}

function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

// Clamps the day-of-month to the last day of the target month when it
// doesn't exist there (e.g. anchor Jan 31 -> Feb period starts Feb 28/29).
function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const daysInTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, daysInTargetMonth)));
}

function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

// Largest whole number of months m such that addMonths(start, m) <= reference.
function monthsElapsed(start: Date, reference: Date): number {
  let naive =
    (reference.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (reference.getUTCMonth() - start.getUTCMonth());
  if (addMonths(start, naive).getTime() > reference.getTime()) {
    naive -= 1;
  }
  return naive;
}

function firstPeriodEnd(periodType: GoalPeriodType, start: Date): Date {
  switch (periodType) {
    case GoalPeriodType.WEEKLY:
      return addDays(start, 6);
    case GoalPeriodType.MONTHLY:
      return addDays(addMonths(start, 1), -1);
    case GoalPeriodType.YEARLY:
      return addDays(addYears(start, 1), -1);
    default:
      throw new Error(`firstPeriodEnd is not defined for period type: ${periodType}`);
  }
}

// Computes the current period window for a goal relative to `referenceDate`.
// CUSTOM goals have a single fixed window (startDate..endDate). Recurring
// goals (WEEKLY/MONTHLY/YEARLY) auto-renew indefinitely from their anchor
// `startDate` — the window returned is whichever occurrence contains
// `referenceDate`, computed on the fly rather than stored.
export function getCurrentPeriodWindow(
  goal: Pick<Goal, 'periodType' | 'startDate' | 'endDate'>,
  referenceDate: Date = new Date(),
): PeriodWindow {
  const start = toUtcMidnight(new Date(goal.startDate));
  const reference = toUtcMidnight(referenceDate);

  if (goal.periodType === GoalPeriodType.CUSTOM) {
    const end = toUtcMidnight(new Date(goal.endDate as Date));
    return {
      periodStart: start,
      periodEnd: end,
      isActive: reference.getTime() >= start.getTime() && reference.getTime() <= end.getTime(),
    };
  }

  if (reference.getTime() < start.getTime()) {
    return { periodStart: start, periodEnd: firstPeriodEnd(goal.periodType, start), isActive: false };
  }

  switch (goal.periodType) {
    case GoalPeriodType.WEEKLY: {
      const daysElapsed = Math.floor((reference.getTime() - start.getTime()) / MS_PER_DAY);
      const weekIndex = Math.floor(daysElapsed / 7);
      const periodStart = addDays(start, weekIndex * 7);
      return { periodStart, periodEnd: addDays(periodStart, 6), isActive: true };
    }
    case GoalPeriodType.MONTHLY: {
      const months = monthsElapsed(start, reference);
      const periodStart = addMonths(start, months);
      const periodEnd = addDays(addMonths(start, months + 1), -1);
      return { periodStart, periodEnd, isActive: true };
    }
    case GoalPeriodType.YEARLY: {
      const years = Math.floor(monthsElapsed(start, reference) / 12);
      const periodStart = addYears(start, years);
      const periodEnd = addDays(addYears(start, years + 1), -1);
      return { periodStart, periodEnd, isActive: true };
    }
    default:
      throw new Error(`Unsupported period type: ${goal.periodType as string}`);
  }
}
