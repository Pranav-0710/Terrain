"use client";

import { useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import type { EventPerspectiveResponse, Perspective } from "../../app/types";
import { ContradictionPanel } from "../ContradictionPanel";
import { EventTimeline } from "../EventTimeline";
import { PerspectiveGrid } from "../PerspectiveGrid";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

interface AnalysisViewProps {
  eventDetails: EventPerspectiveResponse;
  isLoading: boolean;
  onBack: () => void;
  onCompare: (perspectiveA: Perspective, perspectiveB: Perspective) => void;
}

export function AnalysisView({
  eventDetails,
  isLoading,
  onBack,
  onCompare,
}: AnalysisViewProps) {
  const [perspectiveSort, setPerspectiveSort] = useState<"recency" | "proximity">("recency");
  const [selectedPerspectives, setSelectedPerspectives] = useState<string[]>([]);

  const headlineStats = useMemo(() => {
    const sourceCount = eventDetails.perspectives.length;
    const avgProximity =
      sourceCount > 0
        ? Math.round(
            eventDetails.perspectives.reduce(
              (sum, item) => sum + item.alignment.proximity_score,
              0,
            ) / sourceCount,
          )
        : 0;
    return { sourceCount, avgProximity };
  }, [eventDetails]);

  const sortedPerspectives = useMemo(() => {
    return [...eventDetails.perspectives].sort((left, right) => {
      if (perspectiveSort === "proximity") {
        return right.alignment.proximity_score - left.alignment.proximity_score;
      }
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [eventDetails, perspectiveSort]);

  const togglePerspective = (id: string) => {
    setSelectedPerspectives(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedPerspectives.length !== 2) return;
    const pA = eventDetails.perspectives.find(p => p.story_id === selectedPerspectives[0]);
    const pB = eventDetails.perspectives.find(p => p.story_id === selectedPerspectives[1]);
    if (pA && pB) onCompare(pA, pB);
  };

  const localCount = eventDetails.perspectives.filter(p => p.alignment.relative_position === "local").length;
  const regionalCount = eventDetails.perspectives.filter(p => p.alignment.relative_position === "regional").length;
  const globalCount = eventDetails.perspectives.filter(p => p.alignment.relative_position === "global").length;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#000000] overflow-hidden">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.06),transparent_50%)]" />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center gap-4 px-5 py-4 md:px-8 md:py-5">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onBack}
            className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-slate-400 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest">Globe</span>
          </motion.button>

          <div className="h-4 w-px bg-white/[0.06]" />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Analysis Dashboard
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* 1. Hero Title Card - col-span-12 */}
            <motion.div className="col-span-12" variants={itemVariants}>
               <div className="glass-card p-8 relative overflow-hidden group border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50" />
                 <h2 className="text-3xl md:text-4xl font-semibold text-white leading-tight tracking-tight">
                    {eventDetails.event_title}
                  </h2>
                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-white/5 border border-white/10">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z"/>
                      </svg>
                    </div>
                    <span>EPICENTER: {eventDetails.event_coordinates.lat.toFixed(4)}°N, {eventDetails.event_coordinates.lng.toFixed(4)}°E</span>
                  </div>
               </div>
            </motion.div>

            {/* 2. Metrics - col-span-4 each */}
            <motion.div className="col-span-12 md:col-span-4" variants={itemVariants}>
               <div className="glass-card p-6 h-full glow-card-hover border-white/[0.08] shadow-xl flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Coverage Intensity</p>
                    <p className="text-4xl font-semibold text-white mt-2 tracking-tighter">{headlineStats.sourceCount}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(headlineStats.sourceCount, 4))].map((_, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-black bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-300">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Global reporters mapped</span>
                  </div>
               </div>
            </motion.div>

            <motion.div className="col-span-12 md:col-span-4" variants={itemVariants}>
              <div className="glass-card p-6 h-full glow-card-hover border-white/[0.08] shadow-xl flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Source Proximity</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-4xl font-semibold text-white tracking-tighter">{headlineStats.avgProximity}</p>
                    <span className="text-sm font-medium text-slate-500">/ 100</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${headlineStats.avgProximity}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Aggregate Geodetic Score</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="col-span-12 md:col-span-4" variants={itemVariants}>
              <div className="glass-card p-6 h-full glow-card-hover border-white/[0.08] shadow-xl flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Regional DNA</p>
                  <div className="flex gap-2 mt-3">
                    <TierBadge active={localCount > 0} label="Local" color="bg-emerald-500" />
                    <TierBadge active={regionalCount > 0} label="Regional" color="bg-amber-500" />
                    <TierBadge active={globalCount > 0} label="Global" color="bg-blue-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                   <p className="text-[10px] text-slate-400 font-medium">Perspective diversity</p>
                   <p className="text-[10px] text-white font-mono font-bold">{(localCount ? 1 : 0) + (regionalCount ? 1 : 0) + (globalCount ? 1 : 0)} / 3</p>
                </div>
              </div>
            </motion.div>

            {/* 3. Contradiction Report - col-span-8 */}
            <motion.div className="col-span-12 md:col-span-8" variants={itemVariants}>
               <div className="glass-card h-full glow-card-hover border-white/[0.08] shadow-2xl flex flex-col">
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/20">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-cyan-400">
                          <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                        Intelligence Synthesis
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 flex-1">
                    <ContradictionPanel eventId={eventDetails.event_id} apiBaseUrl={API_BASE_URL} />
                  </div>
               </div>
            </motion.div>

            {/* 4. Timeline Card - col-span-4 */}
            <motion.div className="col-span-12 md:col-span-4" variants={itemVariants}>
               <div className="glass-card h-full glow-card-hover border-white/[0.08] shadow-2xl flex flex-col">
                  <div className="px-6 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/10 border border-purple-500/20">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-400">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                        Velocity
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <EventTimeline perspectives={eventDetails.perspectives} isLoading={isLoading} />
                  </div>
               </div>
            </motion.div>

            {/* 5. Warning Card (if applicable) - col-span-12 */}
            {headlineStats.avgProximity < 30 && (
              <motion.div className="col-span-12" variants={itemVariants}>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 flex items-center gap-4 backdrop-blur-md">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-amber-200 uppercase tracking-widest">Coverage Gap Warning</p>
                     <p className="text-[11px] text-amber-200/60 mt-0.5">Critical lack of local sources identified. Current coverage may be subject to external regional bias.</p>
                   </div>
                </div>
              </motion.div>
            )}

            {/* 6. Perspectives Grid - col-span-12 */}
            <motion.div className="col-span-12 pt-8" variants={itemVariants}>
               <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-pink-500/50" />
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
                      Mapped Perspectives ({eventDetails.perspectives.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-inner">
                    <SortPill active={perspectiveSort === "recency"} label="Recency" onClick={() => setPerspectiveSort("recency")} />
                    <SortPill active={perspectiveSort === "proximity"} label="Proximity" onClick={() => setPerspectiveSort("proximity")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <PerspectiveGrid
                    perspectives={sortedPerspectives}
                    selectedIds={selectedPerspectives}
                    onToggle={togglePerspective}
                  />
                </div>
            </motion.div>

          </div>

          {/* Bottom spacer for sticky CTA */}
          {selectedPerspectives.length > 0 && <div className="h-32" />}
        </motion.div>
      </main>

      {/* Sticky Compare CTA */}
      {selectedPerspectives.length >= 1 && (
        <motion.div 
          className="sticky-cta flex items-center justify-between px-6 py-2"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <div className="flex flex-col">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Compare Engine
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {selectedPerspectives.length}/2 selected
            </p>
          </div>

          {selectedPerspectives.length === 2 ? (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              type="button"
              onClick={handleCompare}
              className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Run Comparison
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </motion.button>
          ) : (
            <p className="text-[9px] text-slate-500 uppercase tracking-widest animate-pulse">
              Select 1 more
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

function TierBadge({ active, label, color }: { active: boolean; label: string; color: string }) {
  return (
    <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border transition-all ${
      active 
        ? `${color}/10 ${color.replace('bg-', 'text-')} border-${color.replace('bg-', '')}/20` 
        : 'bg-white/5 text-slate-600 border-white/5 opacity-50'
    }`}>
      {label}
    </div>
  );
}

function SortPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] transition-all ${
        active
          ? "bg-white/10 text-white shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
