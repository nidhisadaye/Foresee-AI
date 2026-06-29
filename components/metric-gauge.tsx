"use client";

import { motion } from "framer-motion";

export function MetricGauge({
  value,
  label,
  tone = "sky",
}: {
  value: number;
  label: string;
  tone?: "sky" | "teal" | "violet";
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = tone === "teal" ? "#5eead4" : tone === "violet" ? "#c4b5fd" : "#7dd3fc";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="10"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-semibold text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {value}
          </motion.span>
          <span className="text-xs text-white/45">/100</span>
        </div>
      </div>
      <p className="mt-1 text-center text-sm text-white/62">{label}</p>
    </div>
  );
}
