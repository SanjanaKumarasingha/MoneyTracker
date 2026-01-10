import BackButton from '../components/BackButton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { profile, updatePassword } from '../apis';
import { IUpdatePasswordDto, IUserInfo } from '../types';
import CustomTextField from '../components/Custom/CustomTextField';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { queryClient } from '../App';
import { useAuth } from '../provider/AuthProvider';

type Props = {};

interface IConfirmPassword extends IUpdatePasswordDto {
  confirmNewPassword: string;
}

const UpdatePassword = (props: Props) => {
  const { userId } = useAuth();

  const { data: user } = useQuery<IUserInfo>(['user', userId], () =>
    profile(userId!),
  );

  const [password, setPassword] = useState<IConfirmPassword>({
    id: user?.id ?? 0,
    email: user?.email ?? '',
    username: user?.username ?? '',
    categoryOrder: user?.categoryOrder ?? [],
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] =
    useState<boolean>(false);

  // Update user mutation
  const updatePasswordMutation = useMutation<
    IUserInfo,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    IUpdatePasswordDto
  >(updatePassword, {
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
    },
    retry: 3,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (
        password.oldPassword &&
        password.newPassword &&
        password.confirmNewPassword
      ) {
        if (password.oldPassword === password.newPassword) {
          toast('The new password is same as the old password', {
            type: 'warning',
          });
        } else if (password.newPassword !== password.confirmNewPassword) {
          toast('New password does not match', { type: 'error' });
        } else {
          await updatePasswordMutation.mutateAsync(password);
        }
      } else {
        toast('Please fill up all the blank', { type: 'error' });
      }
    } catch (error) {}
  };

  return (
    <div>
      <BackButton />
      <form className="p-2 space-y-2" onSubmit={handleSubmit}>
        <CustomTextField
          name="Original Password"
          direction="horizontal"
          type={'password'}
          value={password['oldPassword']}
          callbackAction={(event) => {
            setPassword((prev) => {
              return {
                ...prev,
                oldPassword: event.target.value,
              };
            });
          }}
          visibleControl
          visible={showOldPassword}
          setVisibleControl={setShowOldPassword}
        />

        <CustomTextField
          name="New Password"
          direction="horizontal"
          type={'password'}
          value={password['newPassword']}
          callbackAction={(event) => {
            setPassword((prev) => {
              return {
                ...prev,
                newPassword: event.target.value,
              };
            });
          }}
          visibleControl
          visible={showNewPassword}
          setVisibleControl={setShowNewPassword}
        />

        <CustomTextField
          name="Confirm New Password"
          direction="horizontal"
          type={'password'}
          value={password['confirmNewPassword']}
          callbackAction={(event) => {
            setPassword((prev) => {
              return {
                ...prev,
                confirmNewPassword: event.target.value,
              };
            });
          }}
          visibleControl
          visible={showConfirmNewPassword}
          setVisibleControl={setShowConfirmNewPassword}
        />
        <div className="flex justify-end pt-2 gap-2">
          <button className="bg-rose-400 w-fit p-1 rounded-md text-white hover:bg-rose-300 cursor-pointer active:bg-rose-500 select-none">
            Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdatePassword;
