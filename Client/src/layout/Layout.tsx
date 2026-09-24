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
  const isDashboard = mode === 'dashboard';

  return (
    <div className="min-h-screen font-lux flex flex-col lux-canvas bg-zinc-50 text-zinc-900 dark:text-zinc-100 relative">
      {isDashboard && (
        // Fixed-width rail pinned to the viewport; the content column below
        // is offset by the same 15rem so the two never overlap.
        <div className="hidden sm:block fixed inset-y-0 left-0 z-40 w-60">
          <Navbar />
        </div>
      )}

      <div className={clsx('flex-1 min-w-0 flex flex-col', isDashboard && 'sm:pl-60')}>
        <Header />

        {/* Centered, width-capped canvas - content stops stretching
            edge-to-edge on wide monitors (the empty-gutter problem) but
            still gets a comfortable ~1280px for multi-column dashboards.
            Extra bottom padding on phones clears the fixed bottom tab bar. */}
        <main
          className={clsx(
            'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8',
            isDashboard && 'pb-24 sm:pb-8',
          )}
        >
          {children}
        </main>

        <div className="mt-auto">
          <Footer />
        </div>
      </div>

      {isDashboard && <BottomNavbar />}
    </div>
  );
};

export default Layout;
