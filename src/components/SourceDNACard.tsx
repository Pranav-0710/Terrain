import type { Source } from "../app/types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getProximityColor = (score: number) => {
  const safeScore = clamp(score, 0, 100);

  if (safeScore >= 75) {
    return "from-emerald-400 to-cyan-300";
  }

  if (safeScore >= 45) {
    return "from-amber-300 to-orange-400";
  }

  return "from-fuchsia-400 to-violet-400";
};

export function SourceDNACard({ source }: { source: Source }) {
  const proximityGradient = getProximityColor(source.proximity_score);

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Source DNA
          </p>
          <h4 className="mt-2 text-lg font-semibold text-white">
            {source.name}
          </h4>
          <p className="text-sm text-slate-400">{source.country}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Source
          </span>
          <span
            className={`rounded-full bg-gradient-to-r ${proximityGradient} px-3 py-1 text-xs font-semibold text-slate-950`}
          >
            {source.proximity_score}
          </span>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm text-slate-300">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="Funding" value={source.funding_type} />
          <InfoTile
            label="Distance"
            value={`${Math.round(source.distance_km).toLocaleString()} km`}
          />
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Proximity Score
          </dt>
          <dd className="mt-2">
            <div className="h-2 w-full rounded-full bg-white/[0.08]">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${proximityGradient}`}
                style={{ width: `${clamp(source.proximity_score, 0, 100)}%` }}
              />
            </div>
          </dd>
        </div>

        <InfoTile
          label="Coordinates"
          value={`${source.lat.toFixed(2)}, ${source.lng.toFixed(2)}`}
        />
      </dl>
    </div>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium leading-6 text-white">
        {value}
      </dd>
    </div>
  );
}
