"use client";

import type { Perspective } from "../../app/types";
import { SourceDNACard } from "../SourceDNACard";

interface ComparisonViewProps {
  perspectiveA: Perspective;
  perspectiveB: Perspective;
  onBack: () => void;
}

export function ComparisonView({
  perspectiveA,
  perspectiveB,
  onBack,
}: ComparisonViewProps) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#000000] view-slide-enter">
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.05),transparent_40%),radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.05),transparent_40%)]" />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-slate-400 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-0.5 transition-transform">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-widest">Analysis</span>
            </button>
            <div className="h-4 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <h2 className="text-xs font-semibold tracking-widest text-white uppercase">
                Perspective Diff
              </h2>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        {/* Structural Divergence Summary — Promoted to top */}
        <div className="border-b border-white/[0.06] bg-white/[0.02]">
          <div className="mx-auto max-w-5xl px-5 py-6 md:px-8 md:py-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10">
                <div className="h-2 w-2 rounded-full bg-cyan-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">
                Structural Divergence Detected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded">FRAME</span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Source A emphasizes <span className="text-cyan-400 font-medium">geopolitical impact</span> while Source B focuses on <span className="text-purple-400 font-medium">local civilian cost</span>.
                  </p>
                </div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded">OMISSION</span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Source A omits <span className="italic text-slate-400">&quot;{perspectiveB.article.omitted_context?.split('.')[0]}&quot;</span> mentioned in Source B.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-side columns */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            <PerspectiveColumn perspective={perspectiveA} label="Source A" accent="cyan" />
            <PerspectiveColumn perspective={perspectiveB} label="Source B" accent="purple" />
          </div>
        </div>
      </main>
    </div>
  );
}

function PerspectiveColumn({
  perspective,
  label,
  accent,
}: {
  perspective: Perspective;
  label: string;
  accent: "cyan" | "purple";
}) {
  const accentColor = accent === "cyan" ? "text-cyan-400 border-cyan-500/20" : "text-purple-400 border-purple-500/20";
  const accentBg = accent === "cyan" ? "bg-cyan-500/[0.06]" : "bg-purple-500/[0.06]";

  return (
    <div className="px-5 py-8 md:px-8 md:py-10 space-y-8">
      {/* Label */}
      <div className="flex items-center gap-3">
        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] ${accentColor} ${accentBg}`}>
          {label}
        </span>
      </div>

      {/* Headline */}
      <div>
        <h3 className="text-xl md:text-2xl font-medium text-white leading-tight">
          {perspective.article.headline}
        </h3>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">
          {perspective.source.name} · {perspective.source.country}
        </p>
      </div>

      {/* Editorial Frame */}
      <div className="space-y-3">
        <SectionLabel>Editorial Frame</SectionLabel>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {perspective.article.editorial_frame}
          </p>
        </div>
      </div>

      {/* AI Summary */}
      <div className="space-y-3">
        <SectionLabel>AI Summary</SectionLabel>
        <p className="text-sm text-slate-300 leading-relaxed">
          {perspective.article.summary_ai}
        </p>
      </div>

      {/* Missing Context */}
      {perspective.article.omitted_context && (
        <div className="space-y-3">
          <SectionLabel>Missing Context</SectionLabel>
          <div className={`border-l-2 pl-4 py-2 ${accent === "cyan" ? "border-cyan-500/30" : "border-purple-500/30"}`}>
            <p className="text-sm text-slate-400 italic leading-relaxed">
              {perspective.article.omitted_context}
            </p>
          </div>
        </div>
      )}

      {/* Source DNA */}
      <SourceDNACard source={perspective.source} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
      {children}
    </p>
  );
}
