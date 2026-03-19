import React from 'react';
import { BsChevronLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
  text?: string;
};

const BackButton = ({ text }: BackButtonProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="dashboard-chip text-sm text-white/80"
      onClick={() => {
        navigate(-1);
      }}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80">
        <BsChevronLeft />
      </span>
      <span>Back {text && `to ${text}`}</span>
    </button>
  );
};

export default BackButton;
