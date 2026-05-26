import type { AnalyzeEventResponse } from "./types";
import { TerrainMap } from "../components/TerrainMap";
import { PerspectiveGrid } from "../components/PerspectiveGrid";

const requestPayload = {
  event_topic: "Delimitation Act India",
  coordinates: {
    lat: 28.6139,
    lng: 77.209,
  },
};

const fetchAnalysis = async (): Promise<AnalyzeEventResponse> => {
  const response = await fetch("http://localhost:8000/api/analyze-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Backend error ${response.status}`);
  }

  return (await response.json()) as AnalyzeEventResponse;
};

export default async function HomePage() {
  const data = await fetchAnalysis();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Terrain
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 md:text-5xl">
            Terrain
          </h1>
          <h2 className="mt-4 text-xl font-semibold text-slate-800 md:text-2xl">
            Don&apos;t read the news. See it from every angle.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
            A geo-anchored intelligence platform that reveals how geographic
            distance and funding shape global narratives.
          </p>
        </section>

        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Event Intelligence
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            {data.event_title}
          </h1>
          <p className="text-sm text-slate-600">Event ID: {data.event_id}</p>
        </header>

        <TerrainMap />

        <PerspectiveGrid perspectives={data.perspectives} />
      </div>
    </main>
  );
}
