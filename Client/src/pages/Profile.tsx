import BackButton from '../components/BackButton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { profile, updateUser } from '../apis';
import { IUserInfo } from '../types';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { queryClient } from '../App';
import { useAuth } from '../provider/AuthProvider';
import { Button, Card, Input } from '../components/ui';

type Props = {};

type FieldErrors = {
  username?: string;
  email?: string;
};

const Profile = (props: Props) => {
  const { userId } = useAuth();

  const { data: user } = useQuery<IUserInfo>({
    queryKey: ['user', userId],
    queryFn: () => profile(userId!),
    enabled: !!userId,
  });

  const [edit, setEdit] = useState<boolean>(false);

  const [editUser, setEditUser] = useState<IUserInfo>(
    user ?? { id: 0, username: '', email: '', categoryOrder: [] },
  );

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Update user mutation
  const updateUserMutation = useMutation<
    IUserInfo,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    { id: number; user: IUserInfo }
  >({
    mutationFn: updateUser,
    onMutate: async ({ user }) => {
      // Optimistically update the cache
      queryClient.setQueryData<IUserInfo>(['user'], (oldData) => {
        if (oldData) {
          oldData.username = user.username;
          oldData.email = user.email;
        }
        return oldData;
      });
      return {
        previousWallets: queryClient.getQueryData<IUserInfo>(['user']),
      };
    },
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
      setEdit(false);
    },
    retry: 3,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors: FieldErrors = {};
    if (!editUser.username) nextFieldErrors.username = 'Username is required';
    if (!editUser.email) nextFieldErrors.email = 'Email is required';
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      toast('Email / Username is missing', { type: 'error' });
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        user: editUser,
        id: editUser.id,
      });
    } catch (error) {}
  };

  const handleCancel = () => {
    setEdit(false);
    setFieldErrors({});
    setEditUser(
      user ?? { id: 0, username: '', email: '', categoryOrder: [] },
    );
  };

  return (
    <div>
      <BackButton />

      <div className="mt-2 flex items-center gap-3 px-1">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xl font-semibold text-white">
          {(user?.username ?? '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {user?.username ?? 'Your profile'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {user?.email ?? 'Tap a field below to edit it.'}
          </p>
        </div>
      </div>

      <Card className="mt-4" padding="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Username
            </span>
            {!edit ? (
              <div
                className="cursor-pointer rounded-md border border-transparent px-2 py-1.5 text-zinc-900 hover:border-primary-300 dark:text-zinc-100"
                onClick={() => setEdit(true)}
              >
                {user?.username}
              </div>
            ) : (
              <Input
                type="text"
                value={editUser.username}
                error={fieldErrors.username}
                onChange={(event) => {
                  setEditUser((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }));
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                  }
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Email
            </span>
            {!edit ? (
              <div
                className="cursor-pointer rounded-md border border-transparent px-2 py-1.5 text-zinc-900 hover:border-primary-300 dark:text-zinc-100"
                onClick={() => setEdit(true)}
              >
                {user?.email}
              </div>
            ) : (
              <Input
                type="email"
                value={editUser.email}
                error={fieldErrors.email}
                onChange={(event) => {
                  setEditUser((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }));
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
              />
            )}
          </div>

          {edit && (
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={updateUserMutation.isPending}
              >
                Update
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};

export default Profile;
