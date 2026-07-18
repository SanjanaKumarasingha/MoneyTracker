import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import { IoSearchOutline } from 'react-icons/io5';
import { useOutsideAlerter } from '../../hooks';

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: string[];
  value: string;
  placeholder?: string;
  filter?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
}

const Select = ({
  label,
  error,
  helperText,
  options,
  value,
  placeholder,
  filter,
  disabled,
  onChange,
  className,
}: SelectProps) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: React.MouseEvent) => {
    if (
      listRef.current &&
      !listRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  };

  const wrapperRef = useOutsideAlerter(handleClickOutside);

  return (
    <div className={clsx('w-full font-medium relative', className)} ref={wrapperRef}>
      {label && (
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
          {label}
        </div>
      )}

      <div
        className={clsx(
          'w-full border p-2 flex items-center justify-between rounded-lg bg-white dark:bg-zinc-800',
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer',
          error
            ? 'border-danger-500'
            : 'border-zinc-300 dark:border-zinc-600',
        )}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        ref={buttonRef}
      >
        <p
          className={clsx(
            'truncate select-none',
            !value && 'text-zinc-400',
          )}
        >
          {value || placeholder || 'Select...'}
        </p>
        <BsChevronDown className="text-zinc-500 dark:text-zinc-300 shrink-0" />
      </div>

      <ul
        className={clsx(
          'bg-white dark:bg-zinc-800 mt-2 max-h-40 text-zinc-700 dark:text-zinc-300 overflow-y-auto overflow-x-hidden z-50 absolute break-words rounded-lg transition-all duration-300 shadow-sm border border-zinc-200 dark:border-zinc-700',
          open ? 'visible' : 'hidden',
        )}
        ref={listRef}
        style={{
          width: wrapperRef.current?.clientWidth,
        }}
      >
        {filter && (
          <div className="flex gap-2 sticky top-0 z-50 overflow-x-hidden mx-2 pt-2 bg-white dark:bg-zinc-800 items-center">
            <IoSearchOutline className="text-zinc-400" strokeWidth={1} />
            <input
              type="text"
              value={inputValue}
              className="outline-none placeholder:text-zinc-400 overflow-x-hidden truncate flex-1 bg-transparent dark:text-zinc-100"
              placeholder={placeholder}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
            />
          </div>
        )}

        {options.map((option) => (
          <li
            key={option}
            className={clsx(
              'p-2 hover:bg-primary-50 dark:hover:bg-primary-900 relative cursor-pointer',
              inputValue && !new RegExp(inputValue, 'i').test(option)
                ? 'hidden'
                : 'block',
            )}
            onClick={() => {
              if (value !== option) {
                onChange(option);
              }
              setOpen(false);
            }}
          >
            {option}
          </li>
        ))}
      </ul>

      {error ? (
        <p className="text-xs text-danger-500 mt-1">{error}</p>
      ) : (
        helperText && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {helperText}
          </p>
        )
      )}
    </div>
  );
};

export default Select;
