import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/userSlice';
import { FaUserCircle } from 'react-icons/fa';
import { useOutsideAlerter } from '../hooks/useOutsideAlerter';

type Props = {};

const Setting = (props: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { isSignedIn } = useAppSelector((state) => state.user);

  // The menu used to open purely on CSS :hover (peer-hover) - unreachable by
  // keyboard and invisible to screen readers (no button, no aria-expanded).
  // This swaps it for a real disclosure: click/Enter/Space to toggle,
  // Escape or an outside click to dismiss.
  const menuRef = useOutsideAlerter((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  });

  return (
    <div className="float-right relative" ref={menuRef}>
      {isSignedIn ? (
        <>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label="Account menu"
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setIsOpen(false);
            }}
            className="cursor-pointer hover:bg-zinc-100 rounded-full text-zinc-600 dark:text-zinc-400 text-2xl"
          >
            <FaUserCircle strokeWidth={1} />
          </button>
          {isOpen && (
            <ul
              role="menu"
              className="bg-white absolute float-right top-full right-0 z-10 rounded-md shadow dark:text-zinc-800"
            >
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-3 py-2 rounded-t-md cursor-pointer hover:bg-zinc-200 active:bg-zinc-100"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/settings');
                  }}
                >
                  Setting
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-3 py-2 rounded-b-md cursor-pointer hover:bg-zinc-200 active:bg-zinc-100"
                  onClick={() => {
                    setIsOpen(false);
                    dispatch(logout());
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
          )}
        </>
      ) : (
        <button
          onClick={() => {
            navigate('/login');
          }}
        >
          Login
        </button>
      )}
    </div>
  );
};

export default Setting;
