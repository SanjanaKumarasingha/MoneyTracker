import React, { useState } from 'react';
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
import { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profile, updatePassword } from '@/apis';
import { useAuth } from '@/provider/AuthProvider';
import { ApiError, IUpdatePasswordDto, IUserInfo } from '@/types';
import { colors } from '@/theme/colors';
import PasswordInput from '@/components/PasswordInput';

type FieldErrors = {
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

interface IConfirmPassword extends IUpdatePasswordDto {
  confirmNewPassword: string;
}

const emptyPassword = (user?: IUserInfo): IConfirmPassword => ({
  id: user?.id ?? 0,
  username: user?.username ?? '',
  email: user?.email ?? '',
  categoryOrder: user?.categoryOrder ?? [],
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

// Native counterpart to Client/src/pages/UpdatePassword.tsx: old/new/confirm
// password fields with the same inline validation rules (all required, new
// != old, new == confirm), submitted via the shared updatePassword API.
export default function UpdatePasswordScreen() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const [password, setPassword] = useState<IConfirmPassword>(emptyPassword());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const updatePasswordMutation = useMutation<IUserInfo, AxiosError<ApiError>, IUpdatePasswordDto>({
    mutationFn: updatePassword,
    onError: (error) => {
      const message = error.response?.data.message;
      setBanner({
        type: 'error',
        message: Array.isArray(message) ? message.join('\n') : message ?? 'Could not update your password.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onSuccess: () => {
      setBanner({ type: 'success', message: 'Password updated.' });
      setPassword(emptyPassword(user));
    },
  });

  const setField = (field: keyof IConfirmPassword, value: string) => {
    setPassword((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = () => {
    const nextFieldErrors: FieldErrors = {};

    if (!password.oldPassword) nextFieldErrors.oldPassword = 'Original password is required';
    if (!password.newPassword) nextFieldErrors.newPassword = 'New password is required';
    if (!password.confirmNewPassword) nextFieldErrors.confirmNewPassword = 'Please confirm your new password';

    if (!nextFieldErrors.oldPassword && !nextFieldErrors.newPassword && password.oldPassword === password.newPassword) {
      nextFieldErrors.newPassword = 'The new password is same as the old password';
    }

    if (
      !nextFieldErrors.newPassword &&
      !nextFieldErrors.confirmNewPassword &&
      password.newPassword !== password.confirmNewPassword
    ) {
      nextFieldErrors.confirmNewPassword = 'New password does not match';
    }

    setFieldErrors(nextFieldErrors);
    setBanner(null);

    if (Object.keys(nextFieldErrors).length > 0) return;

    updatePasswordMutation.mutate({
      id: password.id,
      username: password.username,
      email: password.email,
      categoryOrder: password.categoryOrder,
      oldPassword: password.oldPassword,
      newPassword: password.newPassword,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.card}>
          {banner && (
            <View style={[styles.banner, banner.type === 'error' ? styles.errorBanner : styles.successBanner]}>
              <Text style={banner.type === 'error' ? styles.errorBannerText : styles.successBannerText}>
                {banner.message}
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Original Password</Text>
            <PasswordInput
              style={[styles.input, fieldErrors.oldPassword && styles.inputError]}
              value={password.oldPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              onChangeText={(text) => setField('oldPassword', text)}
            />
            {fieldErrors.oldPassword && <Text style={styles.fieldError}>{fieldErrors.oldPassword}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New Password</Text>
            <PasswordInput
              style={[styles.input, fieldErrors.newPassword && styles.inputError]}
              value={password.newPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              onChangeText={(text) => setField('newPassword', text)}
            />
            {fieldErrors.newPassword && <Text style={styles.fieldError}>{fieldErrors.newPassword}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm New Password</Text>
            <PasswordInput
              style={[styles.input, fieldErrors.confirmNewPassword && styles.inputError]}
              value={password.confirmNewPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              onChangeText={(text) => setField('confirmNewPassword', text)}
            />
            {fieldErrors.confirmNewPassword && (
              <Text style={styles.fieldError}>{fieldErrors.confirmNewPassword}</Text>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
              onPress={handleSubmit}
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Update</Text>
              )}
            </Pressable>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    margin: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 6,
  },
  banner: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 13,
  },
  successBanner: {
    backgroundColor: colors.successSoft,
  },
  successBannerText: {
    color: colors.success,
    fontSize: 13,
  },
  field: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  saveButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
