import type { Perspective } from "../app/types";
import { SourceDNACard } from "./SourceDNACard";

const alignmentTone = {
  local: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/25",
  regional: "bg-amber-400/15 text-amber-100 ring-amber-300/25",
  global: "bg-fuchsia-400/15 text-fuchsia-100 ring-fuchsia-300/25",
} as const;

export function PerspectiveGrid({
  perspectives,
}: {
  perspectives: Perspective[];
}) {
  return (
    <div className="grid gap-5">
      {perspectives.map((perspective, index) => (
        <div
          key={perspective.story_id}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur-xl transition duration-300 hover:border-cyan-300/20 hover:bg-white/[0.075]"
        >
          <div className="flex flex-col gap-5">
            <article className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
                    Perspective {index + 1}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ring-1 ${
                      alignmentTone[perspective.alignment.relative_position]
                    }`}
                  >
                    {perspective.alignment.relative_position}
                  </span>
                  <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                    {perspective.source.funding_type}
                  </span>
                </div>

                {perspective.url ? (
                  <a
                    href={perspective.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
                  >
                    Read Source
                  </a>
                ) : null}
              </div>

              <div>
                <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {perspective.article.headline}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {perspective.source.name}
                  {" · "}
                  {perspective.source.country}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InlineStat
                  label="Distance"
                  value={`${Math.round(
                    perspective.alignment.distance_km,
                  ).toLocaleString()} km`}
                />
                <InlineStat
                  label="Proximity"
                  value={`${perspective.alignment.proximity_score}`}
                />
                <InlineStat
                  label="Frame"
                  value={perspective.article.editorial_frame}
                />
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Published{" "}
                {new Date(perspective.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>

              <div className="rounded-[1.25rem] border border-cyan-300/10 bg-slate-950/45 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                  AI Summary
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {perspective.article.summary_ai}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/[0.08] bg-slate-950/30 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    Missing Context
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {perspective.article.omitted_context}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/[0.08] bg-slate-950/30 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    Original Article
                  </p>
                  <p className="mt-2 line-clamp-5 text-sm leading-6 text-slate-300">
                    {perspective.article.content}
                  </p>
                </div>
              </div>
            </article>

            <SourceDNACard source={perspective.source} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InlineStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.1rem] border border-white/[0.08] bg-slate-950/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-5 text-white">{value}</p>
    </div>
  );
}
