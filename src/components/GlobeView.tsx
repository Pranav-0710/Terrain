"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";

import type { EventMarker } from "../app/types";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
});

const GLOBE_TEXTURE =
  "https://unpkg.com/three-globe/example/img/earth-night.jpg";
const GLOBE_BUMP_TEXTURE =
  "https://unpkg.com/three-globe/example/img/earth-topology.png";

const pointPalette = [
  "#22d3ee",
  "#60a5fa",
  "#f472b6",
  "#f59e0b",
  "#a78bfa",
] as const;

interface GlobeViewProps {
  events: EventMarker[];
  selectedEventId: string | null;
  onSelectEvent: (event: EventMarker) => void;
}

export function GlobeView({
  events,
  selectedEventId,
  onSelectEvent,
}: GlobeViewProps) {
  const globeRef = useRef<any>(null);

  const points = useMemo(
    () =>
      events.map((event, index) => ({
        ...event,
        size: event.id === selectedEventId ? 0.26 : 0.18,
        altitude: event.id === selectedEventId ? 0.2 : 0.12,
        color: pointPalette[index % pointPalette.length],
      })),
    [events, selectedEventId],
  );

  useEffect(() => {
    const globe = globeRef.current;

    if (!globe) {
      return;
    }

    globe.controls().autoRotate = !selectedEventId;
    globe.controls().autoRotateSpeed = 0.45;

    if (!selectedEventId && events[0]) {
      globe.pointOfView(
        {
          lat: events[0].lat,
          lng: events[0].lng,
          altitude: 2.25,
        },
        0,
      );
    }
  }, [events, selectedEventId]);

  const handlePointClick = (point: EventMarker) => {
    const globe = globeRef.current;

    if (globe) {
      globe.pointOfView(
        {
          lat: point.lat,
          lng: point.lng,
          altitude: 0.8,
        },
        1400,
      );
    }

    onSelectEvent(point);
  };

  return (
    <div className="absolute inset-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_75%_18%,rgba(168,85,247,0.18),transparent_26%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.12),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.8)_100%)]" />

      <Globe
        ref={globeRef}
        width={undefined}
        height={undefined}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={GLOBE_TEXTURE}
        bumpImageUrl={GLOBE_BUMP_TEXTURE}
        showAtmosphere
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.22}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="altitude"
        pointRadius="size"
        pointColor="color"
        pointResolution={24}
        pointLabel={(point) => {
          const event = point as EventMarker & { story_count: number };
          return `
            <div style="padding:10px 12px;border-radius:16px;background:rgba(2,6,23,0.88);border:1px solid rgba(148,163,184,0.18);color:white;backdrop-filter:blur(16px);min-width:180px;">
              <div style="font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#67e8f9;">Event</div>
              <div style="margin-top:6px;font-size:14px;font-weight:700;line-height:1.3;">${event.title}</div>
              <div style="margin-top:6px;font-size:11px;color:#cbd5e1;">${event.story_count} mapped sources</div>
            </div>
          `;
        }}
        onPointClick={(point) => handlePointClick(point as EventMarker)}
      />
    </div>
  );
}
