import type { Perspective } from "../app/types";
import { SourceDNACard } from "./SourceDNACard";

export function PerspectiveGrid({
  perspectives,
}: {
  perspectives: Perspective[];
}) {
  return (
    <div className="mt-6 grid gap-6">
      {perspectives.map((perspective, index) => (
        <div
          key={`${perspective.source.name}-${index}`}
          className="grid gap-6 rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm md:grid-cols-[2fr_1fr]"
        >
          <article className="flex h-full flex-col gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Perspective {index + 1}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {perspective.article.headline}
              </h2>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                AI Summary
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {perspective.article.summary_ai}
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Editorial Frame
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {perspective.article.editorial_frame}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Omitted Context
                </p>
                <p className="mt-1 text-slate-700">
                  {perspective.article.omitted_context}
                </p>
              </div>
            </div>
          </article>

          <SourceDNACard source={perspective.source} />
        </div>
      ))}
    </div>
  );
}
