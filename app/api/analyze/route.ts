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
      model: "gemini-1.5-pro",
      generationConfig: { responseMimeType: "application/json", temperature: 0.55 },
    });

    const prompt = `You are Foresee AI, a premium decision intelligence system. Reason like a McKinsey consultant + clinical psychologist + executive coach + risk analyst.

Decision: "${cleanDecision}"
Additional context:
${cleanContext.length ? cleanContext.map((item, index) => `${index + 1}. ${item}`).join("\n") : "None provided."}

RESPOND WITH THIS JSON SHAPE:
{
  "status": "needs_context" | "analysis",
  "decision": string,
  "category": "career" | "finance" | "technology" | "cybersecurity" | "relationships" | "health" | "general",
  "categoryLabel": string,
  "executiveSummary": string,
  "assumptions": string[],
  "uncertainty": string,
  "decisionQualityScore": number (0-100),
  "decisionQualityLabel": "Excellent" | "Good" | "Needs More Information" | "High Risk",
  "qualityDimensions": [{"name": string, "score": number, "reasoning": string}],
  "riskScore": number (0-100),
  "regretProbability": number (0-100),
  "aiConfidenceScore": number (0-100),
  "biasSignals": [{"name": string, "detected": boolean, "intensity": number, "evidence": string}],
  "hiddenRisks": [{"title": string, "why": string, "evidence": string, "reasoning": string, "confidence": number}],
  "blindSpots": [{"title": string, "why": string, "evidence": string, "reasoning": string, "confidence": number}],
  "betterAlternatives": [{"title": string, "why": string, "evidence": string, "reasoning": string, "confidence": number}],
  "timeline": [{"label": "Immediate"|"1 Week"|"1 Month"|"6 Months"|"1 Year", "outlook": string, "risk": number, "upside": number, "evidence": string}],
  "actionPlan": [{"title": string, "why": string, "evidence": string, "reasoning": string, "confidence": number}],
  "categoryVisualization": {"title": string, "subtitle": string, "primaryLabel": string, "secondaryLabel": string, "data": [{"name": string, "primary": number, "secondary": number}]},
  "comparison": {"options": [{"name": string, "pros": string[], "cons": string[], "risk": number, "cost": number, "timelineFit": number, "recommendation": string}], "winner": string, "finalRecommendation": string} | null
}

===================================================
BLIND SPOTS GENERATION RULES
===================================================

Generate EXACTLY 3 blind spots.
Each blind spot is a question the user hasn't asked themselves.
Each must address a DIFFERENT category of missing perspective:

Blind Spot 1: Missing Information
→ What data/verification is the user not gathering?
→ What would they discover if they looked?
→ What conversation haven't they had?

Blind Spot 2: Emotional or Psychological Assumption
→ What assumption about feelings/motivations haven't they tested?
→ What are they assuming about the other person?
→ What emotional state is driving this?

Blind Spot 3: Long-term Consequence or Second-order Effect
→ What ripple effect in 6-12 months haven't they considered?
→ What does this change about their future options?
→ What becomes irreversible after this decision?

CATEGORY-SPECIFIC BLIND SPOTS:

CAREER:
1. Information gap: "Have you actually spoken with someone who recently left this company? What do they regret?"
2. Psychological assumption: "Are you fleeing burnout or being pulled by genuine opportunity? How can you tell?"
3. Long-term effect: "If this role doesn't work out after 6 months, how will that setback affect your next opportunity?"

FINANCE:
1. Information gap: "Have you run this investment thesis through a recession scenario? How does it perform in 2008-like conditions?"
2. Psychological assumption: "Are you betting on a trend that's already priced in, or are you seeing something the market missed?"
3. Long-term effect: "If this investment underperforms for 3 years, will you have the discipline to stay invested or will you bail?"

RELATIONSHIPS:
1. Information gap: "What does the other person actually want from this? Have you asked directly without defending your position?"
2. Psychological assumption: "Are you assuming they feel the way you do, or have you verified their emotional reality?"
3. Long-term effect: "What will be different in this relationship 6 months after this conversation? Is that acceptable?"

HEALTH:
1. Information gap: "What would a second medical opinion say? Have you verified this is the right intervention?"
2. Psychological assumption: "Are you making this decision from panic or from a calm assessment? What would change if you waited 30 days?"
3. Long-term effect: "If this intervention doesn't work, what's your next move? Have you committed to a review date?"

TECHNOLOGY:
1. Information gap: "Have you tested this device with your actual workflow, or are you basing this on marketing claims?"
2. Psychological assumption: "Are you upgrading because you need to or because new feels better? Can you articulate the actual problem?"
3. Long-term effect: "In 18 months when this device has depreciated 40%, will it still solve your problem?"

BUSINESS:
1. Information gap: "Have you actually sold to a paying customer, or are you betting they'll want it?"
2. Psychological assumption: "Are you confident in your product because you built it, or because customers validated it?"
3. Long-term effect: "If growth plateaus after 6 months, what's your pivot plan? Or are you committed to the current path?"

CYBERSECURITY:
1. Information gap: "Has this threat actually been attempted against you, or are you defending against a theoretical risk?"
2. Psychological assumption: "Are you responding to recent fear or to actual threat probability? What's driving the urgency?"
3. Long-term effect: "If you implement this control and a different threat emerges, will you be overprotected or underprotected?"

GENERAL:
1. Information gap: "Who would disagree with you? Have you sought out their strongest argument?"
2. Psychological assumption: "What are you afraid of that you haven't said out loud? What would change if you named it?"
3. Long-term effect: "After one year, what would make you regret this decision? Is that risk acceptable?"

FORMAT:
- Each blind spot is a QUESTION, not a statement
- The question must be something the user hasn't asked themselves
- "why" explains why this question matters
- "evidence" connects to patterns in their decision category
- "reasoning" tells them how to explore this blind spot
- Confidence reflects how likely they've overlooked this

CRITICAL: Never generate blind spots like:
❌ "Validate your assumptions"
❌ "Challenge your assumptions"
❌ "Reconsider your approach"
These are vague and repetitive.

Always generate blind spots like:
✅ "Have you calculated how many months your savings can support you?"
✅ "Are you assuming your first customers will arrive within 60 days?"
✅ "If this fails after one year, what is your recovery plan?"

===================================================
BETTER ALTERNATIVES GENERATION RULES
===================================================

Generate EXACTLY 3 alternatives.
Each alternative uses a COMPLETELY DIFFERENT strategy.
Do NOT generate variations of the same approach (e.g., delay 1 week, delay 2 weeks, delay 1 month).

Alternative 1: Lower-Risk Version
→ Same goal, reduced commitment
→ Test before full execution
→ Preserve optionality

Alternative 2: Phased or Experimental Approach
→ Validation before scaling
→ Small-scale proof of concept
→ Reversible commitment with exit

Alternative 3: Completely Different Solution
→ Different path to same outcome
→ Addresses the underlying need differently
→ May require rethinking the goal

CATEGORY-SPECIFIC ALTERNATIVES:

CAREER (Quit Job → Start Company):
1. Lower-risk: Build nights and weekends while keeping salary (test idea with zero financial risk)
2. Experimental: Find 3 paying customers before resigning (validate market before quitting)
3. Different: Negotiate part-time employment at current company (income security while testing)

FINANCE (Invest $100k):
1. Lower-risk: Invest $10k first to test thesis with real money (avoid full commitment)
2. Experimental: Dollar-cost average $10k per month for 10 months (reduce timing risk)
3. Different: Choose diversified index fund instead of single thesis (accept market returns vs. beat it)

RELATIONSHIPS (Break Up):
1. Lower-risk: Trial separation 30 days (test reality before permanent decision)
2. Experimental: Couples therapy 8 weeks with breakup/stay decision date (validation before exit)
3. Different: Have the hard conversation first, then decide (get clarity before action)

HEALTH (Start Treatment):
1. Lower-risk: Begin with lifestyle changes first, no medication yet (test non-invasive option)
2. Experimental: 30-day trial of intervention with measurable metrics (validate before long-term commitment)
3. Different: Get second medical opinion before proceeding (verify it's the right intervention)

TECHNOLOGY (Buy New Device):
1. Lower-risk: Rent or borrow device for one week (test with real usage before buying)
2. Experimental: Buy previous generation at discount (get benefits at lower cost)
3. Different: Upgrade only the component causing the problem (solve specific issue, not everything)

BUSINESS (Launch Product):
1. Lower-risk: Presell to 3-5 customers before building (validate demand before investing time)
2. Experimental: Launch to small segment first, measure traction (prove concept before scaling)
3. Different: Partner with existing company instead of competing alone (leverage their infrastructure)

CYBERSECURITY (Implement Control):
1. Lower-risk: Start with free/low-cost controls first (test effectiveness before premium investment)
2. Experimental: Red team exercise before deploying controls (verify it stops actual attacks)
3. Different: Address insider threat first, then external threat (fix highest-impact risk first)

GENERAL:
1. Lower-risk: Run a 30-day experiment before full commitment (validate with limited exposure)
2. Experimental: Get one key metric validated before scaling (prove the core assumption)
3. Different: Solve the underlying problem instead of the surface symptom (address root cause)

FORMAT:
- Each alternative is a complete, actionable path
- "title" is specific and concrete (not vague like "try it first")
- "why" explains the different strategic logic
- "evidence" connects to success patterns in this category
- "reasoning" tells them how to execute it
- Confidence reflects feasibility in their specific situation

CRITICAL: Never generate alternatives like:
❌ "Delay the decision"
❌ "Gather more information"
❌ "Think about it longer"
These are stalling tactics, not alternatives.

Always generate alternatives like:
✅ "Acquire first three paying customers before full launch"
✅ "Negotiate part-time role while validating market"
✅ "Run 30-day pilot with single customer segment"

===================================================
CAREER DECISIONS - Reason about: runway, leverage, reversibility, growth trajectory
- Hidden risks: health insurance loss, equity cliffs, burnout carryover, manager quality, institutional knowledge
- Blind spots: (Info) day-to-day reality, (Psychology) fleeing vs. being pulled, (Long-term) recovery from failure
- Alternatives: (Lower-risk) build nights/weekends, (Experimental) validate market first, (Different) part-time negotiation
- Biases: Loss Aversion, FOMO, Overconfidence

FINANCE DECISIONS - Reason about: time horizon, portfolio fit, tax efficiency, recession stress-test
- Hidden risks: recession sensitivity, fee drag, concentration risk, tax implications, sequence risk
- Blind spots: (Info) stress-test scenarios, (Psychology) trend vs. insight, (Long-term) discipline during downturns
- Alternatives: (Lower-risk) test with 10%, (Experimental) dollar-cost average, (Different) index fund instead
- Biases: Overconfidence, Anchoring, Confirmation Bias

RELATIONSHIPS DECISIONS - Reason about: readiness, clarity, power dynamics, reversibility, unspoken assumptions
- Hidden risks: unspoken expectations, resentment accumulation, power shifts, boundary softening, unmet needs
- Blind spots: (Info) what they actually want, (Psychology) your emotional assumptions, (Long-term) outcome acceptability
- Alternatives: (Lower-risk) trial separation, (Experimental) therapy with decision date, (Different) conversation first
- Biases: Emotional Decision-making, FOMO, Loss Aversion

HEALTH DECISIONS - Reason about: professional supervision, lifestyle factors, reversibility, urgency, placebo effect
- Hidden risks: supervision gaps, lifestyle determines outcome, placebo regression at month 3-4, sunk cost bias, comorbidities
- Blind spots: (Info) second opinion validity, (Psychology) panic vs. calm, (Long-term) success metrics clarity
- Alternatives: (Lower-risk) lifestyle changes first, (Experimental) 30-day trial, (Different) second opinion
- Biases: Anchoring, Emotional Decision-making, Loss Aversion

TECHNOLOGY DECISIONS - Reason about: need vs. want, switching costs, depreciation, ecosystem lock-in, actual use
- Hidden risks: hidden switching costs, fast depreciation, ecosystem lock-in, learning curve, replaced features
- Blind spots: (Info) actual workflow testing, (Psychology) need vs. want, (Long-term) device longevity
- Alternatives: (Lower-risk) rent first, (Experimental) previous generation, (Different) component upgrade
- Biases: FOMO, Overconfidence, shiny object syndrome

BUSINESS DECISIONS - Reason about: market validation, execution, competition, runway, opportunity cost
- Hidden risks: demand unvalidated, execution underestimated, competition dismissed, unit economics, team capacity
- Blind spots: (Info) real paying customers, (Psychology) builder confidence vs. validation, (Long-term) pivot plan
- Alternatives: (Lower-risk) presell first, (Experimental) small segment launch, (Different) partnership
- Biases: Overconfidence, Sunk Cost, Founder's Mentality

CYBERSECURITY DECISIONS - Reason about: actual threat, business impact, control effectiveness, implementation cost, monitoring
- Hidden risks: effectiveness assumed, attacker sophistication, compliance ≠ security, insider threat, social engineering
- Blind spots: (Info) real threat probability, (Psychology) fear-driven vs. analysis-driven, (Long-term) emerging threats
- Alternatives: (Lower-risk) free controls first, (Experimental) red team before deploying, (Different) insider threat priority
- Biases: Anchoring, Overconfidence, Loss Aversion

OUTPUT RULES (CRITICAL):
- NEVER use: "safer path", "inferred from", "current wording suggests", "may influence", "tends to", "appears to"
- Each hidden risk must have DIFFERENT language/structure from others
- Each blind spot must ask a DISTINCT question (not variations of "validate", "challenge", "reconsider")
- Each alternative must have UNIQUE logic (not variations of "delay", "wait", "think more")
- Bias signals: only show relevant ones. Sometimes show ZERO if none detected.
- Confidence: 90-100 = fact, 75-89 = strong evidence, 60-74 = reasonable inference, 40-59 = educated guess, 0-39 = speculation
- Quality dimensions: different reasoning for EACH dimension, EACH category
- No repeated phrasing across any section
- Write like a premium consultant, not a template engine

TONE: Specific consultant advice, not generic suggestions. Use concrete examples over abstractions.

If insufficient context: return status "needs_context" with category-specific questions.
Otherwise: return status "analysis" with complete JSON.`;

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
