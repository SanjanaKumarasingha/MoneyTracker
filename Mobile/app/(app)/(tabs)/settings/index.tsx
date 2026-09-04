import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { deleteAccount, profile } from '@/apis';
import { useAppDispatch } from '@/hooks';
import { useAuth } from '@/provider/AuthProvider';
import { logout } from '@/store/userSlice';
import { clearStoredToken, getStoredPreference, setStoredPreference } from '@/lib/secureStorage';
import { IUserInfo } from '@/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import ScreenHeader from '@/components/ScreenHeader';
import Skeleton from '@/components/Skeleton';
import { showToast } from '@/components/Toast';

const NOTIFICATIONS_PREFERENCE_KEY = 'notifications_enabled';

type SettingRow = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  badge?: string;
  destructive?: boolean;
};

// Native counterpart to Client/src/pages/SettingPage.tsx, extended now that
// Wallets/Charts moved off their own tabs: Manage Categories lives here too
// (you touch it rarely enough that Settings is the right depth for it),
// alongside a profile summary card, Update Password, a local Notifications
// toggle, Delete Account (Google Play Data Safety requirement — cascades via
// DELETE /users/me, see Server/src/users/users.service.ts's deleteAccount),
// and Log Out set apart at the bottom.
export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    getStoredPreference(NOTIFICATIONS_PREFERENCE_KEY).then((stored) => {
      if (stored !== null) setNotificationsOn(stored === 'true');
    });
  }, []);

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsOn(value);
    setStoredPreference(NOTIFICATIONS_PREFERENCE_KEY, value ? 'true' : 'false');
  };

  const { data: user, isLoading: isProfileLoading } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

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

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, wallets, transactions, and goals. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await deleteAccount();
              // Stronger reset than a plain log out: purge every cached
              // server response (wallets, goals, profile, ...) so nothing
              // from the deleted account can flash on screen for whoever
              // signs in next on this device.
              queryClient.clear();
              await clearStoredToken();
              dispatch(logout());
              // No manual navigation needed — same as handleLogout above,
              // the root layout's Stack.Protected guards react to
              // `isSignedIn` flipping and swap back to (auth)/login.
            } catch {
              setIsDeletingAccount(false);
              showToast('Could not delete your account. Please try again.');
            }
          },
        },
      ],
    );
  }, [dispatch, queryClient]);

  const preferenceRows: SettingRow[] = [
    {
      key: 'categories',
      label: 'Manage Categories',
      icon: 'pricetags-outline',
      onPress: () => router.push('/settings/categories'),
    },
    {
      key: 'update-password',
      label: 'Update Password',
      icon: 'lock-closed-outline',
      onPress: () => router.push('/settings/update-password'),
    },
  ];

  const aboutRows: SettingRow[] = [
    {
      key: 'delete-account',
      label: isDeletingAccount ? 'Deleting…' : 'Delete Account',
      icon: 'trash-outline',
      disabled: isDeletingAccount,
      destructive: true,
      onPress: handleDeleteAccount,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScreenHeader title="Settings" />

      <View style={styles.list}>
        {isProfileLoading ? (
          <Skeleton height={72} borderRadius={radius.xxl} />
        ) : (
          <Pressable
            style={({ pressed }) => [styles.profileCard, pressed && styles.rowPressed]}
            onPress={() => router.push('/settings/profile')}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{(user?.username ?? '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.username ?? '—'}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        )}

        <Text style={styles.groupLabel}>Preferences</Text>
        {preferenceRows.map((row) => (
          <Pressable
            key={row.key}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={row.onPress}
          >
            <View style={styles.rowLeft}>
              <Ionicons name={row.icon} size={20} color={colors.text} />
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => handleNotificationsToggle(!notificationsOn)}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>Notifications</Text>
          </View>
          <Switch
            value={notificationsOn}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={notificationsOn ? colors.primary : '#fff'}
          />
        </Pressable>

        <Text style={styles.groupLabel}>About</Text>
        {aboutRows.map((row) => (
          <Pressable
            key={row.key}
            style={({ pressed }) => [styles.row, row.disabled && styles.rowDisabled, pressed && !row.disabled && styles.rowPressed]}
            onPress={row.onPress}
            disabled={row.disabled || !row.onPress}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name={row.icon}
                size={20}
                color={row.disabled ? colors.textMuted : row.destructive ? colors.danger : colors.text}
              />
              <Text
                style={[
                  styles.rowLabel,
                  row.destructive && !row.disabled && styles.logoutLabel,
                  row.disabled && styles.rowLabelDisabled,
                ]}
              >
                {row.label}
              </Text>
              {row.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{row.badge}</Text>
                </View>
              )}
            </View>
            {!row.destructive && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
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
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.md,
    ...shadows.card,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  groupLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    color: colors.textFaint,
    marginTop: 6,
    marginBottom: -2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
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
