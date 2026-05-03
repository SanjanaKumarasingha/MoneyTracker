import { Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { useDarkMode } from '../provider/DarkModeProvider';

const PublicLayout = () => {
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
            isDarkMode ? 'bg-emerald-400/15' : 'bg-emerald-300/26',
          )}
        />
        <div
          className={clsx(
            'absolute bottom-[-120px] left-[35%] h-[280px] w-[280px] rounded-full blur-[100px]',
            isDarkMode ? 'bg-cyan-400/10' : 'bg-cyan-300/22',
          )}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-4 sm:px-4 sm:py-6">
        <main className="flex flex-1 items-center justify-center">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PublicLayout;
