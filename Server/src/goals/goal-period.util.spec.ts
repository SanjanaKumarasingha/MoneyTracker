import { GoalPeriodType } from '../enums';
import { getCurrentPeriodWindow } from './goal-period.util';

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

describe('getCurrentPeriodWindow', () => {
  it('computes a CUSTOM window as an exact range', () => {
    const goal = {
      periodType: GoalPeriodType.CUSTOM,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-15'),
    };

    const { periodStart, periodEnd, isActive } = getCurrentPeriodWindow(
      goal,
      new Date('2026-07-01'),
    );

    expect(iso(periodStart)).toBe('2026-06-01');
    expect(iso(periodEnd)).toBe('2026-08-15');
    expect(isActive).toBe(true);
  });

  it('marks a CUSTOM goal inactive once past its end date', () => {
    const goal = {
      periodType: GoalPeriodType.CUSTOM,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
    };

    const { isActive } = getCurrentPeriodWindow(goal, new Date('2026-07-01'));
    expect(isActive).toBe(false);
  });

  it('advances a WEEKLY goal to the correct 7-day window', () => {
    const goal = {
      periodType: GoalPeriodType.WEEKLY,
      startDate: new Date('2026-07-01'), // a Wednesday
      endDate: null,
    };

    // 10 days after start -> week index 1 (days 7-13)
    const { periodStart, periodEnd, isActive } = getCurrentPeriodWindow(
      goal,
      new Date('2026-07-11'),
    );

    expect(iso(periodStart)).toBe('2026-07-08');
    expect(iso(periodEnd)).toBe('2026-07-14');
    expect(isActive).toBe(true);
  });

  it('clamps a MONTHLY goal anchored on Jan 31 into Feb 28 (non-leap year)', () => {
    const goal = {
      periodType: GoalPeriodType.MONTHLY,
      startDate: new Date('2026-01-31'),
      endDate: null,
    };

    const { periodStart, periodEnd } = getCurrentPeriodWindow(
      goal,
      new Date('2026-02-15'),
    );

    expect(iso(periodStart)).toBe('2026-01-31');
    // Feb 2026 has 28 days; next period starts Feb 28/Mar 1 boundary handling
    // means this period's end is the day before the (clamped) next start.
    expect(iso(periodEnd)).toBe('2026-02-27');
  });

  it('clamps a MONTHLY goal anchored on Jan 31 into Feb 29 (leap year)', () => {
    const goal = {
      periodType: GoalPeriodType.MONTHLY,
      startDate: new Date('2028-01-31'),
      endDate: null,
    };

    const { periodStart, periodEnd } = getCurrentPeriodWindow(
      goal,
      new Date('2028-02-15'),
    );

    expect(iso(periodStart)).toBe('2028-01-31');
    expect(iso(periodEnd)).toBe('2028-02-28');
  });

  it('handles a YEARLY goal anchored on Feb 29 in a non-leap year', () => {
    const goal = {
      periodType: GoalPeriodType.YEARLY,
      startDate: new Date('2028-02-29'),
      endDate: null,
    };

    const { periodStart, periodEnd, isActive } = getCurrentPeriodWindow(
      goal,
      new Date('2029-03-01'),
    );

    expect(iso(periodStart)).toBe('2029-02-28');
    expect(isActive).toBe(true);
    expect(periodEnd.getTime()).toBeGreaterThan(periodStart.getTime());
  });

  it('is not active before the goal has started', () => {
    const goal = {
      periodType: GoalPeriodType.MONTHLY,
      startDate: new Date('2026-09-01'),
      endDate: null,
    };

    const { isActive, periodStart } = getCurrentPeriodWindow(
      goal,
      new Date('2026-07-01'),
    );

    expect(isActive).toBe(false);
    expect(iso(periodStart)).toBe('2026-09-01');
  });
});
