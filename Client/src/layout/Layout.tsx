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
    <div className="min-h-screen font-Barlow flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 relative">
      {/* Soft ambient color, fixed behind everything - a frosted-glass
          surface (Header/Navbar/BottomNavbar) has nothing to actually look
          "frosted" against on top of a flat single-color background. These
          are low-opacity, blurred, and pointer-events-none so they never
          affect layout or interaction. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-primary-300/30 dark:bg-primary-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-success-300/25 dark:bg-success-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-primary-200/25 dark:bg-primary-800/20 blur-3xl" />
      </div>

      <div
        className={clsx(
          'flex p-2 gap-2 transition-all select-none flex-1',
          mode === 'dashboard' && 'pb-16 sm:pb-2',
        )}
      >
        {mode === 'dashboard' && (
          // Fixed sidebar width instead of a fluid grid column - on a wide
          // desktop monitor a % -based sidebar grows well past what 4 short
          // nav rows need, leaving huge empty gutters either side of the
          // logo/links.
          <div className="sm:block hidden w-60 shrink-0">
            <Navbar />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <Header />
          {/* Capped + centered so content stops stretching edge-to-edge on
              wide monitors - the single biggest "messy" contributor across
              every page (search "max-w-" before this change: zero hits in
              the authenticated app). */}
          <div className="rounded-lg flex-1 w-full max-w-6xl mx-auto">
            {children}
          </div>
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
