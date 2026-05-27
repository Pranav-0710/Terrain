"use client";

import type { Perspective } from "../app/types";
import { SourceDNACard } from "./SourceDNACard";

interface ComparisonModeProps {
  perspectiveA: Perspective;
  perspectiveB: Perspective;
  onClose: () => void;
}

export function ComparisonMode({
  perspectiveA,
  perspectiveB,
  onClose,
}: ComparisonModeProps) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-8 py-4">
        <div className="flex items-center gap-4">
          <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
          <h2 className="text-xs font-semibold tracking-widest text-white uppercase">
            Side-by-Side Perspective Diff
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
        >
          Exit Comparison
        </button>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid h-full grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
          <PerspectiveColumn perspective={perspectiveA} side="Left" />
          <PerspectiveColumn perspective={perspectiveB} side="Right" />
        </div>
      </div>

      {/* Analysis Overlay (Placeholder for "Diff" logic) */}
      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[min(40rem,90vw)] rounded-2xl border border-white/10 bg-black/80 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-4 w-4 rounded bg-cyan-500/20 flex items-center justify-center">
             <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Structural Divergence Detected</span>
        </div>
        <div className="space-y-3">
          <div className="flex gap-4">
             <div className="shrink-0 text-[10px] font-mono text-slate-500">FRAME</div>
             <p className="text-xs text-slate-300 leading-relaxed">
               Source A emphasizes <span className="text-cyan-400 font-medium">geopolitical impact</span> while Source B focuses on <span className="text-purple-400 font-medium">local civilian cost</span>.
             </p>
          </div>
          <div className="flex gap-4">
             <div className="shrink-0 text-[10px] font-mono text-slate-500">OMISSION</div>
             <p className="text-xs text-slate-300 leading-relaxed">
               Source A omits <span className="italic">"{perspectiveB.article.omitted_context?.split('.')[0]}"</span> mentioned in Source B.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerspectiveColumn({ perspective, side }: { perspective: Perspective; side: string }) {
  return (
    <div className="px-6 py-8 md:px-12 md:py-12 space-y-8 md:space-y-12">
      <div className="space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          {side} Perspective
        </span>
        <h3 className="text-2xl md:text-3xl font-medium text-white leading-tight">
          {perspective.article.headline}
        </h3>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Editorial Frame</p>
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {perspective.article.editorial_frame}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Key Summary</p>
        <p className="text-base text-slate-300 leading-relaxed">
          {perspective.article.summary_ai}
        </p>
      </div>

      {perspective.article.omitted_context && (
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Missing Context</p>
          <div className="border-l-2 border-amber-500/30 pl-6 py-2">
            <p className="text-sm text-slate-400 italic leading-relaxed">
              {perspective.article.omitted_context}
            </p>
          </div>
        </div>
      )}

      <div className="pt-8">
        <SourceDNACard source={perspective.source} />
      </div>

      {/* Spacer to allow scrolling past the floating analysis overlay */}
      <div className="h-44 md:h-48" />
    </div>
  );
}
