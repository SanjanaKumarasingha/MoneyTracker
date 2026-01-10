import clsx from 'clsx';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import { useOutsideAlerter } from '../../hooks';

type CustomAccordionProps = {
  header: string | ReactElement;
  customClass?: string;
  children: ReactElement;
  childClass?: string;
  triggerUpdate?: any;
  arrowPosition?: 'Left' | 'Right';
  hideArrow?: boolean;

  controlled?: {
    expanded: boolean;
    handleChange: (
      open: boolean,
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    ) => void;
  };
};

const CustomAccordion = ({
  header,
  customClass,
  children,
  childClass,
  triggerUpdate,
  arrowPosition,
  hideArrow,
  controlled,
}: CustomAccordionProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const [contentHeight, setContentHeight] = useState(0);

  const childRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (controlled) {
      if (controlled.expanded) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
    if (childRef.current) {
      setContentHeight(childRef.current?.scrollHeight);
    }
  }, [triggerUpdate, open, controlled?.expanded]);

  return (
    <div
      className={clsx(
        'accordion p-2 rounded w-full shadow flex flex-col',
        customClass,
      )}
    >
      <div
        className={clsx(
          'flex w-full justify-between cursor-pointer items-center',
          arrowPosition === 'Right' ? 'flex-row-reverse' : '',
        )}
        onClick={(e) => {
          if (!controlled) {
            setOpen((prev) => !prev);
          } else {
            controlled.handleChange(open, e);
          }
        }}
      >
        <span className="flex-1">{header}</span>

        <BsChevronDown
          className={clsx(
            'duration-300',
            {
              'rotate-180': open,
            },
            {
              ['hidden']: hideArrow,
            },
          )}
        />
      </div>

      <div
        // transition animation need to be first, CSS issue
        className={clsx(
          open ? childClass : '',
          'transition-[max-height] transition-all duration-500 ease-in-out overflow-x-auto overflow-y-hidden',
        )}
        style={{ maxHeight: open ? contentHeight : 0 }}
        ref={childRef}
      >
        {children}
      </div>
    </div>
  );
};

export default CustomAccordion;
