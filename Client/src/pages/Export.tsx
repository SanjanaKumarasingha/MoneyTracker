export default function ExportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Export</h1>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
        <div className="text-sm text-slate-400">
          Download Excel for a month.
        </div>

        <div className="flex gap-3">
          <input type="month" className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2" />
          <button className="rounded-xl bg-indigo-500 px-3 py-2 font-medium hover:bg-indigo-400">
            Download .xlsx
          </button>
        </div>
      </div>
    </div>
  );
}
