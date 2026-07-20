import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type LiquidGaugeProps = {
  percent: number;
  size?: number;
  // Three-stop vertical gradient (top -> bottom) for the liquid itself.
  // Defaults to a realistic blue "water" look; pass danger tones for an
  // over-limit state instead of a flat color swap.
  colorLight?: string;
  colorMid?: string;
  colorDeep?: string;
  trackColor?: string;
  label?: string;
};

const WAVE_AMPLITUDE = 4;
const WAVE_STEPS = 24;

// A transparent glass "vessel" (circle outline) partially filled with an
// animated water gradient, clipped so the liquid never draws outside the
// circle, plus a static glossy highlight for a glass-sphere feel. `percent`
// drives the fill height (animated with withTiming on change); the wave's
// horizontal sloshing motion runs continuously and independently via a
// looping phase value.
export default function LiquidGauge({
  percent,
  size = 96,
  colorLight = colors.waterHealthyLight,
  colorMid = colors.waterHealthyMid,
  colorDeep = colors.waterHealthyDeep,
  trackColor = colors.border,
  label,
}: LiquidGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const fillLevel = useSharedValue(0);
  const wavePhase = useSharedValue(0);

  useEffect(() => {
    fillLevel.value = withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clamped, fillLevel]);

  useEffect(() => {
    wavePhase.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
    // Runs once on mount — the continuous sloshing animation is independent
    // of `percent` changes, which are handled by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radius = size / 2;
  const clipRadius = radius - 2;
  const gradientId = `liquidGaugeGradient-${colorMid}`;
  const clipId = `liquidGaugeClip-${size}`;

  const animatedProps = useAnimatedProps(() => {
    const baselineY = size * (1 - fillLevel.value / 100);
    let d = `M 0 ${size} L 0 ${baselineY.toFixed(2)} `;
    for (let i = 0; i <= WAVE_STEPS; i++) {
      const x = (i / WAVE_STEPS) * size;
      const y =
        baselineY + WAVE_AMPLITUDE * Math.sin((x / size) * 2 * Math.PI + wavePhase.value);
      d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    d += `L ${size} ${size} Z`;
    return { d };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Circle cx={radius} cy={radius} r={clipRadius} />
          </ClipPath>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colorLight} stopOpacity={0.9} />
            <Stop offset="0.55" stopColor={colorMid} stopOpacity={0.92} />
            <Stop offset="1" stopColor={colorDeep} stopOpacity={0.96} />
          </LinearGradient>
        </Defs>
        <Circle cx={radius} cy={radius} r={clipRadius} stroke={trackColor} strokeWidth={2} fill="transparent" />
        <AnimatedPath animatedProps={animatedProps} fill={`url(#${gradientId})`} clipPath={`url(#${clipId})`} />
        {/* Static glossy highlight — a glass-sphere reflection, independent of fill level. */}
        <Ellipse
          cx={radius - clipRadius * 0.32}
          cy={radius - clipRadius * 0.45}
          rx={clipRadius * 0.3}
          ry={clipRadius * 0.18}
          fill="#ffffff"
          opacity={0.35}
        />
      </Svg>
      {label ? (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{label}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 3,
  },
});
