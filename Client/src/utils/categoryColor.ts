// Ports Mobile/src/theme/categoryColor.ts. Fixed per-category identity
// colors, one hex per rotation slot, reused everywhere a category needs a
// color (chart legends/slices, top-spending mini rows) so the same category
// always reads as the same color across the app. Deliberately keyed by
// categoryId (identity-stable), not by spending rank - Mobile's own comment
// notes an earlier rank-based scheme changed a category's color every time
// its rank shifted, which was worse.
//
// success/danger are reserved exclusively for income/expense direction
// elsewhere in the app - never reused here as a category color, so a
// category dot is never mistaken for a primary/active-state or income/
// expense-direction color.
const CATEGORY_COLORS = [
  '#64748b', // catTransport
  '#fb923c', // catRestaurant
  '#14b8a6', // catHealth
  '#8b7cf6', // catEducation
  '#ec4899', // catShopping
  '#a78bfa', // catBills
  '#eda100', // catAmberAlt
  '#e34948', // catRoseAlt
] as const;

const CATEGORY_OTHER = '#9ca3af';

export function getCategoryColor(categoryId: number | null | undefined): string {
  if (categoryId == null || categoryId < 0) return CATEGORY_OTHER;
  return CATEGORY_COLORS[categoryId % CATEGORY_COLORS.length];
}
