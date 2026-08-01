import { colors } from './colors';

// Identity-stable category coloring: keyed by categoryId (not by amount rank,
// which is what Report used before — the same category could get a
// different color every time its spending rank shifted). Any category id
// maps deterministically to the same slot everywhere it's shown.
const CATEGORY_PALETTE = [
  colors.catTransport,
  colors.catRestaurant,
  colors.catHealth,
  colors.catEducation,
  colors.catShopping,
  colors.catBills,
  colors.catAmberAlt,
  colors.catRoseAlt,
];

export function getCategoryColor(categoryId: number | null | undefined): string {
  if (categoryId == null || categoryId < 0) return colors.catOther;
  return CATEGORY_PALETTE[categoryId % CATEGORY_PALETTE.length];
}
