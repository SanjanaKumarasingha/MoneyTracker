import clsx from 'clsx';
import { HTMLAttributes } from 'react';

// Soft translucent badge. In dark mode it's the shared `.lux-pill` style
// (white/5 fill, white/10 hairline); light mode gets the equivalent slate tint.
const Pill = ({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
      'bg-zinc-100 border border-zinc-200 text-zinc-600',
      'dark:bg-white/5 dark:border-white/10 dark:text-slate-300',
      className,
    )}
    {...rest}
  />
);

export default Pill;
