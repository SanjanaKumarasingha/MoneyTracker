import clsx from 'clsx';
import React, { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, ...rest }: SkeletonProps) => {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700',
        className,
      )}
      {...rest}
    />
  );
};

export const SkeletonText = ({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) => {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={clsx('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className }: { className?: string }) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm p-4 flex flex-col gap-3',
        className,
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
};

export default Skeleton;
