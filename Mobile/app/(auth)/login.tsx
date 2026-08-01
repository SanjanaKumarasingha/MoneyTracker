import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { signIn } from '@/apis';
import { setStoredToken } from '@/lib/secureStorage';
import { useAppDispatch } from '@/hooks';
import { setIsSignedIn } from '@/store/userSlice';
import { ApiError, IUser, LoginResponse } from '@/types';
import { colors } from '@/theme/colors';
import PasswordInput from '@/components/PasswordInput';

type FieldErrors = {
  username?: string;
  password?: string;
};

function extractErrorMessage(err: AxiosError<ApiError>): string {
  const msg = err.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? err.message ?? 'Unexpected error from server';
}

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const dispatch = useAppDispatch();

  const isFormValid = useMemo(
    () => username.trim().length > 0 && password.length > 0,
    [username, password],
  );

  const login = useMutation<LoginResponse, AxiosError<ApiError>, IUser>({
    mutationFn: signIn,
    onMutate: () => setError(''),
    onError: (err) => setError(extractErrorMessage(err)),
    onSuccess: async (data) => {
      await setStoredToken(data.access_token);
      dispatch(setIsSignedIn({ access_token: data.access_token, user: data.user }));
      // No manual navigation needed here: the root layout's Stack.Protected
      // guards react to `isSignedIn` flipping and swap to the (app) group.
    },
  });

  const handleSignIn = async () => {
    const nextFieldErrors: FieldErrors = {};
    if (!username.trim()) nextFieldErrors.username = 'Username is required';
    if (!password) nextFieldErrors.password = 'Password is required';
    setFieldErrors(nextFieldErrors);

    if (!isFormValid) {
      setError('Username / Password is missing');
      return;
    }

    try {
      await login.mutateAsync({ username: username.trim(), password });
    } catch {
      // handled by onError
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue tracking your income and expenses.
            </Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, fieldErrors.username && styles.inputError]}
                value={username}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                placeholder="Enter your username"
                placeholderTextColor={colors.textMuted}
                onChangeText={(value) => {
                  setUsername(value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }
                }}
              />
              {fieldErrors.username ? (
                <Text style={styles.fieldError}>{fieldErrors.username}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <PasswordInput
                style={[styles.input, fieldErrors.password && styles.inputError]}
                value={password}
                autoCapitalize="none"
                autoComplete="current-password"
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                onChangeText={(value) => {
                  setPassword(value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
              />
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!isFormValid || login.isPending) && styles.buttonDisabled,
                pressed && isFormValid && !login.isPending && styles.buttonPressed,
              ]}
              disabled={!isFormValid || login.isPending}
              onPress={handleSignIn}
            >
              {login.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </Pressable>

            <Link href="/(auth)/register" asChild>
              <Pressable style={styles.linkRow}>
                <Text style={styles.linkText}>
                  Don&apos;t have an account? <Text style={styles.linkTextBold}>Register</Text>
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted,
  },
  errorBanner: {
    marginTop: 16,
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    padding: 10,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 13,
  },
  field: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  linkRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});
