import React from 'react';
import { Stack } from 'expo-router';

// Wraps the tab navigator in a Stack so wallet/[id], transactions, and
// add-record can be pushed WITHOUT the bottom tab bar — nesting them inside
// the Tabs itself would keep the tab bar visible underneath, which none of
// these full-screen flows want.
export default function AppGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="wallet/[id]" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="add-record" options={{ animation: 'none' }} />
    </Stack>
  );
}
