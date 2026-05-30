"use client";

import { useEffect, useState } from "react";

interface ContradictionReport {
  consensus: string;
  contradictions: string[];
  bias_vectors: string;
}

interface ContradictionPanelProps {
  eventId: string;
  apiBaseUrl: string;
}

export function ContradictionPanel({
  eventId,
  apiBaseUrl,
}: ContradictionPanelProps) {
  const [report, setReport] = useState<ContradictionReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const fetchWithTimeout = async (url: string, timeoutMs: number) => {
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          signal: abortController.signal,
          cache: "no-store",
        });
        clearTimeout(timeoutId);
        return res;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    const loadReport = async () => {
      const maxRetries = 2;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (cancelled) return;
        try {
          setIsLoading(true);
          setError(null);

          const response = await fetchWithTimeout(
            `${apiBaseUrl}/api/events/${eventId}/contradiction-report`,
            55000
          );

          if (!response.ok) {
            throw new Error(`Failed to load report (${response.status})`);
          }

          const data = (await response.json()) as ContradictionReport;
          if (!cancelled) setReport(data);
          return;
        } catch (err) {
          lastError = err as Error;
          if (lastError.name === "AbortError") {
            if (attempt < maxRetries && !cancelled) {
              continue; // retry on timeout
            }
            if (!cancelled) setError("Analysis timed out. The AI engine is processing — try refreshing in a moment.");
            return;
          }
        }
      }

      if (!cancelled && lastError) {
        setError(lastError.message || "Failed to load contradiction report.");
      }
      if (!cancelled) setIsLoading(false);
    };

    loadReport().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [eventId, apiBaseUrl]);

  if (isLoading) {
    return (
      <div className="animate-pulse border-l border-white/[0.08] pl-4">
        <div className="h-2 w-16 bg-white/10" />
        <div className="mt-4 h-3 w-3/4 bg-white/5" />
        <div className="mt-2 h-3 w-1/2 bg-white/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-l border-white/[0.08] pl-4 text-xs">
        <p className="font-medium text-slate-500">Engine Fault</p>
        <p className="mt-1 text-slate-400">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* Consensus Section */}
      <div className="border-l-2 border-cyan-500/30 pl-4 py-1">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
            AI Consensus Synthesis
          </h3>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
          {report.consensus}
        </p>
      </div>

      {/* Contradictions Section */}
      {report.contradictions.length > 0 && (
        <div className="border-l-2 border-rose-500/30 pl-4 py-1">
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
              Identified Friction Points
            </h3>
          </div>
          <ul className="space-y-2">
            {report.contradictions.map((item, i) => (
              <li key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3 flex items-start gap-3">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-[9px] font-bold text-rose-400">
                  {i + 1}
                </span>
                <p className="text-[12px] leading-relaxed text-slate-300">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bias Vectors Section */}
      <div className="border-l-2 border-purple-500/30 pl-4 py-1">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22h10M2 22h10M12 2v20M12 6h8a4 4 0 0 1 0 8h-8M12 6H4a4 4 0 0 0 0 8h8"/>
          </svg>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
            Source Alignment & Bias Vectors
          </h3>
        </div>
        <p className="mt-2 text-[12px] italic leading-relaxed text-slate-400">
          {report.bias_vectors}
        </p>
      </div>
    </div>
  );
}
