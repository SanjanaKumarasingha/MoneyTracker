import { colors } from '@/theme/colors';

// Budget/goal proximity color — green while there's clear headroom, amber as
// the limit gets close, red once it's blown past. Shared by Plan's budget
// rows and the category-goal badges in CategoryBreakdown so both read the
// same thresholds the same way.
export function getBudgetStatusColor(percent: number): string {
  if (percent >= 90) return colors.danger;
  if (percent >= 70) return colors.amber;
  return colors.success;
}

// Saving-goal pace color — `ratio` is how close actual progress is to the
// straight-line pace expected by this point in the goal's period (100 =
// exactly on pace, under 100 = behind). Green at 90%+ of expected pace,
// amber down to 70%, red below that — same semantics as
// getBudgetStatusColor, just read the other way (a ratio, not a raw
// percent-of-target), so a goal's progress bar reads at a glance whether
// its pace is healthy, not just how far along it is.
export function getScheduleStatusColor(ratio: number | null): string {
  if (ratio === null || ratio >= 90) return colors.success;
  if (ratio >= 70) return colors.amber;
  return colors.danger;
}
