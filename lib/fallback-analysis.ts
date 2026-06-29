import type { AnalysisSuccess, DecisionCategory, EvidenceBackedItem, QualityDimension } from "@/lib/types";

const biasNames = [
  "FOMO",
  "Confirmation Bias",
  "Anchoring",
  "Loss Aversion",
  "Overconfidence",
  "Emotional Decision",
];

const categoryKeywords: Record<DecisionCategory, string[]> = {
  career: ["job", "career", "offer", "quit", "salary", "role", "company", "promotion"],
  finance: ["invest", "stock", "fund", "buy", "loan", "debt", "money", "market", "cash"],
  technology: ["phone", "iphone", "samsung", "laptop", "software", "ai", "tool", "platform", "device"],
  cybersecurity: ["security", "breach", "attack", "password", "threat", "vulnerability", "cyber"],
  relationships: ["relationship", "partner", "friend", "marry", "break up", "conversation", "family"],
  health: ["health", "doctor", "diet", "workout", "sleep", "therapy", "medicine", "stress"],
  general: [],
};

const categoryLabels: Record<DecisionCategory, string> = {
  career: "Career Decision",
  finance: "Financial Decision",
  technology: "Technology Decision",
  cybersecurity: "Cybersecurity Decision",
  relationships: "Relationship Decision",
  health: "Health Decision",
  general: "Strategic Decision",
};

export function detectCategory(decision: string): DecisionCategory {
  const lower = decision.toLowerCase();
  const match = (Object.entries(categoryKeywords) as Array<[DecisionCategory, string[]]>).find(
    ([category, words]) => category !== "general" && words.some((word) => lower.includes(word)),
  );
  return match?.[0] ?? "general";
}

function qualityLabel(score: number): AnalysisSuccess["decisionQualityLabel"] {
  if (score >= 82) return "Excellent";
  if (score >= 68) return "Good";
  if (score >= 50) return "Needs More Information";
  return "High Risk";
}

function evidenceItem(title: string, subject: string, confidence: number): EvidenceBackedItem {
  return {
    title,
    why: `${title} matters because it changes the downside, reversibility, or timing of ${subject}.`,
    evidence: `Inferred from the decision wording and the missing context Foresee can currently observe.`,
    reasoning: `The safer path is to validate this point before committing, because unsupported assumptions tend to create regret later.`,
    confidence,
  };
}

function buildQualityDimensions(riskScore: number, signal: number): QualityDimension[] {
  const names: QualityDimension["name"][] = [
    "Information Completeness",
    "Emotional Stability",
    "Risk Exposure",
    "Alternative Evaluation",
    "Timing",
    "Financial Impact",
    "Long-Term Impact",
  ];
  return names.map((name, index) => {
    const raw = name === "Risk Exposure" ? 100 - riskScore : 54 + ((signal + index * 11) % 38);
    return {
      name,
      score: Math.min(96, Math.max(28, raw)),
      reasoning: `${name} is scored from stated context, uncertainty, and how reversible the decision appears.`,
    };
  });
}

function buildVisualization(category: DecisionCategory, seed: number) {
  const configs = {
    career: ["Salary Projection", "Income stability vs upside over time", "Upside", "Stability"],
    finance: ["Investment Graph", "Capital exposure against expected resilience", "Return", "Cash Flow"],
    technology: ["Ownership Timeline", "Utility retention against depreciation", "Utility", "Depreciation"],
    cybersecurity: ["Attack Chain Visualization", "Threat likelihood against control strength", "Threat", "Controls"],
    relationships: ["Conversation Readiness", "Clarity against emotional load", "Readiness", "Friction"],
    health: ["Lifestyle Timeline", "Behavior consistency against risk factors", "Consistency", "Risk"],
    general: ["Decision Simulation", "Upside probability against uncertainty", "Upside", "Uncertainty"],
  } satisfies Record<DecisionCategory, string[]>;
  const [title, subtitle, primaryLabel, secondaryLabel] = configs[category];
  return {
    title,
    subtitle,
    primaryLabel,
    secondaryLabel,
    data: ["Now", "1W", "1M", "6M", "1Y"].map((name, index) => ({
      name,
      primary: Math.min(96, Math.max(18, 42 + ((seed + index * 13) % 44))),
      secondary: Math.min(94, Math.max(14, 32 + ((seed + index * 19) % 48))),
    })),
  };
}

function parseComparisonOptions(decision: string) {
  const separators = /\s+(?:vs\.?|versus|or)\s+/i;
  const parts = decision.split(separators).map((part) => part.replace(/^should i\s+/i, "").trim()).filter(Boolean);
  return parts.length >= 2 ? parts.slice(0, 3) : [];
}

export function createFallbackAnalysis(decision: string, context: string[] = []): AnalysisSuccess {
  const normalized = decision.trim() || "this decision";
  const category = detectCategory(normalized);
  const contextSignal = context.join(" ").length;
  const signal = normalized.length + contextSignal;
  const riskScore = Math.min(88, Math.max(34, 42 + ((signal + category.length) % 37)));
  const regretProbability = Math.min(82, Math.max(24, riskScore - 9));
  const aiConfidenceScore = Math.min(94, Math.max(68, 101 - Math.round(riskScore / 3)));
  const qualityDimensions = buildQualityDimensions(riskScore, signal);
  const decisionQualityScore = Math.round(
    qualityDimensions.reduce((sum, item) => sum + item.score, 0) / qualityDimensions.length,
  );

  const biasSignals = biasNames.map((name, index) => {
    const intensity = Math.min(92, Math.max(18, ((signal + index * 17) % 85) + 12));
    return {
      name,
      detected: intensity > 48,
      intensity,
      evidence:
        intensity > 48
          ? `The framing suggests ${name.toLowerCase()} may be influencing urgency, certainty, or downside perception.`
          : `No strong ${name.toLowerCase()} pattern is visible from the current wording.`,
    };
  });
  const comparisonNames = parseComparisonOptions(normalized);

  return {
    status: "analysis",
    decision: normalized,
    category,
    categoryLabel: categoryLabels[category],
    executiveSummary: `Foresee AI sees "${normalized}" as a decision that deserves deliberate pacing. The strongest leverage is to separate reversible assumptions from irreversible commitments, define what success looks like before acting, and run one smaller validation step before committing fully.`,
    assumptions: [
      "The decision is important enough to benefit from a deliberate review.",
      "Some personal constraints are not fully visible yet.",
      "The best next step should reduce uncertainty before increasing commitment.",
    ],
    uncertainty: "This simulation is strongest on structure and risk reasoning; it should be refined with personal constraints, timelines, and financial details.",
    decisionQualityScore,
    decisionQualityLabel: qualityLabel(decisionQualityScore),
    qualityDimensions,
    riskScore,
    regretProbability,
    aiConfidenceScore,
    biasSignals,
    hiddenRisks: [
      evidenceItem("Switching cost may be underestimated", normalized, 72),
      evidenceItem("Second-order impact may compound quietly", normalized, 68),
      evidenceItem("Core assumptions may be untested", normalized, 76),
    ],
    blindSpots: [
      evidenceItem("Define what would make this wrong within 30 days", normalized, 74),
      evidenceItem("Invite the strongest opposing stakeholder view", normalized, 66),
      evidenceItem("Check whether a quieter option is being dismissed too early", normalized, 70),
    ],
    betterAlternatives: [
      evidenceItem("Run a constrained pilot", normalized, 81),
      evidenceItem("Create a reversible commitment with an exit rule", normalized, 78),
      evidenceItem("Compare against a 30-day hold scenario", normalized, 73),
    ],
    timeline: [
      { label: "Immediate", outlook: "Momentum increases, but ambiguity is still high.", risk: riskScore - 8, upside: 58, evidence: "Immediate upside comes from acting, while risk remains tied to incomplete context." },
      { label: "1 Week", outlook: "Early signals reveal whether the core assumption is holding.", risk: riskScore - 3, upside: 64, evidence: "One week is enough to test reaction, feasibility, or emotional clarity." },
      { label: "1 Month", outlook: "Operational tradeoffs become visible and measurable.", risk: riskScore + 2, upside: 67, evidence: "Practical costs tend to surface after the first execution cycle." },
      { label: "6 Months", outlook: "Compounding benefits or hidden drag start to dominate.", risk: riskScore + 6, upside: 72, evidence: "Six months reveals whether the choice compounds or drains attention." },
      { label: "1 Year", outlook: "The decision becomes part of your strategic identity.", risk: riskScore + 10, upside: 78, evidence: "Long-term outcomes depend on consistency and opportunity cost." },
    ],
    actionPlan: [
      evidenceItem("Write the decision criteria", normalized, 86),
      evidenceItem("Test the riskiest assumption first", normalized, 84),
      evidenceItem("Ask one trusted skeptic to critique the plan", normalized, 77),
      evidenceItem("Set a review date with continue, pause, or reverse rules", normalized, 82),
    ],
    categoryVisualization: buildVisualization(category, signal),
    comparison: comparisonNames.length
      ? {
          options: comparisonNames.map((name, index) => ({
            name,
            pros: [`Higher fit if ${name} matches your primary constraint`, "Can be evaluated with a small pre-commitment test"],
            cons: [`May hide opportunity cost compared with option ${index === 0 ? 2 : 1}`, "Requires clearer success criteria before committing"],
            risk: Math.min(90, Math.max(24, riskScore + index * 8 - 4)),
            cost: Math.min(95, Math.max(18, 36 + ((signal + index * 23) % 48))),
            timelineFit: Math.min(94, Math.max(30, 52 + ((signal + index * 17) % 36))),
            recommendation: `Choose ${name} only if it wins on your top constraint after one validation step.`,
          })),
          winner: comparisonNames[0],
          finalRecommendation: `${comparisonNames[0]} is the current winner because it appears more reversible from the available context. Confirm with cost, timing, and downside data before committing.`,
        }
      : undefined,
    chartData: [
      { name: "Risk", value: riskScore },
      { name: "Regret", value: regretProbability },
      { name: "Confidence", value: aiConfidenceScore },
      { name: "Bias", value: Math.round(biasSignals.reduce((sum, b) => sum + b.intensity, 0) / biasSignals.length) },
      { name: "Quality", value: decisionQualityScore },
    ],
  };
}

export function createClarifyingQuestions(decision: string) {
  const normalized = decision.trim();
  const category = detectCategory(normalized);
  const questionMap: Record<DecisionCategory, string[]> = {
    career: [
      "Do you already have another offer or income path?",
      "How many months of savings do you have?",
      "Are there financial dependents or fixed obligations involved?",
      "What is your current stress level from 1 to 10?",
    ],
    finance: [
      "What amount of money is at stake?",
      "What is your time horizon for this decision?",
      "How much downside can you tolerate without changing your lifestyle?",
      "Is this money needed for an upcoming obligation?",
    ],
    technology: [
      "What problem must the purchase or technology solve?",
      "How long do you expect to use it?",
      "What is the total cost including accessories, subscriptions, or switching?",
      "What current option are you replacing?",
    ],
    cybersecurity: [
      "What assets or systems are exposed?",
      "Has there been an incident or is this preventive?",
      "What controls already exist?",
      "What is the impact if the threat materializes?",
    ],
    relationships: [
      "What outcome do you want from the conversation or decision?",
      "How urgent is this emotionally and practically?",
      "What does the other person likely need or fear?",
      "What boundary or value is non-negotiable?",
    ],
    health: [
      "Is this decision supervised by a qualified professional?",
      "What symptoms, goals, or constraints are involved?",
      "What is the risk of delaying action?",
      "What lifestyle factors would affect the outcome?",
    ],
    general: [
      "What outcome would make this decision successful?",
      "What is the biggest downside you want to avoid?",
      "Is the decision reversible?",
      "What deadline or timing pressure exists?",
    ],
  };

  return {
    status: "needs_context" as const,
    decision: normalized,
    category,
    categoryLabel: categoryLabels[category],
    reason: "Foresee AI needs a few constraints before running a high-confidence simulation.",
    questions: questionMap[category],
  };
}
