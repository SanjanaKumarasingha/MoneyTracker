import React from 'react';
import { Stack } from 'expo-router';

import { colors } from '@/theme/colors';

// Wallets is a tab that also owns a per-wallet Goals sub-screen, so like
// Settings it needs its own Stack rather than being a single flat screen.
export default function WalletsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/goals" options={{ title: 'Goals' }} />
    </Stack>
  );
}
