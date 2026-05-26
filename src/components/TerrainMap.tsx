const points = [
  {
    name: "Dainik Jagran",
    region: "North India",
    x: 248,
    y: 134,
    ring: "Near-field",
    color: "fill-amber-400",
    stroke: "stroke-amber-400",
    align: "start",
  },
  {
    name: "The Hindu",
    region: "South India",
    x: 186,
    y: 248,
    ring: "Domestic distance",
    color: "fill-cyan-400",
    stroke: "stroke-cyan-400",
    align: "end",
  },
  {
    name: "BBC News",
    region: "London",
    x: 88,
    y: 90,
    ring: "Global edge",
    color: "fill-violet-400",
    stroke: "stroke-violet-400",
    align: "end",
  },
] as const;

export function TerrainMap() {
  const centerX = 220;
  const centerY = 180;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94))] p-6 text-white shadow-sm md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/80">
            Distance Map
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Geographic spread becomes visible before narrative spread does.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            Terrain anchors each perspective to physical distance from event
            epicenter, making local proximity and global remove legible at a
            glance.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-300">
            <span>Signal Field</span>
            <span>New Delhi Event</span>
          </div>

          <div className="mt-4">
            <svg
              viewBox="0 0 440 360"
              className="h-auto w-full"
              role="img"
              aria-label="Abstract radar map showing source distance from New Delhi event"
            >
              <defs>
                <radialGradient id="terrain-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(248,113,113,0.42)" />
                  <stop offset="100%" stopColor="rgba(248,113,113,0)" />
                </radialGradient>
              </defs>

              <circle cx={centerX} cy={centerY} r="146" fill="none" className="stroke-white/10" strokeWidth="1.5" />
              <circle cx={centerX} cy={centerY} r="104" fill="none" className="stroke-white/10" strokeWidth="1.5" />
              <circle cx={centerX} cy={centerY} r="62" fill="none" className="stroke-white/10" strokeWidth="1.5" />
              <circle cx={centerX} cy={centerY} r="18" fill="url(#terrain-glow)" />

              {points.map((point) => (
                <g key={point.name}>
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={point.x}
                    y2={point.y}
                    className="stroke-white/35"
                    strokeWidth="1.5"
                    strokeDasharray="5 6"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="10"
                    className={`${point.color} opacity-90`}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="18"
                    className={`${point.stroke} opacity-20`}
                    fill="none"
                    strokeWidth="1.5"
                  />
                  <text
                    x={point.align === "end" ? point.x - 16 : point.x + 16}
                    y={point.y - 8}
                    textAnchor={point.align}
                    className="fill-white text-[12px] font-semibold"
                  >
                    {point.name}
                  </text>
                  <text
                    x={point.align === "end" ? point.x - 16 : point.x + 16}
                    y={point.y + 10}
                    textAnchor={point.align}
                    className="fill-slate-300 text-[10px] uppercase tracking-[0.22em]"
                  >
                    {point.region}
                  </text>
                </g>
              ))}

              <g>
                <circle cx={centerX} cy={centerY} r="8" className="fill-red-500">
                  <animate
                    attributeName="r"
                    values="8;12;8"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;0.72;1"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx={centerX} cy={centerY} r="18" className="fill-red-500/20">
                  <animate
                    attributeName="r"
                    values="14;24;14"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.45;0.1;0.45"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <text
                  x={centerX + 20}
                  y={centerY - 8}
                  className="fill-white text-[12px] font-semibold"
                >
                  New Delhi
                </text>
                <text
                  x={centerX + 20}
                  y={centerY + 10}
                  className="fill-red-200 text-[10px] uppercase tracking-[0.22em]"
                >
                  Event
                </text>
              </g>
            </svg>
          </div>

          <div className="mt-4 grid gap-2 text-xs text-slate-300 md:grid-cols-3">
            {points.map((point) => (
              <div
                key={point.name}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <p className="font-semibold text-white">{point.name}</p>
                <p className="mt-1">{point.ring}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
