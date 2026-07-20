// Shared palette matching the approved UI direction: a purple/violet brand
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

  primary: '#8b7cf6',
  primaryDark: '#6d5cf0',
  primarySoft: '#efe9ff',

  heroFrom: '#ada2fb',
  heroTo: '#7a6cf0',

  danger: '#f4506b',
  dangerSoft: '#fde3e8',
  success: '#22c55e',
  successSoft: '#dcfce7',
  amber: '#f2a93c',
  amberSoft: '#fff3d9',

  // Ratio-band gradient stops for the income/expense LiquidGauge (healthy /
  // caution / danger), plus the flat "insight" pill background.
  waterHealthyLight: '#7dfcd6',
  waterHealthyMid: '#12b886',
  waterHealthyDeep: '#0f8a68',
  waterCautionLight: '#ffe29a',
  waterCautionMid: '#f2a93c',
  waterCautionDeep: '#c97b12',
  waterDangerLight: '#ffb3b3',
  waterDangerMid: '#f4506b',
  waterDangerDeep: '#c81e3a',
  insightBg: '#17161f',

  catTransport: '#4d8dfd',
  catRestaurant: '#fb923c',
  catHealth: '#22c55e',
  catEducation: '#8b7cf6',
  catShopping: '#ec4899',
  catBills: '#a78bfa',
  catOther: '#9ca3af',
};
