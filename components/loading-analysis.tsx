"use client";

import { motion } from "framer-motion";
import { BrainCircuit, ScanLine } from "lucide-react";

const steps = [
  "Understanding your decision...",
  "Identifying hidden variables...",
  "Running future simulations...",
  "Detecting cognitive biases...",
  "Generating possible futures...",
];

export function LoadingAnalysis() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-xl rounded-2xl p-8 text-center">
        <motion.div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.08]"
          animate={{ rotate: [0, 4, -4, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <BrainCircuit className="h-7 w-7 text-sky-200" />
        </motion.div>
        <h1 className="mt-6 text-2xl font-semibold text-white">Running decision simulation</h1>
        <p className="mt-2 text-sm text-white/55">Foresee AI is modeling constraints, futures, uncertainty, and bias signals.</p>
        <div className="mt-8 space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.045] px-4 py-3 text-left"
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.8, delay: index * 0.25, repeat: Infinity }}
            >
              <ScanLine className="h-4 w-4 text-teal-200" />
              <span className="text-sm text-white/70">{step}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
