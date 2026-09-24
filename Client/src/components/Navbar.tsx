import { ReactElement } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HiOutlineHome } from 'react-icons/hi';
import { HiOutlineWallet } from 'react-icons/hi2';
import { AiOutlineBarChart } from 'react-icons/ai';
import { TbReportSearch } from 'react-icons/tb';
import { LuTarget } from 'react-icons/lu';
import { PiCoinsFill } from 'react-icons/pi';
import clsx from 'clsx';
type Props = {};

interface INavItem {
  name: string;
  icon: ReactElement;
  path: string;
}

export const navItems: INavItem[] = [
  {
    name: 'Home',
    icon: <HiOutlineHome strokeWidth="1" />,
    path: '/',
  },
  {
    name: 'Wallets',
    icon: <HiOutlineWallet strokeWidth="1" />,
    path: '/wallets',
  },
  {
    name: 'Records',
    icon: <TbReportSearch strokeWidth="1" />,
    path: '/records',
  },
  {
    name: 'Analytics',
    icon: <AiOutlineBarChart strokeWidth="1" />,
    path: '/charts',
  },
  {
    name: 'Goals',
    icon: <LuTarget strokeWidth="1.5" />,
    path: '/goals',
  },
];

const Navbar = (props: Props) => {
  const navigate = useNavigate();
  return (
    <nav
      aria-label="Primary"
      className={clsx(
        // Full-height rail: near-black obsidian with a faint vertical sheen
        // so it reads as a separate, darker layer than the page behind it.
        'h-full flex flex-col backdrop-blur-xl',
        'bg-white dark:bg-gradient-to-b dark:from-[#0a0e16]/95 dark:to-[#06080d]/95',
        'border-r border-zinc-200 dark:border-white/[0.06]',
        'text-zinc-800 dark:text-zinc-100',
      )}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-3 px-5 py-5 text-left cursor-pointer"
      >
        {/* Gold metallic crest: diagonal champagne ramp, inner top highlight
            and bottom shade for a struck-metal look, with a soft blurred
            amber halo behind it. */}
        <span className="relative">
          <span
            aria-hidden
            className="absolute inset-0 -m-1.5 rounded-2xl bg-amber-400/30 blur-lg"
          />
          <span
            aria-hidden
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-xl text-amber-950 ring-1 ring-inset ring-amber-100/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_-2px_3px_rgba(120,53,15,0.35),0_4px_14px_-2px_rgba(217,119,6,0.55)] bg-gradient-to-br from-amber-100 via-amber-300 to-amber-600"
          >
            <PiCoinsFill />
          </span>
        </span>
        <span className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight">Money</span>
          <span className="block -mt-0.5 text-lg font-extrabold tracking-tight text-primary-600 dark:bg-gradient-to-r dark:from-amber-200 dark:to-amber-400 dark:bg-clip-text dark:text-transparent">
            Game
          </span>
        </span>
      </button>

      <div className="flex flex-col gap-0.5 px-3 pt-2 text-[15px]">
        {navItems.map((item) => (
          <NavLink
            to={item.path}
            end={item.path === '/'}
            key={item.name}
            className={({ isActive }) =>
              clsx(
                // Active = ice-blue frosted pill (translucent fill, hairline
                // ring, backdrop blur); idle = muted label that lifts and
                // slides a couple of px on hover.
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                isActive
                  ? 'bg-primary-600/10 text-primary-700 dark:bg-sky-300/[0.09] dark:text-sky-50 dark:backdrop-blur-md dark:ring-1 dark:ring-inset dark:ring-sky-200/20 dark:shadow-[0_0_24px_-8px_rgba(125,211,252,0.35)] font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.05] hover:text-zinc-900 dark:hover:text-zinc-100 hover:translate-x-0.5',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'text-xl transition-colors',
                    isActive
                      ? 'text-primary-600 dark:text-sky-300'
                      : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300',
                  )}
                >
                  {item.icon}
                </span>
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
