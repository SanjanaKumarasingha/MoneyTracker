import { ReactElement } from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import clsx from 'clsx';
import NavbarOverlay from '../components/NavbarOverlay';
import { useMenu } from '../provider/MenuOpenProvider';
import Footer from '../components/Footer';

type LayoutProps = {
  children: ReactElement;
  mode?: 'dashboard' | 'layout';
};

const Layout = ({ children, mode }: LayoutProps) => {
  const { isSideBarOpen } = useMenu();

  return (
    <div className="min-h-screen font-Barlow flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-primary-50">
      <div className="grid grid-cols-5  p-2 gap-2 transition-all select-none flex-1">
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

        {/* <div
          className={clsx(
            'sm:hidden absolute h-full top-0 left-0 z-50 transition-all duration-300 overflow-hidden',
            isSideBarOpen ? 'w-full' : 'w-0',
          )}
        >
          <NavbarOverlay />
        </div> */}
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
