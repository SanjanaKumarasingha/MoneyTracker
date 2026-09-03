import React from 'react';
import { Tabs } from 'expo-router';

import JellyTabBar from '@/components/JellyTabBar';

// Exactly 3 destinations — Home, Plan, Settings. Wallets live on Home,
// Categories lives in Settings. Report's category breakdown moved into the
// per-wallet screen (wallet/[id].tsx) since it was always scoped to one
// wallet anyway; there's no standalone Report destination anymore.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <JellyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
