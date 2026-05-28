"use client";

import type { EventMarker } from "../../app/types";
import { SourceDiversityRing } from "../SourceDiversityRing";

interface ExploreViewProps {
  events: EventMarker[];
  isLoading: boolean;
  error: string | null;
  onSelectEvent: (event: EventMarker) => void;
}

export function ExploreView({
  events,
  isLoading,
  error,
  onSelectEvent,
}: ExploreViewProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
      {/* Floating Header */}
      <header className="pointer-events-auto relative z-20 flex items-center justify-between px-5 py-4 md:px-8 md:py-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 animate-pulse-glow" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative text-cyan-400">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-white uppercase">
              Terrain
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wide">
              Global Perspective Engine
            </p>
          </div>
        </div>
        
        {!isLoading && (
          <div className="flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 backdrop-blur-lg">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">
              {events.length} Live Events
            </span>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="flex-1" />

      {/* First-time hint */}
      {!isLoading && events.length > 0 && (
        <div className="pointer-events-none flex justify-center pb-4 animate-float">
          <div className="flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 border border-white/[0.06]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
              <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
            </svg>
            <span className="text-[10px] font-medium text-slate-400 tracking-wide">
              Tap a hotspot or select an event below
            </span>
          </div>
        </div>
      )}

      {/* Bottom Event Rail */}
      <div className="pointer-events-auto relative z-20 w-full">
        {/* Gradient fade at top */}
        <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        
        <div className="bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-5 pt-6 md:px-8 md:pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                <span className="text-xs text-slate-500 tracking-wide">Mapping global events...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-red-400/80">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-xs">{error}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Active Events
                </p>
                <p className="text-[10px] text-slate-600">
                  scroll →
                </p>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {events.map((event, index) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    style={{ animationDelay: `${index * 60}ms` }}
                    className="group relative flex-shrink-0 w-[280px] md:w-[320px] snap-start rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-left backdrop-blur-lg transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] animate-pill-in opacity-0 active:scale-[0.98]"
                  >
                    {/* Glow accent */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/[0.04] to-purple-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-white leading-snug line-clamp-2 group-hover:text-cyan-50 transition-colors">
                          {event.title}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-[10px] text-slate-500">
                            {new Date(event.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="h-0.5 w-0.5 rounded-full bg-slate-600" />
                          <span className="text-[10px] font-medium text-slate-400">
                            {event.story_count} sources
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <SourceDiversityRing slices={event.source_diversity ?? []} />
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-600 group-hover:text-cyan-400 transition-colors group-hover:translate-x-0.5 transition-transform">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
