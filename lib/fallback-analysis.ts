import type { AnalysisSuccess, DecisionCategory, EvidenceBackedItem, QualityDimension } from "@/lib/types";

const categoryLabels: Record<DecisionCategory, string> = {
  career: "Career Decision",
  finance: "Financial Decision",
  technology: "Technology Decision",
  cybersecurity: "Cybersecurity Decision",
  relationships: "Relationship Decision",
  health: "Health Decision",
  general: "Strategic Decision",
};

const categoryKeywords: Record<DecisionCategory, string[]> = {
  career: ["job", "career", "offer", "quit", "salary", "role", "company", "promotion"],
  finance: ["invest", "stock", "fund", "buy", "loan", "debt", "money", "market", "cash"],
  technology: ["phone", "iphone", "samsung", "laptop", "software", "ai", "tool", "platform", "device"],
  cybersecurity: ["security", "breach", "attack", "password", "threat", "vulnerability", "cyber"],
  relationships: ["relationship", "partner", "friend", "marry", "break up", "conversation", "family"],
  health: ["health", "doctor", "diet", "workout", "sleep", "therapy", "medicine", "stress"],
  general: [],
};

const contextualRisks: Record<DecisionCategory, Array<{ title: string; why: string; reasoning: string }>> = {
  career: [
    {
      title: "Health insurance gap during transition",
      why: "A family health event between jobs can cost tens of thousands without coverage. COBRA bridges the gap but is expensive.",
      reasoning: "Calculate COBRA monthly costs and verify your family's health status before accepting. Check if new employer offers day-one coverage.",
    },
    {
      title: "Golden handcuffs (equity/bonus cliff)",
      why: "Your current company may have unvested equity or an upcoming bonus you'd forfeit. The new offer looks better on paper but costs real cash.",
      reasoning: "Ask current company for accelerated vesting. Negotiate signing bonus at new company to offset what you're leaving.",
    },
    {
      title: "Burnout recovery time underestimated",
      why: "Moving to a new job doesn't reset mental fatigue. You'll carry stress into the new role and misdiagnose culture problems.",
      reasoning: "Take a week off between jobs. Honestly assess: are you running FROM or running TO?",
    },
    {
      title: "Manager quality variance",
      why: "Your future manager shapes everything (learning, politics, speed). You may only meet them once before committing.",
      reasoning: "Request to meet your future manager before final decision. Ask specifically about their management philosophy and your expected role.",
    },
  ],
  finance: [
    {
      title: "Recession sensitivity not stress-tested",
      why: "This thesis works when markets are healthy. But if rates spike 2%, bonds fall, and correlations invert, your allocation breaks.",
      reasoning: "Run the numbers for 2008 and 2020 scenarios. How much can you tolerate losing in a 30% drawdown?",
    },
    {
      title: "Fee drag compounds silently",
      why: "A 1% annual fee seems small. Over 30 years, it costs you $100k+ per $1M invested.",
      reasoning: "Calculate total expense ratio including advisory fees, fund fees, and platform fees. Compare to low-cost alternatives.",
    },
    {
      title: "Concentration risk in this market thesis",
      why: "You're betting on one narrative (AI, clean energy, value, growth). If that narrative fails, you lose significantly.",
      reasoning: "What would make you wrong about this thesis? How much of your portfolio is at risk if you're wrong?",
    },
    {
      title: "Tax implications underestimated",
      why: "A taxable account generates capital gains taxes. A tax-advantaged account has withdrawal penalties. You may be in the wrong account type.",
      reasoning: "Check your marginal tax rate. Consult a tax advisor before moving large positions.",
    },
  ],
  relationships: [
    {
      title: "Unspoken expectations are time bombs",
      why: "You have assumptions about what the other person wants/needs. Those assumptions are probably wrong.",
      reasoning: "Before the conversation, write down: What do I want the outcome to be? What might they want? What am I afraid of?",
    },
    {
      title: "Resentment accumulates silently",
      why: "Avoiding this conversation doesn't solve it—it lets frustration compound. Every day makes it harder to address.",
      reasoning: "The longer you wait, the more emotional baggage loads onto the conversation. Timing matters more than perfection.",
    },
    {
      title: "Power dynamics shift with this choice",
      why: "Whatever you decide changes the relationship's balance. Whoever has more invested (time, emotion, money) has less power.",
      reasoning: "Be aware of asymmetric investment. Ensure both parties are choosing freely, not out of desperation.",
    },
    {
      title: "Boundary clarity gets lost in emotion",
      why: "You care about this person, so you soften your boundary. Later, resentment builds because it wasn't actually negotiated.",
      reasoning: "Practice stating your boundary without justifying it. 'I need X' is complete. You don't need to convince them.",
    },
  ],
  health: [
    {
      title: "Professional supervision is non-negotiable",
      why: "Without qualified medical oversight, you're experimenting on yourself. Side effects appear weeks later.",
      reasoning: "If not already under professional care, find one before deciding. This decision should be supervised.",
    },
    {
      title: "Lifestyle factors may determine outcome",
      why: "The treatment works great for compliant people with stable stress/sleep. Your chaos will undermine it.",
      reasoning: "Be honest about your consistency track record. Design the approach for real-you, not ideal-you.",
    },
    {
      title: "Placebo effect is real but temporary",
      why: "You'll feel great the first month from novelty. Regression to mean happens around month 3-4.",
      reasoning: "Set a realistic review date (3 months minimum) with objective metrics, not just how you feel.",
    },
    {
      title: "Sunk cost bias clouds reversal decisions",
      why: "You've invested effort into this approach. If it's not working, you'll rationalize continuing instead of switching.",
      reasoning: "Decide in advance: what metrics would cause you to stop? When will you evaluate? Who will tell you honestly?",
    },
  ],
  technology: [
    {
      title: "Switching costs are usually hidden",
      why: "New device → new ecosystem → learning curve → lost integrations. You won't realize until you've committed.",
      reasoning: "List every app/service you use today. Check compatibility before deciding.",
    },
    {
      title: "Depreciation hits faster than expected",
      why: "New tech drops 15-20% in value in 6 months. Your planned 3-year ownership may truncate.",
      reasoning: "Check resale value expectations. Is the device financially worth keeping 3+ years?",
    },
    {
      title: "Ecosystem lock-in changes your future options",
      why: "Switching to Apple means buying more Apple gear over time. Breaking free gets expensive.",
      reasoning: "Honestly assess: how likely are you to switch platforms in 5 years? Cost that in now.",
    },
  ],
  cybersecurity: [
    {
      title: "Control effectiveness not empirically tested",
      why: "You know what controls should do, but security breaches happen to companies with 'good' controls. Assumption gap is real.",
      reasoning: "Verify control effectiveness through logs/reports. Don't assume it's working.",
    },
    {
      title: "Attacker sophistication may be underestimated",
      why: "You're planning for the average threat. Targeted attackers are orders of magnitude more skilled.",
      reasoning: "Ask: who would specifically target us? Would they succeed with our current controls?",
    },
    {
      title: "Compliance doesn't equal security",
      why: "You can pass an audit and still be breached. The audit checks boxes, not actual safety.",
      reasoning: "Security assessment should include offensive testing, not just compliance review.",
    },
  ],
  general: [
    {
      title: "Core assumptions aren't validated",
      why: "Every decision rests on 2-3 fundamental beliefs. Those beliefs are probably untested.",
      reasoning: "Write down your 3 biggest assumptions. How would you disprove each one?",
    },
    {
      title: "Reversibility window is narrowing",
      why: "Every day you wait makes this harder to undo. Opportunity cost is real.",
      reasoning: "When does this window close? When can you no longer reverse this decision?",
    },
    {
      title: "Downside scenario is underestimated",
      why: "You're imagining the mild-bad scenario. The real bad-bad scenario is worse than you think.",
      reasoning: "What if everything goes wrong? What's the actual worst case? Can you survive it?",
    },
  ],
};

const contextualBlindSpots: Record<DecisionCategory, string[]> = {
  career: [
    "Have you actually talked to someone who left this company? What do they regret?",
    "Does the new role description match reality, or have you only heard from hiring managers?",
    "What would happen if you're laid off within 6 months? Do you have a plan?",
  ],
  finance: [
    "What assumptions about future market conditions are baked into this thesis? Which is most fragile?",
    "How would this investment perform if your biggest fear happened? Can you tolerate it?",
    "Are you comparing this to the best alternative, or just your current option?",
  ],
  relationships: [
    "What are you assuming about the other person's intentions or feelings that you haven't verified?",
    "What outcome would feel like failure? Have you acknowledged that possibility?",
    "Is there a deeper issue this conversation is actually about?",
  ],
  health: [
    "Are you making this decision based on a single data point or emotional moment?",
    "Who else should be involved in this decision? Why haven't you consulted them?",
    "What would need to be true for you to reverse this decision later?",
  ],
  technology: [
    "Are you upgrading because you need to, or because you want to? Be honest.",
    "What will break when you switch? Have you tested it?",
    "In 2 years, will you regret this choice? Why or why not?",
  ],
  cybersecurity: [
    "What's the actual business impact if this threat materializes? Have you quantified it?",
    "Are you defending against yesterday's attacks or next year's attacks?",
    "Is the cost of the control proportional to the risk you're mitigating?",
  ],
  general: [
    "What would need to be true for this to be obviously wrong? How would you know?",
    "Who disagrees with you? What's their strongest argument?",
    "What are you afraid of that you haven't said out loud?",
  ],
};

const contextualAlternatives: Record<DecisionCategory, string[]> = {
  career: [
    "Negotiate a trial period: 6-month contract role before full-time commitment.",
    "Ask current employer for a raise/role adjustment. Use the new offer as leverage.",
    "Take the sabbatical first. Then job search from a stronger position.",
  ],
  finance: [
    "Dollar-cost average into this over 6 months instead of lump sum.",
    "Invest half the amount while keeping the other half liquid for opportunities.",
    "Run a small position first. Scale up after you have real-world data.",
  ],
  relationships: [
    "Try a trial separation (30 days apart) before making permanent decisions.",
    "Couples therapy as an experiment, not an admission of failure.",
    "Have the conversation with a mediator or therapist present.",
  ],
  health: [
    "Start with the least invasive option. Escalate only if it fails.",
    "Combine with lifestyle changes first. Measure the impact before adding medication/procedures.",
    "Pilot test with a shorter timeline (30 days) before committing long-term.",
  ],
  technology: [
    "Rent or borrow the device for a week. Then decide.",
    "Wait 30 days and see if you still want it (combats FOMO).",
    "Buy the previous generation at a discount instead of the latest model.",
  ],
  cybersecurity: [
    "Implement controls incrementally. Test each one's actual effectiveness.",
    "Run a red team exercise before investing in defensive controls.",
    "Start with free/low-cost controls. Layer in expensive solutions only if needed.",
  ],
  general: [
    "Do nothing for 30 days. See if the urgency is real or manufactured.",
    "Test the decision on a small scale first. Use results to inform the full commitment.",
    "Delay the decision until you have one more piece of critical information.",
  ],
};

const qualityDimensionReasons: Record<DecisionCategory, Record<string, string>> = {
  career: {
    "Information Completeness": "Do you actually know the day-to-day work, team dynamics, and manager's leadership style?",
    "Emotional Stability": "Are you running away from burnout or running toward genuine opportunity?",
    "Risk Exposure": "How many months of expenses can you cover if this fails? Do you have a safety net?",
    "Alternative Evaluation": "Have you explored non-resignation paths (negotiation, internal transfer, sabbatical)?",
    "Timing": "Are you jumping before a bonus, benefits cliff, or vesting milestone?",
    "Financial Impact": "Does the salary account for benefits loss, relocation, taxes, and opportunity cost?",
    "Long-Term Impact": "Does this move you closer to or further from your 5-year career identity?",
  },
  finance: {
    "Information Completeness": "Do you understand the fees, tax implications, and historical performance?",
    "Emotional Stability": "Are you chasing gains or protecting against loss? Which is actually wise here?",
    "Risk Exposure": "How does this asset perform in your worst-case scenario? Can you tolerate it?",
    "Alternative Evaluation": "Is this truly the best risk-adjusted option, or just the most exciting?",
    "Timing": "Is now the right time, or are you buying high on emotion?",
    "Financial Impact": "What's the long-term fee drag? What's the tax cost of this decision?",
    "Long-Term Impact": "Does this fit your actual retirement/financial plan, or just a hunch?",
  },
  relationships: {
    "Information Completeness": "Do you actually understand the other person's perspective, needs, and fears?",
    "Emotional Stability": "Are you making this decision from clarity or from emotional overwhelm?",
    "Risk Exposure": "What's the realistic downside? Can the relationship survive this?",
    "Alternative Evaluation": "Have you explored middle-ground options before choosing all-or-nothing?",
    "Timing": "Is this the right time to bring this up, or are you forcing it?",
    "Financial Impact": "Does this decision have financial consequences you've calculated?",
    "Long-Term Impact": "Will you regret this decision in 5 years? Why or why not?",
  },
  health: {
    "Information Completeness": "Do you have professional guidance? Have you researched actual outcomes?",
    "Emotional Stability": "Are you making this decision from panic or from considered thought?",
    "Risk Exposure": "What are the realistic side effects? How likely and severe?",
    "Alternative Evaluation": "Have you explored less invasive options first?",
    "Timing": "Is this medically urgent, or are you manufacturing urgency?",
    "Financial Impact": "What's the actual cost? Can you afford it without financial stress?",
    "Long-Term Impact": "Is this a 6-month intervention or a lifetime commitment?",
  },
  technology: {
    "Information Completeness": "Have you tested the device? Read from actual users, not reviews?",
    "Emotional Stability": "Are you buying from genuine need or from FOMO?",
    "Risk Exposure": "What's your exit cost if you hate it? How liquid is this purchase?",
    "Alternative Evaluation": "Have you compared current device to alternatives meaningfully?",
    "Timing": "Is there a new generation launching soon? Are you buying at peak price?",
    "Financial Impact": "How does this fit your discretionary budget? What else are you sacrificing?",
    "Long-Term Impact": "Will you actually use this in 2 years, or will it gather dust?",
  },
  cybersecurity: {
    "Information Completeness": "Do you know the actual threat landscape? Are you defending yesterday or tomorrow?",
    "Emotional Stability": "Are you reacting to panic or to risk analysis?",
    "Risk Exposure": "What's the business impact if this threat materializes?",
    "Alternative Evaluation": "Is this control the most effective option, or just the most obvious?",
    "Timing": "Is this urgent, or can you phase it in?",
    "Financial Impact": "Is the control cost proportional to the risk you're mitigating?",
    "Long-Term Impact": "Will this control be sufficient in 3 years, or will you need to upgrade?",
  },
  general: {
    "Information Completeness": "Do you have the information you need, or are you deciding on guesses?",
    "Emotional Stability": "Are you calm and clear-headed, or are you in a triggered state?",
    "Risk Exposure": "Can you actually tolerate the downside? Seriously?",
    "Alternative Evaluation": "Have you explored other paths, or are you locked in?",
    "Timing": "Is the urgency real, or are you manufacturing pressure?",
    "Financial Impact": "Can you afford this financially without stress?",
    "Long-Term Impact": "Will this decision compound in your favor or against you?",
  },
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

function buildQualityDimensions(category: DecisionCategory, riskScore: number, signal: number): QualityDimension[] {
  const names: QualityDimension["name"][] = [
    "Information Completeness",
    "Emotional Stability",
    "Risk Exposure",
    "Alternative Evaluation",
    "Timing",
    "Financial Impact",
    "Long-Term Impact",
  ];
  
  const reasons = qualityDimensionReasons[category];
  
  return names.map((name, index) => {
    const raw = name === "Risk Exposure" ? 100 - riskScore : 54 + ((signal + index * 11) % 38);
    return {
      name,
      score: Math.min(96, Math.max(28, raw)),
      reasoning: reasons[name] || "Evaluate based on available information and decision context.",
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
  const parts = decision
    .split(separators)
    .map((part) => part.replace(/^should i\s+/i, "").trim())
    .filter(Boolean);
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
  const qualityDimensions = buildQualityDimensions(category, riskScore, signal);
  const decisionQualityScore = Math.round(
    qualityDimensions.reduce((sum, item) => sum + item.score, 0) / qualityDimensions.length,
  );

  const categoryRisks = contextualRisks[category] || contextualRisks.general;
  const hiddenRisks: EvidenceBackedItem[] = categoryRisks.slice(0, 3).map((risk, idx) => ({
    title: risk.title,
    why: risk.why,
    evidence: `Specific to ${categoryLabels[category].toLowerCase()} decisions based on common patterns.`,
    reasoning: risk.reasoning,
    confidence: 68 + (idx * 5),
  }));

  const categorySpots = contextualBlindSpots[category] || contextualBlindSpots.general;
  const blindSpots: EvidenceBackedItem[] = categorySpots.map((question, idx) => ({
    title: question,
    why: "This question exposes an assumption you haven't tested.",
    evidence: `Patterns in ${categoryLabels[category].toLowerCase()} decisions suggest this blind spot is common.`,
    reasoning: "Spend 5 minutes answering this honestly.",
    confidence: 65 + (idx * 4),
  }));

  const categoryAlts = contextualAlternatives[category] || contextualAlternatives.general;
  const betterAlternatives: EvidenceBackedItem[] = categoryAlts.map((alt, idx) => ({
    title: alt,
    why: `This approach removes urgency and creates a validation step before full commitment.`,
    evidence: "Practical for this decision category.",
    reasoning: "Test the assumption with minimal downside first.",
    confidence: 72 + (idx * 3),
  }));

  const biasConfig: Record<DecisionCategory, string[]> = {
    career: ["FOMO", "Loss Aversion", "Overconfidence"],
    finance: ["Overconfidence", "Anchoring", "Loss Aversion"],
    technology: ["FOMO", "Overconfidence"],
    cybersecurity: ["Anchoring", "Loss Aversion", "Overconfidence"],
    relationships: ["Emotional Decision", "FOMO", "Loss Aversion"],
    health: ["Anchoring", "Emotional Decision", "Loss Aversion"],
    general: ["FOMO", "Confirmation Bias", "Anchoring"],
  };

  const relevantBiases = biasConfig[category];
  const biasSignals = relevantBiases.map((name, index) => {
    const intensity = Math.min(92, Math.max(18, ((signal + index * 17) % 85) + 12));
    const biasEvidence: Record<string, string> = {
      FOMO: "The decision emphasizes missing out or seizing time-limited opportunities. Examine: Are you moving toward something or away from panic?",
      "Confirmation Bias": "Limited context provided suggests selective information gathering. What contradicts your view?",
      Anchoring: "Previous prices, offers, or experiences may anchor your thinking. Test against a fresh baseline.",
      "Loss Aversion": "Heavy focus on protecting against downside. Question: Is upside being discounted?",
      Overconfidence: "High conviction despite limited reversibility. How would you respond if you're wrong?",
      "Emotional Decision": "Emotional language detected. Create space between emotion and action.",
    };
    
    return {
      name,
      detected: intensity > 48,
      intensity,
      evidence: biasEvidence[name],
    };
  });

  const comparisonNames = parseComparisonOptions(normalized);

  return {
    status: "analysis",
    decision: normalized,
    category,
    categoryLabel: categoryLabels[category],
    executiveSummary: `This ${categoryLabels[category].toLowerCase()} requires testing one critical assumption before full commitment. The highest-leverage move is to validate reversibility and separate what's urgent from what just feels urgent.`,
    assumptions: [
      "You have enough information to decide responsibly.",
      "The context you're aware of is complete.",
      "Your preferred path remains available if you delay.",
    ],
    uncertainty: "This analysis improves with concrete data about your constraints, timeline, and financial runway.",
    contextQuality: {
  score: 82,
  label: "Usable",
  missingSignals: [
    "Detailed budget or financial constraints",
    "Decision deadline",
    "Long-term personal priorities",
  ],
},

informationGaps: [
  "Budget or financial constraints",
  "Decision timeline",
  "Personal priorities",
],

decisionLevers: [
  {
    name: "Risk Tolerance",
    impact: 88,
    effort: 35,
    description:
      "Your willingness to accept uncertainty has the greatest influence on this decision.",
  },
  {
    name: "Available Resources",
    impact: 76,
    effort: 42,
    description:
      "Money, time and support systems determine how safely this decision can be executed.",
  },
  {
    name: "Preparation",
    impact: 81,
    effort: 58,
    description:
      "Collecting more evidence before acting will improve the expected outcome.",
  },
],

scenarioBranches: [
  {
    name: "Best Case",
    probability: 25,
    outcome:
      "The decision performs better than expected and creates long-term positive outcomes.",
    trigger:
      "Preparation is thorough and execution goes according to plan.",
    earlySignal:
      "Positive results begin appearing within the first few weeks.",
  },
  {
    name: "Base Case",
    probability: 60,
    outcome:
      "The decision succeeds with moderate challenges that require adjustments.",
    trigger:
      "Normal execution with expected uncertainty.",
    earlySignal:
      "Steady progress with manageable setbacks.",
  },
  {
    name: "Worst Case",
    probability: 15,
    outcome:
      "Unexpected obstacles reduce the benefits and require a change of strategy.",
    trigger:
      "Critical assumptions prove incorrect.",
    earlySignal:
      "Repeated delays or negative outcomes appear early.",
  },
],
    decisionQualityScore,
    decisionQualityLabel: qualityLabel(decisionQualityScore),
    qualityDimensions,
    riskScore,
    regretProbability,
    aiConfidenceScore,
    biasSignals,
    hiddenRisks,
    blindSpots,
    betterAlternatives,
    timeline: [
      {
        label: "Immediate",
        outlook: "Action creates momentum, but also locks in assumptions. Use this window to test reversibility.",
        risk: riskScore - 8,
        upside: 58,
        evidence: "Immediate upside comes from decisiveness. Risk remains tied to incomplete information.",
      },
      {
        label: "1 Week",
        outlook: "Early signals reveal whether core assumptions hold. Reality testing begins.",
        risk: riskScore - 3,
        upside: 64,
        evidence: "One week is sufficient to gather critical feedback, test feasibility, and clarify your own thinking.",
      },
      {
        label: "1 Month",
        outlook: "Practical tradeoffs become visible. The real cost emerges from actual execution.",
        risk: riskScore + 2,
        upside: 67,
        evidence: "First-month friction reveals what you couldn't predict. This data is valuable.",
      },
      {
        label: "6 Months",
        outlook: "Compounding effects dominate. You'll know if this decision compounds or drains.",
        risk: riskScore + 6,
        upside: 72,
        evidence: "Six months is enough to see whether you've moved closer to or further from your goal.",
      },
      {
        label: "1 Year",
        outlook: "This decision becomes part of your identity and strategy. Reversibility decreases sharply.",
        risk: riskScore + 10,
        upside: 78,
        evidence: "One year reveals long-term impacts and opportunity costs that couldn't be predicted.",
      },
    ],
    actionPlan: [
      {
        title: "Write your decision criteria",
        why: "Deciding what matters prevents you from optimizing for the wrong outcome.",
        evidence: "Criterion drift is the #1 cause of post-decision regret.",
        reasoning: "List 3-5 non-negotiable criteria and 3-5 nice-to-haves. Rank them.",
        confidence: 92,
      },
      {
        title: "Test the riskiest assumption",
        why: "One assumption dominates all others. Test it with minimal downside.",
        evidence: "Most bad decisions fail because one hidden assumption breaks, not because the entire thesis is wrong.",
        reasoning: "Identify the assumption that would kill the decision if wrong. Design a small experiment to validate it.",
        confidence: 88,
      },
      {
        title: "Get opposition feedback",
        why: "You're biased toward your decision. Someone who disagrees will see what you're missing.",
        evidence: "The strongest predictor of decision quality is whether you've heard legitimate criticism.",
        reasoning: "Find someone you trust who disagrees. Ask them specifically: What am I missing?",
        confidence: 85,
      },
      {
        title: "Set a review date with exit rules",
        why: "Without predetermined checkpoints, you'll rationalize continuing past the point where you should stop.",
        evidence: "Sunk cost bias traps people in decisions that should have been reversed.",
        reasoning: "Decide now: What metrics would cause you to pause, modify, or reverse this decision? When will you evaluate?",
        confidence: 90,
      },
    ],
    categoryVisualization: buildVisualization(category, signal),
    comparison: comparisonNames.length
      ? {
          options: comparisonNames.map((name, index) => ({
            name,
            pros: [
              `${name} aligns with your primary constraint if that's what matters most here.`,
              `Can be tested or piloted with lower risk than full commitment.`,
            ],
            cons: [
              `May obscure opportunity cost compared to other options you're not considering.`,
              `Requires clear success criteria before committing to avoid drifting into rationalization.`,
            ],
            risk: Math.min(90, Math.max(24, riskScore + index * 8 - 4)),
            cost: Math.min(95, Math.max(18, 36 + ((signal + index * 23) % 48))),
            timelineFit: Math.min(94, Math.max(30, 52 + ((signal + index * 17) % 36))),
            recommendation: `Choose ${name} only if it wins decisively on your top constraint. Validate before committing.`,
          })),
          winner: comparisonNames[0],
          finalRecommendation: `${comparisonNames[0]} appears more reversible from the available context. Confirm alignment on cost, timing, and downside before committing.`,
        }
      : undefined,
    chartData: [
      { name: "Risk", value: riskScore },
      { name: "Regret", value: regretProbability },
      { name: "Confidence", value: aiConfidenceScore },
      {
        name: "Bias",
        value: Math.round(
          biasSignals.reduce((sum, b) => sum + b.intensity, 0) / biasSignals.length,
        ),
      },
      { name: "Quality", value: decisionQualityScore },
    ],
      
  };
}

export function createClarifyingQuestions(decision: string) {
  const normalized = decision.trim();
  const category = detectCategory(normalized);

  const questionMap: Record<DecisionCategory, string[]> = {
    career: [
      "Do you already have another offer, or is this exploratory?",
      "How many months of living expenses can you cover without income?",
      "Does this move get you closer to your 5-year goal, or is it a escape move?",
      "What does the new role actually involve day-to-day? Have you verified?",
    ],
    finance: [
      "What amount of money is at stake, and how does it fit your net worth?",
      "What's your investment timeline? (6 months, 10 years, retirement?)",
      "How much portfolio downside can you tolerate without panic-selling?",
      "Is this money allocated elsewhere, or truly available to invest?",
    ],
    technology: [
      "What specific problem must this device solve for you?",
      "How long do you realistically expect to use it? (1 year? 5 years?)",
      "What's the total cost including accessories, software, and switching?",
      "What current device or solution are you replacing?",
    ],
    cybersecurity: [
      "What assets or data would be compromised if this threat materializes?",
      "Has there been an incident, or is this preventive hardening?",
      "What controls exist today? What gaps are you seeing?",
      "If this threat happens, what's the business impact in dollars?",
    ],
    relationships: [
      "What outcome would make this conversation successful for you?",
      "How urgent is this emotionally vs. how urgent is it practically?",
      "What are you assuming the other person needs or wants? Have you verified?",
      "What would feel like the worst outcome of this conversation?",
    ],
    health: [
      "Are you under professional medical supervision for this decision?",
      "What symptoms, constraints, or goals are driving this?",
      "What's the risk of delaying this decision? (hours, days, weeks, years?)",
      "How consistent are you typically with behavior change? Be honest.",
    ],
    general: [
      "What would make this decision successful? (Define success clearly)",
      "What's the biggest downside you're trying to avoid?",
      "Can you reverse this decision if it goes wrong? How?",
      "What's creating the urgency? Is it real or manufactured?",
    ],
  };

  return {
    status: "needs_context" as const,
    decision: normalized,
    category,
    categoryLabel: categoryLabels[category],
    reason: "Foresee AI needs sharper context to run a high-confidence simulation.",
    questions: questionMap[category],
  };
}