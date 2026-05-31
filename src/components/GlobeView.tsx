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

import { getEventTopic, TOPIC_CONFIG } from "../app/page";

interface GlobeViewProps {
  events: EventMarker[];
  selectedEventId: string | null;
  onSelectEvent: (event: EventMarker) => void;
  perspectives?: any[]; // Perspectives for the selected event
  isSimulated?: boolean;
}

export function GlobeView({
  events,
  selectedEventId,
  onSelectEvent,
  perspectives = [],
  isSimulated = false,
}: GlobeViewProps) {
  const globeRef = useRef<any>(null);

  const ringsData = useMemo(
    () =>
      events.map((event) => {
        const topic = getEventTopic(event.title);
        const config = TOPIC_CONFIG[topic];
        
        let color = event.id === selectedEventId ? '#ffffff' : config.color;
        
        if (isSimulated) {
          color = event.id === selectedEventId ? '#ffffff' : '#d946ef'; // Magenta for simulation
        }

        return {
          ...event,
          maxRadius: (event as any).story_count ? Math.min(Math.max((event as any).story_count * 0.8, 1.5), 8) : 2,
          propagationSpeed: isSimulated ? 2.5 : 1.5,
          repeatPeriod: isSimulated ? 1000 : 2000,
          color,
        };
      }),
    [events, selectedEventId, isSimulated],
  );

  const arcsData = useMemo(() => {
    if (!selectedEventId || !perspectives.length) return [];
    
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) return [];

    return perspectives.map((p, i) => ({
      startLat: selectedEvent.lat,
      startLng: selectedEvent.lng,
      endLat: p.source.lat,
      endLng: p.source.lng,
      color: [
        'rgba(34, 211, 238, 0.8)', 
        'rgba(168, 85, 247, 0.8)'
      ],
      label: p.source.name
    }));
  }, [selectedEventId, perspectives, events]);

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
        
        // Pulse Rings
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius="maxRadius"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        onRingClick={(ring) => handlePointClick(ring as EventMarker)}

        pointLabel={(point) => {
          const event = point as EventMarker & { story_count: number };
          const label = isSimulated ? "TIMELINE PROJECTED" : "RECON REPORT";
          const accentColor = isSimulated ? "#d946ef" : "#22d3ee";
          const borderColor = isSimulated ? "rgba(217, 70, 239, 0.35)" : "rgba(34, 211, 238, 0.35)";
          const glowColor = isSimulated ? "rgba(217, 70, 239, 0.15)" : "rgba(34, 211, 238, 0.15)";

          return `
            <div style="
              padding: 12px 16px;
              border-radius: 12px;
              background: rgba(10, 10, 10, 0.95);
              border: 1px solid ${borderColor};
              box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 15px ${glowColor};
              color: white;
              min-width: 220px;
              max-width: 300px;
              font-family: 'Inter', system-ui, sans-serif;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; margin-bottom: 8px;">
                <span style="font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: ${accentColor};">${label}</span>
                <span style="font-size: 8px; font-family: monospace; color: rgba(255,255,255,0.4);">${event.lat.toFixed(2)}°N, ${event.lng.toFixed(2)}°E</span>
              </div>
              <div style="font-size: 13px; font-weight: 600; line-height: 1.4; color: #ffffff; margin-bottom: 8px;">${event.title}</div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; color: #cbd5e1;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${accentColor};"></span>
                <span>${event.story_count} perspectives ${isSimulated ? 'projected' : 'tracked'}</span>
              </div>
            </div>
          `;
        }}
        
        // Arcs for Perspectives
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={4}
        arcDashAnimateTime={2000}
        arcStroke={0.4}
        arcAltitudeAutoScale={0.5}
        arcLabel={d => (d as any).label}
      />
    </div>
  );
}
