import React, { ReactNode } from 'react';
import Button, { ButtonProps } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionProps?: Omit<ButtonProps, 'onClick' | 'children'>;
}

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionProps,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 p-8">
      {icon && (
        <div className="text-4xl text-primary-500 dark:text-primary-400 mb-1">
          {icon}
        </div>
      )}
      <p className="font-medium text-zinc-800 dark:text-zinc-100">{title}</p>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-2" onClick={onAction} {...actionProps}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
