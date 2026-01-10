import React, { useState } from 'react';
import CustomAlert, { CustomAlertType } from '../components/Custom/CustomAlert';
import { useMutation } from '@tanstack/react-query';
import { register } from '../apis';
import CustomTextField from '../components/Custom/CustomTextField';
import { IUser, IUserInfo } from '../types';
import { AxiosError } from 'axios';

type Props = {};

export interface NewUser extends IUser {
  email: string;
  confirmPassword: string;
}

const RegisterPage = (props: Props) => {
  const [userInfo, setUserInfo] = useState<NewUser>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
  });
  const [error, setError] = useState<{
    message: string;
    type: CustomAlertType;
  }>({ message: '', type: 'warning' });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setConfirmShowPassword] =
    useState<boolean>(false);

  const isValidEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const createUser = useMutation<
    IUserInfo,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    NewUser
  >(register, {
    onError(error, variables, context) {
      setError({
        type: 'error',
        message: error.response
          ? error.response?.data.message ?? ''
          : error.message,
      });
    },
    onSuccess(data, variables, context) {
      setError({ type: 'success', message: 'User is created' });
    },
    onSettled(data, error, variables, context) {
      setUserInfo({
        username: '',
        password: '',
        email: '',
        confirmPassword: '',
      });
    },
    retry: 3,
  });

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !userInfo.username ||
      !userInfo.email ||
      !userInfo.password ||
      !userInfo.confirmPassword
    ) {
      return setError({
        message: 'Please fill up all the blanks',
        type: 'error',
      });
    }

    if (userInfo.password !== userInfo.confirmPassword) {
      return setError({
        message: 'Passwords do not match!',
        type: 'error',
      });
    }

    if (isValidEmail(userInfo.email)) {
      try {
        await createUser.mutateAsync(userInfo);
      } catch (error) {}
    } else {
      setError({ message: 'Invalid email', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 font-Barlow">
      <form
        className="w-1/2 py-3 px-5 text-lg flex flex-col gap-2 rounded-lg shadow dark:shadow-zinc-700"
        onSubmit={handleRegister}
      >
        {error.message && (
          <CustomAlert type={error.type} content={error.message} />
        )}

        <CustomTextField
          type="text"
          name="Username"
          value={userInfo.username}
          callbackAction={(event) => {
            setUserInfo((prev) => {
              return { ...prev, username: event.target.value };
            });
          }}
        />
        <CustomTextField
          type="email"
          name="Email"
          value={userInfo.email}
          callbackAction={(event) => {
            setUserInfo((prev) => {
              return { ...prev, email: event.target.value };
            });
          }}
        />

        <CustomTextField
          type="password"
          name="Password"
          value={userInfo.password}
          callbackAction={(event) => {
            setUserInfo((prev) => {
              return { ...prev, password: event.target.value };
            });
          }}
          visibleControl
          visible={showPassword}
          setVisibleControl={setShowPassword}
        />

        <CustomTextField
          type="password"
          name="Confirm Password"
          value={userInfo.confirmPassword}
          callbackAction={(event) => {
            setUserInfo((prev) => {
              return { ...prev, confirmPassword: event.target.value };
            });
          }}
          visibleControl
          visible={showConfirmPassword}
          setVisibleControl={setConfirmShowPassword}
        />
        <div className="flex justify-end">
          <button className="bg-info-400 w-fit p-1 rounded-md text-white hover:bg-info-300 cursor-pointer active:bg-info-500 select-none">
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
