"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

export type AuroraTheme = "neutral" | "conflict" | "tech" | "climate" | "social";

interface AuroraBackgroundProps {
  theme?: AuroraTheme;
}

const PALETTES: Record<AuroraTheme, string[]> = {
  neutral: ["rgba(30, 41, 59, 0.3)", "rgba(15, 23, 42, 0.4)", "rgba(2, 6, 23, 0.5)"],
  conflict: ["rgba(153, 27, 27, 0.25)", "rgba(124, 45, 18, 0.25)", "rgba(69, 10, 10, 0.3)"],
  tech: ["rgba(34, 211, 238, 0.2)", "rgba(147, 51, 234, 0.2)", "rgba(8, 145, 178, 0.25)"],
  climate: ["rgba(20, 184, 166, 0.2)", "rgba(101, 163, 13, 0.2)", "rgba(13, 148, 136, 0.25)"],
  social: ["rgba(244, 114, 182, 0.2)", "rgba(249, 115, 22, 0.2)", "rgba(190, 24, 93, 0.25)"],
};

export function AuroraBackground({ theme = "neutral" }: AuroraBackgroundProps) {
  const colors = useMemo(() => PALETTES[theme], [theme]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Main Aurora Blobs */}
          <motion.div
            animate={{
              x: [0, 40, -40, 0],
              y: [0, -30, 30, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full blur-[120px]"
            style={{ background: colors[0] }}
          />

          <motion.div
            animate={{
              x: [0, -50, 50, 0],
              y: [0, 40, -40, 0],
              scale: [1, 0.9, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[120px]"
            style={{ background: colors[1] }}
          />

          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[150px]"
            style={{ background: colors[2] }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Existing dot grid overlay for depth */}
      <div className="absolute inset-0 bg-dot-grid opacity-30" />
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
    </div>
  );
}
