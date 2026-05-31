"use client";

import { motion, Variants } from "framer-motion";
import { BarChart2, GitMerge, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import type { EventMarker, EventPerspectiveResponse } from "../../app/types";

interface EventHeroViewProps {
  event: EventMarker;
  eventDetails: EventPerspectiveResponse | null;
  isLoading: boolean;
  onBack: () => void;
  onNavigate: (view: "analysis" | "sentiment" | "simulation") => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", damping: 20, stiffness: 100 },
  },
};

const features = [
  {
    id: "analysis" as const,
    title: "Analyze Perspectives",
    description: "See how multiple global sources cover this event — their framing, proximity, and editorial bias mapped side by side.",
    icon: BarChart2,
    gradient: "from-cyan-500 to-blue-600",
    glowColor: "rgba(34, 211, 238, 0.15)",
    borderColor: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    hint: "View source cards, contradiction reports, and coverage intensity",
  },
  {
    id: "sentiment" as const,
    title: "Sentiment Radar",
    description: "Map the emotional and tone-based framing — see which sources are critical, balanced, or optimistic about this event.",
    icon: MessageSquare,
    gradient: "from-purple-500 to-pink-600",
    glowColor: "rgba(168, 85, 247, 0.15)",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-400",
    hint: "Tone distribution, bias vectors, and per-source sentiment breakdown",
  },
  {
    id: "simulation" as const,
    title: "Red Team Simulator",
    description: "Assume the role of a policymaker. Choose a response and simulate the 30-day geopolitical fallout on the global stage.",
    icon: GitMerge,
    gradient: "from-magenta-500 to-rose-600",
    glowColor: "rgba(217, 70, 239, 0.15)",
    borderColor: "border-magenta-500/20",
    iconColor: "text-magenta-400",
    hint: "Scenario modeling, predictive ripples, and outcome visualization",
  },
];

export function EventHeroView({
  event,
  eventDetails,
  isLoading,
  onBack,
  onNavigate,
}: EventHeroViewProps) {
  const perspectiveCount = eventDetails?.perspectives.length ?? 0;
  const hasData = !!eventDetails && perspectiveCount > 0;

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden">
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.06),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-5 md:px-8">
        <motion.div
          className="w-full max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Back button */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05, x: -3 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onBack}
            className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-slate-400 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Back to Globe</span>
          </motion.button>

          {/* Event Header */}
          <motion.div variants={itemVariants} className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400/70 mb-3">
              Event Briefing
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
              {event.title}
            </h1>
          </motion.div>

          {/* Meta row */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 mb-12">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z" />
              </svg>
              <span className="text-[10px] text-slate-400 font-mono">
                {event.lat.toFixed(2)}°N, {event.lng.toFixed(2)}°E
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
              {isLoading ? (
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
              ) : (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-medium">
                {isLoading ? "Aggregating sources..." : `${perspectiveCount} perspectives mapped`}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
              <span className="text-[10px] text-slate-400">
                {new Date(event.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div variants={itemVariants}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-5">
              Choose your lens
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isDisabled = !hasData;

              return (
                <motion.button
                  key={feature.id}
                  variants={itemVariants}
                  whileHover={!isDisabled ? { scale: 1.02, y: -4 } : undefined}
                  whileTap={!isDisabled ? { scale: 0.98 } : undefined}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onNavigate(feature.id)}
                  className={`group relative text-left rounded-2xl border p-6 md:p-8 backdrop-blur-xl transition-all overflow-hidden ${
                    isDisabled
                      ? "border-white/[0.04] bg-white/[0.02] opacity-50 cursor-wait"
                      : `${feature.borderColor} bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer`
                  }`}
                  style={!isDisabled ? { boxShadow: `0 0 60px -15px ${feature.glowColor}` } : undefined}
                >
                  {/* Glow overlay on hover */}
                  {!isDisabled && (
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{ background: `radial-gradient(circle at 50% 100%, ${feature.glowColor}, transparent 70%)` }}
                    />
                  )}

                  <div className="relative z-10">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white tracking-tight">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-[13px] leading-relaxed text-slate-400 mb-5">
                      {feature.description}
                    </p>

                    {/* Hint */}
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/[0.06]" />
                      <span className="text-[9px] text-slate-600 uppercase tracking-widest font-medium">
                        {isDisabled ? "Loading perspectives..." : feature.hint}
                      </span>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>

                    {/* CTA */}
                    {!isDisabled && (
                      <div className="mt-5 flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${feature.iconColor} group-hover:translate-x-1 transition-transform`}>
                          Launch →
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Compare hint */}
          <motion.div variants={itemVariants} className="mt-8">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4">
              <GitMerge className="w-4 h-4 text-slate-600 shrink-0" />
              <p className="text-[11px] text-slate-500">
                <span className="text-slate-400 font-medium">Compare Views</span> unlocks after you select two perspectives inside the Analysis dashboard.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
