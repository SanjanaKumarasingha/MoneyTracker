import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { GLASS } from '@/theme/glass';
import PressableScale from '@/components/PressableScale';

type GlassButtonProps = {
  onPress: () => void;
  label: string;
  accessibilityLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

// The labeled counterpart to GlassFab — same material (theme/glass.ts: same
// blur, tint, border, highlight), but a wide pill with a label instead of a
// small floating circle. Reach for this where the action needs a label to
// be clear in context (a sticky "New Goal" footer, an inline section
// action) rather than the page-level, self-evident-from-position primary
// action a bare icon ball is for. Same style, deliberately different feel
// — see GlassFab.tsx for why the two shapes exist instead of one.
export default function GlassButton({ onPress, label, accessibilityLabel, icon, style }: GlassButtonProps) {
  const { scheme } = useTheme();

  return (
    <PressableScale
      style={[styles.button, style]}
      scaleTo={0.95}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <BlurView intensity={GLASS.blurIntensity} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[styles.tint, { backgroundColor: scheme === 'dark' ? GLASS.tintDark : GLASS.tintLight }]} />
      <View style={styles.highlight} pointerEvents="none" />
      <View style={styles.content}>
        {icon && <Ionicons name={icon} size={18} color="#fff" />}
        <Text style={styles.label}>{label}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.borderColor,
    ...shadows.raised,
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // A wide, low streak rather than GlassFab's small round highlight — scaled
  // to the pill's shape, same "light catching glass unevenly" idea.
  highlight: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 90,
    height: 26,
    borderRadius: 16,
    backgroundColor: GLASS.highlightColor,
    transform: [{ rotate: '-8deg' }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
