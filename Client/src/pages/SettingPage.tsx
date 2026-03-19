import { BsChevronRight } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { PiMoonStarsThin, PiSunThin } from 'react-icons/pi';
import { useDarkMode } from '../provider/DarkModeProvider';

type Props = {};

const SettingPage = (props: Props) => {
  const { enable, disable, isDarkMode } = useDarkMode();
  const settings = [
    {
      name: 'User Profile',
      path: '/profile',
    },
    {
      name: 'Update Password',
      path: '/update-password',
    },
  ];

  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="shadow dark:shadow-primary-900 p-3 flex justify-between items-center hover:bg-primary-50 dark:hover:bg-primary-900 dark:hover:bg-opacity-40">
        <div>
          <div className="font-medium">Mode</div>
          <div className="text-sm text-slate-500 dark:text-white/60">
            Switch between light and dark appearance
          </div>
        </div>

        <div className="flex items-center gap-2 text-xl">
          <button
            type="button"
            className={clsx(
              'rounded-2xl p-2 transition',
              !isDarkMode
                ? 'bg-amber-400/15 text-amber-400'
                : 'text-slate-500 dark:text-white/55 hover:bg-slate-100 dark:hover:bg-white/10',
            )}
            onClick={() => disable()}
            aria-label="Enable light mode"
          >
            <PiSunThin />
          </button>
          <button
            type="button"
            className={clsx(
              'rounded-2xl p-2 transition',
              isDarkMode
                ? 'bg-cyan-400/15 text-cyan-200'
                : 'text-slate-500 hover:bg-slate-100',
            )}
            onClick={() => enable()}
            aria-label="Enable dark mode"
          >
            <PiMoonStarsThin />
          </button>
        </div>
      </div>

      {settings.map((setting) => (
        <div
          key={setting.path}
          className="shadow dark:shadow-primary-900 p-2 cursor-pointer flex justify-between items-center hover:bg-primary-50 active:bg-primary-100 dark:hover:bg-primary-900 dark:hover:bg-opacity-40 dark:active:bg-opacity-80"
          onClick={() => {
            navigate(setting.path);
          }}
        >
          <span>{setting.name}</span>
          <BsChevronRight />
        </div>
      ))}
    </div>
  );
};

export default SettingPage;
