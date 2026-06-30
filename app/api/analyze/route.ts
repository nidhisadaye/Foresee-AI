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
    contextQuality: {
      ...fallback.contextQuality,
      ...result.contextQuality,
      score: clampScore(result.contextQuality?.score, fallback.contextQuality.score),
    },
    informationGaps: result.informationGaps?.length ? result.informationGaps : fallback.informationGaps,
    decisionLevers: result.decisionLevers?.length
      ? result.decisionLevers.map((lever, index) => ({
          ...fallback.decisionLevers[index % fallback.decisionLevers.length],
          ...lever,
          impact: clampScore(lever.impact, fallback.decisionLevers[index % fallback.decisionLevers.length].impact),
          effort: clampScore(lever.effort, fallback.decisionLevers[index % fallback.decisionLevers.length].effort),
        }))
      : fallback.decisionLevers,
    scenarioBranches: result.scenarioBranches?.length
      ? result.scenarioBranches.map((scenario, index) => ({
          ...fallback.scenarioBranches[index % fallback.scenarioBranches.length],
          ...scenario,
          probability: clampScore(
            scenario.probability,
            fallback.scenarioBranches[index % fallback.scenarioBranches.length].probability,
          ),
        }))
      : fallback.scenarioBranches,
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
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.55 },
    });
    
    const prompt = `You are Foresee AI, an elite decision reasoning engine. Your ONLY job is deep analysis. Do NOT generate advice, action plans, timelines, or UI content.

Decision: "${cleanDecision}"
Context:
${cleanContext.length ? cleanContext.map((item, index) => `${index + 1}. ${item}`).join("\n") : "None provided."}

THINK INTERNALLY (step-by-step reasoning - do not expose):
1. What is the user's actual objective?
2. Which category fits? (career, finance, technology, cybersecurity, relationships, health, general, business)
3. What assumptions underlie this decision?
4. What critical information is missing?
5. What are the 2-3 biggest risks?
6. What cognitive biases may be present?
7. Which variables drive the outcome most?
8. What are realistic future scenarios?
9. If comparison: what's the objective winner?

RETURN THIS JSON STRUCTURE ONLY:

{
  "status": "analysis",
  "decision": "${cleanDecision}",
  "category": "DETECTED_CATEGORY_HERE",
  "categoryLabel": "Human readable category",
  "executiveSummary": "2-4 sentence summary of the core insight about this decision",
  "assumptions": [
    "Critical assumption #1",
    "Critical assumption #2",
    "Critical assumption #3"
  ],
  "uncertainty": "1-2 sentences: What makes this decision inherently uncertain?",
  "contextQuality": {
    "score": 0-100,
    "label": "Strong | Usable | Thin | Insufficient",
    "missingSignals": [
      "Key information gap #1",
      "Key information gap #2"
    ]
  },
  "informationGaps": [
    "Specific missing data point #1",
    "Specific missing data point #2",
    "Specific missing data point #3"
  ],
  "decisionLevers": [
    {
      "name": "Most impactful variable",
      "impact": 90,
      "effort": 40,
      "description": "Why this matters most"
    },
    {
      "name": "Second most impactful variable",
      "impact": 75,
      "effort": 60,
      "description": "Why this matters"
    },
    {
      "name": "Third variable",
      "impact": 55,
      "effort": 30,
      "description": "Why this matters"
    }
  ],
  "scenarioBranches": [
    {
      "name": "Best Case",
      "probability": 25,
      "outcome": "What actually happens if everything goes right",
      "trigger": "What needs to be true for this to happen",
      "earlySignal": "What would you observe in week 1 that predicts this"
    },
    {
      "name": "Base Case",
      "probability": 50,
      "outcome": "Most likely outcome",
      "trigger": "What conditions lead to this",
      "earlySignal": "What would you observe that predicts this"
    },
    {
      "name": "Worst Case",
      "probability": 25,
      "outcome": "What could actually go wrong",
      "trigger": "What would need to happen for this",
      "earlySignal": "What would you observe that predicts this"
    }
  ],
  "decisionQualityScore": 0-100,
  "decisionQualityLabel": "Excellent | Good | Needs More Information | High Risk",
  "qualityDimensions": [
    {
      "name": "Information Completeness",
      "score": 0-100,
      "reasoning": "Why this score for this category"
    },
    {
      "name": "Emotional Stability",
      "score": 0-100,
      "reasoning": "Why this score for this category"
    },
    {
      "name": "Risk Exposure",
      "score": 0-100,
      "reasoning": "Why this score for this category"
    },
    {
      "name": "Alternative Evaluation",
      "score": 0-100,
      "reasoning": "Why this score for this category"
    },
    {
      "name": "Timing",
      "score": 0-100,
      "reasoning": "Why this score for this category"
    },
    {
      "name": "Financial Impact",
      "score": 0-100,
      "reasoning": "Why this score for this category"
    },
    {
      "name": "Long-Term Impact",
      "score": 0-100,
      "reasoning": "Why this score for this category"
    }
  ],
  "riskScore": 0-100,
  "riskDrivers": [
    {
      "title": "Biggest risk in this decision",
      "severity": 0-100,
      "reason": "Why this is a serious risk"
    },
    {
      "title": "Second biggest risk",
      "severity": 0-100,
      "reason": "Why this is a serious risk"
    },
    {
      "title": "Third risk",
      "severity": 0-100,
      "reason": "Why this is a serious risk"
    }
  ],
  "regretProbability": 0-100,
  "aiConfidenceScore": 0-100,
  "biasSignals": [
    {
      "name": "BIAS_NAME_IF_DETECTED",
      "detected": true,
      "intensity": 0-100,
      "evidence": "Specific evidence from their decision phrasing"
    },
    {
      "name": "SECOND_BIAS_IF_DETECTED",
      "detected": true,
      "intensity": 0-100,
      "evidence": "Specific evidence"
    }
  ],
  "comparison": {
    "options": [
      {
        "name": "Option 1 name",
        "pros": ["Advantage 1", "Advantage 2", "Advantage 3"],
        "cons": ["Disadvantage 1", "Disadvantage 2"],
        "risk": 0-100,
        "cost": 0-100,
        "timelineFit": 0-100,
        "recommendation": "When this is the right choice"
      },
      {
        "name": "Option 2 name",
        "pros": ["Advantage 1", "Advantage 2"],
        "cons": ["Disadvantage 1", "Disadvantage 2", "Disadvantage 3"],
        "risk": 0-100,
        "cost": 0-100,
        "timelineFit": 0-100,
        "recommendation": "When this is the right choice"
      }
    ],
    "winner": "Which option objectively wins and why",
    "finalRecommendation": "If I had to pick one path, this is it"
  }
}

RULES:
- Return ONLY valid JSON
- No markdown, no code blocks, no text outside JSON
- Confidence: 90-100 = fact, 75-89 = strong evidence, 60-74 = reasonable, 40-59 = educated guess, 0-39 = speculation
- Bias detection: only return biases you actually detect. Sometimes zero biases.
- Quality dimensions: reasoning must be unique for each dimension
- Scenario branches: probabilities must sum to 100
- Decision levers: impact + effort trade-off analysis
- DO NOT generate: hiddenRisks, blindSpots, betterAlternatives, actionPlan, timeline, chartData, categoryVisualization

If insufficient context for analysis, return:
{
  "status": "needs_context",
  "decision": "${cleanDecision}",
  "category": "DETECTED_CATEGORY",
  "categoryLabel": "Label",
  "reason": "Why more context is needed",
  "questions": ["Question 1", "Question 2", "Question 3", "Question 4"]
}`;

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
