import BackButton from '../components/BackButton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { profile, updatePassword } from '../apis';
import { IUpdatePasswordDto, IUserInfo } from '../types';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { queryClient } from '../App';
import { useAuth } from '../provider/AuthProvider';
import { Button, Card, Input } from '../components/ui';

type Props = {};

interface IConfirmPassword extends IUpdatePasswordDto {
  confirmNewPassword: string;
}

type FieldErrors = {
  oldPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

const UpdatePassword = (props: Props) => {
  const { userId } = useAuth();

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const [password, setPassword] = useState<IConfirmPassword>({
    id: user?.id ?? 0,
    email: user?.email ?? '',
    username: user?.username ?? '',
    categoryOrder: user?.categoryOrder ?? [],
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Update user mutation
  const updatePasswordMutation = useMutation<
    IUserInfo,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    IUpdatePasswordDto
  >({
    mutationFn: updatePassword,
    onError: (error, variables, context) => {
      // Revert the cache to the previous state on error
      const typedContext = context as {
        previousUser: IUserInfo | undefined;
      };

      if (typedContext.previousUser) {
        queryClient.setQueryData<IUserInfo>(
          ['user'],
          typedContext.previousUser,
        );
      }
      toast(error.response?.data.message, { type: 'error' });
    },
    onSettled: () => {
      // Refetch the data to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onSuccess(data, variables, context) {
      toast('User is updated', { type: 'success' });
    },
    retry: 3,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: FieldErrors = {};

    if (!password.oldPassword) {
      nextFieldErrors.oldPassword = 'Original password is required';
    }
    if (!password.newPassword) {
      nextFieldErrors.newPassword = 'New password is required';
    }
    if (!password.confirmNewPassword) {
      nextFieldErrors.confirmNewPassword = 'Please confirm your new password';
    }

    if (
      !nextFieldErrors.oldPassword &&
      !nextFieldErrors.newPassword &&
      password.oldPassword === password.newPassword
    ) {
      nextFieldErrors.newPassword =
        'The new password is same as the old password';
    }

    if (
      !nextFieldErrors.newPassword &&
      !nextFieldErrors.confirmNewPassword &&
      password.newPassword !== password.confirmNewPassword
    ) {
      nextFieldErrors.confirmNewPassword = 'New password does not match';
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync(password);
    } catch (error) {}
  };

  return (
    <div>
      <BackButton />
      <Card className="mt-2" padding="md">
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input
            type="password"
            label="Original Password"
            autoComplete="current-password"
            value={password.oldPassword}
            error={fieldErrors.oldPassword}
            onChange={(event) => {
              setPassword((prev) => ({
                ...prev,
                oldPassword: event.target.value,
              }));
              if (fieldErrors.oldPassword) {
                setFieldErrors((prev) => ({ ...prev, oldPassword: undefined }));
              }
            }}
          />

          <Input
            type="password"
            label="New Password"
            autoComplete="new-password"
            value={password.newPassword}
            error={fieldErrors.newPassword}
            onChange={(event) => {
              setPassword((prev) => ({
                ...prev,
                newPassword: event.target.value,
              }));
              if (fieldErrors.newPassword) {
                setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
              }
            }}
          />

          <Input
            type="password"
            label="Confirm New Password"
            autoComplete="new-password"
            value={password.confirmNewPassword}
            error={fieldErrors.confirmNewPassword}
            onChange={(event) => {
              setPassword((prev) => ({
                ...prev,
                confirmNewPassword: event.target.value,
              }));
              if (fieldErrors.confirmNewPassword) {
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmNewPassword: undefined,
                }));
              }
            }}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={updatePasswordMutation.isPending}
            >
              Update
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UpdatePassword;
