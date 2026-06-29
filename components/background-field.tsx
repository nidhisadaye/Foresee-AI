"use client";

import { motion } from "framer-motion";

export function BackgroundField() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-sky-400/18 blur-3xl"
        animate={{ x: [0, 30, -10, 0], y: [0, -22, 18, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[4%] top-[6%] h-80 w-80 rounded-full bg-teal-300/14 blur-3xl"
        animate={{ x: [0, -24, 12, 0], y: [0, 28, -12, 0], scale: [1, 0.94, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[30%] h-96 w-96 rounded-full bg-violet-400/12 blur-3xl"
        animate={{ x: [0, 22, -18, 0], y: [0, -20, 16, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.032)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.032)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
    </div>
  );
}
