import React from 'react';
import { BsChevronLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
  text?: string;
};

const BackButton = ({ text }: BackButtonProps) => {
  const navigate = useNavigate();

  return (
    // A single <button> for the whole row (not just the chevron icon) - the
    // label text is now part of the click/tap target too, not just visually
    // adjacent to it, and it's keyboard-focusable/operable for free.
    <button
      type="button"
      className="flex gap-2 items-center rounded-full pr-2 pl-1 py-1 hover:bg-primary-50 active:bg-primary-100 dark:hover:bg-opacity-40 dark:active:bg-opacity-60 -ml-1"
      onClick={() => {
        navigate(-1);
      }}
    >
      <BsChevronLeft />
      Back {text && `to ${text}`}
    </button>
  );
};

export default BackButton;
