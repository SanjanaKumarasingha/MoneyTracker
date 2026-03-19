import { useAppDispatch, useAppSelector } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/userSlice';
import { FaUserCircle } from 'react-icons/fa';
import { useState } from 'react';
import { useOutsideAlerter } from '../hooks';
import clsx from 'clsx';
type Props = {};

const Setting = (props: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useOutsideAlerter((event: MouseEvent) => {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  });

  const { isSignedIn } = useAppSelector((state) => state.user);
  return (
    <div className="relative z-[70]" ref={wrapperRef}>
      {isSignedIn ? (
        <>
          <button
            type="button"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 dark:text-white"
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="hidden sm:block">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">
                Account
              </p>
              <p className="text-sm font-medium text-white/85">Settings</p>
            </div>
            <FaUserCircle strokeWidth={1} className="text-2xl text-white/80" />
          </button>
          <ul
            className={clsx(
              'absolute right-0 top-[calc(100%+10px)] z-[80] min-w-[180px] rounded-2xl border p-2 shadow-2xl backdrop-blur-xl transition',
              'bg-slate-950/92 text-white border-white/10',
              open
                ? 'visible translate-y-0 opacity-100'
                : 'invisible -translate-y-1 opacity-0',
            )}
          >
            <li
              className="list-none"
            >
              <button
                type="button"
                className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10"
                onClick={() => {
                  setOpen(false);
                  navigate('/settings');
                }}
              >
                Settings
              </button>
            </li>
            <li
              className="list-none"
            >
              <button
                type="button"
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-400/10"
                onClick={() => {
                  setOpen(false);
                  dispatch(logout());
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </>
      ) : (
        <button
          onClick={() => {
            navigate('/login');
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Login
        </button>
      )}
    </div>
  );
};

export default Setting;
