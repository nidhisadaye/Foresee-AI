"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BrainCircuit,
  Download,
  Eye,
  GitCompare,
  Lightbulb,
  Route,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BackgroundField } from "@/components/background-field";
import { BrandMark } from "@/components/brand-mark";
import { LoadingAnalysis } from "@/components/loading-analysis";
import { MetricGauge } from "@/components/metric-gauge";
import { Typewriter } from "@/components/typewriter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { AnalysisResult, AnalysisSuccess, ClarificationResult, EvidenceBackedItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const simulationSteps = [
  "Understanding your decision...",
  "Identifying hidden variables...",
  "Running future simulations...",
  "Detecting cognitive biases...",
  "Generating possible futures...",
];

function AnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const decision = searchParams.get("decision") || "";
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [context, setContext] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!decision) {
      router.replace("/");
      return;
    }
    runAnalysis([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision, router]);

  useEffect(() => {
    setSimulationStep(0);
    setSimulationComplete(false);
    const timer = window.setInterval(() => {
      setSimulationStep((step) => {
        if (step >= simulationSteps.length - 1) {
          window.clearInterval(timer);
          window.setTimeout(() => setSimulationComplete(true), 450);
          return step;
        }
        return step + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [context]);

  async function runAnalysis(nextContext: string[]) {
    setResult(null);
    setError("");
    setContext(nextContext);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, context: nextContext }),
      });
      if (!response.ok) throw new Error("Unable to simulate decision");
      const data = (await response.json()) as AnalysisResult;
      setResult(data);
      if (data.status === "analysis") persistInsight(data);
    } catch {
      setError("Foresee AI could not complete the simulation. Please try again.");
    }
  }

  function submitContext(event: FormEvent) {
    event.preventDefault();
    const nextContext = Object.values(answers).map((answer) => answer.trim()).filter(Boolean);
    if (nextContext.length < 2) return;
    runAnalysis(nextContext);
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-lg p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-red-300" />
          <h1 className="mt-5 text-xl font-semibold text-white">{error}</h1>
          <Button className="mt-6" onClick={() => router.push("/")}>Return Home</Button>
        </Card>
      </div>
    );
  }

  if (!result || !simulationComplete) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <BackgroundField />
        <LoadingAnalysis />
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-20 mx-auto max-w-xl px-4">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-sky-200" />
              <p className="text-sm font-medium text-white">{simulationSteps[simulationStep]}</p>
            </div>
            <Progress value={((simulationStep + 1) / simulationSteps.length) * 100} className="mt-4" />
          </div>
        </div>
      </main>
    );
  }

  if (result.status === "needs_context") {
    return (
      <ClarificationView
        result={result}
        answers={answers}
        onAnswer={setAnswers}
        onSubmit={submitContext}
        onBack={() => router.push("/")}
      />
    );
  }

  return <Dashboard analysis={result} onBack={() => router.push("/")} />;
}

function Dashboard({ analysis, onBack }: { analysis: AnalysisSuccess; onBack: () => void }) {
  const timelineChart = useMemo(
    () =>
      analysis.timeline.map((point) => ({
        name: point.label,
        risk: Math.min(100, Math.max(0, point.risk)),
        upside: Math.min(100, Math.max(0, point.upside)),
      })),
    [analysis],
  );

  return (
    <main className="printable relative min-h-screen overflow-hidden">
      <BackgroundField />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <nav className="no-print flex items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              New Simulation
            </Button>
            <Button onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </nav>

        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="pt-10 sm:pt-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm text-white/62">
            <Sparkles className="h-4 w-4 text-sky-200" />
            {analysis.categoryLabel} simulation
          </div>
          <h1 className="mt-5 max-w-5xl text-balance text-4xl font-semibold tracking-normal text-white sm:text-6xl">
            {analysis.decision}
          </h1>
        </motion.header>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <Card className="min-h-64">
            <CardHeader>
              <CardTitle>Executive Simulation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-8 text-white/72">
                <Typewriter text={analysis.executiveSummary} />
              </p>
              <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.035] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/38">Uncertainty</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{analysis.uncertainty}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Decision Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
                <MetricGauge value={analysis.decisionQualityScore} label={analysis.decisionQualityLabel} tone="teal" />
                <div className="space-y-3">
                  {analysis.qualityDimensions.map((dimension) => (
                    <div key={dimension.name}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-white/68">{dimension.name}</span>
                        <span className="text-white">{dimension.score}</span>
                      </div>
                      <Progress value={dimension.score} className="mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricGauge value={analysis.riskScore} label="Decision Risk" tone="sky" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Regret</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricGauge value={analysis.regretProbability} label="Regret Probability" tone="violet" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricGauge value={analysis.aiConfidenceScore} label="AI Confidence" tone="teal" />
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{analysis.categoryVisualization.title}</CardTitle>
              <p className="text-sm text-white/45">{analysis.categoryVisualization.subtitle}</p>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.categoryVisualization.data}>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="primary" name={analysis.categoryVisualization.primaryLabel} stroke="#5eead4" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="secondary" name={analysis.categoryVisualization.secondaryLabel} stroke="#c4b5fd" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signal Mix</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.chartData}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#7dd3fc" radius={[8, 8, 8, 8]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {analysis.comparison ? <ComparisonPanel comparison={analysis.comparison} /> : null}

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Future Timeline</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChart}>
                  <defs>
                    <linearGradient id="risk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7dd3fc" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#7dd3fc" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="upside" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5eead4" stopOpacity={0.42} />
                      <stop offset="95%" stopColor="#5eead4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="risk" stroke="#7dd3fc" strokeWidth={3} fill="url(#risk)" />
                  <Area type="monotone" dataKey="upside" stroke="#5eead4" strokeWidth={3} fill="url(#upside)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.timeline.map((point) => (
                <div key={point.label} className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{point.label}</p>
                    <p className="text-xs text-white/45">Risk {Math.min(100, Math.max(0, point.risk))}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/58">{point.outlook}</p>
                  <p className="mt-2 text-xs leading-5 text-white/40">{point.evidence}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Bias Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.biasSignals.map((bias) => (
                <div key={bias.name} className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{bias.name}</p>
                      <p className="mt-1 text-sm text-white/45">{bias.detected ? "Detected" : "Low signal"}</p>
                    </div>
                    <span className={cn("rounded-full px-3 py-1 text-xs", bias.detected ? "bg-red-400/12 text-red-200" : "bg-teal-300/12 text-teal-100")}>
                      {bias.intensity}%
                    </span>
                  </div>
                  <Progress value={bias.intensity} className="mt-3" />
                  <p className="mt-3 text-sm leading-6 text-white/52">{bias.evidence}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <EvidenceCard icon={AlertTriangle} title="Hidden Risks" items={analysis.hiddenRisks} />
            <EvidenceCard icon={Eye} title="Blind Spots" items={analysis.blindSpots} />
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <EvidenceCard icon={Lightbulb} title="Better Alternatives" items={analysis.betterAlternatives} />
          <Card>
            <CardHeader>
              <CardTitle>Action Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.actionPlan.map((item, index) => (
                <div key={item.title} className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm text-sky-100">
                      {index + 1}
                    </div>
                    <EvidenceBody item={item} />
                  </div>
                </div>
              ))}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniMetric icon={Route} label="Reversibility" value={100 - Math.round(analysis.riskScore / 2)} />
                <MiniMetric icon={Target} label="Clarity" value={analysis.aiConfidenceScore} />
                <MiniMetric icon={BadgeCheck} label="Readiness" value={Math.round((analysis.aiConfidenceScore + (100 - analysis.regretProbability)) / 2)} />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function ClarificationView({
  result,
  answers,
  onAnswer,
  onSubmit,
  onBack,
}: {
  result: ClarificationResult;
  answers: Record<number, string>;
  onAnswer: (answers: Record<number, string>) => void;
  onSubmit: (event: FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundField />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <BrandMark />
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </nav>
        <div className="flex flex-1 items-center justify-center py-12">
          <Card className="w-full p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm text-white/62">
              <Sparkles className="h-4 w-4 text-teal-200" />
              {result.categoryLabel}
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white sm:text-5xl">Foresee needs sharper context.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/56">{result.reason}</p>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {result.questions.map((question, index) => (
                <label key={question} className="block rounded-xl border border-white/8 bg-white/[0.035] p-4">
                  <span className="text-sm font-medium text-white">{question}</span>
                  <Input
                    value={answers[index] ?? ""}
                    onChange={(event) => onAnswer({ ...answers, [index]: event.target.value })}
                    placeholder="Add context"
                    className="mt-3 h-12 rounded-2xl border-white/8 bg-white/[0.04] text-sm"
                  />
                </label>
              ))}
              <Button type="submit" size="lg" disabled={Object.values(answers).filter((answer) => answer.trim()).length < 2}>
                Run Decision Intelligence
                <BrainCircuit className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}

function ComparisonPanel({ comparison }: { comparison: NonNullable<AnalysisSuccess["comparison"]> }) {
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
          <GitCompare className="h-4 w-4 text-sky-200" />
        </div>
        <div>
          <CardTitle>Decision Comparison</CardTitle>
          <p className="text-sm text-white/45">Winner: {comparison.winner}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {comparison.options.map((option) => (
            <div key={option.name} className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
              <h3 className="text-lg font-semibold text-white">{option.name}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniStat label="Risk" value={option.risk} />
                <MiniStat label="Cost" value={option.cost} />
                <MiniStat label="Timeline Fit" value={option.timelineFit} />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ListBlock title="Pros" items={option.pros} />
                <ListBlock title="Cons" items={option.cons} />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/58">{option.recommendation}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-teal-200/15 bg-teal-200/[0.06] p-4 text-sm leading-6 text-teal-50/82">
          {comparison.finalRecommendation}
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceCard({ icon: Icon, title, items }: { icon: typeof AlertTriangle; title: string; items: EvidenceBackedItem[] }) {
  return (
    <Card className="transition duration-300 hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
          <Icon className="h-4 w-4 text-sky-200" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
            <EvidenceBody item={item} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EvidenceBody({ item }: { item: EvidenceBackedItem }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-4">
        <p className="font-medium text-white">{item.title}</p>
        <span className="shrink-0 rounded-full bg-white/[0.08] px-3 py-1 text-xs text-white/58">{item.confidence}%</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/56"><span className="text-white/82">Why:</span> {item.why}</p>
      <p className="mt-2 text-sm leading-6 text-white/48"><span className="text-white/72">Evidence:</span> {item.evidence}</p>
      <p className="mt-2 text-sm leading-6 text-white/48"><span className="text-white/72">Reasoning:</span> {item.reasoning}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-white/38">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-white/52">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.035] p-3">
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/42">{label}</p>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
      <Icon className="h-4 w-4 text-teal-200" />
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{label}</p>
    </div>
  );
}

function persistInsight(analysis: AnalysisSuccess) {
  const key = "foresee-history";
  const existing = window.localStorage.getItem(key);
  const history = existing ? (JSON.parse(existing) as Array<{ categoryLabel: string; confidence: number; biases: string[] }>) : [];
  const next = [
    {
      categoryLabel: analysis.categoryLabel,
      confidence: analysis.aiConfidenceScore,
      biases: analysis.biasSignals.filter((bias) => bias.detected).map((bias) => bias.name),
    },
    ...history,
  ].slice(0, 12);
  window.localStorage.setItem(key, JSON.stringify(next));
}

const tooltipStyle = {
  background: "rgba(8,12,20,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
};

export default function AnalysisPage() {
  return (
    <Suspense fallback={<LoadingAnalysis />}>
      <AnalysisContent />
    </Suspense>
  );
}
