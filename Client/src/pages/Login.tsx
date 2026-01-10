import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { useAuthStore } from "../stores/authStore";

export default function Login() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // expects gateway: POST /auth/login -> { token, role }
    //   const res = await api.post("/auth/login", { email, password });
    
    //   setAuth(res.data.token, res.data.role);
      console.log("Login disabled");
      nav("/");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow"
      >
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track income, expenses, limits, and exports.
        </p>

        <div className="mt-6 space-y-3">
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 outline-none focus:border-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 px-3 py-2 font-medium"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-sm text-slate-400">
            No account?{" "}
            <Link className="text-indigo-300 hover:underline" to="/register">
              Create one
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
