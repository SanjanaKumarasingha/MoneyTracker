import React, { useMemo, useState } from "react";
import CustomAlert, { CustomAlertType } from "../components/Custom/CustomAlert";
import { useMutation } from "@tanstack/react-query";
import { register } from "../apis";
import CustomTextField from "../components/Custom/CustomTextField";
import { IUser, IUserInfo, ApiError } from "../types";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useDarkMode } from "../provider/DarkModeProvider";

export interface NewUser extends IUser {
  email: string;
  confirmPassword: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
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
    <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1.1fr_minmax(0,420px)]">
      <section className="hidden rounded-[32px] px-8 py-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className={clsx("dashboard-kicker", isDarkMode ? "text-white/40" : "text-slate-500")}>
            Get started
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight">
            Build a clearer money routine from the first wallet onward.
          </h1>
          <p className={clsx("mt-4 max-w-xl text-base", isDarkMode ? "text-white/60" : "text-slate-600")}>
            Create your account, add a wallet, and keep records organized with a layout that works on both desktop and mobile.
          </p>
        </div>
      </section>

      <div className="auth-card mx-auto max-w-md">
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

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-left text-xs text-info-600 hover:text-info-700 dark:text-info-300 dark:hover:text-info-200"
              onClick={() => navigate("/login")}
            >
              Already have an account? Login
            </button>
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
