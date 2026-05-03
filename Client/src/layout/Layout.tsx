import { ReactElement } from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import clsx from 'clsx';
import NavbarOverlay from '../components/NavbarOverlay';
import MobileBottomNav from '../components/MobileBottomNav';
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
        <div
          className={clsx(
            'absolute -left-24 top-[-120px] h-[360px] w-[360px] rounded-full blur-[110px]',
            isDarkMode ? 'bg-blue-500/20' : 'bg-blue-300/35',
          )}
        />
        <div
          className={clsx(
            'absolute right-[-80px] top-[140px] h-[320px] w-[320px] rounded-full blur-[100px]',
            isDarkMode ? 'bg-emerald-400/15' : 'bg-emerald-300/28',
          )}
        />
        <div
          className={clsx(
            'absolute bottom-[-120px] left-[35%] h-[280px] w-[280px] rounded-full blur-[100px]',
            isDarkMode ? 'bg-cyan-400/10' : 'bg-cyan-300/24',
          )}
        />
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
            <main className={clsx('flex-1', mode === 'dashboard' && 'pb-20 sm:pb-0')}>
              {children}
            </main>
          </div>

          <div
            className={clsx(
              'absolute left-0 top-0 z-50 h-full overflow-hidden transition-all duration-300 sm:hidden',
              isSideBarOpen ? 'w-full' : 'w-0',
            )}
          >
            <NavbarOverlay />
          </div>
        </div>

        {mode === 'dashboard' && <MobileBottomNav />}
      </div>
    </div>
  );
};

export default Layout;
