import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/ThemeProvider';
import { shadows } from '@/theme/shadows';
import { GLASS } from '@/theme/glass';
import PressableScale from '@/components/PressableScale';

type GlassFabProps = {
  onPress: () => void;
  accessibilityLabel: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

// The round, icon-only "glass ball" — for a page-level floating primary
// action (Home's Add Record, a wallet's Add Record). For a labeled/pill
// glass button (a sticky full-width CTA, an inline section action), see
// GlassButton.tsx instead — same material (theme/glass.ts), different shape
// for a deliberately different feel. Position (bottom/right) is the
// caller's job via `style`; this component only owns the look and feel.
//
// Design rationale (see Home screen's original comment for the full
// citations): Fitts's Law (large + thumb-reachable), von Restorff / the
// isolation effect (a lone circle among rectangles reads as "the" primary
// action), and glass-only surfaces losing tactile affordance unless paired
// with a hard border + cast shadow + real press/haptic feedback.
export default function GlassFab({ onPress, accessibilityLabel, icon = 'add', size = 64, style }: GlassFabProps) {
  const { scheme } = useTheme();

  // Proportions tuned at the default size=64 (22x14 at top:6/left:10) and
  // scaled from there — a fixed-pixel highlight looked right at 64 but
  // ballooned into a dominant white blob at the 30px inline size Categories
  // uses, since it barely shrank relative to the ball around it.
  const highlightStyle = {
    top: size * 0.09,
    left: size * 0.156,
    width: size * 0.34,
    height: size * 0.22,
    borderRadius: size * 0.16,
  };

  return (
    <PressableScale
      style={[styles.fab, { width: size, height: size, borderRadius: size / 2 }, style]}
      scaleTo={0.88}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <BlurView intensity={GLASS.blurIntensity} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[styles.fabTint, { backgroundColor: scheme === 'dark' ? GLASS.tintDark : GLASS.tintLight }]} />
      <View style={[styles.fabHighlight, highlightStyle]} pointerEvents="none" />
      <Ionicons name={icon} size={size * 0.47} color="#fff" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.borderColor,
    ...shadows.raised,
  },
  fabTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Glossy top-left highlight — the cue that sells "sphere" rather than
  // "tinted disc"; a real glass ball catches light unevenly, not uniformly.
  // Size/position come from GlassFab's highlightStyle (scaled to `size`).
  fabHighlight: {
    position: 'absolute',
    backgroundColor: GLASS.highlightColor,
    transform: [{ rotate: '-20deg' }],
  },
});
