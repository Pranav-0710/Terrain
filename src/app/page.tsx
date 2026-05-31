"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobeView } from "../components/GlobeView";

import { ExploreView } from "../components/views/ExploreView";
import { AnalysisView } from "../components/views/AnalysisView";
import { ComparisonView } from "../components/views/ComparisonView";
import { SentimentView } from "../components/views/SentimentView";
import { SimulationView } from "../components/views/SimulationView";
import { EventHeroView } from "../components/views/EventHeroView";
import { AuroraBackground, type AuroraTheme } from "../components/AuroraBackground";
import { XCircle } from "lucide-react";
import type { EventMarker, EventPerspectiveResponse, Perspective } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

export type ViewState = "explore" | "hero" | "analysis" | "comparison" | "sentiment" | "simulation";
export type TopicCategory = "Conflict" | "Tech" | "Climate" | "Social" | "General";
export type RegionCategory = "Americas" | "Europe" | "Middle East" | "Africa" | "Asia" | "Oceania";

export const TOPIC_CONFIG: Record<TopicCategory, { regex: RegExp; color: string }> = {
  Conflict: { regex: /war|conflict|attack|strike|military|protest|riot|kill|death/i, color: "#ef4444" },
  Tech: { regex: /tech|ai|semiconductor|crypto|launch|startup|space|digital/i, color: "#8b5cf6" },
  Climate: { regex: /climate|earthquake|storm|flood|carbon|emission|nature|ocean/i, color: "#10b981" },
  Social: { regex: /social|rights|law|bill|policy|election|vote|human/i, color: "#22d3ee" },
  General: { regex: /./, color: "#64748b" },
};

export function getEventTopic(title: string): TopicCategory {
  if (TOPIC_CONFIG.Conflict.regex.test(title)) return "Conflict";
  if (TOPIC_CONFIG.Tech.regex.test(title)) return "Tech";
  if (TOPIC_CONFIG.Climate.regex.test(title)) return "Climate";
  if (TOPIC_CONFIG.Social.regex.test(title)) return "Social";
  return "General";
}

export function getEventRegion(lat: number, lng: number): RegionCategory | null {
  if (lng <= -30) return "Americas";
  if (lng >= 30 && lng <= 60 && lat >= 12 && lat <= 42) return "Middle East";
  if (lng >= -25 && lng <= 45 && lat >= 36) return "Europe";
  if (lng >= -20 && lng <= 50 && lat >= -35 && lat <= 35) return "Africa";
  if (lng >= 60 && lng <= 150 && lat >= 5) return "Asia";
  if (lng >= 110 && lng <= 180 && lat < 5) return "Oceania";
  return null;
}

export default function HomePage() {
  const [view, setView] = useState<ViewState>("explore");
  const [activeTopic, setActiveTopic] = useState<TopicCategory | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionCategory | null>(null);
  const [events, setEvents] = useState<EventMarker[]>([]);
  const [simulatedEvents, setSimulatedEvents] = useState<EventMarker[]>([]);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  
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

  // ── Theme Detection ──
  const auroraTheme = useMemo<AuroraTheme>(() => {
    if (isSimulationActive) return "tech";
    if (!selectedEvent) return "neutral";
    const title = (eventDetails?.event_title ?? selectedEvent.title).toLowerCase();
    
    if (title.match(/war|conflict|attack|strike|military|protest|riot|kill|death/)) return "conflict";
    if (title.match(/tech|ai|semiconductor|crypto|launch|startup|space|digital/)) return "tech";
    if (title.match(/climate|earthquake|storm|flood|carbon|emission|nature|ocean/)) return "climate";
    if (title.match(/social|rights|law|bill|policy|election|vote|human/)) return "social";
    
    return "neutral";
  }, [selectedEvent, eventDetails, isSimulationActive]);

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
    if (!selectedEvent || isSimulationActive) {
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
    setView("hero");
  };

  const handleBackToExplore = () => {
    setView("explore");
    setSelectedEvent(null);
    setEventDetails(null);
    setComparisonPair(null);
    setError(null);
  };

  const handleCompare = (a: Perspective, b: Perspective) => {
    setComparisonPair({ a, b });
    setView("comparison");
  };

  const handleBackToAnalysis = () => {
    setView("analysis");
    setComparisonPair(null);
  };

  const handleNavigate = (newView: ViewState) => {
    if (newView === "explore") {
      handleBackToExplore();
    } else if (newView === "hero" && selectedEvent) {
      setView("hero");
    } else if (newView === "analysis" && selectedEvent) {
      setView("analysis");
    } else if (newView === "comparison" && comparisonPair) {
      setView("comparison");
    } else if (newView === "sentiment" && selectedEvent) {
      setView("sentiment");
    } else if (newView === "simulation" && selectedEvent) {
      setView("simulation");
    }
  };

  const handleHeroNavigate = (target: "analysis" | "sentiment" | "simulation") => {
    setView(target);
  };

  const handleBackToHero = () => {
    setView("hero");
    setComparisonPair(null);
  };

  const handleStartSimulation = (simulated: EventMarker[]) => {
    setSimulatedEvents(simulated);
    setIsSimulationActive(true);
    setView("explore");
    setSelectedEvent(null);
  };

  const handleExitSimulation = () => {
    setIsSimulationActive(false);
    setSimulatedEvents([]);
    setSelectedEvent(null);
    setError(null);
    setView("explore");
  };

  const filteredEvents = useMemo(() => {
    const baseEvents = isSimulationActive ? simulatedEvents : events;
    return baseEvents.filter((ev) => {
      const topic = getEventTopic(ev.title);
      const region = getEventRegion(ev.lat, ev.lng);
      const topicMatch = !activeTopic || topic === activeTopic;
      const regionMatch = !activeRegion || region === activeRegion;
      return topicMatch && regionMatch;
    });
  }, [events, simulatedEvents, isSimulationActive, activeTopic, activeRegion]);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#000000] text-slate-100">
      
      {/* Living Ambient Atmosphere */}
      <AuroraBackground theme={auroraTheme} />

      {/* Simulation HUD Overlay */}
      <AnimatePresence>
        {isSimulationActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-3 rounded-2xl border border-fuchsia-500/30 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(217,70,239,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-400">
                Simulation Active: +30 Days
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <button
              onClick={handleExitSimulation}
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              <span>Exit Reality Warp</span>
              <XCircle className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Globe — Spatial cinematic background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={false}
        animate={{
          scale: (view === "explore" || view === "hero") ? 1 : 0.85,
          opacity: view === "explore" ? 1 : view === "hero" ? 0.3 : 0.2,
          y: (view === "explore" || view === "hero") ? 0 : -40,
        }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1], // expo easeOut
        }}
      >
        <GlobeView
          events={filteredEvents}
          selectedEventId={selectedEvent?.id ?? null}
          onSelectEvent={handleSelectEvent}
          perspectives={eventDetails?.perspectives ?? []}
          isSimulated={isSimulationActive}
        />
      </motion.div>



      {/* Subtle Vignette (explore only) */}
      <AnimatePresence>
        {view === "explore" && (
          <motion.div 
            className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_100%)]" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* ── View Layer with AnimatePresence ── */}
      <AnimatePresence mode="wait">
        
        {/* Explore View */}
        {view === "explore" && (
          <motion.div
            key="explore"
            className="absolute inset-0 z-10 pointer-events-none"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "circOut" }}
          >
            <ExploreView
              events={filteredEvents}
              allEvents={events}
              activeTopic={activeTopic}
              activeRegion={activeRegion}
              onTopicChange={setActiveTopic}
              onRegionChange={setActiveRegion}
              isLoading={isLoadingEvents}
              error={error}
              onSelectEvent={handleSelectEvent}
            />
          </motion.div>
        )}

        {/* Event Hero Landing */}
        {view === "hero" && selectedEvent && (
          <motion.div
            key="hero"
            className="absolute inset-0 z-15"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "circOut" }}
          >
            <EventHeroView
              event={selectedEvent}
              eventDetails={eventDetails}
              isLoading={isLoadingDetails}
              onBack={handleBackToExplore}
              onNavigate={handleHeroNavigate}
            />
          </motion.div>
        )}

        {/* Simulation View */}
        {view === "simulation" && selectedEvent && (
          <motion.div
            key="simulation"
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SimulationView
              event={selectedEvent}
              onBack={handleBackToHero}
              onComplete={handleStartSimulation}
            />
          </motion.div>
        )}

        {/* Analysis View */}
        {view === "analysis" && (
          <motion.div
            key="analysis"
            className="absolute inset-0 z-20"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
          >
            {eventDetails ? (
              <AnalysisView
                eventDetails={eventDetails}
                isLoading={isLoadingDetails}
                onBack={handleBackToHero}
                onCompare={handleCompare}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                  <motion.div 
                    className="relative"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <div className="h-10 w-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white tracking-widest uppercase">Aggregating Perspectives</p>
                    <p className="mt-1 text-xs text-slate-500 font-mono">Mapping source networks...</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Comparison View */}
        {view === "comparison" && comparisonPair && (
          <motion.div
            key="comparison"
            className="absolute inset-0 z-30"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 150 }}
          >
            <ComparisonView
              perspectiveA={comparisonPair.a}
              perspectiveB={comparisonPair.b}
              onBack={handleBackToAnalysis}
            />
          </motion.div>
        )}

        {/* Sentiment View */}
        {view === "sentiment" && eventDetails && (
          <motion.div
            key="sentiment"
            className="absolute inset-0 z-30"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
          >
            <SentimentView
              eventDetails={eventDetails}
              onBack={handleBackToHero}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}
