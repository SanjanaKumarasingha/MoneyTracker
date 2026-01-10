export default function Settings() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
        <div>
          <div className="text-sm text-slate-400">Currency</div>
          <select className="mt-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
            <option>LKR</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </div>

        <div>
          <div className="text-sm text-slate-400">Monthly limit</div>
          <input
            className="mt-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2"
            placeholder="e.g. 50000"
          />
        </div>

        <button className="rounded-xl border border-slate-700 px-3 py-2 hover:bg-slate-900">
          Save
        </button>
      </div>
    </div>
  );
}
