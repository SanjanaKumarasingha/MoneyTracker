import clsx from 'clsx';
import React, { HTMLAttributes } from 'react';

export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const Card = ({
  title,
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-card',
        paddingClasses[padding],
        className,
      )}
      {...rest}
    >
      {title && (
        <div className="font-medium text-zinc-800 dark:text-zinc-100 mb-2">
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
