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
        <div className="absolute -left-24 top-[-120px] h-[360px] w-[360px] rounded-full bg-blue-500/20 blur-[110px]" />
        <div className="absolute right-[-80px] top-[140px] h-[320px] w-[320px] rounded-full bg-emerald-400/15 blur-[100px]" />
        <div className="absolute bottom-[-120px] left-[35%] h-[280px] w-[280px] rounded-full bg-cyan-400/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-3 sm:px-4">
        <main className="flex flex-1 items-center justify-center">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PublicLayout;
