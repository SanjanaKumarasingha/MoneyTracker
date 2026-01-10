export default function Transactions() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col md:flex-row gap-3">
        <select className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
          <option>Day</option>
          <option>Month</option>
          <option>Year</option>
          <option>Custom range</option>
        </select>
        <input className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" placeholder="Search note/category..." />
        <button className="rounded-xl bg-indigo-500 px-3 py-2 font-medium hover:bg-indigo-400">
          Add Transaction
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="text-sm text-slate-400">List will appear here</div>
      </div>
    </div>
  );
}
