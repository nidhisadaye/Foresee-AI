import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClarifyingQuestions, createFallbackAnalysis } from "@/lib/fallback-analysis";
import type { AnalysisResult, AnalysisSuccess } from "@/lib/types";

export const runtime = "nodejs";

function clampScore(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function normalize(result: AnalysisSuccess, decision: string, context: string[]): AnalysisSuccess {
  const fallback = createFallbackAnalysis(decision, context);
  return {
    ...fallback,
    ...result,
    status: "analysis",
    decision,
    category: result.category ?? fallback.category,
    categoryLabel: result.categoryLabel ?? fallback.categoryLabel,
    decisionQualityScore: clampScore(result.decisionQualityScore, fallback.decisionQualityScore),
    riskScore: clampScore(result.riskScore, fallback.riskScore),
    regretProbability: clampScore(result.regretProbability, fallback.regretProbability),
    aiConfidenceScore: clampScore(result.aiConfidenceScore, fallback.aiConfidenceScore),
    qualityDimensions: (result.qualityDimensions?.length ? result.qualityDimensions : fallback.qualityDimensions).map(
      (dimension, index) => ({
        ...fallback.qualityDimensions[index % fallback.qualityDimensions.length],
        ...dimension,
        score: clampScore(dimension.score, fallback.qualityDimensions[index % fallback.qualityDimensions.length].score),
      }),
    ),
    biasSignals: (result.biasSignals?.length ? result.biasSignals : fallback.biasSignals).map((bias, index) => ({
      ...fallback.biasSignals[index % fallback.biasSignals.length],
      ...bias,
      intensity: clampScore(bias.intensity, fallback.biasSignals[index % fallback.biasSignals.length].intensity),
      detected: Boolean(bias.detected),
    })),
    timeline: result.timeline?.length ? result.timeline : fallback.timeline,
    hiddenRisks: result.hiddenRisks?.length ? result.hiddenRisks : fallback.hiddenRisks,
    blindSpots: result.blindSpots?.length ? result.blindSpots : fallback.blindSpots,
    betterAlternatives: result.betterAlternatives?.length ? result.betterAlternatives : fallback.betterAlternatives,
    actionPlan: result.actionPlan?.length ? result.actionPlan : fallback.actionPlan,
    categoryVisualization: result.categoryVisualization ?? fallback.categoryVisualization,
    chartData: [
      { name: "Risk", value: clampScore(result.riskScore, fallback.riskScore) },
      { name: "Regret", value: clampScore(result.regretProbability, fallback.regretProbability) },
      { name: "Confidence", value: clampScore(result.aiConfidenceScore, fallback.aiConfidenceScore) },
      {
        name: "Bias",
        value: Math.round(
          (result.biasSignals?.length ? result.biasSignals : fallback.biasSignals).reduce(
            (sum, bias) => sum + clampScore(bias.intensity, 0),
            0,
          ) / (result.biasSignals?.length || fallback.biasSignals.length),
        ),
      },
      { name: "Quality", value: clampScore(result.decisionQualityScore, fallback.decisionQualityScore) },
    ],
  };
}

function hasEnoughContext(decision: string, context: string[]) {
  const lower = decision.toLowerCase();
  const looksComplex = /\b(quit|invest|loan|marry|break up|health|doctor|security|breach|job|offer|move|buy|vs|versus)\b/.test(
    lower,
  );
  return !looksComplex || context.filter(Boolean).length >= 2 || decision.length > 95;
}

export async function POST(request: Request) {
  const { decision, context = [] } = (await request.json()) as { decision?: string; context?: string[] };
  const cleanDecision = decision?.trim();
  const cleanContext = context.map((item) => item.trim()).filter(Boolean);

  if (!cleanDecision) {
    return NextResponse.json({ error: "Decision is required" }, { status: 400 });
  }

  if (!hasEnoughContext(cleanDecision, cleanContext)) {
    return NextResponse.json(createClarifyingQuestions(cleanDecision));
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(createFallbackAnalysis(cleanDecision, cleanContext));
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { responseMimeType: "application/json", temperature: 0.55 },
    });

    const prompt = `You are Foresee AI, a premium decision intelligence operating system. This is not a chatbot response.

Decision: "${cleanDecision}"
Additional context:
${cleanContext.length ? cleanContext.map((item, index) => `${index + 1}. ${item}`).join("\n") : "None provided."}

If the context is insufficient for a responsible analysis, return:
{
  "status": "needs_context",
  "decision": string,
  "category": "career" | "finance" | "technology" | "cybersecurity" | "relationships" | "health" | "general",
  "categoryLabel": string,
  "reason": string,
  "questions": string[]
}

Otherwise return strict JSON matching this TypeScript shape:
{
  "status": "analysis",
  "decision": string,
  "category": "career" | "finance" | "technology" | "cybersecurity" | "relationships" | "health" | "general",
  "categoryLabel": string,
  "executiveSummary": string,
  "assumptions": string[],
  "uncertainty": string,
  "decisionQualityScore": number,
  "decisionQualityLabel": "Excellent" | "Good" | "Needs More Information" | "High Risk",
  "qualityDimensions": [{"name": "Information Completeness" | "Emotional Stability" | "Risk Exposure" | "Alternative Evaluation" | "Timing" | "Financial Impact" | "Long-Term Impact", "score": number, "reasoning": string}],
  "riskScore": number,
  "regretProbability": number,
  "aiConfidenceScore": number,
  "biasSignals": [{"name": "FOMO" | "Confirmation Bias" | "Anchoring" | "Loss Aversion" | "Overconfidence" | "Emotional Decision", "detected": boolean, "intensity": number, "evidence": string}],
  "hiddenRisks": [{"title": string, "why": string, "evidence": string, "reasoning": string, "confidence": number}],
  "blindSpots": [{"title": string, "why": string, "evidence": string, "reasoning": string, "confidence": number}],
  "betterAlternatives": [{"title": string, "why": string, "evidence": string, "reasoning": string, "confidence": number}],
  "timeline": [{"label": "Immediate" | "1 Week" | "1 Month" | "6 Months" | "1 Year", "outlook": string, "risk": number, "upside": number, "evidence": string}],
  "actionPlan": [{"title": string, "why": string, "evidence": string, "reasoning": string, "confidence": number}],
  "categoryVisualization": {"title": string, "subtitle": string, "primaryLabel": string, "secondaryLabel": string, "data": [{"name": string, "primary": number, "secondary": number}]},
  "comparison": {"options": [{"name": string, "pros": string[], "cons": string[], "risk": number, "cost": number, "timelineFit": number, "recommendation": string}], "winner": string, "finalRecommendation": string} | undefined
}

Rules:
- Avoid generic advice and repetitive wording.
- Explain reasoning for every recommendation.
- Cite assumptions and mention uncertainty when appropriate.
- Adapt language and visualization to the decision category.
- Prefer concise, actionable recommendations over long paragraphs.
- Never fabricate facts about the user's situation.
- Every recommendation must include why, evidence, reasoning, and confidence.
- If comparison options are present, include a visually useful comparison result and a winner.
- Scores must be 0-100.`;

    const response = await model.generateContent(prompt);
    const json = JSON.parse(response.response.text()) as AnalysisResult;
    if (json.status === "needs_context") {
      return NextResponse.json(json);
    }
    return NextResponse.json(normalize(json, cleanDecision, cleanContext));
  } catch (error) {
    console.error(error);
    return NextResponse.json(createFallbackAnalysis(cleanDecision, cleanContext));
  }
}
