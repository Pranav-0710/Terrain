import type { SourceDiversitySlice } from "../app/types";

const REGION_COLORS: Record<string, string> = {
  Americas: "#38bdf8",
  Europe: "#a78bfa",
  "Middle East": "#f472b6",
  Africa: "#f59e0b",
  Asia: "#22d3ee",
  Oceania: "#34d399",
  Other: "#64748b",
  Unknown: "#94a3b8",
};

const MAX_SEGMENTS = 4;

export function SourceDiversityRing({
  slices,
  size = 26,
  strokeWidth = 3.5,
}: {
  slices: SourceDiversitySlice[];
  size?: number;
  strokeWidth?: number;
}) {
  const filtered = slices.filter((slice) => slice.count > 0);
  const sorted = [...filtered].sort((a, b) => b.count - a.count);
  const capped = sorted.slice(0, MAX_SEGMENTS);

  if (sorted.length > MAX_SEGMENTS) {
    const otherCount = sorted
      .slice(MAX_SEGMENTS)
      .reduce((sum, slice) => sum + slice.count, 0);
    capped.push({ region: "Other", count: otherCount });
  }

  const total = capped.reduce((sum, slice) => sum + slice.count, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const tooltip = total
    ? capped.map((slice) => `${slice.region}: ${slice.count}`).join(" • ")
    : "No source diversity data";

  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Source diversity ring"
      className="shrink-0"
    >
      <title>{tooltip}</title>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(148,163,184,0.25)"
        strokeWidth={strokeWidth}
      />
      {total
        ? capped.map((slice, index) => {
            const value = (slice.count / total) * circumference;
            const strokeDasharray = `${value} ${circumference - value}`;
            const strokeDashoffset = -offset;
            offset += value;

            return (
              <circle
                key={`${slice.region}-${index}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={REGION_COLORS[slice.region] ?? REGION_COLORS.Other}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })
        : null}
    </svg>
  );
}
