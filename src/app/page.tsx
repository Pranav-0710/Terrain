"use client";

import { useEffect, useMemo, useState } from "react";

import { GlobeView } from "../components/GlobeView";
import { PerspectiveGrid } from "../components/PerspectiveGrid";
import { ContradictionPanel } from "../components/ContradictionPanel";
import { SourceDiversityRing } from "../components/SourceDiversityRing";
import { ComparisonMode } from "../components/ComparisonMode";
import { EventTimeline } from "../components/EventTimeline";
import type { EventMarker, EventPerspectiveResponse } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const panelBaseClass =
  "absolute inset-0 z-20 w-full overflow-hidden bg-[#000000] md:inset-y-6 md:right-6 md:w-[min(30rem,calc(100vw-2rem))] md:rounded-2xl md:border md:border-white/[0.08] md:bg-[#000000]/80 md:shadow-2xl md:backdrop-blur-2xl transition-all duration-500 ease-out";

export default function HomePage() {
  const [events, setEvents] = useState<EventMarker[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const [showPanelMobile, setShowPanelMobile] = useState(true);
  const [eventDetails, setEventDetails] =
    useState<EventPerspectiveResponse | null>(null);
  const [perspectiveSort, setPerspectiveSort] = useState<"recency" | "proximity">("recency");
  const [selectedPerspectives, setSelectedPerspectives] = useState<string[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const loadEvents = async () => {
      try {
        setIsLoadingEvents(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/events`, {
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load events (${response.status})`);
        }

        const data = (await response.json()) as EventMarker[];
        setEvents(data);

        if (data[0]) {
          setSelectedEvent(data[0]);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingEvents(false);
        }
      }
    };

    loadEvents();
    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setEventDetails(null);
      return;
    }

    setShowPanelMobile(true);
    setEventDetails(null); // Clear old event data immediately
    
    const abortController = new AbortController();

    const loadEventDetails = async () => {
      try {
        setIsLoadingDetails(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/events/${selectedEvent.id}/perspectives`,
          {
            signal: abortController.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load perspectives (${response.status})`);
        }

        const data = (await response.json()) as EventPerspectiveResponse;
        setEventDetails(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingDetails(false);
        }
      }
    };

    loadEventDetails();
    return () => abortController.abort();
  }, [selectedEvent]);

  const headlineStats = useMemo(() => {
    const activeEvent = eventDetails ?? null;
    const sourceCount = activeEvent?.perspectives.length ?? 0;
    const avgProximity =
      sourceCount > 0
        ? Math.round(
            activeEvent!.perspectives.reduce(
              (sum, item) => sum + item.alignment.proximity_score,
              0,
            ) / sourceCount,
          )
        : 0;

    return { sourceCount, avgProximity };
  }, [eventDetails]);

  const sortedPerspectives = useMemo(() => {
    if (!eventDetails) return [];
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

  const comparisonData = useMemo(() => {
    if (selectedPerspectives.length !== 2 || !eventDetails) return null;
    const pA = eventDetails.perspectives.find(p => p.story_id === selectedPerspectives[0]);
    const pB = eventDetails.perspectives.find(p => p.story_id === selectedPerspectives[1]);
    if (!pA || !pB) return null;
    return { pA, pB };
  }, [selectedPerspectives, eventDetails]);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#000000] text-slate-100">
      
      {comparisonData && (
        <ComparisonMode 
          perspectiveA={comparisonData.pA} 
          perspectiveB={comparisonData.pB} 
          onClose={() => setSelectedPerspectives([])} 
        />
      )}

      {/* 3D Globe - Now the absolute focal point */}
      <GlobeView
        events={events}
        selectedEventId={selectedEvent?.id ?? null}
        onSelectEvent={setSelectedEvent}
        perspectives={eventDetails?.perspectives ?? []}
      />

      {/* Subtle Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_100%)]" />

      {/* Left Control Surface */}
      <section className="pointer-events-none absolute left-0 top-0 z-10 flex h-full w-full flex-col justify-between p-6 md:p-8">
        
        {/* Sleek Minimalist Header */}
        <div className="animate-slide-up pointer-events-auto flex w-fit items-center gap-4 rounded-xl border border-white/[0.08] bg-[#000000]/60 px-5 py-3 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-white opacity-80" />
          <h1 className="text-xs font-semibold tracking-widest text-white uppercase">
            Terrain V3
          </h1>
          <div className="hidden sm:block h-3 w-px bg-white/20" />
          <p className="hidden sm:block text-xs text-slate-400">
            {events.length} tracked events · {headlineStats.sourceCount} active perspectives
          </p>
        </div>

        {/* Minimalist Event Rail */}
        <div className={`animate-slide-up-delay pointer-events-auto w-full max-w-[22rem] md:w-[22rem] ${selectedEvent && showPanelMobile ? "hidden md:block" : "block"}`}>
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Event Rail
            </p>
          </div>

          <div className="max-h-[40vh] space-y-1 overflow-y-auto">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEvent(event)}
                className={`group flex w-full items-start justify-between gap-3 rounded-lg border-l-2 px-4 py-3 text-left transition-all ${
                  selectedEvent?.id === event.id
                    ? "border-white bg-white/[0.05]"
                    : "border-transparent hover:border-white/20 hover:bg-white/[0.02]"
                }`}
              >
                <div className="min-w-0 animate-fade-in-up">
                  <p className={`truncate text-sm transition-colors ${selectedEvent?.id === event.id ? "text-white font-medium" : "text-slate-400 group-hover:text-slate-300"}`}>
                    {event.title}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600 uppercase tracking-wider">
                    {new Date(event.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <SourceDiversityRing slices={event.source_diversity ?? []} />
                  <span
                    className={`text-[10px] font-medium tracking-widest transition-colors ${
                      selectedEvent?.id === event.id ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {event.story_count} SRC
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Timeline Strip */}
      <section className={`pointer-events-none absolute inset-x-0 bottom-5 z-10 px-6 md:px-10 ${selectedEvent && showPanelMobile ? "hidden md:block" : "block"}`}>
        <div className="pointer-events-auto w-full">
          <EventTimeline
            perspectives={eventDetails?.perspectives ?? []}
            isLoading={isLoadingEvents || isLoadingDetails}
          />
        </div>
      </section>

      {/* Right Side Panel */}
      <aside
        className={`${panelBaseClass} ${
          selectedEvent || error
            ? showPanelMobile
              ? "translate-x-0 opacity-100"
              : "translate-x-[110%] opacity-0 md:translate-x-0 md:opacity-100"
            : "translate-x-[110%] opacity-0"
        }`}
      >
        <div className="flex h-full flex-col relative z-10">
          <div className="border-b border-white/[0.08] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 animate-fade-in-up">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Perspective Analysis
                </p>
                <h2 className="mt-2 text-xl font-medium tracking-tight text-white leading-snug">
                  {eventDetails?.event_title ?? selectedEvent?.title ?? "Loading..."}
                </h2>
                {eventDetails ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Epicenter: {eventDetails.event_coordinates.lat.toFixed(2)}, {eventDetails.event_coordinates.lng.toFixed(2)}
                  </p>
                ) : null}
              </div>

              {selectedEvent ? (
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="shrink-0 p-2 text-slate-500 transition-colors hover:text-white"
                  aria-label="Close panel"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 pb-12">
            {error ? (
              <PanelState title="System Error" body={error} />
            ) : isLoadingEvents || isLoadingDetails ? (
              <PanelState title="Aggregating Coverage" body="Loading perspectives..." />
            ) : selectedEvent && eventDetails?.perspectives.length ? (
                <div className="animate-fade-in space-y-8">
                
                {headlineStats.avgProximity < 30 && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-amber-200/80">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-[11px] font-medium leading-tight">
                      Coverage Gap: This event has no coverage from local sources near the epicenter.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {eventDetails.perspectives.length} Perspectives
                  </p>
                  <div className="flex items-center gap-2">
                    <SortButton active={perspectiveSort === "recency"} label="Recency" onClick={() => setPerspectiveSort("recency")} />
                    <SortButton active={perspectiveSort === "proximity"} label="Proximity" onClick={() => setPerspectiveSort("proximity")} />
                  </div>
                </div>

                <div className="animate-fade-in-up [animation-delay:150ms] opacity-0">
                  <ContradictionPanel eventId={selectedEvent.id} apiBaseUrl={API_BASE_URL} />
                </div>
                
                <div className="animate-fade-in-up [animation-delay:200ms] opacity-0">
                  <PerspectiveGrid 
                    perspectives={sortedPerspectives} 
                    selectedIds={selectedPerspectives}
                    onToggle={togglePerspective}
                  />
                </div>
              </div>
            ) : (
              <PanelState title="No Coverage" body="No coverage anchors detected for this marker." />
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Floating Toggle Button */}
      {selectedEvent && (
        <button
          type="button"
          onClick={() => setShowPanelMobile((prev) => !prev)}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-[#0f172a]/95 px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-white shadow-2xl backdrop-blur-md transition-all active:scale-95 md:hidden"
        >
          {showPanelMobile ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/>
                <line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
              <span>View Globe</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21H3V3"/>
                <path d="M21 9l-7 7-4-4-4 4"/>
              </svg>
              <span>View Analysis</span>
            </>
          )}
        </button>
      )}
    </main>
  );
}

function SortButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[10px] font-semibold uppercase tracking-widest transition-colors ${
        active ? "text-white" : "text-slate-600 hover:text-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

function PanelState({ title, body }: { title: string; body: string }) {
  return (
    <div className="animate-fade-in flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <p className="mt-2 text-xs text-slate-500">{body}</p>
    </div>
  );
}
