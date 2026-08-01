// Shared palette matching the approved UI direction: a vivid-blue brand
// accent (hero gradient, FAB, active tab), semantic income/expense colors,
// and a fixed set of category colors reused everywhere a category appears
// (Report, wallet detail, transaction rows) so the same category always
// reads as the same color across the app.
export const colors = {
  background: '#f7f7fb',
  card: '#ffffff',
  cardSoft: '#f7f7fb',
  border: '#eceef4',
  text: '#16151f',
  textMuted: '#6f7285',
  textFaint: '#a4a7b8',

  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primarySoft: '#dbeafe',

  heroFrom: '#3b82f6',
  heroTo: '#1e3a8a',

  danger: '#f4506b',
  dangerSoft: '#fde3e8',
  success: '#22c55e',
  successSoft: '#dcfce7',
  amber: '#f2a93c',
  amberSoft: '#fff3d9',

  // Fixed per-category identity colors — one hex per category, reused
  // everywhere a category appears (Report, Plan, Edit Goal) so the same
  // category never reads as two different colors. catHealth intentionally
  // avoids `success` (teal instead of green) since success/danger are
  // reserved exclusively for income/expense direction, never a category.
  // catTransport is a slate-blue (not the vivid brand blue) so a category
  // dot never gets mistaken for a primary button/active state.
  catTransport: '#64748b',
  catRestaurant: '#fb923c',
  catHealth: '#14b8a6',
  catEducation: '#8b7cf6',
  catShopping: '#ec4899',
  catBills: '#a78bfa',
  catAmberAlt: '#eda100',
  catRoseAlt: '#e34948',
  catOther: '#9ca3af',
};
