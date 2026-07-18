import React from 'react';
import { Stack } from 'expo-router';

import { colors } from '@/theme/colors';

// Settings is a tab that also owns two sub-screens (Profile, Update
// Password), so unlike the single-screen Home/Wallets/Records/Categories/
// Charts tabs it needs its own Stack. The list screen keeps its own header
// hidden (the Tabs navigator's default header already labels it "Settings"),
// while the sub-screens get a native header with a back button and title.
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="update-password" options={{ title: 'Update Password' }} />
    </Stack>
  );
}
