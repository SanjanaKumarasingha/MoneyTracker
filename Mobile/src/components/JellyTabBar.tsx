import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  plan: 'flag',
  settings: 'settings',
};

const BLOB_SIZE = 50;
const HOLD_MS = 30;

type TabLayout = { x: number; width: number };

// The tapped tab's own icon "pops" — grow, overshoot small, settle — in
// sync with the blob's landing wobble below, so the ball arriving and the
// icon reacting read as one gesture instead of two unrelated animations.
function AnimatedTabIcon({ focused, name }: { focused: boolean; name: keyof typeof Ionicons.glyphMap }) {
  const lift = useSharedValue(focused ? -1 : 0);
  const pop = useSharedValue(1);
  const wasFocused = useRef(focused);

  useEffect(() => {
    lift.value = withTiming(focused ? -1 : 0, { duration: 200 });
    if (focused && !wasFocused.current) {
      pop.value = withSequence(
        withTiming(1.4, { duration: 130, easing: Easing.out(Easing.cubic) }),
        withTiming(0.9, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(1.1, { duration: 110, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 100, easing: Easing.out(Easing.cubic) }),
      );
    }
    wasFocused.current = focused;
  }, [focused, lift, pop]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: pop.value }],
  }));

  return (
    <Animated.View style={iconStyle}>
      <Ionicons name={name} size={22} color={focused ? colors.primary : colors.textMuted} />
    </Animated.View>
  );
}

// A translucent "jelly" pill behind the active tab. Two ways to move it:
// (1) tap a different tab — the blob bridges from the old position to the
// new one (fast stretch), then lands on it with a couple of squash-and-
// stretch wobbles instead of one clean spring settle (see the bounce
// sequence in placeBlob) — closer to a jelly ball landing than a highlight
// sliding to a stop; (2) press-and-hold (~20ms) directly on it to grab it,
// drag it with your finger — it grows while held — and release to snap
// onto the nearest tab, with the same landing wobble.
export default function JellyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const layouts = useRef<TabLayout[]>([]);
  const barWidth = useRef(0);
  const [ready, setReady] = useState(false);

  const blobLeft = useSharedValue(0);
  const blobWidth = useSharedValue(BLOB_SIZE);
  const blobScale = useSharedValue(1);
  const blobScaleX = useSharedValue(1);
  const blobScaleY = useSharedValue(1);
  const dragStartLeft = useSharedValue(0);

  const nearestIndexFor = (centerX: number) => {
    let best = 0;
    let bestDist = Infinity;
    layouts.current.forEach((layout, i) => {
      if (!layout) return;
      const center = layout.x + layout.width / 2;
      const dist = Math.abs(center - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const navigateToIndex = (index: number) => {
    const route = state.routes[index];
    if (!route || state.index === index) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const placeBlob = (index: number, animate: boolean) => {
    const layout = layouts.current[index];
    if (!layout) return;
    const targetLeft = layout.x + layout.width / 2 - BLOB_SIZE / 2;

    if (!animate) {
      blobLeft.value = targetLeft;
      blobWidth.value = BLOB_SIZE;
      return;
    }

    const oldLeft = blobLeft.value;
    const oldWidth = blobWidth.value;
    const bridgeLeft = Math.min(oldLeft, targetLeft);
    const bridgeRight = Math.max(oldLeft + oldWidth, targetLeft + BLOB_SIZE);

    blobLeft.value = withTiming(bridgeLeft, { duration: 150, easing: Easing.out(Easing.cubic) });
    blobWidth.value = withTiming(bridgeRight - bridgeLeft, { duration: 150, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) {
        blobLeft.value = withSpring(targetLeft, { damping: 18, stiffness: 160, mass: 0.9 });
        blobWidth.value = withSpring(BLOB_SIZE, { damping: 18, stiffness: 160, mass: 0.9 });

        // Instagram-style jelly-ball landing: a few quick squash-and-stretch
        // wobbles instead of one clean spring settle, so the ball reads as
        // flexible material bouncing into place rather than a highlight
        // sliding to a stop.
        const bounce = { duration: 90, easing: Easing.out(Easing.cubic) };
        blobScaleX.value = withSequence(
          withTiming(1.22, bounce),
          withTiming(0.88, bounce),
          withTiming(1.1, bounce),
          withTiming(0.97, bounce),
          withTiming(1, bounce),
        );
        blobScaleY.value = withSequence(
          withTiming(0.8, bounce),
          withTiming(1.18, bounce),
          withTiming(0.92, bounce),
          withTiming(1.05, bounce),
          withTiming(1, bounce),
        );
      }
    });
  };

  useEffect(() => {
    if (ready) placeBlob(state.index, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[index] = { x, width };
    if (!ready && layouts.current.filter(Boolean).length === state.routes.length) {
      setReady(true);
    }
  };

  const handleSnap = (index: number) => {
    placeBlob(index, true);
    navigateToIndex(index);
  };

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(HOLD_MS)
    .onBegin(() => {
      dragStartLeft.value = blobLeft.value;
      blobScale.value = withSpring(1.28, { damping: 14, stiffness: 220 });
    })
    .onUpdate((e) => {
      const raw = dragStartLeft.value + e.translationX;
      blobLeft.value = Math.max(0, Math.min(raw, Math.max(0, barWidth.current - blobWidth.value)));
    })
    .onEnd((e) => {
      const centerX = dragStartLeft.value + e.translationX + blobWidth.value / 2;
      const index = nearestIndexFor(centerX);
      runOnJS(handleSnap)(index);
    })
    .onFinalize(() => {
      blobScale.value = withSpring(1, { damping: 14, stiffness: 220 });
    });

  const blobStyle = useAnimatedStyle(() => ({
    left: blobLeft.value,
    width: blobWidth.value,
    transform: [{ scale: blobScale.value }, { scaleX: blobScaleX.value }, { scaleY: blobScaleY.value }],
  }));

  return (
    <View style={[styles.outerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.barShadowWrap}>
        <BlurView
          intensity={62}
          tint="light"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={styles.bar}
          onLayout={(e) => {
            barWidth.current = e.nativeEvent.layout.width;
          }}
        >
          {/* The blur alone reads too see-through over busy content behind
              the bar — a soft white tint on top keeps icons/labels legible
              while the bar still reads as glass, not a flat card. */}
          <View style={styles.barTint} pointerEvents="none" />

          <GestureDetector gesture={dragGesture}>
            <Animated.View style={[styles.blob, blobStyle]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.8 }}
                style={styles.blobShine}
                pointerEvents="none"
              />
            </Animated.View>
          </GestureDetector>

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const label = (options.title ?? route.name) as string;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
                placeBlob(index, true);
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
                <AnimatedTabIcon focused={isFocused} name={ICONS[route.name] ?? 'ellipse'} />
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const BAR_RADIUS = 30;

const styles = StyleSheet.create({
  outerWrap: {
    position: 'relative',
    paddingHorizontal: 16,
  },
  // A floating frosted-glass pill rather than an edge-to-edge flat panel —
  // BlurView gives the real translucency/blur (not just a low-opacity
  // color), clipped to the pill shape via overflow: hidden. The shadow has
  // to live on this wrapping View: a shadow on the BlurView itself would
  // get clipped away by the same overflow: hidden that shapes the blur.
  barShadowWrap: {
    borderRadius: BAR_RADIUS,
    // Fully hidden under the BlurView bar below (same size/shape) — its only
    // job is giving Android's elevation shadow an opaque layer to compute
    // against, since elevation renders nothing on a transparent background.
    backgroundColor: colors.card,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 10,
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  // Sits between the blur and the tab content — keeps icons/labels legible
  // over whatever's scrolling underneath without turning the bar opaque.
  barTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  blob: {
    position: 'absolute',
    top: 4,
    height: BLOB_SIZE,
    borderRadius: 999,
    // Brand primary blue, not the off-brand purple this used to be — the
    // active-tab indicator is the single strongest "you are here" signal in
    // the bar, so it should read as the same blue as every other active/
    // primary affordance in the app (hero card, primary buttons), not an
    // unrelated color that appears nowhere else.
    backgroundColor: 'rgba(37,99,235,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(37,99,235,0.45)',
    overflow: 'hidden',
    // Above the tab Pressables so a press-and-hold actually lands on the
    // blob's own GestureDetector instead of the tab underneath — a quick
    // tap that doesn't hold long enough for the pan to activate still
    // falls through to that tab's Pressable normally.
    zIndex: 5,
  },
  // A glass ball's specular highlight — brightest at the top, fading out
  // by roughly 80% of the way down — layered inside the blob itself.
  blobShine: {
    ...StyleSheet.absoluteFillObject,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    // Bumped from 4 to give each tab a taller tap target (closer to the
    // ~44pt thumb-friendly minimum once the bar's own padding is added),
    // not just a bigger-looking icon.
    gap: 3,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
});
