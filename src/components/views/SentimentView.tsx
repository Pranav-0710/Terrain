"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import type { EventPerspectiveResponse, Perspective } from "../../app/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

interface ContradictionReport {
  consensus: string;
  contradictions: string[];
  bias_vectors: string;
}

interface SentimentViewProps {
  eventDetails: EventPerspectiveResponse;
  onBack: () => void;
}

// Derive sentiment from editorial_frame text
function inferSentiment(frame: string): { label: string; color: string; score: number } {
  const lower = frame.toLowerCase();
  if (lower.match(/critical|alarm|warn|crisis|threat|danger|fear|condemn|hostile/))
    return { label: "Critical", color: "#f43f5e", score: 15 };
  if (lower.match(/concern|cautious|skepti|question|uncertain|tension/))
    return { label: "Cautious", color: "#f59e0b", score: 35 };
  if (lower.match(/balanced|neutral|factual|objective|report|inform/))
    return { label: "Balanced", color: "#22d3ee", score: 55 };
  if (lower.match(/optimist|positive|hopeful|progress|success|cooperat|support/))
    return { label: "Optimistic", color: "#34d399", score: 80 };
  if (lower.match(/celebrat|triumph|victory|praise/))
    return { label: "Celebratory", color: "#a78bfa", score: 95 };
  return { label: "Neutral", color: "#94a3b8", score: 50 };
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", damping: 20, stiffness: 100 },
  },
};

export function SentimentView({ eventDetails, onBack }: SentimentViewProps) {
  const [report, setReport] = useState<ContradictionReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contradiction report
  useEffect(() => {
    const abortController = new AbortController();
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE_URL}/api/events/${eventDetails.event_id}/contradiction-report`,
          { signal: abortController.signal, cache: "no-store" }
        );
        if (!res.ok) throw new Error(`Failed to load report (${res.status})`);
        setReport(await res.json());
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError((err as Error).message);
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    };
    load();
    return () => abortController.abort();
  }, [eventDetails.event_id]);

  // Sentiment analysis per perspective
  const sentimentData = useMemo(() => {
    return eventDetails.perspectives.map((p) => {
      const frame = p.article.editorial_frame || "Neutral";
      const sentiment = inferSentiment(frame);
      return {
        perspective: p,
        frame,
        ...sentiment,
      };
    });
  }, [eventDetails.perspectives]);

  // Group by tier
  const tiers = useMemo(() => {
    const local = sentimentData.filter((s) => s.perspective.alignment.relative_position === "local");
    const regional = sentimentData.filter((s) => s.perspective.alignment.relative_position === "regional");
    const global = sentimentData.filter((s) => s.perspective.alignment.relative_position === "global");
    return { local, regional, global };
  }, [sentimentData]);

  // Sentiment distribution
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    sentimentData.forEach((s) => {
      counts[s.label] = (counts[s.label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({
        label,
        count,
        pct: Math.round((count / sentimentData.length) * 100),
        color: sentimentData.find((s) => s.label === label)?.color || "#94a3b8",
      }))
      .sort((a, b) => b.count - a.count);
  }, [sentimentData]);

  // Average sentiment score
  const avgScore = useMemo(() => {
    if (sentimentData.length === 0) return 50;
    return Math.round(sentimentData.reduce((s, d) => s + d.score, 0) / sentimentData.length);
  }, [sentimentData]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#000000] overflow-hidden">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.05),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.05),transparent_50%)]" />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center gap-4 px-5 py-4 md:px-8 md:py-5">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onBack}
            className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-slate-400 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest">Analysis</span>
          </motion.button>

          <div className="h-4 w-px bg-white/[0.06]" />

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Sentiment & Bias Radar
            </p>
          </div>

          {/* Sentiment Pulse */}
          <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: avgScore > 60 ? "#34d399" : avgScore > 40 ? "#22d3ee" : "#f43f5e" }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: avgScore > 60 ? "#34d399" : avgScore > 40 ? "#22d3ee" : "#f43f5e" }} />
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Tone Index: {avgScore}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        <motion.div
          className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Event Title */}
            <motion.div className="col-span-12" variants={itemVariants}>
              <div className="glass-card p-8 relative overflow-hidden border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/50 via-purple-500/50 to-cyan-500/50" />
                <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight tracking-tight">
                  {eventDetails.event_title}
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  Analyzing editorial tone & framing across {eventDetails.perspectives.length} perspectives
                </p>
              </div>
            </motion.div>

            {/* Sentiment Distribution Bar */}
            <motion.div className="col-span-12 md:col-span-8" variants={itemVariants}>
              <div className="glass-card p-6 h-full border-white/[0.08] shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-rose-500/10 border border-rose-500/20">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                    Tone Distribution
                  </h3>
                </div>

                {/* Stacked Bar */}
                <div className="h-4 w-full rounded-full overflow-hidden flex bg-white/5 mb-4">
                  {distribution.map((d, i) => (
                    <motion.div
                      key={d.label}
                      className="h-full"
                      style={{ backgroundColor: d.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4">
                  {distribution.map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] text-slate-400 font-medium">
                        {d.label} ({d.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Tone Index Gauge */}
            <motion.div className="col-span-12 md:col-span-4" variants={itemVariants}>
              <div className="glass-card p-6 h-full border-white/[0.08] shadow-xl flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                  Global Tone Index
                </p>
                <div className="relative w-32 h-32">
                  {/* Ring */}
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={avgScore > 60 ? "#34d399" : avgScore > 40 ? "#22d3ee" : "#f43f5e"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - avgScore / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{avgScore}</span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest">/ 100</span>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-slate-400 text-center">
                  {avgScore > 60 ? "Generally positive framing" : avgScore > 40 ? "Mixed editorial tone" : "Critical / alarmed framing"}
                </p>
              </div>
            </motion.div>

            {/* AI Contradiction Report */}
            {isLoading ? (
              <motion.div className="col-span-12" variants={itemVariants}>
                <div className="glass-card p-8 border-white/[0.08] animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-4 w-4 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                    <span className="text-xs text-slate-500 tracking-wide">Synthesizing contradiction analysis...</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div className="col-span-12" variants={itemVariants}>
                <div className="glass-card p-6 border-rose-500/20">
                  <p className="text-xs text-rose-400">{error}</p>
                </div>
              </motion.div>
            ) : report ? (
              <>
                {/* Consensus */}
                <motion.div className="col-span-12 md:col-span-6" variants={itemVariants}>
                  <div className="glass-card p-6 h-full border-white/[0.08] shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5">
                          <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                        Consensus Zone
                      </h3>
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-300">
                      {report.consensus}
                    </p>
                  </div>
                </motion.div>

                {/* Bias Vectors */}
                <motion.div className="col-span-12 md:col-span-6" variants={itemVariants}>
                  <div className="glass-card p-6 h-full border-white/[0.08] shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                        </svg>
                      </div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                        Bias Vectors
                      </h3>
                    </div>
                    <p className="text-[13px] italic leading-relaxed text-slate-400">
                      {report.bias_vectors}
                    </p>
                  </div>
                </motion.div>

                {/* Contradictions */}
                {report.contradictions.length > 0 && (
                  <motion.div className="col-span-12" variants={itemVariants}>
                    <div className="glass-card p-6 border-white/[0.08] shadow-xl">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
                          Friction Points ({report.contradictions.length})
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {report.contradictions.map((c, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="rounded-xl border border-rose-500/10 bg-rose-500/[0.03] p-4 flex items-start gap-3"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-[9px] font-bold text-rose-400 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-[12px] leading-relaxed text-slate-300">{c}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            ) : null}

            {/* Per-Tier Sentiment Breakdown */}
            <motion.div className="col-span-12 pt-4" variants={itemVariants}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-500/50" />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
                  Source-Level Tone Breakdown
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Local Tier */}
                <TierColumn
                  title="Local Sources"
                  subtitle="Near epicenter"
                  accentColor="#34d399"
                  items={tiers.local}
                />
                {/* Regional Tier */}
                <TierColumn
                  title="Regional Sources"
                  subtitle="Same continent"
                  accentColor="#f59e0b"
                  items={tiers.regional}
                />
                {/* Global Tier */}
                <TierColumn
                  title="Global Sources"
                  subtitle="International wire"
                  accentColor="#60a5fa"
                  items={tiers.global}
                />
              </div>
            </motion.div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Sub-component for each geographic tier
function TierColumn({
  title,
  subtitle,
  accentColor,
  items,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  items: { perspective: Perspective; frame: string; label: string; color: string; score: number }[];
}) {
  return (
    <div className="glass-card border-white/[0.08] shadow-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">{title}</p>
          <p className="text-[9px] text-slate-600">{subtitle}</p>
        </div>
        <span className="ml-auto text-[10px] font-mono text-slate-500">{items.length}</span>
      </div>
      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-[11px] text-slate-600 text-center py-4">No sources in this tier</p>
        ) : (
          items.map((item) => (
            <motion.div
              key={item.perspective.story_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white truncate max-w-[70%]">
                  {item.perspective.source.name}
                </span>
                <span
                  className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                  style={{
                    color: item.color,
                    borderColor: item.color + "33",
                    backgroundColor: item.color + "11",
                  }}
                >
                  {item.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{item.frame}</p>
              {/* Micro sentiment bar */}
              <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
