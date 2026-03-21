export interface MetricCallout {
  label: string;
  value: string;
  delta?: string;
  deltaDir?: "up" | "down";
}

export interface ScenarioParagraph {
  text: string;
}

export interface ChallengeQuestion {
  number: number;
  text: string;
}

export interface Hint {
  id: number;
  text: string;
  unlockAfterMin: number; // 0 = always available
}

export interface ChallengeDetail {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  domain: string;
  companies: string[];
  estimatedMinLow: number;
  estimatedMinHigh: number;
  scenario: ScenarioParagraph[];
  metrics?: MetricCallout[];
  questions: ChallengeQuestion[];
  hints: Hint[];
  locked: boolean;
}

export const SCAFFOLD_TEMPLATES = {
  structured: `## Diagnosis
[What is actually happening? Frame the problem clearly before jumping to solutions.]

## Hypotheses
[List 3-5 possible causes, ordered by likelihood. Be specific.]

## Validation
[How would you test your top hypothesis? What data would you look at? Who would you talk to?]

## Recommendation
[What do you recommend? Be concrete — what do you ship, when, and why?]

## Tradeoffs
[What are you giving up? What risks are you accepting? What would change your decision?]`,

  guided: `Consider: What data do you have, and what does it tell you vs. what it doesn't?

Consider: If you had to bet on one root cause right now, what would it be and why?

Consider: What's the fastest way to validate that hypothesis with real evidence?

Consider: What does a good outcome look like 30 days from now?`,

  blank: "",
};

export const SCAFFOLD_PLACEHOLDERS = {
  structured: "Fill in each section above. Luma evaluates structure, specificity, and tradeoff awareness.",
  guided: "Use these prompts as thinking anchors — write your answer in your own words.",
  blank: "Write your answer here. There's no right format — Luma evaluates thinking quality.",
};

/* ─── Challenge registry ─────────────────────────────────────── */
const CHALLENGE_DETAIL_MAP: Record<string, ChallengeDetail> = {
  m3: {
    id: "M3",
    title: "Design a route optimization feature for couriers",
    difficulty: "Medium",
    domain: "Logistics",
    companies: ["DoorDash", "Uber"],
    estimatedMinLow: 20,
    estimatedMinHigh: 30,
    locked: false,
    scenario: [
      {
        text: "DoorDash's São Paulo operations team has flagged an unusual pattern: courier offer acceptance rates have dropped from 74% to 48% over the past three weeks, concentrated in the Zona Sul and Centro districts during the 11am–2pm and 6pm–9pm peak windows. Couriers who do accept are completing deliveries, but the acceptance rate decline is causing cascading order delays — estimated delivery times have increased by an average of 11 minutes, and customer satisfaction scores in the affected markets are trending down.",
      },
      {
        text: "Initial Dasher interviews (n=22) suggest that couriers feel the assigned routes are inefficient — they're frequently routed through high-congestion streets when parallel routes would be faster, and multi-order stacking sequences often require backtracking across districts. Several couriers mentioned that they've learned to reject offers in certain zones because their prior experience tells them the route won't be worth the time. The operations team estimates that improving acceptance rates back to 70%+ in these markets would recover approximately $180K/month in GMV.",
      },
      {
        text: "You've been asked to define the feature strategy for route optimization. You have access to real-time traffic data from Google Maps API, historical delivery time data for every order in the past 18 months, and the ability to ship a native change to the Dasher app within the next sprint cycle. Engineering has scoped the core routing engine changes at 6 weeks for v1.",
      },
    ],
    metrics: [
      { label: "Offer acceptance rate", value: "48%", delta: "−26pp", deltaDir: "down" },
      { label: "Avg. delivery time increase", value: "+11 min", delta: "vs. baseline", deltaDir: "down" },
      { label: "Affected markets", value: "2 districts", delta: "São Paulo" },
      { label: "Est. GMV impact", value: "$180K/mo", delta: "recoverable" },
    ],
    questions: [
      {
        number: 1,
        text: "What are the most likely root causes of the courier acceptance rate decline, and how would you rank them by likelihood?",
      },
      {
        number: 2,
        text: "How would you validate your top hypothesis before committing to a 6-week engineering build? What does 'enough confidence' look like here?",
      },
      {
        number: 3,
        text: "Define the v1 feature scope for route optimization. What do you ship in sprint 1, what do you defer, and what tradeoffs are you accepting?",
      },
    ],
    hints: [
      {
        id: 1,
        text: "Before jumping to solutions, separate what you know from what you're inferring. The courier interviews give qualitative signal — but 22 interviews in one city isn't statistical proof. What quantitative data could confirm or deny the routing inefficiency hypothesis?",
        unlockAfterMin: 0,
      },
      {
        id: 2,
        text: "Consider the difference between route quality (is the routing algorithm bad?) and route perception (do couriers *believe* it's bad even when it isn't?). Both are real problems but they have very different solutions. Which does the data point to more strongly?",
        unlockAfterMin: 10,
      },
      {
        id: 3,
        text: "For v1 scope: think about what you can ship in 1-2 weeks as a test vs. what needs the full 6-week build. A good PM finds the fastest path to signal. Could you A/B test an improved routing algorithm on a subset of couriers in one district before rolling out?",
        unlockAfterMin: 20,
      },
    ],
  },

  e1: {
    id: "E1",
    title: "Design a payment failure recovery flow",
    difficulty: "Easy",
    domain: "Payments",
    companies: ["Stripe"],
    estimatedMinLow: 15,
    estimatedMinHigh: 20,
    locked: false,
    scenario: [
      {
        text: "You're a PM at a B2C SaaS company with 85,000 monthly subscribers on a $29/month plan. Your data team surfaced a troubling pattern: 8.3% of monthly renewal attempts fail — significantly above the industry average of 3-4% for subscription businesses at your scale. Of those failed renewals, 61% are never recovered: the customer either doesn't respond to dunning emails, manually churns, or their card remains declined indefinitely.",
      },
      {
        text: "A breakdown of failure reasons (from your payment processor's decline codes) shows: insufficient funds (34%), card expired (28%), card reported stolen or blocked (19%), do-not-honor from the issuing bank (12%), and other/unknown (7%). Your current recovery flow is a single automated email sent 3 days after the failed charge, directing customers to update their payment method. There is no retry logic, no in-app notification, and no grace period — access is cut off immediately upon failed renewal.",
      },
      {
        text: "The growth team estimates that reducing failed payment churn from 8.3% to 4% would add approximately $420K in annual recurring revenue at current subscriber scale. The engineering team has confirmed they can ship a redesigned recovery flow within 4 weeks if given a clear spec.",
      },
    ],
    metrics: [
      { label: "Failed renewal rate", value: "8.3%", delta: "vs. 3-4% industry avg", deltaDir: "down" },
      { label: "Unrecovered failures", value: "61%", delta: "of failed renewals" },
      { label: "Top failure reason", value: "Insufficient funds", delta: "34% of declines" },
      { label: "ARR opportunity", value: "$420K", delta: "if target achieved" },
    ],
    questions: [
      { number: 1, text: "What are the highest-leverage interventions for recovering failed payments, and how would you prioritize them?" },
      { number: 2, text: "Design the end-to-end recovery flow. What touchpoints, timing, and messaging do you recommend?" },
      { number: 3, text: "How would you measure success? Define the metrics you'd track and the targets you'd set for a 90-day post-launch review." },
    ],
    hints: [
      {
        id: 1,
        text: "Not all decline reasons are equal. Expired cards (28%) are very recoverable with proactive outreach before renewal. Insufficient funds (34%) requires a different approach — retry timing matters a lot here (payday cycles). Think about segmenting your recovery strategy by decline reason.",
        unlockAfterMin: 0,
      },
      {
        id: 2,
        text: "Consider the difference between passive recovery (send email, hope they fix it) and active recovery (smart retries, in-app prompts, account pause vs. termination). Immediate access termination is likely costing you recoveries — a grace period is a product decision with a quantifiable value.",
        unlockAfterMin: 10,
      },
      {
        id: 3,
        text: "For success metrics: recovery rate is the obvious one, but also think about time-to-recovery (how quickly does a recovered customer re-subscribe?), downstream LTV of recovered customers vs. organic renewals, and the effect of grace period length on recovery rate vs. abuse rate.",
        unlockAfterMin: 20,
      },
    ],
  },
};

// Fallback for any challenge ID not in the map
function buildFallback(id: string): ChallengeDetail {
  return {
    id: id.toUpperCase(),
    title: "Challenge scenario",
    difficulty: "Medium",
    domain: "General",
    companies: [],
    estimatedMinLow: 20,
    estimatedMinHigh: 30,
    locked: false,
    scenario: [
      { text: "This challenge scenario is loading. In production, this content would be fetched from your backend or CMS." },
    ],
    questions: [
      { number: 1, text: "Diagnose the core problem." },
      { number: 2, text: "Validate your top hypothesis." },
      { number: 3, text: "Recommend a solution with clear tradeoffs." },
    ],
    hints: [
      { id: 1, text: "Start with the data you have before jumping to solutions.", unlockAfterMin: 0 },
      { id: 2, text: "Consider multiple root causes before committing to one.", unlockAfterMin: 10 },
      { id: 3, text: "Think about the fastest path to validating your hypothesis.", unlockAfterMin: 20 },
    ],
  };
}

export function getChallengeDetail(id: string): ChallengeDetail {
  return CHALLENGE_DETAIL_MAP[id.toLowerCase()] ?? buildFallback(id);
}
