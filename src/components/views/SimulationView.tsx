"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sword, Globe, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import type { EventMarker } from "../../app/types";

interface SimulationViewProps {
  event: EventMarker;
  onBack: () => void;
  onComplete: (simulatedEvents: EventMarker[]) => void;
}

type SimStep = "choice" | "loading" | "result";

interface PolicyOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  glow: string;
}

const POLICY_OPTIONS: PolicyOption[] = [
  {
    id: "sanctions",
    title: "Aggressive Sanctions",
    description: "Implement sweeping economic restrictions and freeze state assets to cripple financial capabilities.",
    icon: Shield,
    color: "text-amber-400",
    glow: "rgba(251, 191, 36, 0.15)",
  },
  {
    id: "military",
    title: "Military Posturing",
    description: "Deploy carrier strike groups and increase regional presence to demonstrate overwhelming force.",
    icon: Sword,
    color: "text-rose-500",
    glow: "rgba(244, 63, 94, 0.15)",
  },
  {
    id: "diplomacy",
    title: "Diplomatic De-escalation",
    description: "Initiate back-channel communications and propose a multi-lateral framework for peace talks.",
    icon: Globe,
    color: "text-cyan-400",
    glow: "rgba(34, 211, 238, 0.15)",
  },
];

export function SimulationView({ event, onBack, onComplete }: SimulationViewProps) {
  const [step, setStep] = useState<SimStep>("choice");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyOption | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (step === "loading") {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep("result"), 500);
            return 100;
          }
          return prev + 1.5;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handlePolicySelect = (policy: PolicyOption) => {
    setSelectedPolicy(policy);
    setStep("loading");
  };

  const getSimulatedEvents = (): EventMarker[] => {
    if (!selectedPolicy) return [];
    
    // Generate 3-5 mocked "Future Events" relative to the current event's location
    const baseLat = event.lat;
    const baseLng = event.lng;
    
    const scenarios: Record<string, any[]> = {
      sanctions: [
        { title: "Economic Collapse in Major Hub", offset: [2, 3], type: "Social" },
        { title: "Proxy Skirmish near Resource Line", offset: [-5, 8], type: "Conflict" },
        { title: "Emergency Trade Summit", offset: [15, -10], type: "Social" },
        { title: "Resource Nationalization Decree", offset: [-2, -4], type: "Social" },
      ],
      military: [
        { title: "Border Reconnaissance Incident", offset: [1, 1], type: "Conflict" },
        { title: "Massive Naval Drill Commences", offset: [8, 12], type: "Conflict" },
        { title: "Counter-Alliance Formation", offset: [-12, -20], type: "Conflict" },
        { title: "Cyber-Strike on Command Node", offset: [4, -6], type: "Tech" },
      ],
      diplomacy: [
        { title: "Historic Peace Framework Drafted", offset: [0, 2], type: "Social" },
        { title: "Sanctions Relief Discussion", offset: [12, 5], type: "Social" },
        { title: "Regional Cooperation Pact", offset: [-8, 15], type: "Social" },
        { title: "Joint Humanitarian Initiative", offset: [3, -3], type: "Climate" },
      ],
    };

    const scenario = scenarios[selectedPolicy.id];
    
    return scenario.map((s, i) => ({
      id: `sim-${selectedPolicy.id}-${i}`,
      title: `[SIMULATED] ${s.title}`,
      lat: baseLat + s.offset[0],
      lng: baseLng + s.offset[1],
      created_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      story_count: Math.floor(Math.random() * 50) + 10,
      source_diversity: [],
    }));
  };

  const handleFinalize = () => {
    onComplete(getSimulatedEvents());
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
      {/* Dimmed background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Choice */}
          {step === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              className="rounded-3xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl p-8 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.5)]"
            >
              <div className="mb-10 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-fuchsia-500 mb-3">
                  Strategic Simulation
                </p>
                <h2 className="text-3xl font-bold text-white mb-4">Choose Your Response</h2>
                <p className="text-slate-400 text-sm max-w-xl mx-auto italic">
                  &ldquo;{event.title}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {POLICY_OPTIONS.map((policy) => {
                  const Icon = policy.icon;
                  return (
                    <motion.button
                      key={policy.id}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePolicySelect(policy)}
                      className="group relative flex flex-col items-center text-center p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                      style={{ boxShadow: `0 0 40px -20px ${policy.glow}` }}
                    >
                      <div className={`p-4 rounded-xl bg-white/[0.03] mb-5 group-hover:scale-110 transition-transform ${policy.color}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{policy.title}</h3>
                      <p className="text-[11px] leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors">
                        {policy.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-12 flex justify-center">
                <button
                  onClick={onBack}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  Cancel Simulation
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Loading */}
          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-20"
            >
              <div className="relative mb-12">
                {/* Radar Effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-48 h-48 rounded-full border border-fuchsia-500/20"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1/2 bg-gradient-to-t from-fuchsia-500 to-transparent shadow-[0_0_20px_rgba(217,70,239,0.5)]" />
                  </motion.div>
                </div>
                <div className="relative z-10 w-48 h-48 rounded-full border border-white/[0.06] flex items-center justify-center bg-black/40 backdrop-blur-xl">
                  <div className="text-2xl font-bold font-mono text-white">
                    {Math.round(loadingProgress)}%
                  </div>
                </div>
                
                {/* Pulsing rings */}
                <motion.div
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 border border-fuchsia-500/30 rounded-full"
                />
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-fuchsia-400 animate-pulse mb-2">
                Processing Timeline Drift
              </p>
              <p className="text-white text-lg font-medium">
                Simulating +30 days of geopolitical fallout...
              </p>
              <p className="text-slate-500 text-[10px] mt-4 font-mono">
                Calculating causal ripples: {selectedPolicy?.title}
              </p>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-fuchsia-500/20 bg-black/80 backdrop-blur-2xl p-8 md:p-12 shadow-[0_0_100px_rgba(217,70,239,0.1)]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-fuchsia-500/20 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-fuchsia-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Timeline Projected</h2>
                <p className="text-slate-400 text-sm mb-10">
                  Simulation complete. Reality warp successful. 4 critical causal points identified.
                </p>

                <div className="w-full max-w-md space-y-4 mb-10">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                    <p className="text-[11px] text-slate-300 text-left">
                      Event density in the {event.lat > 0 ? "Northern" : "Southern"} Hemisphere expected to surge.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                    <p className="text-[11px] text-slate-300 text-left">
                      Coverage bias across regional hubs will shift toward {selectedPolicy?.id === 'diplomacy' ? 'skepticism' : 'alert'}.
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinalize}
                  className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all hover:bg-fuchsia-400 hover:text-white"
                >
                  <span>Enter Projected Reality</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
