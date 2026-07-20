import React from 'react';
import { Tabs } from 'expo-router';

import JellyTabBar from '@/components/JellyTabBar';

// Exactly 4 destinations — Home, Report, Plan, Settings. Wallets live on
// Home, Categories lives in Settings, and "+" is a floating action on the
// custom tab bar below rather than a fifth tab.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <JellyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="report" options={{ title: 'Report' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
