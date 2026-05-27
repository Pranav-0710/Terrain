import type { Perspective } from "../app/types";

type TimelinePoint = {
  storyId: string;
  sourceName: string;
  timeMs: number;
};

const formatStamp = (value: number) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function EventTimeline({
  perspectives,
  isLoading = false,
}: {
  perspectives: Perspective[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-full border border-white/[0.08] bg-[#030712]/70 px-5 py-3 text-[10px] text-slate-500 shadow-2xl backdrop-blur-2xl">
        Loading timeline...
      </div>
    );
  }

  const points: TimelinePoint[] = perspectives
    .map((perspective) => ({
      storyId: perspective.story_id,
      sourceName: perspective.source.name,
      timeMs: new Date(perspective.created_at).getTime(),
    }))
    .filter((point) => Number.isFinite(point.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs);

  if (!points.length) {
    return (
      <div className="rounded-full border border-white/[0.08] bg-[#030712]/70 px-5 py-3 text-[10px] text-slate-500 shadow-2xl backdrop-blur-2xl">
        No published perspectives yet.
      </div>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const minTime = first.timeMs;
  const maxTime = last.timeMs;
  const span = Math.max(maxTime - minTime, 1);

  return (
    <div className="rounded-full border border-white/[0.08] bg-[#030712]/70 px-5 py-3 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span className="shrink-0 font-semibold uppercase tracking-[0.28em] text-slate-500">
          Timeline
        </span>
        <span className="hidden shrink-0 text-slate-600 sm:inline">
          {formatStamp(minTime)}
        </span>
        <div className="relative h-4 flex-1">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
          {points.map((point, index) => {
            const position = ((point.timeMs - minTime) / span) * 100;
            const isFirst = index === 0;
            const isLast = index === points.length - 1;
            const dotColor = isFirst
              ? "bg-cyan-400/90 border-cyan-300/80 shadow-[0_0_10px_rgba(34,211,238,0.45)]"
              : isLast
                ? "bg-fuchsia-400/90 border-fuchsia-300/80 shadow-[0_0_10px_rgba(217,70,239,0.45)]"
                : "bg-white/40 border-white/30";
            const labelPrefix = isFirst
              ? "First"
              : isLast
                ? "Latest"
                : "Source";

            return (
              <div
                key={point.storyId}
                className="group absolute top-1/2 -translate-y-1/2"
                style={{ left: `${position}%` }}
              >
                <div className={`h-2.5 w-2.5 rounded-full border ${dotColor}`} />
                <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-black/80 px-2 py-1 text-[10px] text-slate-200 opacity-0 transition-opacity group-hover:opacity-100">
                  {labelPrefix}: {point.sourceName} · {formatStamp(point.timeMs)}
                </div>
              </div>
            );
          })}
        </div>
        <span className="hidden shrink-0 text-slate-600 sm:inline">
          {formatStamp(maxTime)}
        </span>
      </div>
    </div>
  );
}
