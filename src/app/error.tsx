"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-lg">
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-600">
          Connection error
        </span>
        <h1 className="text-2xl font-semibold text-slate-900">
          Backend not reachable
        </h1>
        <p className="text-sm text-slate-600">
          Could not connect to FastAPI at http://localhost:8000/api/analyze-event.
        </p>
        <p className="text-xs text-slate-500">Details: {error.message}</p>
        <button
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
          onClick={() => reset()}
          type="button"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
