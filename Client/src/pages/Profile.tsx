import BackButton from '../components/BackButton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { profile, updateUser } from '../apis';
import { IUserInfo } from '../types';
import { useState } from 'react';
import CustomTextField from '../components/Custom/CustomTextField';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { queryClient } from '../App';
import { useAuth } from '../provider/AuthProvider';

type Props = {};

const Profile = (props: Props) => {
  const { userId } = useAuth();

  const { data: user } = useQuery<IUserInfo>(['user', userId], () =>
    profile(userId!),
  );
  const [edit, setEdit] = useState<boolean>(false);

  const [editUser, setEditUser] = useState<IUserInfo>(
    user ?? { id: 0, username: '', email: '', categoryOrder: [] },
  );

  // Update user mutation
  const updateUserMutation = useMutation<
    IUserInfo,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    { id: number; user: IUserInfo }
  >(updateUser, {
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
      queryClient.invalidateQueries(['user']);
    },
    onSuccess(data, variables, context) {
      toast('User is updated', { type: 'success' });
      setEdit(false);
    },
    retry: 3,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editUser.email && editUser.username) {
        await updateUserMutation.mutateAsync({
          user: editUser,
          id: editUser.id,
        });
      } else {
        toast('Email / Username is missing', { type: 'error' });
      }
    } catch (error) {}
  };

  return (
    <div>
      <BackButton />
      <form onSubmit={handleSubmit} className="p-2">
        <div className="flex items-center gap-3">
          Username:
          {!edit ? (
            <span
              onClick={() => {
                setEdit(true);
              }}
            >
              {user?.username}
            </span>
          ) : (
            <CustomTextField
              type={'text'}
              value={editUser!['username']}
              callbackAction={(event) => {
                setEditUser((prev) => {
                  return {
                    ...prev,
                    username: event.target.value,
                  };
                });
              }}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          Email:
          {!edit ? (
            <span
              onClick={() => {
                setEdit(true);
              }}
            >
              {user?.email}
            </span>
          ) : (
            <CustomTextField
              type={'email'}
              value={editUser!['email']}
              callbackAction={(event) => {
                setEditUser((prev) => {
                  return {
                    ...prev,
                    email: event.target.value,
                  };
                });
              }}
            />
          )}
        </div>
        {edit && (
          <div className="flex justify-end pt-2 gap-2">
            <button
              className="bg-zinc-400 w-fit p-1 rounded-md text-white hover:bg-zinc-300 cursor-pointer active:bg-zinc-500 select-none"
              onClick={async () => {
                setEdit(false);
                setEditUser(
                  user ?? { id: 0, username: '', email: '', categoryOrder: [] },
                );
              }}
              type="button"
            >
              Cancel
            </button>
            <button className="bg-rose-400 w-fit p-1 rounded-md text-white hover:bg-rose-300 cursor-pointer active:bg-rose-500 select-none">
              Update
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile;
