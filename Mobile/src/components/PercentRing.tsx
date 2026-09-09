import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors } from '@/theme/colors';

type PercentRingProps = {
  percent: number;
  color: string;
  size?: number;
};

export default function PercentRing({ percent, color, size = 42 }: PercentRingProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="transparent" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <View style={styles.ringLabelWrap} pointerEvents="none">
        <Text style={styles.ringLabel}>{Math.round(clamped)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringLabelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
});
