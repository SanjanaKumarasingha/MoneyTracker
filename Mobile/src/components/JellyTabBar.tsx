import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  report: 'pie-chart',
  plan: 'flag',
  settings: 'settings',
};

const BLOB_SIZE = 44;
const HOLD_MS = 20;

type TabLayout = { x: number; width: number };

// A translucent "jelly" pill behind the active tab. Two ways to move it:
// (1) tap a different tab — the blob bridges from the old position to the
// new one (fast stretch), then springs round again with a gentle overshoot;
// (2) press-and-hold (~20ms) directly on it to grab it, drag it with your
// finger — it grows while held — and release to snap onto the nearest tab.
export default function JellyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layouts = useRef<TabLayout[]>([]);
  const barWidth = useRef(0);
  const [ready, setReady] = useState(false);

  const blobLeft = useSharedValue(0);
  const blobWidth = useSharedValue(BLOB_SIZE);
  const blobScale = useSharedValue(1);
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
        // Gentler spring than a typical "bouncy" default — steadier landing,
        // one small settle instead of a multi-wobble jiggle.
        blobLeft.value = withSpring(targetLeft, { damping: 18, stiffness: 160, mass: 0.9 });
        blobWidth.value = withSpring(BLOB_SIZE, { damping: 18, stiffness: 160, mass: 0.9 });
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
    transform: [{ scale: blobScale.value }],
  }));

  return (
    <View style={[styles.outerWrap, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/add-record')}
        accessibilityLabel="Add record"
        hitSlop={6}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <View
        style={styles.bar}
        onLayout={(e) => {
          barWidth.current = e.nativeEvent.layout.width;
        }}
      >
        <GestureDetector gesture={dragGesture}>
          <Animated.View style={[styles.blob, blobStyle]} />
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
              <Ionicons
                name={ICONS[route.name] ?? 'ellipse'}
                size={20}
                color={isFocused ? colors.text : colors.textMuted}
                style={isFocused ? styles.tabIconActive : undefined}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const FAB_SIZE = 60;

const styles = StyleSheet.create({
  // The FAB's raised half sits fully WITHIN this container's own bounds
  // (top: 0 inside a container tall enough for it) instead of poking above
  // it with a negative offset — a negative offset can end up outside the
  // area the tab navigator actually treats as hit-testable, which is why
  // the button previously didn't register taps.
  outerWrap: {
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabPressed: {
    backgroundColor: colors.primaryDark,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: FAB_SIZE / 2,
    paddingTop: 10,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  blob: {
    position: 'absolute',
    top: 4,
    height: BLOB_SIZE,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primary,
    opacity: 0.6,
    // Above the tab Pressables so a press-and-hold actually lands on the
    // blob's own GestureDetector instead of the tab underneath — a quick
    // tap that doesn't hold long enough for the pan to activate still
    // falls through to that tab's Pressable normally.
    zIndex: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  tabIconActive: {
    transform: [{ translateY: -1 }],
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.text,
  },
});
