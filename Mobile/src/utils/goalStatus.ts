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
