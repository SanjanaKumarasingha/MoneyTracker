import React from 'react';
import { Tabs } from 'expo-router';

import WhatsAppJellyTabBar from '@/components/WhatsAppJellyTabBar';

// 4 destinations — Home, Analytics, Plan, Settings. Wallets live on Home,
// Categories lives in Settings. Analytics surfaces the existing per-wallet
// CategoryBreakdown (donut + category rows) as its own tab, with a wallet
// switcher on top, rather than duplicating that chart logic.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <WhatsAppJellyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
