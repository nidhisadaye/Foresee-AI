"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, GitCompare, Gauge, ShieldCheck, TrendingUp } from "lucide-react";
import { BackgroundField } from "@/components/background-field";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const suggestions = [
  "Should I leave my job to start a company?",
  "Should we launch this product next month?",
  "Should I move cities for this opportunity?",
  "Should I invest in this new market?",
];

const capabilities = [
  { icon: Gauge, label: "Decision Quality", text: "Information, emotion, risk, timing, and long-term impact." },
  { icon: BrainCircuit, label: "Bias Detection", text: "FOMO, anchoring, loss aversion, overconfidence, and more." },
  { icon: GitCompare, label: "Comparison Mode", text: "Compare options with cost, risk, timeline fit, and a winner." },
  { icon: ShieldCheck, label: "Evidence First", text: "Every recommendation includes why, evidence, reasoning, and confidence." },
];

export default function LandingPage() {
  const router = useRouter();
  const [decision, setDecision] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [insights, setInsights] = useState({ total: 0, topCategory: "None yet", commonBias: "Learning", confidence: 0 });

  useEffect(() => {
    const stored = window.localStorage.getItem("foresee-history");
    if (!stored) return;
    const history = JSON.parse(stored) as Array<{ categoryLabel: string; confidence: number; biases: string[] }>;
    const categoryCounts = history.reduce<Record<string, number>>((acc, item) => {
      acc[item.categoryLabel] = (acc[item.categoryLabel] ?? 0) + 1;
      return acc;
    }, {});
    const biasCounts = history.flatMap((item) => item.biases).reduce<Record<string, number>>((acc, bias) => {
      acc[bias] = (acc[bias] ?? 0) + 1;
      return acc;
    }, {});
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";
    const commonBias = Object.entries(biasCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Learning";
    const confidence = history.length
      ? Math.round(history.reduce((sum, item) => sum + item.confidence, 0) / history.length)
      : 0;
    setInsights({ total: history.length, topCategory, commonBias, confidence });
  }, []);

  function analyze(event?: FormEvent) {
    event?.preventDefault();
    const comparison = optionA.trim() && optionB.trim() ? `${optionA.trim()} vs ${optionB.trim()}` : "";
    const value = comparison || decision.trim();
    if (!value) return;
    router.push(`/analysis?decision=${encodeURIComponent(value)}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundField />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <BrandMark />
          <Button variant="secondary" size="default" onClick={() => router.push("/analysis?decision=Should we expand into a new market this quarter?")}>
            View Demo
          </Button>
        </nav>

        <section className="flex flex-1 flex-col items-center justify-center pb-12 pt-16 text-center sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm text-white/68 backdrop-blur-xl"
          >
            <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.8)]" />
            Premium Decision Intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05 }}
            className="max-w-5xl text-balance text-5xl font-semibold tracking-normal text-white sm:text-7xl lg:text-8xl"
          >
            Foresee AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12 }}
            className="mt-5 max-w-2xl text-balance text-xl text-white/64 sm:text-2xl"
          >
            Think Ahead. Decide Better.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18 }}
            className="mt-4 max-w-2xl text-balance text-base leading-7 text-white/48 sm:text-lg"
          >
            See the consequences before they become reality.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18 }}
            className="mt-2 max-w-2xl text-balance text-sm leading-6 text-white/48 sm:text-base"
          >
            Analyze risks, uncover blind spots, and explore possible outcomes before making life&apos;s biggest decisions.
          </motion.p>

          <motion.form
            onSubmit={analyze}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24 }}
            className="glass mt-10 flex w-full max-w-3xl flex-col gap-3 rounded-[1.75rem] p-3 sm:flex-row"
          >
            <Input
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
              placeholder="What decision are you thinking about today?"
              className="border-transparent bg-transparent sm:h-16"
            />
            <Button type="submit" size="lg" className="shrink-0" disabled={!decision.trim() && (!optionA.trim() || !optionB.trim())}>
              Simulate Outcome
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-6 w-full max-w-3xl"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.12em] text-white/45">Try an example</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => router.push(`/analysis?decision=${encodeURIComponent(suggestion)}`)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-white/56 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white/72"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
  initial={{ opacity: 0, y: 18 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.28 }}
  className="mt-4 flex justify-center"
>
  <Button
    variant="secondary"
    onClick={() => {
      const element = document.getElementById("compare-section");
      element?.scrollIntoView({ behavior: "smooth" });
    }}
  >
    <GitCompare className="h-4 w-4" />
    Compare Options
  </Button>
</motion.div>

{/* Compare Mode (Hidden by Default) */}
<motion.div
  id="compare-section"
  initial={{ opacity: 0, y: 18 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.32 }}
  className="glass mt-8 grid w-full max-w-3xl gap-3 rounded-2xl p-3 sm:grid-cols-[1fr_auto_1fr]"
>
  <Input
    value={optionA}
    onChange={(event) => setOptionA(event.target.value)}
    placeholder="Compare option A"
    className="h-12 rounded-2xl border-white/8 bg-white/[0.04] text-sm"
  />
  <div className="flex items-center justify-center rounded-full border border-white/10 px-4 text-xs text-white/45">VS</div>
  <Input
    value={optionB}
    onChange={(event) => setOptionB(event.target.value)}
    placeholder="Compare option B"
    className="h-12 rounded-2xl border-white/8 bg-white/[0.04] text-sm"
  />
</motion.div>

        </section>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.42 }}
          className="grid gap-3 pb-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {capabilities.map((item) => (
            <div key={item.label} className="glass rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-white/18">
              <item.icon className="h-5 w-5 text-sky-200" />
              <h2 className="mt-4 text-sm font-semibold text-white">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-white/48">{item.text}</p>
            </div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="glass mb-8 grid gap-4 rounded-2xl p-5 sm:grid-cols-4"
        >
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <TrendingUp className="h-4 w-4 text-teal-200" />
              Personal Intelligence
            </div>
            <p className="mt-2 text-sm leading-6 text-white/46">Foresee learns from simulations on this device.</p>
          </div>
          <PersonalMetric label="Simulations" value={String(insights.total)} />
          <PersonalMetric label="Top Category" value={insights.topCategory} />
          <PersonalMetric label="Confidence Trend" value={insights.confidence ? `${insights.confidence}%` : "Learning"} />
        </motion.section>
      </div>
    </main>
  );
}

function PersonalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4 text-left">
      <p className="text-xs text-white/42">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
