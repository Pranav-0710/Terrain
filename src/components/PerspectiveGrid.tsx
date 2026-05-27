import type { Perspective } from "../app/types";
import { SourceDNACard } from "./SourceDNACard";

export function PerspectiveGrid({
  perspectives,
  selectedIds = [],
  onToggle,
}: {
  perspectives: Perspective[];
  selectedIds?: string[];
  onToggle?: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {perspectives.map((perspective, index) => {
        const isSelected = selectedIds.includes(perspective.story_id);
        
        return (
          <div
            key={perspective.story_id}
            onClick={() => onToggle?.(perspective.story_id)}
            style={{ animationDelay: `${(index + 5) * 50}ms` }}
            className={`group relative cursor-pointer rounded-xl border p-6 transition-all duration-300 animate-fade-in-up opacity-0 ${
              isSelected 
                ? "border-cyan-500/50 bg-cyan-500/[0.03] shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                : "border-white/[0.04] bg-[#000000] hover:border-white/10 hover:bg-white/[0.01]"
            }`}
          >
            {/* Selection Indicator */}
            <div className={`absolute -left-1 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full transition-all duration-300 ${
              isSelected ? "bg-cyan-500 opacity-100" : "bg-white/10 opacity-0 group-hover:opacity-100"
            }`} />

            <div className="flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                    isSelected ? "border-cyan-500 bg-cyan-500" : "border-white/20"
                  }`}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                    isSelected ? "text-cyan-400" : "text-slate-500"
                  }`}>
                    {perspective.alignment.relative_position} Perspective
                  </span>
                </div>

                {perspective.url ? (
                  <a
                    href={perspective.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                  >
                    Read Source ↗
                  </a>
                ) : null}
              </div>

              <h3 className="text-lg font-medium text-white leading-snug mb-4">
                {perspective.article.headline}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Editorial Frame
                  </p>
                  <p className="text-xs text-slate-300">
                    {perspective.article.editorial_frame}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Published
                  </p>
                  <p className="text-xs text-slate-300">
                    {new Date(perspective.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  AI Summary
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  {perspective.article.summary_ai}
                </p>
              </div>

              {perspective.article.omitted_context && (
                <div className="mb-6 border-l border-white/[0.08] pl-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Missing Context
                  </p>
                  <p className="text-sm leading-relaxed text-slate-400 italic">
                    {perspective.article.omitted_context}
                  </p>
                </div>
              )}

              <SourceDNACard source={perspective.source} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
