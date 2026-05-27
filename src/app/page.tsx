"use client";

import { useEffect, useMemo, useState } from "react";

import { GlobeView } from "../components/GlobeView";
import { PerspectiveGrid } from "../components/PerspectiveGrid";
import type { EventMarker, EventPerspectiveResponse, Perspective } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const panelBaseClass =
  "absolute inset-y-3 right-3 z-20 w-[min(38rem,calc(100vw-1.5rem))] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/82 shadow-[0_40px_160px_rgba(2,6,23,0.6)] backdrop-blur-2xl transition-all duration-500 ease-out md:inset-y-4 md:right-4 md:w-[min(38rem,calc(100vw-2rem))]";

export default function HomePage() {
  const [events, setEvents] = useState<EventMarker[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const [eventDetails, setEventDetails] =
    useState<EventPerspectiveResponse | null>(null);
  const [perspectiveSort, setPerspectiveSort] = useState<"recency" | "proximity">(
    "recency",
  );
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
    if (!eventDetails) {
      return [];
    }

    return [...eventDetails.perspectives].sort((left, right) => {
      if (perspectiveSort === "proximity") {
        return right.alignment.proximity_score - left.alignment.proximity_score;
      }

      return (
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    });
  }, [eventDetails, perspectiveSort]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <GlobeView
        events={events}
        selectedEventId={selectedEvent?.id ?? null}
        onSelectEvent={setSelectedEvent}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.5)_38%,rgba(2,6,23,0.2)_65%,rgba(2,6,23,0.85)_100%)]" />

      <section className="pointer-events-none absolute left-0 top-0 z-10 flex h-full w-full flex-col justify-between p-4 md:p-8">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-[0_30px_120px_rgba(2,6,23,0.4)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-100/80">
              Terrain V2
            </p>
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Global narratives, mapped against physical distance.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 md:text-base">
            Click any event marker. Terrain pulls real database coverage, aligns
            source geography to event epicenter, and reveals framing drift.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Tracked events" value={events.length} />
            <MetricCard
              label="Mapped sources"
              value={headlineStats.sourceCount}
            />
            <MetricCard
              label="Avg proximity"
              value={`${headlineStats.avgProximity}`}
            />
          </div>
        </div>

        <div className="grid max-w-3xl gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="max-w-sm rounded-[1.6rem] border border-white/10 bg-slate-950/[0.35] p-4 text-sm text-slate-300 backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Control Surface
            </p>
            <p className="mt-2 leading-6">
              Select marker to rotate globe, lock camera, open perspective panel.
              Click another marker to compare narrative DNA across regions.
            </p>
          </div>

          <div className="pointer-events-auto rounded-[1.6rem] border border-white/10 bg-slate-950/45 p-3 shadow-[0_24px_90px_rgba(2,6,23,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                  Event Rail
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Latest mapped flashpoints
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                {events.length}
              </span>
            </div>

            <div className="space-y-2">
              {events.slice(0, 4).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className={`flex w-full items-start justify-between gap-3 rounded-[1.2rem] border px-3 py-3 text-left transition duration-300 ${
                    selectedEvent?.id === event.id
                      ? "border-cyan-300/30 bg-cyan-300/10 shadow-[0_12px_40px_rgba(34,211,238,0.12)]"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-5 text-white">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(event.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    {event.story_count} src
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <aside
        className={`${panelBaseClass} ${
          selectedEvent
            ? "translate-x-0 opacity-100"
            : "translate-x-[110%] opacity-0"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />

        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
                  Event Comparison
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {eventDetails?.event_title ?? selectedEvent?.title ?? "Loading"}
                </h2>
                {eventDetails ? (
                  <p className="mt-2 text-sm text-slate-400">
                    {eventDetails.event_coordinates.lat.toFixed(2)},{" "}
                    {eventDetails.event_coordinates.lng.toFixed(2)}
                  </p>
                ) : null}
              </div>

              {selectedEvent ? (
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="pointer-events-auto rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300 transition hover:border-white/20 hover:text-white"
                >
                  Close
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error ? (
              <PanelState
                eyebrow="Data fault"
                title="Backend request failed"
                body={error}
              />
            ) : isLoadingEvents || isLoadingDetails ? (
              <PanelState
                eyebrow="Syncing"
                title="Pulling live perspectives"
                body="Reading event markers, coverage geometry, and source framing from backend."
              />
            ) : eventDetails?.perspectives.length ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricPanel
                    label="Perspective count"
                    value={eventDetails.perspectives.length}
                  />
                  <MetricPanel
                    label="Strongest proximity"
                    value={Math.max(
                      ...eventDetails.perspectives.map(
                        (item) => item.alignment.proximity_score,
                      ),
                    )}
                  />
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                        Event Snapshot
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Comparing {eventDetails.perspectives.length} coverage
                        angles across physically near and distant outlets for{" "}
                        {eventDetails.event_title}.
                      </p>
                    </div>

                    <div className="pointer-events-auto inline-flex rounded-full border border-white/10 bg-slate-950/70 p-1">
                      <SortButton
                        active={perspectiveSort === "recency"}
                        label="Recency"
                        onClick={() => setPerspectiveSort("recency")}
                      />
                      <SortButton
                        active={perspectiveSort === "proximity"}
                        label="Proximity"
                        onClick={() => setPerspectiveSort("proximity")}
                      />
                    </div>
                  </div>
                </div>
                <PerspectiveGrid perspectives={sortedPerspectives} />
              </div>
            ) : (
              <PanelState
                eyebrow="No coverage"
                title="No perspectives mapped yet"
                body="Stories exist for none of the selected event markers. Seed database or ingest new coverage."
              />
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}

function SortButton({
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
      className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition ${
        active
          ? "bg-cyan-300 text-slate-950"
          : "text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] px-4 py-4 backdrop-blur-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MetricPanel({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function PanelState({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full min-h-72 items-center justify-center">
      <div className="max-w-sm rounded-[1.8rem] border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
          {eyebrow}
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
      </div>
    </div>
  );
}
