import React, { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "../apis";
import CustomAlert from "../components/Custom/CustomAlert";
import { AxiosError } from "axios";
import { setIsSignedIn } from "../store/userSlice";
import { LoginResponse, IUser, ApiError } from "../types";
import { Button, Input } from "../components/ui";

type FieldErrors = {
  username?: string;
  password?: string;
};

const LoginPage = () => {
  const { isSignedIn } = useAppSelector((state) => state.user);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

    const nextFieldErrors: FieldErrors = {};
    if (!username.trim()) nextFieldErrors.username = "Username is required";
    if (!password) nextFieldErrors.password = "Password is required";
    setFieldErrors(nextFieldErrors);

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

          <Input
            type="text"
            label="Username"
            autoComplete="username"
            value={username}
            error={fieldErrors.username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
          />

          <Input
            type="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            error={fieldErrors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
          />

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 py-0 text-xs text-primary-600 hover:bg-transparent hover:underline dark:text-primary-300"
              onClick={() => navigate("/register")}
            >
              Don’t have an account? Register
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={!isFormValid || login.isPending}
              isLoading={login.isPending}
            >
              {login.isPending ? "Logging in..." : "Login"}
            </Button>
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
