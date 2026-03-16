export interface DimensionScore {
  label: string;
  score: number; // 0–4
  max: 4;
  explanation: string;
}

export interface LumaFeedback {
  challengeId: string;
  challengeTitle: string;
  submittedAt: string; // ISO date string
  overallImpression: string;
  whatWorked: {
    headline: string;
    body: string;
  };
  whatToFix: {
    headline: string;
    body: string;
  };
  dimensions: DimensionScore[];
  theOneThing: string;
  retries: number;
  totalScore: number;   // e.g. 11
  maxScore: number;     // e.g. 16
}

/* ─── Mock feedback for M3 ───────────────────────────────────── */
export const M3_FEEDBACK: LumaFeedback = {
  challengeId: "M3",
  challengeTitle: "Design a route optimization feature for couriers",
  submittedAt: new Date(Date.now() - 2000).toISOString(),
  totalScore: 12,
  maxScore: 16,
  retries: 1,

  overallImpression:
    "This is a solid diagnostic pass. You found the routing inefficiency signal and correctly separated it from the earnings angle. Where it fell short: you committed to v1 scope before validating the core assumption. That's the move that costs teams six weeks.",

  whatWorked: {
    headline: "You questioned the data before the solution",
    body: "Noting that \"22 interviews in one city isn't statistical proof\" was the right instinct — and one most candidates skip. You correctly identified that courier perception of route quality and actual route quality are different problems requiring different fixes. That distinction would have led you to a faster, cheaper validation path.",
  },

  whatToFix: {
    headline: "The v1 spec jumped straight to the routing engine",
    body: "You recommended building the routing engine change in sprint 1, but you hadn't yet confirmed which of your three hypotheses was correct. A senior PM would have run a two-week natural experiment first: show couriers the estimated vs. actual route time before they accept the offer, and measure acceptance rate change. That's a zero-engineering test. If it doesn't move the needle, you've just saved six weeks of eng time.",
  },

  dimensions: [
    {
      label: "Diagnosis",
      score: 3,
      max: 4,
      explanation: "Strong hypothesis ranking. The routing/perception distinction was sharp.",
    },
    {
      label: "Validation",
      score: 2,
      max: 4,
      explanation: "You named data sources but didn't specify the fastest path to confidence.",
    },
    {
      label: "Framing",
      score: 4,
      max: 4,
      explanation: "Clear problem statement. The GMV frame was well-applied throughout.",
    },
    {
      label: "Recommendation",
      score: 3,
      max: 4,
      explanation: "Good scope discipline, but sprint 1 was too big given the unvalidated hypothesis.",
    },
  ],

  theOneThing:
    "You had the right diagnosis. You needed one more move: a validation step that costs zero engineering. If you'd proposed 'show couriers projected vs. actual route time as a no-code test,' you would have unlocked the correct v1 scope automatically — and the recommendation writes itself.",
};

/* ─── Mock feedback for E1 ───────────────────────────────────── */
export const E1_FEEDBACK: LumaFeedback = {
  challengeId: "E1",
  challengeTitle: "Design a payment failure recovery flow",
  submittedAt: new Date(Date.now() - 2000).toISOString(),
  totalScore: 14,
  maxScore: 16,
  retries: 0,

  overallImpression:
    "This is a well-structured answer with genuine commercial instinct. You correctly segmented by decline reason — that's the move that separates PMs who understand payments from those who don't. The metrics framework at the end was clean.",

  whatWorked: {
    headline: "Decline-reason segmentation unlocked the right strategy",
    body: "Treating 'insufficient funds' and 'expired card' as different recovery problems — not one dunning campaign — was exactly right. Calling out payday cycle retries for the NSF segment showed you understand how your users actually live. That insight alone would change the timing logic and recover a meaningful slice of the 34%.",
  },

  whatToFix: {
    headline: "The grace period analysis needed a number",
    body: "You recommended a grace period but didn't quantify the abuse risk trade-off. A strong answer would have proposed a specific duration (e.g., 7 days) with a rationale — industry benchmarks put 5–10 days as the sweet spot before abuse rises — and flagged what signals would indicate the period is too long. Without a number, the recommendation is hard for a stakeholder to greenlight.",
  },

  dimensions: [
    {
      label: "Diagnosis",
      score: 4,
      max: 4,
      explanation: "Decline-reason segmentation was precise and actionable.",
    },
    {
      label: "Validation",
      score: 3,
      max: 4,
      explanation: "Good metrics framework. Missing: how you'd run the A/B on grace period length.",
    },
    {
      label: "Framing",
      score: 4,
      max: 4,
      explanation: "ARR impact anchored every recommendation. Clean commercial framing.",
    },
    {
      label: "Recommendation",
      score: 3,
      max: 4,
      explanation: "Concrete on most moves. Grace period duration was unspecified.",
    },
  ],

  theOneThing:
    "You needed one sentence: 'We'll offer a 7-day grace period based on industry data showing abuse rates stay below 2% at this threshold, and we'll monitor abuse weekly for the first 90 days.' That sentence turns a recommendation into a decision. Everything else was there.",
};

export const FEEDBACK_MAP: Record<string, LumaFeedback> = {
  m3: M3_FEEDBACK,
  e1: E1_FEEDBACK,
};

export function getFeedback(challengeId: string): LumaFeedback | null {
  return FEEDBACK_MAP[challengeId.toLowerCase()] ?? null;
}
