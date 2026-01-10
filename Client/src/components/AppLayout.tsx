import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-xl px-3 py-2 text-sm ${
    isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900"
  }`;

export default function AppLayout() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 p-4">
        <aside className="col-span-12 md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="px-2 py-2">
            <div className="text-lg font-semibold">MoneyTracker</div>
            <div className="text-xs text-slate-400">Web dashboard</div>
          </div>

          <nav className="mt-3 space-y-1">
            <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
            <NavLink to="/transactions" className={linkClass}>Transactions</NavLink>
            <NavLink to="/analytics" className={linkClass}>Analytics</NavLink>
            <NavLink to="/export" className={linkClass}>Export</NavLink>
            <NavLink to="/settings" className={linkClass}>Settings</NavLink>
          </nav>

          <button
            onClick={logout}
            className="mt-4 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"
          >
            Logout
          </button>
        </aside>

        <main className="col-span-12 md:col-span-9 rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
