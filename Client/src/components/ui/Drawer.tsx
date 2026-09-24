import clsx from 'clsx';
import React, { ReactNode, useEffect, useRef } from 'react';
import { TfiClose } from 'react-icons/tfi';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Panel width from the sm breakpoint up; full-width on phones. */
  width?: 'md' | 'lg';
}

const widthClasses = { md: 'sm:max-w-md', lg: 'sm:max-w-xl' };

// Right-hand slide-over panel. Used instead of a centered Modal for
// "adjust a list of settings while still seeing the page" flows (e.g. a
// wallet's category toggles): the page stays visible and un-dimmed enough to
// keep context, the panel doesn't cover it with a full-screen overlay, and
// each toggle applies instantly so there's no Save/Cancel to hunt for.
const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
}: DrawerProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        aria-hidden
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={clsx(
          'relative flex h-full w-full flex-col outline-none animate-slide-in-right',
          'lux-card bg-white border-l border-zinc-200 shadow-2xl',
          widthClasses[width],
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 dark:border-white/[0.08] p-5">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {title}
            </div>
            {description && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <TfiClose />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-white/[0.08] p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
