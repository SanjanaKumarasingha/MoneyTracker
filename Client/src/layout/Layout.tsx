import { ReactElement } from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import BottomNavbar from '../components/BottomNavbar';
import clsx from 'clsx';
import Footer from '../components/Footer';

type LayoutProps = {
  children: ReactElement;
  mode?: 'dashboard' | 'layout';
};

const Layout = ({ children, mode }: LayoutProps) => {
  return (
    <div className="min-h-screen font-Barlow flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div
        className={clsx(
          'grid grid-cols-5  p-2 gap-2 transition-all select-none flex-1',
          mode === 'dashboard' && 'pb-16 sm:pb-2',
        )}
      >
        {mode === 'dashboard' && (
          <div className="sm:block hidden">
            <Navbar />
          </div>
        )}

        <div
          className={clsx(
            'flex-1 flex flex-col gap-2 ',
            mode === 'dashboard' ? 'sm:col-span-4 col-span-5' : 'col-span-5',
          )}
        >
          <Header />
          <div className="rounded-lg flex-1">{children}</div>
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>

      {mode === 'dashboard' && <BottomNavbar />}
    </div>
  );
};

export default Layout;
