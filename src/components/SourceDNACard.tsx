import type { Source } from "../app/types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getProximityColor = (score: number) => {
  const hue = (clamp(score, 0, 100) / 100) * 120;
  return `hsl(${hue} 70% 45%)`;
};

export function SourceDNACard({ source }: { source: Source }) {
  const color = getProximityColor(source.proximity_score);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Source DNA
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {source.name}
          </h3>
          <p className="text-sm text-slate-600">{source.country}</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {source.proximity_score}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm text-slate-700">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Funding Type
          </dt>
          <dd className="mt-1 text-base font-medium text-slate-900">
            {source.funding_type}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Proximity Score
          </dt>
          <dd className="mt-2">
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${clamp(source.proximity_score, 0, 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </dd>
        </div>
      </dl>
    </div>
  );
}
