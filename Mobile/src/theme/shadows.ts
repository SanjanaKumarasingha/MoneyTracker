import { colors } from './colors';

// Two elevation presets, each carrying both the iOS shadow* props and the
// Android `elevation` fallback (elevation renders nothing on a transparent
// background, so anything using `raised` needs an opaque backgroundColor —
// see JellyTabBar.tsx's barShadowWrap for the pattern this was lifted from).
export const shadows = {
  // Default card/list-row elevation — replaces flat borderWidth:1 styling.
  // Deliberately subtle (low opacity, low elevation) so cards read as
  // gently raised rather than boxed in by a visible edge.
  card: {
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  // Floating elements that should read as clearly above the page (FAB, tab
  // bar, actively-dragged rows).
  raised: {
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};
