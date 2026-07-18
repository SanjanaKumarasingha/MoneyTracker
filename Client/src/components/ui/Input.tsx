import clsx from 'clsx';
import React, { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      type = 'text',
      id,
      ...rest
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword ? (visible ? 'text' : 'password') : type;
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className={clsx('flex flex-col gap-1 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-200"
          >
            {label}
          </label>
        )}

        <div
          className={clsx(
            'flex items-center gap-2 rounded-lg border px-2 py-1.5 bg-white dark:bg-zinc-800',
            error
              ? 'border-danger-500 focus-within:ring-1 focus-within:ring-danger-500'
              : 'border-zinc-300 dark:border-zinc-600 focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500',
          )}
        >
          {leftIcon && (
            <span className="text-zinc-400 flex items-center">{leftIcon}</span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            aria-invalid={!!error || undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={clsx(
              'flex-1 min-w-0 outline-none bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400',
              className,
            )}
            {...rest}
          />

          {isPassword ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="text-zinc-400 cursor-pointer hover:text-zinc-600 active:text-zinc-500 dark:hover:text-zinc-200 flex items-center"
              onClick={() => setVisible((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setVisible((prev) => !prev);
                }
              }}
            >
              {visible ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </span>
          ) : (
            rightIcon && (
              <span className="text-zinc-400 flex items-center">
                {rightIcon}
              </span>
            )
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-danger-500">
            {error}
          </p>
        ) : (
          helperText && (
            <p
              id={`${inputId}-helper`}
              className="text-xs text-zinc-500 dark:text-zinc-400"
            >
              {helperText}
            </p>
          )
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
