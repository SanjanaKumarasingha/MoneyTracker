// Light palette — the app's original/default colors, unchanged. Semantic
// brand/status colors (primary, danger/success/amber, hero gradient, the
// fixed category palette) are deliberately identical between light and dark
// — only surfaces (background/card/border) and text shift with theme, the
// same way most fintech apps keep a stable brand identity across modes.
export const lightColors = {
  background: '#f7f7fb',
  card: '#ffffff',
  cardSoft: '#f7f7fb',
  border: '#eceef4',
  text: '#16151f',
  textMuted: '#64748B',
  textFaint: '#a4a7b8',

  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',

  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primarySoft: '#dbeafe',

  heroFrom: '#1D4ED8',
  heroTo: '#2563EB',

  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FCA5A5',
  dangerDark: '#991b1b',
  success: '#10B981',
  successSoft: '#dcfce7',
  amber: '#F59E0B',
  amberSoft: '#fff3d9',

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

// Dark palette. Surfaces invert to near-black navy tones; text inverts to
// near-white; the "soft" alert/badge fills (previously solid pastels tuned
// for a white background, e.g. dangerSoft '#FEF2F2') become low-opacity
// tints of the same hue instead, so they still read as a gentle wash rather
// than a jarring light patch on a dark screen. Brand/status accent hues are
// nudged a couple shades lighter than their light-mode counterparts, which
// is necessary for AA contrast on a dark background (the light-mode hex
// values are tuned for contrast against white, not black).
export const darkColors = {
  background: '#0B0F19',
  card: '#151B2C',
  cardSoft: '#10141F',
  border: '#232A3D',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textFaint: '#64748B',

  inputBg: '#10141F',
  inputBorder: '#2A3348',

  primary: '#3B82F6',
  primaryDark: '#60A5FA',
  primarySoft: 'rgba(59, 130, 246, 0.18)',

  // Kept identical to light mode — the hero gradient is the brand's
  // defining surface and stays branded regardless of theme.
  heroFrom: '#1D4ED8',
  heroTo: '#2563EB',

  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
  dangerBorder: 'rgba(248, 113, 113, 0.4)',
  // Text/icon color on dangerSoft — in light mode this needed to be a
  // *darker* crimson for contrast against a light pastel fill; in dark mode
  // dangerSoft is a dark translucent fill instead, so the correct-contrast
  // color is a *lighter* red. Same semantic role (text-on-dangerSoft),
  // different literal shade per theme.
  dangerDark: '#FCA5A5',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.16)',
  amber: '#FBBF24',
  amberSoft: 'rgba(251, 191, 36, 0.16)',

  // The fixed category palette is intentionally identical to light mode
  // (see categoryColor.ts — a pure, hookless function that can't read the
  // active theme) except catTransport, nudged lighter for dark-background
  // legibility; the rest read fine on both surfaces unchanged.
  catTransport: '#94a3b8',
  catRestaurant: '#fb923c',
  catHealth: '#14b8a6',
  catEducation: '#8b7cf6',
  catShopping: '#ec4899',
  catBills: '#a78bfa',
  catAmberAlt: '#eda100',
  catRoseAlt: '#e34948',
  catOther: '#9ca3af',
};

export type ColorPalette = typeof lightColors;

// Backward-compatible default export — kept as the light palette so any
// file not yet migrated to useTheme() still renders (just without live
// theme switching) rather than breaking. All in-app screens/components
// should prefer `const { colors } = useTheme()` from '@/theme/ThemeProvider'.
export const colors = lightColors;
