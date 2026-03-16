/* ─── ProductIQ types ────────────────────────────────────────── */

export interface SkillDimension {
  key: string;
  label: string;
  score: number;   // 0–4.0
  max: 4;
  explanation: string;
}

export interface SubmissionRecord {
  challengeId: string;
  challengeTitle: string;
  score: number;
  maxScore: number;
  date: string; // ISO
  retryUsed: boolean;
}

export interface LayerProgress {
  id: number;
  label: string;
  sublabel: string;
  completed: number;
  total: number;
  href: string;
  locked: boolean;
}

export interface ProductIQData {
  unlocked: boolean; // true if ≥5 challenges submitted
  lastUpdatedChallenge: string | null;
  overallScore: number; // 0–4.0 average
  dimensions: SkillDimension[];
  lumaSummary: string | null;
  submissions: SubmissionRecord[];
  layers: LayerProgress[];
  streakDays: number;
  totalHoursSpent: number;
  weeklyActivity: number[]; // 8 weeks, challenges per week newest-last
}

/* ─── Mock data (2 challenges submitted = locked state) ──────── */
export const MOCK_PROGRESS_LOCKED: ProductIQData = {
  unlocked: false,
  lastUpdatedChallenge: "M3",
  overallScore: 0,
  dimensions: [
    { key: "diagnosis",       label: "Diagnostic accuracy",    score: 3.0, max: 4, explanation: "You find the right problem area most of the time" },
    { key: "metrics",         label: "Metric fluency",         score: 2.5, max: 4, explanation: "You use metrics but sometimes miss the right decomposition" },
    { key: "framing",         label: "Framing precision",      score: 3.5, max: 4, explanation: "Your problem framing is clear and commercially grounded" },
    { key: "hypothesis",      label: "Hypothesis quality",     score: 2.0, max: 4, explanation: "Hypotheses are present but need sharper ranking criteria" },
    { key: "recommendation",  label: "Recommendation strength",score: 2.5, max: 4, explanation: "Recommendations are directionally right, often missing specifics" },
  ],
  lumaSummary: null,
  submissions: [
    {
      challengeId: "E1",
      challengeTitle: "Design a payment failure recovery flow",
      score: 14,
      maxScore: 16,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      retryUsed: false,
    },
    {
      challengeId: "M3",
      challengeTitle: "Design a route optimization feature for couriers",
      score: 12,
      maxScore: 16,
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      retryUsed: true,
    },
  ],
  layers: [
    { id: 1, label: "Domain Foundations", sublabel: "Core domains studied", completed: 1, total: 9, href: "/domains", locked: false },
    { id: 2, label: "Framework Patterns", sublabel: "Patterns internalized", completed: 0, total: 5, href: "/domains", locked: false },
    { id: 3, label: "Challenge Practice", sublabel: "Challenges submitted", completed: 2, total: 30, href: "/challenges", locked: false },
    { id: 4, label: "Pro Portfolio", sublabel: "Available after 15 challenges", completed: 0, total: 1, href: "/challenges", locked: true },
  ],
  streakDays: 3,
  totalHoursSpent: 1.5,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 1, 1],
};

/* ─── Mock data (8 challenges submitted = unlocked) ─────────── */
export const MOCK_PROGRESS_UNLOCKED: ProductIQData = {
  unlocked: true,
  lastUpdatedChallenge: "M3",
  overallScore: 2.9,
  dimensions: [
    { key: "diagnosis",       label: "Diagnostic accuracy",    score: 3.4, max: 4, explanation: "You consistently find the right problem area" },
    { key: "metrics",         label: "Metric fluency",         score: 2.8, max: 4, explanation: "Strong metric choice; occasionally misses decomposition depth" },
    { key: "framing",         label: "Framing precision",      score: 3.6, max: 4, explanation: "Commercially sharp framing across all submissions" },
    { key: "hypothesis",      label: "Hypothesis quality",     score: 2.2, max: 4, explanation: "Hypotheses present but ranking logic needs tightening" },
    { key: "recommendation",  label: "Recommendation strength",score: 2.5, max: 4, explanation: "Right direction, but scope and tradeoffs underspecified" },
  ],
  lumaSummary:
    "Your diagnosis keeps getting sharper — you're now decomposing metrics correctly in 4 of your last 5 submissions. The recurring gap is in recommendations: you identify the right problem but stop short of committing to a specific action with an explicit tradeoff. Next focus: practice writing recommendations that name exactly what you're giving up, and why that's the right bet.",
  submissions: [
    {
      challengeId: "E1",
      challengeTitle: "Design a payment failure recovery flow",
      score: 14,
      maxScore: 16,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      retryUsed: false,
    },
    {
      challengeId: "M3",
      challengeTitle: "Design a route optimization feature for couriers",
      score: 12,
      maxScore: 16,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      retryUsed: true,
    },
    {
      challengeId: "E2",
      challengeTitle: "Diagnose a drop in session duration",
      score: 10,
      maxScore: 16,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      retryUsed: false,
    },
    {
      challengeId: "E3",
      challengeTitle: "Design an onboarding flow for B2B SaaS",
      score: 13,
      maxScore: 16,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      retryUsed: false,
    },
    {
      challengeId: "M1",
      challengeTitle: "Prioritize a feature backlog under constraints",
      score: 11,
      maxScore: 16,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      retryUsed: false,
    },
  ],
  layers: [
    { id: 1, label: "Domain Foundations", sublabel: "Core domains studied", completed: 3, total: 9, href: "/domains", locked: false },
    { id: 2, label: "Framework Patterns", sublabel: "Patterns internalized", completed: 1, total: 5, href: "/domains", locked: false },
    { id: 3, label: "Challenge Practice", sublabel: "Challenges submitted", completed: 5, total: 30, href: "/challenges", locked: false },
    { id: 4, label: "Pro Portfolio", sublabel: "Available after 15 challenges", completed: 0, total: 1, href: "/challenges", locked: true },
  ],
  streakDays: 7,
  totalHoursSpent: 6.5,
  weeklyActivity: [0, 1, 0, 2, 1, 0, 3, 2],
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
