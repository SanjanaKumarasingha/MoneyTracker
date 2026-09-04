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
  // Slate-500 — the modern-fintech secondary-text tone this app's design
  // language is standardizing on (section labels, hints, captions).
  textMuted: '#64748B',
  textFaint: '#a4a7b8',

  // Shared fill/border for every text input and primary selector button
  // (segmented controls, chip pickers, date-value boxes) — kept distinct
  // from `card`/`border` above since inputs/selectors are meant to read as
  // a slightly recessed field, not a raised card.
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',

  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primarySoft: '#dbeafe',

  // Signature royal-blue hero gradient — the brand's defining surface.
  heroFrom: '#1D4ED8',
  heroTo: '#2563EB',

  // Standard fintech-palette semantic colors (Tailwind red/amber/emerald
  // 500s) — used for expense/income direction, danger actions, and pace/
  // status indicators (budget proximity, goal schedule health) alike.
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FCA5A5',
  // A dark crimson for text/icons on dangerSoft alert backgrounds — `danger`
  // itself is too light against that soft rose fill to hit AA contrast.
  dangerDark: '#991b1b',
  success: '#10B981',
  successSoft: '#dcfce7',
  amber: '#F59E0B',
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
