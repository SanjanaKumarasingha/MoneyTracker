import React, { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { jwtDecode } from 'jwt-decode';

import { store } from '@/store';
import { useAppDispatch } from '@/hooks';
import { setIsSignedIn } from '@/store/userSlice';
import { AuthProvider, useAuth } from '@/provider/AuthProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { clearStoredToken, getStoredToken } from '@/lib/secureStorage';
import Toast from '@/components/Toast';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    // react-native-draggable-flatlist (used by the Categories tab's reorder
    // lists) is built on react-native-gesture-handler, which requires a
    // GestureHandlerRootView somewhere above it in the tree.
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <SessionBootstrap>
                <RootNavigator />
              </SessionBootstrap>
            </AuthProvider>
            <ThemedStatusBar />
            <Toast />
          </QueryClientProvider>
        </Provider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

// expo-status-bar's style="auto" already follows the OS scheme on its own,
// but Home.tsx (see app/(app)/(tabs)/index.tsx) imperatively forces 'light'
// while it's focused (its hero banner is a solid blue gradient in both
// themes) and must hand back the *current* theme's style on blur rather
// than a hardcoded one — reading `scheme` here isn't strictly required for
// that handoff (Home reads useTheme() itself), but keeping the root style
// explicitly tied to the resolved theme (rather than 'auto') avoids any
// lag between an in-app Light/Dark override and the OS's own scheme.
function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

/**
 * Restores a persisted session on boot: reads the JWT from expo-secure-store,
 * decodes it, and checks its expiry — mirroring the logic in
 * Client/src/provider/AuthProvider.tsx, adapted for expo-secure-store's
 * async API. Renders a loading spinner until the check completes so the
 * auth-gate below never flashes the login screen for an already-signed-in
 * user.
 */
function SessionBootstrap({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const token = await getStoredToken();

        if (token) {
          const decoded = jwtDecode<{ exp: number }>(token);
          const nowInSeconds = Date.now() / 1000;

          if (decoded.exp > nowInSeconds) {
            dispatch(setIsSignedIn({ access_token: token, user: undefined }));
          } else {
            await clearStoredToken();
          }
        }
      } catch {
        // Malformed/unreadable token — treat as signed out.
        await clearStoredToken();
      } finally {
        setIsReady(true);
      }
    })();
  }, [dispatch]);

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Auth-gated navigator. Mirrors Client/src/layout/AuthLayout.tsx's intent
 * (redirect to login when unauthenticated) using expo-router's declarative
 * Stack.Protected guards: whichever group's guard is true is the one
 * that's mounted, so flipping `isSignedIn`/`authorized` in redux (via
 * sign in / logout) automatically redirects the user to the right group.
 */
function RootNavigator() {
  const { authorized, isSignedIn } = useAuth();
  const signedIn = authorized && isSignedIn;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
