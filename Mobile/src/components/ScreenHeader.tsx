import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  // Tab-root variant: title left-aligned, optional action on the right.
  right?: ReactNode;
  // Sub-page variant: back chevron + centered title + optional overflow slot.
  back?: { onPress: () => void; overflow?: ReactNode };
};

// Owns the safe-area top inset itself so no screen using it can regress into
// the header-under-status-bar bug that hit Plan/Report/Settings/Categories.
export default function ScreenHeader({ title, subtitle, right, back }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  if (back) {
    return (
      <View style={[styles.header, styles.backHeader, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={back.onPress} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.backTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.backSlot}>{back.overflow}</View>
      </View>
    );
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  backHeader: {
    gap: spacing.sm,
  },
  backTitle: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  backSlot: {
    minWidth: 24,
    alignItems: 'flex-end',
  },
});
