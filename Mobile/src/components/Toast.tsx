import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';

type ToastVariant = 'error' | 'success';
type ToastState = { id: number; message: string; variant: ToastVariant } | null;

// Module-level pub-sub rather than context/redux — this is a fire-and-forget
// one-line notice, not app state anything else needs to read.
let listener: ((state: ToastState) => void) | null = null;
let counter = 0;

export function showToast(message: string, variant: ToastVariant = 'error') {
  counter += 1;
  listener?.({ id: counter, message, variant });
}

const VISIBLE_MS = 2600;

// Mount once near the root (app/_layout.tsx). Reuses Skeleton.tsx's
// useSharedValue/useAnimatedStyle/withTiming shape for the slide-in/fade.
export default function Toast() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    listener = (state) => {
      setToast(state);
      progress.value = 0;
      progress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    };
    return () => {
      listener = null;
    };
  }, [progress]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => {
      progress.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setToast)(null);
      });
    }, VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [toast, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -16 }],
  }));

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { top: insets.top + 8 },
        toast.variant === 'success' ? styles.success : styles.error,
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 999,
    ...shadows.raised,
  },
  error: {
    backgroundColor: colors.danger,
  },
  success: {
    backgroundColor: colors.success,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});
