"use client";

import { useMemo, useState } from "react";
import type { EventPerspectiveResponse, Perspective } from "../../app/types";
import { ContradictionPanel } from "../ContradictionPanel";
import { EventTimeline } from "../EventTimeline";
import { PerspectiveGrid } from "../PerspectiveGrid";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#000000] overflow-hidden view-slide-enter">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.06),transparent_50%)]" />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center gap-4 px-5 py-4 md:px-8 md:py-5">
          <button
            type="button"
            onClick={onBack}
            className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-slate-400 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-0.5 transition-transform">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest">Globe</span>
          </button>

          <div className="h-4 w-px bg-white/[0.06]" />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Perspective Analysis
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-12 space-y-12">
          
          {/* Hero Section */}
          <section className="animate-section-in opacity-0" style={{ animationDelay: "0ms" }}>
            <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight tracking-tight">
              {eventDetails.event_title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z"/>
                </svg>
                {eventDetails.event_coordinates.lat.toFixed(2)}, {eventDetails.event_coordinates.lng.toFixed(2)}
              </span>
              <span className="h-0.5 w-0.5 rounded-full bg-slate-600" />
              <span>{headlineStats.sourceCount} perspectives mapped</span>
            </div>

            {/* Coverage breakdown pills */}
            <div className="mt-5 flex flex-wrap gap-2">
              {localCount > 0 && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1 text-[10px] font-medium text-emerald-400 uppercase tracking-widest">
                  {localCount} Local
                </span>
              )}
              {regionalCount > 0 && (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1 text-[10px] font-medium text-amber-400 uppercase tracking-widest">
                  {regionalCount} Regional
                </span>
              )}
              {globalCount > 0 && (
                <span className="rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-3 py-1 text-[10px] font-medium text-blue-400 uppercase tracking-widest">
                  {globalCount} Global
                </span>
              )}
            </div>

            {/* Coverage gap warning */}
            {headlineStats.avgProximity < 30 && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400 shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-[11px] font-medium leading-tight text-amber-200/80">
                  Coverage Gap: No coverage from sources near the epicenter.
                </p>
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Consensus & Contradictions */}
          <section className="animate-section-in opacity-0" style={{ animationDelay: "100ms" }}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                AI Consensus & Contradictions
              </h3>
            </div>
            <div className="glass-card p-5 md:p-6">
              <ContradictionPanel eventId={eventDetails.event_id} apiBaseUrl={API_BASE_URL} />
            </div>
          </section>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Coverage Timeline */}
          <section className="animate-section-in opacity-0" style={{ animationDelay: "200ms" }}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Coverage Timeline
              </h3>
            </div>
            <EventTimeline perspectives={eventDetails.perspectives} isLoading={isLoading} />
          </section>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Perspectives */}
          <section className="animate-section-in opacity-0" style={{ animationDelay: "300ms" }}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-500/10">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {eventDetails.perspectives.length} Perspectives
                </h3>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
                <SortPill active={perspectiveSort === "recency"} label="Recency" onClick={() => setPerspectiveSort("recency")} />
                <SortPill active={perspectiveSort === "proximity"} label="Proximity" onClick={() => setPerspectiveSort("proximity")} />
              </div>
            </div>

            <p className="mb-6 text-[11px] text-slate-500">
              Select 2 perspectives to unlock the side-by-side comparison view.
            </p>

            <PerspectiveGrid
              perspectives={sortedPerspectives}
              selectedIds={selectedPerspectives}
              onToggle={togglePerspective}
            />
          </section>

          {/* Bottom spacer for sticky CTA */}
          {selectedPerspectives.length === 2 && <div className="h-20" />}
        </div>
      </main>

      {/* Sticky Compare CTA */}
      {selectedPerspectives.length >= 1 && (
        <div className="sticky-cta animate-slide-up">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 md:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {selectedPerspectives.length}/2 selected
            </p>

            {selectedPerspectives.length === 2 ? (
              <button
                type="button"
                onClick={handleCompare}
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-12 transition-transform">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                Compare Now
              </button>
            ) : (
              <p className="text-[10px] text-slate-600">
                Select one more to compare
              </p>
            )}
          </div>
        </div>
      )}
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
      className={`rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all ${
        active
          ? "bg-white/[0.08] text-white shadow-sm"
          : "text-slate-600 hover:text-slate-400"
      }`}
    >
      {label}
    </button>
  );
}
