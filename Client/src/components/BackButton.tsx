import React from 'react';
import { BsChevronLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
  text?: string;
};

const BackButton = ({ text }: BackButtonProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2 items-center">
      <div
        className="cursor-pointer rounded-full p-1 hover:bg-primary-50 active:bg-primary-100 dark:hover:bg-opacity-40 dark:active:bg-opacity-60 w-fit"
        onClick={() => {
          navigate(-1);
        }}
      >
        <BsChevronLeft />
      </div>
      Back {text && `to ${text}`}
    </div>
  );
};

export default BackButton;
