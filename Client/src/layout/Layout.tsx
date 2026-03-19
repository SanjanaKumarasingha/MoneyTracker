import { ReactElement } from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import clsx from 'clsx';
import NavbarOverlay from '../components/NavbarOverlay';
import { useMenu } from '../provider/MenuOpenProvider';
import { useDarkMode } from '../provider/DarkModeProvider';

type LayoutProps = {
  children: ReactElement;
  mode?: 'dashboard' | 'layout';
};

const Layout = ({ children, mode }: LayoutProps) => {
  const { isSideBarOpen } = useMenu();
  const { isDarkMode } = useDarkMode();

  return (
    <div
      className={clsx(
        'min-h-screen font-Barlow transition-colors duration-500',
        isDarkMode ? 'bg-[#06121f] text-white' : 'bg-[#f3f7fb] text-slate-900',
      )}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-[-120px] h-[360px] w-[360px] rounded-full bg-blue-500/20 blur-[110px]" />
        <div className="absolute right-[-80px] top-[140px] h-[320px] w-[320px] rounded-full bg-emerald-400/15 blur-[100px]" />
        <div className="absolute bottom-[-120px] left-[35%] h-[280px] w-[280px] rounded-full bg-cyan-400/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-3 sm:px-4">
        <div className="grid flex-1 grid-cols-1 gap-3 select-none sm:grid-cols-[270px_minmax(0,1fr)]">
        {mode === 'dashboard' && (
          <div className="hidden sm:block">
            <Navbar />
          </div>
        )}

        <div
          className={clsx(
            'flex min-w-0 flex-1 flex-col gap-3',
            mode === 'dashboard' ? '' : 'sm:col-span-2',
          )}
        >
          <Header />
          <main className="flex-1">{children}</main>
        </div>

        <div
          className={clsx(
            'sm:hidden absolute h-full top-0 left-0 z-50 transition-all duration-300 overflow-hidden',
            isSideBarOpen ? 'w-full' : 'w-0',
          )}
        >
          <NavbarOverlay />
        </div>
      </div>

      </div>
    </div>
  );
};

export default Layout;
