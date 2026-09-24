import { EGoalType } from '../common/goal-type.enum';
import { IGoalWithProgress } from '../types';

export type StatusTone = 'success' | 'warning' | 'danger';

// Web port of Mobile/src/utils/goalStatus.ts. Mobile returns hex colors; here
// each tone maps to the semantic Tailwind tokens (success=emerald,
// warning=amber, danger=rose) so light/dark variants come for free.
export const TONE_CLASSES: Record<
  StatusTone,
  { bar: string; text: string; soft: string; ring: string }
> = {
  success: {
    bar: 'bg-success-500',
    text: 'text-success-600 dark:text-success-400',
    soft: 'bg-success-500/15 text-success-700 dark:text-success-300',
    ring: '#10b981',
  },
  warning: {
    bar: 'bg-warning-500',
    text: 'text-warning-600 dark:text-warning-400',
    soft: 'bg-warning-500/15 text-warning-700 dark:text-warning-300',
    ring: '#f59e0b',
  },
  danger: {
    bar: 'bg-danger-500',
    text: 'text-danger-600 dark:text-danger-400',
    soft: 'bg-danger-500/15 text-danger-700 dark:text-danger-300',
    ring: '#f43f5e',
  },
};

/** Budget proximity: green with headroom, amber near the limit, rose once it's blown. */
export function getBudgetTone(percent: number): StatusTone {
  if (percent >= 90) return 'danger';
  if (percent >= 70) return 'warning';
  return 'success';
}

/**
 * Saving-goal pace tone. `ratio` is actual progress vs. the straight-line
 * pace expected by now (100 = exactly on pace) - same semantics as Mobile.
 */
export function getScheduleTone(ratio: number | null): StatusTone {
  if (ratio === null || ratio >= 90) return 'success';
  if (ratio >= 70) return 'warning';
  return 'danger';
}

export type ScheduleStatus = { gapPercent: number; ratio: number };

/** How a saving goal's progress compares to an even pace across its current period. */
export function getScheduleStatus(goal: IGoalWithProgress): ScheduleStatus | null {
  if (goal.type !== EGoalType.SAVING || !goal.progress.isActive) return null;
  const start = new Date(goal.progress.periodStart).getTime();
  const end = new Date(goal.progress.periodEnd).getTime();
  if (end <= start) return null;
  const expectedPercent = Math.min(100, ((Date.now() - start) / (end - start)) * 100);
  const ratio = expectedPercent <= 0 ? 100 : (goal.progress.percent / expectedPercent) * 100;
  return { gapPercent: Math.round(expectedPercent - goal.progress.percent), ratio };
}

/** Whole days left in the goal's current period (0 on its last day), or null if not active. */
export function daysLeft(goal: IGoalWithProgress): number | null {
  if (!goal.progress.isActive) return null;
  const end = new Date(goal.progress.periodEnd).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

export interface WalletBudget {
  percent: number;
  spent: number;
  limit: number;
}

/**
 * A wallet's headline budget usage for its card track. Whole-wallet spending
 * limits win (the one closest to its cap, since that's the one that needs
 * attention); if the wallet only has per-category limits, those are summed.
 * Null when the wallet has no active spending limit at all.
 */
export function getWalletBudget(
  goals: IGoalWithProgress[],
  walletId: number,
): WalletBudget | null {
  const limits = goals.filter(
    (goal) =>
      goal.wallet.id === walletId &&
      goal.type === EGoalType.SPENDING_LIMIT &&
      goal.progress.isActive,
  );
  if (limits.length === 0) return null;

  const walletLevel = limits.filter((goal) => !goal.category);
  if (walletLevel.length > 0) {
    const tightest = walletLevel.reduce((a, b) => (b.progress.percent > a.progress.percent ? b : a));
    return {
      percent: tightest.progress.percent,
      spent: tightest.progress.actual,
      limit: Number(tightest.targetAmount),
    };
  }

  const spent = limits.reduce((sum, goal) => sum + goal.progress.actual, 0);
  const limit = limits.reduce((sum, goal) => sum + Number(goal.targetAmount), 0);
  return { percent: limit > 0 ? (spent / limit) * 100 : 0, spent, limit };
}
