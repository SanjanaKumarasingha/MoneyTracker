import clsx from 'clsx';
import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 disabled:hover:bg-primary-600',
  secondary:
    'bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-900 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300 disabled:hover:bg-zinc-800',
  outline:
    'bg-transparent border border-zinc-300 text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700 disabled:hover:bg-transparent',
  ghost:
    'bg-transparent text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 disabled:hover:bg-transparent',
  danger:
    'bg-danger-600 text-white hover:bg-danger-500 active:bg-danger-700 disabled:hover:bg-danger-600',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm px-2 py-1 gap-1.5',
  md: 'text-base px-3 py-1.5 gap-2',
  lg: 'text-lg px-4 py-2 gap-2.5',
};

const Spinner = ({ size }: { size: ButtonSize }) => (
  <svg
    className={clsx(
      'animate-spin',
      size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
    )}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
    />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg font-medium select-none transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          !isDisabled && 'cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {isLoading && <Spinner size={size} />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
