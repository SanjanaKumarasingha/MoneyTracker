import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch } from '@/hooks';
import { logout } from '@/store/userSlice';
import { clearStoredToken } from '@/lib/secureStorage';
import { colors } from '@/theme/colors';

type SettingRow = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  badge?: string;
  destructive?: boolean;
};

// Native counterpart to Client/src/pages/SettingPage.tsx: a list of rows
// linking to Profile and Update Password, plus a disabled "Delete Account"
// row. The web app also links to Manage Categories from here, but on mobile
// that already has its own top-level tab, so it's omitted to avoid a
// duplicate entry point. There is still no DELETE /users/:id route on the
// server (Server/src/users/users.controller.ts keeps it commented out), so
// this stays a disabled placeholder rather than a wired-up action.
export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await clearStoredToken();
          dispatch(logout());
          // No manual navigation needed: the root layout's Stack.Protected
          // guards react to `isSignedIn` flipping and swap back to (auth).
        },
      },
    ]);
  }, [dispatch]);

  const rows: SettingRow[] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      onPress: () => router.push('/settings/profile'),
    },
    {
      key: 'update-password',
      label: 'Update Password',
      icon: 'lock-closed-outline',
      onPress: () => router.push('/settings/update-password'),
    },
    {
      key: 'delete-account',
      label: 'Delete Account',
      icon: 'trash-outline',
      disabled: true,
      badge: 'Coming soon',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.list}>
        {rows.map((row) => (
          <Pressable
            key={row.key}
            style={({ pressed }) => [
              styles.row,
              row.disabled && styles.rowDisabled,
              pressed && !row.disabled && styles.rowPressed,
            ]}
            onPress={row.onPress}
            disabled={row.disabled || !row.onPress}
          >
            <View style={styles.rowLeft}>
              <Ionicons name={row.icon} size={20} color={row.disabled ? colors.textMuted : colors.text} />
              <Text style={[styles.rowLabel, row.disabled && styles.rowLabelDisabled]}>{row.label}</Text>
              {row.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{row.badge}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [styles.row, styles.logoutRow, pressed && styles.rowPressed]}
          onPress={handleLogout}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.rowLabel, styles.logoutLabel]}>Log out</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.primarySoft,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowLabelDisabled: {
    color: colors.textMuted,
  },
  badge: {
    backgroundColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  logoutRow: {
    marginTop: 8,
  },
  logoutLabel: {
    color: colors.danger,
  },
});
