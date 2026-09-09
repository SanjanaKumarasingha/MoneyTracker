import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

const WIDTH = 216;
const HEIGHT = 44;
const PADDING = 4;
const BLOB_WIDTH = (WIDTH - PADDING * 2) / 2;
const STEP = BLOB_WIDTH;

// One continuous glass capsule with both labels living inside it (not two
// separate touching pills with tiny tap targets below — tapping the
// capsule itself used to do nothing since it only recognized a drag). A
// frosted blob slides underneath whichever side is active and re-tints
// itself leftColor/rightColor, squeezing through the middle as it
// crosses. Tap either half of the pill to jump straight there, or drag
// the blob — both gestures live on the same view now.
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

  const notify = (next: Side) => {
    if (next !== value) onChange(next);
  };

  const snapTo = (next: Side) => {
    'worklet';
    progress.value = withSpring(next === 'right' ? 1 : 0, { damping: 16, stiffness: 170 });
    runOnJS(notify)(next);
  };

  const panGesture = Gesture.Pan()
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

  // A quick tap anywhere on the pill jumps straight to whichever half was
  // tapped — raced against the pan gesture so a drag still wins once the
  // finger actually moves.
  const tapGesture = Gesture.Tap().onEnd((e) => {
    snapTo(e.x < WIDTH / 2 ? 'left' : 'right');
  });

  const gesture = Gesture.Race(panGesture, tapGesture);

  const blobStyle = useAnimatedStyle(() => {
    const translateX = progress.value * STEP;
    // A capsule squeezing through the neck: shrink its height and stretch
    // its width as it crosses the midpoint, then relax back to a normal
    // capsule once it's fully inside the far side.
    const squeezeY = interpolate(progress.value, [0, 0.5, 1], [1, 0.58, 1]);
    const squeezeX = interpolate(progress.value, [0, 0.5, 1], [1, 1.22, 1]);
    return {
      backgroundColor: interpolateColor(progress.value, [0, 1], [leftColor, rightColor]),
      borderColor: interpolateColor(progress.value, [0, 1], [leftColor, rightColor]),
      transform: [{ translateX }, { scaleX: squeezeX }, { scaleY: squeezeY }],
    };
  });

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.42]),
  }));
  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.42, 1]),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.track}>
        <Animated.View style={[styles.blob, blobStyle]} pointerEvents="none" />
        <View style={styles.labelsRow} pointerEvents="none">
          <Animated.View style={[styles.labelWrap, leftLabelStyle]}>
            <Text style={styles.label}>{leftLabel}</Text>
          </Animated.View>
          <Animated.View style={[styles.labelWrap, rightLabelStyle]}>
            <Text style={styles.label}>{rightLabel}</Text>
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    backgroundColor: colors.cardSoft,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    width: BLOB_WIDTH,
    height: HEIGHT - PADDING * 2,
    borderRadius: 999,
    borderWidth: 1.5,
    opacity: 0.55,
  },
  labelsRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  labelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
  },
});
