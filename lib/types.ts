export type BiasSignal = {
  name: string;
  detected: boolean;
  intensity: number;
  evidence: string;
};

export type DecisionCategory =
  | "career"
  | "finance"
  | "technology"
  | "cybersecurity"
  | "relationships"
  | "health"
  | "general";

export type TimelinePoint = {
  label: "Immediate" | "1 Week" | "1 Month" | "6 Months" | "1 Year";
  outlook: string;
  risk: number;
  upside: number;
  evidence: string;
};

export type QualityDimension = {
  name:
    | "Information Completeness"
    | "Emotional Stability"
    | "Risk Exposure"
    | "Alternative Evaluation"
    | "Timing"
    | "Financial Impact"
    | "Long-Term Impact";
  score: number;
  reasoning: string;
};

export type EvidenceBackedItem = {
  title: string;
  why: string;
  evidence: string;
  reasoning: string;
  confidence: number;
};

export type CategoryVisualization = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  data: Array<{ name: string; primary: number; secondary: number }>;
};

export type ComparisonOption = {
  name: string;
  pros: string[];
  cons: string[];
  risk: number;
  cost: number;
  timelineFit: number;
  recommendation: string;
};

export type ComparisonResult = {
  options: ComparisonOption[];
  winner: string;
  finalRecommendation: string;
};

export type AnalysisSuccess = {
  status: "analysis";
  decision: string;
  category: DecisionCategory;
  categoryLabel: string;
  executiveSummary: string;
  assumptions: string[];
  uncertainty: string;
  decisionQualityScore: number;
  decisionQualityLabel: "Excellent" | "Good" | "Needs More Information" | "High Risk";
  qualityDimensions: QualityDimension[];
  riskScore: number;
  regretProbability: number;
  aiConfidenceScore: number;
  biasSignals: BiasSignal[];
  hiddenRisks: EvidenceBackedItem[];
  blindSpots: EvidenceBackedItem[];
  betterAlternatives: EvidenceBackedItem[];
  timeline: TimelinePoint[];
  actionPlan: EvidenceBackedItem[];
  categoryVisualization: CategoryVisualization;
  comparison?: ComparisonResult;
  chartData: Array<{ name: string; value: number }>;
};

export type ClarificationResult = {
  status: "needs_context";
  decision: string;
  category: DecisionCategory;
  categoryLabel: string;
  reason: string;
  questions: string[];
};

export type AnalysisResult = AnalysisSuccess | ClarificationResult;
