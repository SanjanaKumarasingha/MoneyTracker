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
import { Link, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { register } from '@/apis';
import { ApiError, IUserInfo, NewUser } from '@/types';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import PasswordInput from '@/components/PasswordInput';

type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type AlertState = { type: 'error'; message: string };

const isValidEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email);

function extractErrorMessage(err: AxiosError<ApiError>): string {
  const msg = err.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? err.message ?? 'Unexpected error from server';
}

export default function RegisterScreen() {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<NewUser>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<AlertState | null>(null);

  const isFormValid = useMemo(
    () =>
      userInfo.username.trim().length > 0 &&
      userInfo.email.trim().length > 0 &&
      userInfo.password.length > 0 &&
      userInfo.confirmPassword.length > 0,
    [userInfo],
  );

  const createUser = useMutation<IUserInfo, AxiosError<ApiError>, NewUser>({
    mutationFn: register,
    onMutate: () => setAlert(null),
    onError: (err) => setAlert({ type: 'error', message: extractErrorMessage(err) }),
    onSuccess: () => {
      router.replace('/(auth)/login');
    },
  });

  const handleRegister = async () => {
    const username = userInfo.username.trim();
    const email = userInfo.email.trim();

    const nextFieldErrors: FieldErrors = {};
    if (!username) nextFieldErrors.username = 'Username is required';
    if (!email) nextFieldErrors.email = 'Email is required';
    else if (!isValidEmail(email)) nextFieldErrors.email = 'Invalid email';
    if (!userInfo.password) nextFieldErrors.password = 'Password is required';
    if (!userInfo.confirmPassword) {
      nextFieldErrors.confirmPassword = 'Please confirm your password';
    } else if (userInfo.password !== userInfo.confirmPassword) {
      nextFieldErrors.confirmPassword = 'Passwords do not match!';
    }
    setFieldErrors(nextFieldErrors);

    if (!isFormValid || Object.keys(nextFieldErrors).length > 0) {
      setAlert({ type: 'error', message: 'Please fill up all the fields correctly' });
      return;
    }

    try {
      await createUser.mutateAsync({ ...userInfo, username, email });
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Register to start tracking your money.</Text>

            {alert ? (
              <View style={[styles.alertBanner, styles.errorBanner]}>
                <Text style={styles.errorBannerText}>{alert.message}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, fieldErrors.username && styles.inputError]}
                value={userInfo.username}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                placeholder="Choose a username"
                placeholderTextColor={colors.textMuted}
                onChangeText={(value) => {
                  setUserInfo((prev) => ({ ...prev, username: value }));
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
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, fieldErrors.email && styles.inputError]}
                value={userInfo.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                onChangeText={(value) => {
                  setUserInfo((prev) => ({ ...prev, email: value }));
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
              />
              {fieldErrors.email ? (
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <PasswordInput
                style={[styles.input, fieldErrors.password && styles.inputError]}
                value={userInfo.password}
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder="Create a password"
                placeholderTextColor={colors.textMuted}
                onChangeText={(value) => {
                  setUserInfo((prev) => ({ ...prev, password: value }));
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
              />
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <PasswordInput
                style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
                value={userInfo.confirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textMuted}
                onChangeText={(value) => {
                  setUserInfo((prev) => ({ ...prev, confirmPassword: value }));
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
              />
              {fieldErrors.confirmPassword ? (
                <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!isFormValid || createUser.isPending) && styles.buttonDisabled,
                pressed &&
                  isFormValid &&
                  !createUser.isPending && styles.buttonPressed,
              ]}
              disabled={!isFormValid || createUser.isPending}
              onPress={handleRegister}
            >
              {createUser.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </Pressable>

            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.linkRow}>
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkTextBold}>Log in</Text>
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
    paddingVertical: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: 24,
    ...shadows.card,
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
  alertBanner: {
    marginTop: 16,
    borderRadius: 8,
    padding: 10,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
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
    height: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.inputBg,
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
