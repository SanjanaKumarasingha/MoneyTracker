import React from 'react';
import { Tabs } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';
import WhatsAppJellyTabBar from '@/components/WhatsAppJellyTabBar';

// 4 destinations — Home, Analytics, Plan, Settings. Wallets live on Home,
// Categories lives in Settings. Analytics surfaces the existing per-wallet
// CategoryBreakdown (donut + category rows) as its own tab, with a wallet
// switcher on top, rather than duplicating that chart logic.
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <WhatsAppJellyTabBar {...props} />}
      // React Navigation's default scene background is white regardless of
      // theme — without this, dark mode showed a flash/strip of white
      // wherever a screen hadn't already painted its own background over
      // the full scene (e.g. around the floating tab bar's safe-area gap).
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
