"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, events]);

  // Mouse wheel → horizontal scroll on desktop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [events]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -340 : 340;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

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
            <h1 className="text-sm font-bold tracking-[0.25em] bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent uppercase">
              Terrain
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wide">
              Global Perspective Engine
            </p>
          </div>
        </div>
        
        {!isLoading && (
          <div className="relative flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-2 backdrop-blur-lg shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-cyan-400 uppercase">
              {events.length} Live Events
            </span>
          </div>
        )}
      </header>

      {/* Floating HUD Legend */}
      {!isLoading && events.length > 0 && (
        <div className="absolute right-5 top-20 pointer-events-auto hidden sm:flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-black/60 p-3.5 backdrop-blur-lg z-20">
          <p className="text-[8px] font-bold tracking-[0.2em] text-slate-500 uppercase">Geographic Key</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]" />
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Americas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Europe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f472b6]" />
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Mid East</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Africa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]" />
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Asia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Oceania</span>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Feature Showcase — teach users what's available */}
      {!isLoading && events.length > 0 && (
        <div className="pointer-events-auto flex justify-center pb-5 px-4 md:px-8">
          <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-3xl w-full">
            {[
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                    <path d="M5 21v-6" /><path d="M12 21V3" /><path d="M19 21V9" />
                  </svg>
                ),
                title: "Analyze",
                desc: "Multi-source perspective breakdown",
                textColor: "text-cyan-400",
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                ),
                title: "Sentiment",
                desc: "Editorial tone & bias radar",
                textColor: "text-purple-400",
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                    <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 0 0 9 9" />
                  </svg>
                ),
                title: "Compare",
                desc: "Side-by-side source comparison",
                textColor: "text-emerald-400",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex-1 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md px-4 py-3"
              >
                <div className="shrink-0">{feature.icon}</div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${feature.textColor}`}>
                    {feature.title}
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* First-time hint */}
      {!isLoading && events.length > 0 && (
        <div className="pointer-events-none flex justify-center pb-4 animate-float">
          <div className="flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 border border-white/[0.06]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
              <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
            </svg>
            <span className="text-[10px] font-medium text-slate-400 tracking-wide">
              Select an event below to unlock these features
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
                
                {/* Desktop scroll arrows */}
                <div className="hidden md:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => scroll("left")}
                    disabled={!canScrollLeft}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] transition-all active:scale-90 ${
                      canScrollLeft
                        ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                        : "bg-transparent text-slate-700 cursor-default"
                    }`}
                    aria-label="Scroll left"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scroll("right")}
                    disabled={!canScrollRight}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] transition-all active:scale-90 ${
                      canScrollRight
                        ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                        : "bg-transparent text-slate-700 cursor-default"
                    }`}
                    aria-label="Scroll right"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>

                {/* Mobile hint */}
                <p className="text-[10px] text-slate-600 md:hidden">
                  swipe →
                </p>
              </div>
              
              <div className="relative">
                {/* Left fade gradient */}
                {canScrollLeft && (
                  <div className="hidden md:block absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                )}
                {/* Right fade gradient */}
                {canScrollRight && (
                  <div className="hidden md:block absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
                )}

                <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
                  {events.map((event, index) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      style={{ animationDelay: `${index * 60}ms` }}
                      className="group relative flex-shrink-0 w-[280px] md:w-[320px] snap-start rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-left backdrop-blur-lg glow-card-hover animate-pill-in opacity-0 active:scale-[0.98]"
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
