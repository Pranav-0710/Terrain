"use client";

import { motion, Variants } from "framer-motion";
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
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 100 }
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#000000]">
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.05),transparent_40%),radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.05),transparent_40%)]" />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onBack}
              className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-slate-400 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-widest">Analysis</span>
            </motion.button>
            <div className="h-4 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <h2 className="text-xs font-semibold tracking-widest text-white uppercase">
                Comparison Engine
              </h2>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid Content */}
      <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        <motion.div 
          className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto">
            
            {/* 1. Structural Divergence Header - col-span-12 */}
            <motion.div className="col-span-12" variants={itemVariants}>
              <div className="glass-card p-6 border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                     <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                   </svg>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">
                    Structural Divergence Detected
                  </span>
                </div>
                <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                  Terrain's comparison engine has identified high-impact semantic shifts between these sources. One source emphasizes institutional stability while the other prioritizes grassroots impact.
                </p>
              </div>
            </motion.div>

            {/* 2. Divergence Detail Cards - col-span-6 each */}
            <motion.div className="col-span-12 md:col-span-6" variants={itemVariants}>
               <div className="glass-card h-full p-6 glow-card-hover border-white/[0.08] shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">Frame Shift</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <strong>{perspectiveA.source.name}</strong> frames this issue around <span className="text-cyan-400 font-semibold">{perspectiveA.article.editorial_frame?.trim() || "unspecified frame"}</span>, whereas <strong>{perspectiveB.source.name}</strong> structures it as <span className="text-purple-400 font-semibold">{perspectiveB.article.editorial_frame?.trim() || "unspecified frame"}</span>.
                  </p>
               </div>
            </motion.div>

            <motion.div className="col-span-12 md:col-span-6" variants={itemVariants}>
               <div className="glass-card h-full p-6 glow-card-hover border-white/[0.08] shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">Context Omission</span>
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed space-y-3">
                    {perspectiveA.article.omitted_context && (
                      <div className="flex gap-2">
                        <div className="shrink-0 w-1 h-1 rounded-full bg-cyan-400 mt-2" />
                        <p><strong>{perspectiveA.source.name}</strong> omits: <span className="italic text-slate-400">&quot;{perspectiveA.article.omitted_context.trim()}&quot;</span>.</p>
                      </div>
                    )}
                    {perspectiveB.article.omitted_context && (
                      <div className="flex gap-2">
                        <div className="shrink-0 w-1 h-1 rounded-full bg-purple-400 mt-2" />
                        <p><strong>{perspectiveB.source.name}</strong> omits: <span className="italic text-slate-400">&quot;{perspectiveB.article.omitted_context.trim()}&quot;</span>.</p>
                      </div>
                    )}
                  </div>
               </div>
            </motion.div>

            {/* 3. Perspective A Headline - col-span-6 */}
            <motion.div className="col-span-12 md:col-span-6" variants={itemVariants}>
               <div className="glass-card p-8 border-l-4 border-l-cyan-500/50 shadow-2xl bg-gradient-to-br from-cyan-500/[0.02] to-transparent">
                  <span className="inline-block px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[9px] font-bold uppercase tracking-widest border border-cyan-500/20 mb-6">Source Alpha</span>
                  <h3 className="text-2xl md:text-3xl font-medium text-white leading-tight">
                    {perspectiveA.article.headline}
                  </h3>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{perspectiveA.source.name}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{perspectiveA.source.country}</span>
                  </div>
               </div>
            </motion.div>

            {/* 4. Perspective B Headline - col-span-6 */}
            <motion.div className="col-span-12 md:col-span-6" variants={itemVariants}>
               <div className="glass-card p-8 border-l-4 border-l-purple-500/50 shadow-2xl bg-gradient-to-br from-purple-500/[0.02] to-transparent">
                  <span className="inline-block px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-[9px] font-bold uppercase tracking-widest border border-purple-500/20 mb-6">Source Beta</span>
                  <h3 className="text-2xl md:text-3xl font-medium text-white leading-tight">
                    {perspectiveB.article.headline}
                  </h3>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{perspectiveB.source.name}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{perspectiveB.source.country}</span>
                  </div>
               </div>
            </motion.div>

            {/* 5. Analysis Detail Cards */}
            <motion.div className="col-span-12 md:col-span-6 space-y-6" variants={itemVariants}>
               <div className="glass-card p-6 glow-card-hover shadow-xl">
                  <SectionLabel>Editorial Frame</SectionLabel>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium bg-white/5 p-3 rounded-lg border border-white/5">
                    {perspectiveA.article.editorial_frame}
                  </p>
               </div>
               <div className="glass-card p-6 glow-card-hover shadow-xl">
                  <SectionLabel>AI Narrative Summary</SectionLabel>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    {perspectiveA.article.summary_ai}
                  </p>
               </div>
               <div className="glass-card p-6 glow-card-hover shadow-xl">
                  <SourceDNACard source={perspectiveA.source} />
               </div>
            </motion.div>

            <motion.div className="col-span-12 md:col-span-6 space-y-6" variants={itemVariants}>
               <div className="glass-card p-6 glow-card-hover shadow-xl">
                  <SectionLabel>Editorial Frame</SectionLabel>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium bg-white/5 p-3 rounded-lg border border-white/5">
                    {perspectiveB.article.editorial_frame}
                  </p>
               </div>
               <div className="glass-card p-6 glow-card-hover shadow-xl">
                  <SectionLabel>AI Narrative Summary</SectionLabel>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    {perspectiveB.article.summary_ai}
                  </p>
               </div>
               <div className="glass-card p-6 glow-card-hover shadow-xl">
                  <SourceDNACard source={perspectiveB.source} />
               </div>
            </motion.div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">
      {children}
    </p>
  );
}
