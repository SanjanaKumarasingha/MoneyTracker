import React, { useEffect, useState } from 'react';
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

import { profile, updateUser } from '@/apis';
import { useAuth } from '@/provider/AuthProvider';
import { ApiError, IUserInfo } from '@/types';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import Skeleton from '@/components/Skeleton';
import ErrorState from '@/components/ErrorState';

type FieldErrors = {
  username?: string;
  email?: string;
};

const emptyUser = (): IUserInfo => ({ id: 0, username: '', email: '', categoryOrder: [] });

// Native counterpart to Client/src/pages/Profile.tsx: view username/email,
// tap to edit inline, save via updateUser with the same optimistic-update +
// invalidate pattern as the rest of the app's mutations.
export default function ProfileScreen() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError, refetch } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const [edit, setEdit] = useState(false);
  const [editUser, setEditUser] = useState<IUserInfo>(emptyUser());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string>('');

  useEffect(() => {
    if (user && !edit) {
      setEditUser(user);
    }
  }, [user, edit]);

  const updateUserMutation = useMutation<
    IUserInfo,
    AxiosError<ApiError>,
    { id: number; user: IUserInfo },
    { previousUser?: IUserInfo }
  >({
    mutationFn: updateUser,
    onMutate: async ({ user: nextUser }) => {
      await queryClient.cancelQueries({ queryKey: ['user', userId] });
      const previousUser = queryClient.getQueryData<IUserInfo>(['user', userId]);
      if (previousUser) {
        queryClient.setQueryData<IUserInfo>(['user', userId], {
          ...previousUser,
          username: nextUser.username,
          email: nextUser.email,
        });
      }
      return { previousUser };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previousUser) {
        queryClient.setQueryData(['user', userId], ctx.previousUser);
      }
      const message = error.response?.data.message;
      setBanner(Array.isArray(message) ? message.join('\n') : message ?? 'Could not update your profile.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onSuccess: () => {
      setEdit(false);
      setBanner('');
    },
  });

  const handleEditPress = () => {
    setBanner('');
    setFieldErrors({});
    setEdit(true);
  };

  const handleCancel = () => {
    setEdit(false);
    setFieldErrors({});
    setBanner('');
    setEditUser(user ?? emptyUser());
  };

  const handleSave = () => {
    const nextFieldErrors: FieldErrors = {};
    if (!editUser.username.trim()) nextFieldErrors.username = 'Username is required';
    if (!editUser.email.trim()) nextFieldErrors.email = 'Email is required';
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) return;

    updateUserMutation.mutate({ id: editUser.id, user: editUser });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.card}>
          <Skeleton height={44} borderRadius={10} style={{ marginBottom: 14 }} />
          <Skeleton height={44} borderRadius={10} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <ErrorState message="Couldn't load your profile." onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.card}>
          {!!banner && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{banner}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            {!edit ? (
              <Pressable style={styles.valueBox} onPress={handleEditPress}>
                <Text style={styles.valueText}>{user?.username}</Text>
              </Pressable>
            ) : (
              <>
                <TextInput
                  style={[styles.input, fieldErrors.username && styles.inputError]}
                  value={editUser.username}
                  autoCapitalize="none"
                  onChangeText={(text) => {
                    setEditUser((prev) => ({ ...prev, username: text }));
                    if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                />
                {fieldErrors.username && <Text style={styles.fieldError}>{fieldErrors.username}</Text>}
              </>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            {!edit ? (
              <Pressable style={styles.valueBox} onPress={handleEditPress}>
                <Text style={styles.valueText}>{user?.email}</Text>
              </Pressable>
            ) : (
              <>
                <TextInput
                  style={[styles.input, fieldErrors.email && styles.inputError]}
                  value={editUser.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={(text) => {
                    setEditUser((prev) => ({ ...prev, email: text }));
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                />
                {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}
              </>
            )}
          </View>

          {edit && (
            <View style={styles.actions}>
              <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
                onPress={handleSave}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Update</Text>
                )}
              </Pressable>
            </View>
          )}
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
    gap: 6,
    ...shadows.card,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  errorBannerText: {
    color: colors.danger,
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
  valueBox: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  valueText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
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
    gap: 8,
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonPressed: {
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
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
