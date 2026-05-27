import type { Source } from "../app/types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function SourceDNACard({ source }: { source: Source }) {
  const proximityPercent = clamp(source.proximity_score, 0, 100);
  const pressFreedomPercent = clamp(source.press_freedom_score, 0, 100);

  return (
    <div className="border-t border-white/[0.04] pt-6 mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Source Demographics
          </p>
          <h4 className="mt-1 text-base font-medium text-white">
            {source.name}
          </h4>
          <p className="text-xs text-slate-400">{source.country}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">
            {source.political_lean}
          </span>
          <span className="rounded-sm bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">
            {source.funding_type}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Proximity
            </span>
            <span className="text-xs text-white">{source.proximity_score}</span>
          </div>
          <div className="h-px w-full bg-white/[0.05]">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${proximityPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Press Freedom
            </span>
            <span className="text-xs text-white">{source.press_freedom_score} <span className="text-slate-600">/ 100</span></span>
          </div>
          <div className="h-px w-full bg-white/[0.05]">
            <div
              className="h-full bg-slate-400 transition-all duration-1000"
              style={{ width: `${pressFreedomPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Epicenter Distance
          </span>
          <span className="text-xs text-slate-300">
            {Math.round(source.distance_km).toLocaleString()} km
          </span>
        </div>
      </div>
    </div>
  );
}
