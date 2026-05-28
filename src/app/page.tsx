"use client";

import { useEffect, useState } from "react";

import { GlobeView } from "../components/GlobeView";
import { ExploreView } from "../components/views/ExploreView";
import { AnalysisView } from "../components/views/AnalysisView";
import { ComparisonView } from "../components/views/ComparisonView";
import type { EventMarker, EventPerspectiveResponse, Perspective } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ViewState = "explore" | "analysis" | "comparison";

export default function HomePage() {
  const [view, setView] = useState<ViewState>("explore");
  const [events, setEvents] = useState<EventMarker[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const [eventDetails, setEventDetails] =
    useState<EventPerspectiveResponse | null>(null);
  const [comparisonPair, setComparisonPair] = useState<{
    a: Perspective;
    b: Perspective;
  } | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load events on mount ──
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

  // ── Load event details when an event is selected ──
  useEffect(() => {
    if (!selectedEvent) {
      setEventDetails(null);
      return;
    }

    setEventDetails(null);
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

  // ── Navigation handlers ──
  const handleSelectEvent = (event: EventMarker) => {
    setSelectedEvent(event);
    setView("analysis");
  };

  const handleBackToExplore = () => {
    setView("explore");
    setSelectedEvent(null);
    setEventDetails(null);
    setComparisonPair(null);
  };

  const handleCompare = (a: Perspective, b: Perspective) => {
    setComparisonPair({ a, b });
    setView("comparison");
  };

  const handleBackToAnalysis = () => {
    setView("analysis");
    setComparisonPair(null);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#000000] bg-dot-grid text-slate-100">
      {/* 3D Globe — always rendered, hidden via CSS when not on explore */}
      <div
        className="transition-opacity duration-700"
        style={{
          opacity: view === "explore" ? 1 : 0,
          visibility: view === "explore" ? "visible" : "hidden",
        }}
      >
        <GlobeView
          events={events}
          selectedEventId={selectedEvent?.id ?? null}
          onSelectEvent={handleSelectEvent}
          perspectives={eventDetails?.perspectives ?? []}
        />
      </div>

      {/* Subtle Vignette (explore only) */}
      {view === "explore" && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_100%)]" />
      )}

      {/* ── View Layer ── */}
      
      {/* Explore View */}
      {view === "explore" && (
        <ExploreView
          events={events}
          isLoading={isLoadingEvents}
          error={error}
          onSelectEvent={handleSelectEvent}
        />
      )}

      {/* Analysis View */}
      {view === "analysis" && eventDetails && (
        <AnalysisView
          eventDetails={eventDetails}
          isLoading={isLoadingDetails}
          onBack={handleBackToExplore}
          onCompare={handleCompare}
        />
      )}

      {/* Analysis Loading State */}
      {view === "analysis" && !eventDetails && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#000000] view-slide-enter">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="h-10 w-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-purple-400/10 border-b-purple-400/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">Aggregating Perspectives</p>
              <p className="mt-1 text-xs text-slate-500">Mapping source networks...</p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {view === "comparison" && comparisonPair && (
        <ComparisonView
          perspectiveA={comparisonPair.a}
          perspectiveB={comparisonPair.b}
          onBack={handleBackToAnalysis}
        />
      )}
    </main>
  );
}
