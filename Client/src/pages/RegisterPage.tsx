import React, { useMemo, useState } from "react";
import CustomAlert, { CustomAlertType } from "../components/Custom/CustomAlert";
import { useMutation } from "@tanstack/react-query";
import { register } from "../apis";
import { IUser, IUserInfo, ApiError } from "../types";
import { AxiosError } from "axios";
import { Button, Input } from "../components/ui";

export interface NewUser extends IUser {
  email: string;
  confirmPassword: string;
}

type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const RegisterPage = () => {
  const [userInfo, setUserInfo] = useState<NewUser>({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  const [alert, setAlert] = useState<{ message: string; type: CustomAlertType }>({
    message: "",
    type: "warning",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isValidEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email);

  const isFormValid = useMemo(() => {
    return (
      userInfo.username.trim().length > 0 &&
      userInfo.email.trim().length > 0 &&
      userInfo.password.length > 0 &&
      userInfo.confirmPassword.length > 0
    );
  }, [userInfo]);

  const createUser = useMutation<IUserInfo, AxiosError<ApiError>, NewUser>({
    mutationFn: register,
    onMutate: () => {
      // clear previous alert when a new attempt starts
      setAlert({ message: "", type: "warning" });
    },
    onError: (error) => {
      const msg = error.response?.data?.message;
      setAlert({
        type: "error",
        message: Array.isArray(msg) ? msg.join(", ") : msg ?? error.message,
      });
    },
    onSuccess: () => {
      setAlert({ type: "success", message: "User is created" });
      setUserInfo({ username: "", password: "", email: "", confirmPassword: "" });
    },
    retry: 3,
  });

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = userInfo.username.trim();
    const email = userInfo.email.trim();

    const nextFieldErrors: FieldErrors = {};
    if (!username) nextFieldErrors.username = "Username is required";
    if (!email) nextFieldErrors.email = "Email is required";
    else if (!isValidEmail(email)) nextFieldErrors.email = "Invalid email";
    if (!userInfo.password) nextFieldErrors.password = "Password is required";
    if (!userInfo.confirmPassword) {
      nextFieldErrors.confirmPassword = "Please confirm your password";
    } else if (userInfo.password !== userInfo.confirmPassword) {
      nextFieldErrors.confirmPassword = "Passwords do not match!";
    }
    setFieldErrors(nextFieldErrors);

    if (!isFormValid) {
      setAlert({ message: "Please fill up all the blanks", type: "error" });
      return;
    }

    if (!isValidEmail(email)) {
      setAlert({ message: "Invalid email", type: "error" });
      return;
    }

    if (userInfo.password !== userInfo.confirmPassword) {
      setAlert({ message: "Passwords do not match!", type: "error" });
      return;
    }

    try {
      await createUser.mutateAsync({ ...userInfo, username, email });
    } catch {
      // handled by onError
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 font-Barlow">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-800/40">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Create account
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Register to start tracking your money.
        </p>

        <form className="mt-5 flex flex-col gap-3" onSubmit={handleRegister}>
          {alert.message && <CustomAlert type={alert.type} content={alert.message} />}

          <Input
            type="text"
            label="Username"
            autoComplete="username"
            value={userInfo.username}
            error={fieldErrors.username}
            onChange={(event) => {
              setUserInfo((prev) => ({ ...prev, username: event.target.value }));
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
          />

          <Input
            type="email"
            label="Email"
            autoComplete="email"
            value={userInfo.email}
            error={fieldErrors.email}
            onChange={(event) => {
              setUserInfo((prev) => ({ ...prev, email: event.target.value }));
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
          />

          <Input
            type="password"
            label="Password"
            autoComplete="new-password"
            value={userInfo.password}
            error={fieldErrors.password}
            onChange={(event) => {
              setUserInfo((prev) => ({ ...prev, password: event.target.value }));
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
          />

          <Input
            type="password"
            label="Confirm Password"
            autoComplete="new-password"
            value={userInfo.confirmPassword}
            error={fieldErrors.confirmPassword}
            onChange={(event) => {
              setUserInfo((prev) => ({ ...prev, confirmPassword: event.target.value }));
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
          />

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              disabled={createUser.isPending || !isFormValid}
              isLoading={createUser.isPending}
            >
              {createUser.isPending ? "Registering..." : "Register"}
            </Button>
          </div>

          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            Tip: Use a valid email so you can recover your account later.
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
