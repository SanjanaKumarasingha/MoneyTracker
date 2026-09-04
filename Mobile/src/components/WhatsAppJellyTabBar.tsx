import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';

type IconPair = { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap };

const ICONS: Record<string, IconPair> = {
  index: { active: 'home', inactive: 'home-outline' },
  analytics: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  plan: { active: 'flag', inactive: 'flag-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

const BAR_HEIGHT = 56;
const PILL_HEIGHT = 40;
const PILL_TOP = (BAR_HEIGHT - PILL_HEIGHT) / 2;
const SPRING_CONFIG = { stiffness: 160, damping: 18, mass: 0.8 };

type TabLayout = { x: number; width: number };

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// A floating, frosted-glass pill bar (WhatsApp-style) with a sliding
// "jelly" capsule that snaps to whichever tab is active, spanning that
// tab's full measured width so it encloses both the icon and its label.
// The capsule is purely decorative — position:'absolute' + pointerEvents
// "none" and no zIndex override, so it always paints *behind* the tab
// Pressables (normal JSX paint order: it's rendered before them) and never
// intercepts a touch meant for a tab. A previous version made it grabbable
// via a GestureDetector + zIndex, which caused exactly the two bugs that
// requires: touches landing on the capsule's own gesture recognizer
// instead of the tab underneath, and the capsule's zIndex painting it over
// the tab icon/label instead of behind them. Tap-to-switch only, no drag.
export default function WhatsAppJellyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const layouts = useRef<TabLayout[]>([]);
  const [ready, setReady] = useState(false);

  const pillLeft = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillScaleX = useSharedValue(1);
  const pillScaleY = useSharedValue(1);

  const placePill = (index: number, animate: boolean) => {
    const layout = layouts.current[index];
    if (!layout) return;

    if (!animate) {
      pillLeft.value = layout.x;
      pillWidth.value = layout.width;
      return;
    }

    pillLeft.value = withSpring(layout.x, SPRING_CONFIG);
    pillWidth.value = withSpring(layout.width, SPRING_CONFIG, (finished) => {
      if (finished) {
        // A few quick squash-and-stretch wobbles instead of one clean
        // spring settle, so the pill reads as flexible material bouncing
        // into place rather than a highlight sliding to a stop.
        const bounce = { duration: 90, easing: Easing.out(Easing.cubic) };
        pillScaleX.value = withSequence(
          withTiming(1.16, bounce),
          withTiming(0.9, bounce),
          withTiming(1.06, bounce),
          withTiming(0.98, bounce),
          withTiming(1, bounce),
        );
        pillScaleY.value = withSequence(
          withTiming(0.82, bounce),
          withTiming(1.14, bounce),
          withTiming(0.94, bounce),
          withTiming(1.03, bounce),
          withTiming(1, bounce),
        );
      }
    });
  };

  useEffect(() => {
    if (ready) placePill(state.index, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[index] = { x, width };
    if (!ready && layouts.current.filter(Boolean).length === state.routes.length) {
      setReady(true);
    }
  };

  const pillStyle = useAnimatedStyle(() => ({
    left: pillLeft.value,
    width: pillWidth.value,
    transform: [{ scaleX: pillScaleX.value }, { scaleY: pillScaleY.value }],
  }));

  return (
    <View style={[styles.outerWrap, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16) }]}>
      <View style={styles.shadowWrap}>
        <BlurView
          intensity={75}
          tint="light"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={styles.bar}
        >
          <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const label = (options.title ?? route.name) as string;
            const iconSet = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

            const onPress = () => {
              // route.name is the real, registered Tabs.Screen name (from
              // React Navigation's own state, not a guess), so this never
              // navigates to an undefined route.
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                triggerHaptic();
                navigation.navigate(route.name);
                placePill(index, true);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLayout={handleLayout(index)}
                style={styles.tab}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
              >
                <Ionicons
                  name={isFocused ? iconSet.active : iconSet.inactive}
                  size={21}
                  color={isFocused ? colors.primary : '#94A3B8'}
                />
                <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const BAR_RADIUS = 28;

const styles = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 20,
  },
  // Shadow lives on this wrapper (not the clipped/blurred bar below it) —
  // a shadow on a view with overflow:hidden gets clipped away along with
  // everything else outside its bounds.
  shadowWrap: {
    borderRadius: BAR_RADIUS,
    backgroundColor: colors.card,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bar: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: PILL_TOP,
    height: PILL_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10.5,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  labelInactive: {
    color: '#94A3B8',
    fontWeight: '500',
  },
});
