import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signIn } from '../apis';
import CustomAlert from '../components/Custom/CustomAlert';
import CustomTextField from '../components/Custom/CustomTextField';

import { AxiosError } from 'axios';
import { setIsSignedIn } from '../store/userSlice';
import { LoginResponse, IUser } from '../types';

type Props = {};

const LoginPage = (props: Props) => {
  const { isSignedIn } = useAppSelector((state) => state.user);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const login = useMutation<
    LoginResponse,
    AxiosError<{ error: string; message: string; statusCode: number }>,
    IUser
  >(signIn, {
    onError(error, variables, context) {
      console.log(error);
      setError(error.response?.data.message ?? 'Unexpected error from server');
    },
    onSuccess(data, variables, context) {
      dispatch(
        setIsSignedIn({
          access_token: data.access_token,
          user: data.user,
        }),
      );
      setError('');
      navigate('/');
    },
  });

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username && password) {
      try {
        await login.mutateAsync({ username, password });
      } catch (error) {}
    } else {
      setError('Username / Password is missing');
    }
  };

  if (isSignedIn) {
    return <Navigate to={'/'} />;
  }

  return (
    <div className="flex flex-col items-center gap-4 font-Barlow">
      <form
        className="min-w-[50%] max-w-[80%] py-3 px-5 text-lg flex flex-col gap-2 rounded-lg shadow dark:shadow-zinc-700"
        onSubmit={handleSignIn}
      >
        {error && <CustomAlert type={'error'} content={error} />}

        <CustomTextField
          type="text"
          name="Username"
          value={username}
          callbackAction={(event) => {
            setUsername(event.target.value);
          }}
        />
        <CustomTextField
          type="password"
          name="Password"
          value={password}
          callbackAction={(event) => {
            setPassword(event.target.value);
          }}
          visibleControl
          visible={showPassword}
          setVisibleControl={setShowPassword}
        />
        <div>
          <div
            className="cursor-pointer text-xs hover:text-info-600"
            onClick={() => {
              navigate('/register');
            }}
          >
            You don't have an account? Click Me to register
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="bg-info-400 w-fit p-1 rounded-md text-white hover:bg-info-300 cursor-pointer active:bg-info-500 select-none"
            type="submit"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
