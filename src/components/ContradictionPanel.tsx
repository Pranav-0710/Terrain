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

    const loadReport = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${apiBaseUrl}/api/events/${eventId}/contradiction-report`,
          {
            signal: abortController.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load report (${response.status})`);
        }

        const data = (await response.json()) as ContradictionReport;
        setReport(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => abortController.abort();
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
    <div className="border-l border-white/[0.08] pl-5">
      <div className="mb-6">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Consensus
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {report.consensus}
        </p>
      </div>

      {report.contradictions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Contradictions
          </h3>
          <ul className="mt-2 space-y-3">
            {report.contradictions.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-px w-2 shrink-0 bg-slate-600" />
                <p className="text-sm leading-relaxed text-slate-300">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Bias Vectors
        </h3>
        <p className="mt-2 text-sm italic leading-relaxed text-slate-400">
          {report.bias_vectors}
        </p>
      </div>
    </div>
  );
}
