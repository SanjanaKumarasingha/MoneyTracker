import React, { useMemo, useState } from "react";
import CustomAlert, { CustomAlertType } from "../components/Custom/CustomAlert";
import { useMutation } from "@tanstack/react-query";
import { register } from "../apis";
import CustomTextField from "../components/Custom/CustomTextField";
import { IUser, IUserInfo } from "../types";
import { AxiosError } from "axios";

export interface NewUser extends IUser {
  email: string;
  confirmPassword: string;
}

type ApiError = { error: string; message: string | string[]; statusCode: number };

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

          <CustomTextField
            type="text"
            name="Username"
            value={userInfo.username}
            callbackAction={(event) =>
              setUserInfo((prev) => ({ ...prev, username: event.target.value }))
            }
          />

          <CustomTextField
            type="email"
            name="Email"
            value={userInfo.email}
            callbackAction={(event) =>
              setUserInfo((prev) => ({ ...prev, email: event.target.value }))
            }
          />

          <CustomTextField
            type="password"
            name="Password"
            value={userInfo.password}
            callbackAction={(event) =>
              setUserInfo((prev) => ({ ...prev, password: event.target.value }))
            }
            visibleControl
            visible={showPassword}
            setVisibleControl={setShowPassword}
          />

          <CustomTextField
            type="password"
            name="Confirm Password"
            value={userInfo.confirmPassword}
            callbackAction={(event) =>
              setUserInfo((prev) => ({ ...prev, confirmPassword: event.target.value }))
            }
            visibleControl
            visible={showConfirmPassword}
            setVisibleControl={setShowConfirmPassword}
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={createUser.isPending || !isFormValid}
              className="rounded-md bg-info-500 px-3 py-2 text-sm font-medium text-white
                         hover:bg-info-400 active:bg-info-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createUser.isPending ? "Registering..." : "Register"}
            </button>
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
