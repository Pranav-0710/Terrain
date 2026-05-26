export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 text-center">
        <div className="h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-emerald-400 via-amber-400 to-rose-500 shadow-lg shadow-emerald-200" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Multi-Agent Sweep
        </p>
        <p className="animate-pulse text-lg font-semibold text-slate-900">
          Terrain Multi-Agent Engine is analyzing global sources...
        </p>
      </div>
    </main>
  );
}
