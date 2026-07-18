import clsx from 'clsx';
import React, { ReactNode, useEffect, useRef } from 'react';
import { TfiClose } from 'react-icons/tfi';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: ModalSize;
  children?: ReactNode;
  footer?: ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:w-1/4',
  md: 'sm:w-1/2',
  lg: 'sm:w-4/5',
};

const Modal = ({ isOpen, onClose, title, size = 'md', children, footer }: ModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 w-full h-full bg-zinc-900 bg-opacity-40 z-50 flex items-end sm:items-center justify-center sm:p-5"
      onClick={(event) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={clsx(
          'bg-white dark:bg-zinc-800 shadow-lg overflow-auto w-full min-w-min max-h-[85vh]',
          'rounded-t-2xl sm:rounded-xl',
          'animate-slide-up sm:animate-none',
          sizeClasses[size],
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-700">
          <div className="font-medium text-zinc-800 dark:text-zinc-100">
            {title}
          </div>
          <div
            className="hover:bg-zinc-100 rounded-full p-1 cursor-pointer active:bg-zinc-200 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 dark:text-white"
            onClick={onClose}
          >
            <TfiClose />
          </div>
        </div>

        <div className="p-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-zinc-100 dark:border-zinc-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
