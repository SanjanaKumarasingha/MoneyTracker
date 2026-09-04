import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ECategoryType } from '@/types';
import { colors } from '@/theme/colors';

type ExpenseIncomeSwitchProps = {
  value: ECategoryType;
  onChange: (value: ECategoryType) => void;
};

const WIDTH = 200;
const HEIGHT = 36;
const PADDING = 3;
const CAPSULE_WIDTH = (WIDTH - PADDING * 2) / 2;

// Compact sliding-capsule switch: a single capsule springs left/right
// between the two labels and re-tints itself (soft rose <-> soft emerald)
// as it crosses, while each label's own text color (not just opacity)
// tracks which side is active — crimson/emerald when active, muted slate
// when not.
export default function ExpenseIncomeSwitch({ value, onChange }: ExpenseIncomeSwitchProps) {
  const progress = useSharedValue(value === ECategoryType.INCOME ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value === ECategoryType.INCOME ? 1 : 0, { damping: 16, stiffness: 170 });
  }, [value, progress]);

  const capsuleStyle = useAnimatedStyle(() => {
    // A capsule squeezing through the neck, not a rigid box sliding then
    // stopping dead — shrink its height and stretch its width as it
    // crosses the midpoint, then relax back to a normal capsule once it's
    // fully on the far side. Same fluid feel as the tab bar's jelly pill.
    const squeezeY = interpolate(progress.value, [0, 0.5, 1], [1, 0.58, 1]);
    const squeezeX = interpolate(progress.value, [0, 0.5, 1], [1, 1.22, 1]);
    return {
      transform: [
        { translateX: progress.value * CAPSULE_WIDTH },
        { scaleX: squeezeX },
        { scaleY: squeezeY },
      ],
      backgroundColor: interpolateColor(progress.value, [0, 1], ['#FEE2E2', '#DCFCE7']),
    };
  });

  const isExpense = value === ECategoryType.EXPENSE;
  const isIncome = value === ECategoryType.INCOME;

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.capsule, capsuleStyle]} pointerEvents="none" />
      <Pressable style={styles.option} onPress={() => onChange(ECategoryType.EXPENSE)}>
        <Text style={[styles.label, isExpense ? styles.labelExpenseActive : styles.labelInactive]}>Expense</Text>
      </Pressable>
      <Pressable style={styles.option} onPress={() => onChange(ECategoryType.INCOME)}>
        <Text style={[styles.label, isIncome ? styles.labelIncomeActive : styles.labelInactive]}>Income</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    backgroundColor: colors.card,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: PADDING,
    alignSelf: 'center',
  },
  capsule: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    width: CAPSULE_WIDTH,
    height: HEIGHT - PADDING * 2,
    borderRadius: 999,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  labelExpenseActive: {
    color: '#DC2626',
  },
  labelIncomeActive: {
    color: '#16A34A',
  },
  labelInactive: {
    color: colors.textMuted,
  },
});
