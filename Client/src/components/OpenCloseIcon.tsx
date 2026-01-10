import React from 'react';

type OpenCloseIconProps = {
  isOpen: boolean;
  color?: string;
  stroke?: number;
  size: number;
};

const OpenCloseIcon = ({ isOpen, color, stroke, size }: OpenCloseIconProps) => {
  // Common Style for lines
  const commonStyle: React.CSSProperties = {
    height: stroke ?? 1,
    width: isOpen ? size * 0.75 : size,
    display: 'block',
    position: 'absolute',
    transformOrigin: 'center',
    transition: '.25s ease-in-out',
    borderRadius: size,
    opacity: 1,
    backgroundColor: color ?? 'black',
  };

  return (
    <div className="flex">
      <div
        className="my-auto"
        style={{
          width: isOpen ? size * 0.75 : size,
          height: size * 0.75,
          position: 'relative',
          transform: 'rotate(0)',
          transition: '0.5s ease-in-out',
        }}
      >
        <span
          style={{
            ...commonStyle,
            top: isOpen ? (size * 0.75) / 2 : 0,
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
          }}
        ></span>
        <span
          style={{
            ...commonStyle,
            top: (size * 0.75) / 2,
            width: isOpen ? '0' : size,
            opacity: isOpen ? 0 : 1,
          }}
        ></span>
        <span
          style={{
            ...commonStyle,
            top: isOpen ? (size * 0.75) / 2 : size * 0.75,
            transform: isOpen ? 'rotate(-45deg)' : 'rotate(0)',
          }}
        ></span>
      </div>
    </div>
  );
};

export default OpenCloseIcon;
