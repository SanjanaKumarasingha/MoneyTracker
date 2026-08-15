import React, { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Same spring feel already tuned in JellyTabBar.tsx, reused here so every
// pressable in the app scales down consistently instead of only the tab bar
// having press feedback.
const SPRING = { damping: 18, stiffness: 160 };

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  scaleTo?: number;
  // Reanimated layout-animation props (entering/exiting/layout) — typed
  // loosely since Reanimated's own types are awkward to thread through a
  // wrapper component and this is a thin, internal-only component.
  entering?: any;
  exiting?: any;
  layout?: any;
};

export default function PressableScale({ style, children, scaleTo = 0.96, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
