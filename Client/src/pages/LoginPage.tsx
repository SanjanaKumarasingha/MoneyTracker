import React, { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "../apis";
import CustomAlert from "../components/Custom/CustomAlert";
import CustomTextField from "../components/Custom/CustomTextField";
import { AxiosError } from "axios";
import { setIsSignedIn } from "../store/userSlice";
import { LoginResponse, IUser } from "../types";

type ApiError = { message: string | string[]; error: string; statusCode: number };

const LoginPage = () => {
  const { isSignedIn } = useAppSelector((state) => state.user);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isFormValid = useMemo(
    () => username.trim().length > 0 && password.length > 0,
    [username, password]
  );

  const login = useMutation<LoginResponse, AxiosError<ApiError>, IUser>({
    mutationFn: signIn,
    onMutate: () => {
      // Clear old error when a new attempt starts
      setError("");
    },
    onError: (err) => {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg ?? "Unexpected error from server");
    },
    onSuccess: (data) => {
      dispatch(
        setIsSignedIn({
          access_token: data.access_token,
          user: data.user,
        })
      );
      navigate("/", { replace: true });
    },
  });

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      setError("Username / Password is missing");
      return;
    }

    try {
      await login.mutateAsync({ username: username.trim(), password });
    } catch {
      // error is handled by onError; no need to swallow it here
    }
  };

  if (isSignedIn) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 font-Barlow">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-800/40">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to continue tracking your income and expenses.
        </p>

        <form className="mt-5 flex flex-col gap-3" onSubmit={handleSignIn}>
          {error && <CustomAlert type="error" content={error} />}

          <CustomTextField
            type="text"
            name="Username"
            value={username}
            callbackAction={(event) => setUsername(event.target.value)}
          />

          <CustomTextField
            type="password"
            name="Password"
            value={password}
            callbackAction={(event) => setPassword(event.target.value)}
            visibleControl
            visible={showPassword}
            setVisibleControl={setShowPassword}
          />

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="text-xs text-info-600 hover:text-info-700 dark:text-info-300 dark:hover:text-info-200"
              onClick={() => navigate("/register")}
            >
              Don’t have an account? Register
            </button>

            <button
              type="submit"
              disabled={!isFormValid || login.isPending}
              className="rounded-md bg-info-500 px-3 py-2 text-sm font-medium text-white
                         hover:bg-info-400 active:bg-info-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {login.isPending ? "Logging in..." : "Login"}
            </button>
          </div>

          {/* Optional small hint area */}
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            Tip: Use your username and password you registered with.
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
