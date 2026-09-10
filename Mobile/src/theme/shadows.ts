// Two elevation presets, each carrying both the iOS shadow* props and the
// Android `elevation` fallback (elevation renders nothing on a transparent
// background, so anything using `raised` needs an opaque backgroundColor —
// see JellyTabBar.tsx's barShadowWrap for the pattern this was lifted from).
//
// shadowColor is intentionally a fixed dark tone in both light and dark
// mode, not theme.colors.text — a drop shadow represents cast light and
// stays dark regardless of theme (colors.text flips to near-white in dark
// mode, which would render as a pale glow instead of a shadow if used here).
export const shadows = {
  // Default card/list-row elevation — replaces flat borderWidth:1 styling.
  // Deliberately subtle (low opacity, low elevation) so cards read as
  // gently raised rather than boxed in by a visible edge.
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  // Floating elements that should read as clearly above the page (FAB, tab
  // bar, actively-dragged rows).
  raised: {
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export type Shadows = typeof shadows;
