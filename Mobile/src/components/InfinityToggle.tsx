import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';

type Side = 'left' | 'right';

type InfinityToggleProps = {
  value: Side;
  onChange: (value: Side) => void;
  leftLabel: string;
  rightLabel: string;
  leftColor?: string;
  rightColor?: string;
};

const CAPSULE_W = 118;
const CAPSULE_H = 40;
const WIDTH = CAPSULE_W * 2;
const HEIGHT = CAPSULE_H;
const STEP = CAPSULE_W;

// Two long capsule (pill) shapes touching directly, no gap between them —
// their rounded ends meeting at the same line is what actually draws the
// infinity/hourglass pinch, rather than a separate connecting neck shape.
// Drag the blob from one capsule to the other (or just tap either side)
// and it squeezes through that pinch point like jelly, then swells back
// out to fill the capsule it lands in.
export default function InfinityToggle({
  value,
  onChange,
  leftLabel,
  rightLabel,
  leftColor = colors.danger,
  rightColor = colors.success,
}: InfinityToggleProps) {
  const progress = useSharedValue(value === 'right' ? 1 : 0);
  const startProgress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(value === 'right' ? 1 : 0, { damping: 16, stiffness: 170 });
  }, [value, progress]);

  const notify = (next: Side) => onChange(next);

  const snapTo = (next: Side) => {
    'worklet';
    progress.value = withSpring(next === 'right' ? 1 : 0, { damping: 16, stiffness: 170 });
    runOnJS(notify)(next);
  };

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startProgress.value = progress.value;
    })
    .onUpdate((e) => {
      const raw = startProgress.value + e.translationX / STEP;
      progress.value = Math.max(0, Math.min(1, raw));
    })
    .onEnd(() => {
      snapTo(progress.value >= 0.5 ? 'right' : 'left');
    });

  const tapLeft = () => snapTo('left');
  const tapRight = () => snapTo('right');

  const blobStyle = useAnimatedStyle(() => {
    const translateX = progress.value * STEP;
    // A capsule squeezing through the neck: shrink its height and stretch
    // its width as it crosses the midpoint, then relax back to a normal
    // capsule once it's fully inside the far side.
    const squeezeY = interpolate(progress.value, [0, 0.5, 1], [1, 0.58, 1]);
    const squeezeX = interpolate(progress.value, [0, 0.5, 1], [1, 1.22, 1]);
    return {
      backgroundColor: interpolateColor(progress.value, [0, 1], [leftColor, rightColor]),
      transform: [{ translateX }, { scaleX: squeezeX }, { scaleY: squeezeY }],
    };
  });

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.4]),
  }));
  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.4, 1]),
  }));

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={gesture}>
        <View style={styles.track}>
          <Svg width={WIDTH} height={HEIGHT} style={StyleSheet.absoluteFillObject}>
            <Rect
              x={1}
              y={1}
              width={CAPSULE_W - 2}
              height={CAPSULE_H - 2}
              rx={(CAPSULE_H - 2) / 2}
              fill={colors.cardSoft}
              stroke={colors.border}
              strokeWidth={1.5}
            />
            <Rect
              x={CAPSULE_W + 1}
              y={1}
              width={CAPSULE_W - 2}
              height={CAPSULE_H - 2}
              rx={(CAPSULE_H - 2) / 2}
              fill={colors.cardSoft}
              stroke={colors.border}
              strokeWidth={1.5}
            />
          </Svg>
          <Animated.View style={[styles.blob, blobStyle]} pointerEvents="none" />
        </View>
      </GestureDetector>

      <View style={styles.labelsRow} pointerEvents="box-none">
        <Animated.View style={[styles.labelHit, leftLabelStyle]} onTouchEnd={tapLeft}>
          <Text style={styles.label}>{leftLabel}</Text>
        </Animated.View>
        <Animated.View style={[styles.labelHit, rightLabelStyle]} onTouchEnd={tapRight}>
          <Text style={styles.label}>{rightLabel}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const BLOB_W = CAPSULE_W - 10;
const BLOB_H = CAPSULE_H - 10;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
  },
  track: {
    width: WIDTH,
    height: HEIGHT,
  },
  blob: {
    position: 'absolute',
    left: 5,
    top: 5,
    width: BLOB_W,
    height: BLOB_H,
    borderRadius: BLOB_H / 2,
  },
  labelsRow: {
    flexDirection: 'row',
    width: WIDTH,
    justifyContent: 'space-between',
  },
  labelHit: {
    width: CAPSULE_W,
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
  },
});
