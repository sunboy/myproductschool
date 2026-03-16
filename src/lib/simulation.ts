/* ─── Simulation types ───────────────────────────────────────── */

export type MessageRole = "luma" | "user";
export type LumaInterruptType =
  | "opening"
  | "neutral"
  | "pushback"
  | "prioritize"
  | "specificity"
  | "hypothesis"
  | "closing";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  interruptType?: LumaInterruptType;
  timestamp: number;
}

export interface SimulationScenario {
  id: string;
  company: string;
  domain: string;
  context: string;
  prompt: string;
  openingNote: string;
}

/* ─── Scenarios ──────────────────────────────────────────────── */
export const SCENARIOS: SimulationScenario[] = [
  {
    id: "collab-metrics",
    company: "Hex",
    domain: "Data & Analytics",
    context:
      "Hex is a B2B SaaS data platform. We just shipped a real-time collaboration feature for data models — think Google Docs, but for SQL notebooks and data models. You're the PM who owns this feature.",
    prompt: "Design the success metrics for this new collaboration feature.",
    openingNote: "Take your time. Think out loud. I'll jump in when I need to.",
  },
  {
    id: "churn-drop",
    company: "Notion",
    domain: "Productivity SaaS",
    context:
      "Notion's enterprise team conversion rate dropped from 34% to 21% over the last 6 weeks. The change is concentrated in accounts with 50–200 seats. You're the PM for enterprise growth.",
    prompt: "Walk me through how you'd diagnose this.",
    openingNote: "Start wherever makes sense. I'll push back as we go.",
  },
  {
    id: "ml-feature",
    company: "Linear",
    domain: "Developer Tools",
    context:
      "Linear is considering adding an AI feature that auto-prioritizes your issue backlog based on team velocity, dependencies, and deadline signals. Engineering says it's 8 weeks. You're the PM.",
    prompt: "Should we build this? Make the case, or kill it.",
    openingNote:
      "I want your actual recommendation. Don't hedge.",
  },
];

/* ─── Interrupt scripts (rule-based, keyed by elapsed minutes + turn count) */
export interface InterruptRule {
  triggerAfterUserTurns: number;
  triggerAfterMinutes?: number;
  type: LumaInterruptType;
  message: string;
}

export const INTERRUPT_SCRIPTS: Record<string, InterruptRule[]> = {
  "collab-metrics": [
    {
      triggerAfterUserTurns: 1,
      type: "neutral",
      message:
        "Good start. Keep going — you haven't told me what the north star metric is yet.",
    },
    {
      triggerAfterUserTurns: 2,
      type: "pushback",
      message:
        "Why DAU specifically? Collaboration features often have very different usage patterns than solo tools. What assumption is DAU making that might not hold here?",
    },
    {
      triggerAfterUserTurns: 3,
      type: "prioritize",
      message:
        "You've listed several metrics. Which one matters most to the business right now, and why would you bet on that one?",
    },
    {
      triggerAfterUserTurns: 4,
      type: "specificity",
      message:
        "That's still vague. Give me a concrete target. What does 'good' look like at 90 days post-launch?",
    },
    {
      triggerAfterUserTurns: 5,
      type: "hypothesis",
      message:
        "We're about ten minutes in. What's the one thing you'd cut from this metrics framework if you had to, and why?",
    },
    {
      triggerAfterUserTurns: 7,
      type: "pushback",
      message:
        "Walk me through your counter-metrics. What are the guardrails — what would tell you the feature is actually hurting the product?",
    },
    {
      triggerAfterUserTurns: 9,
      type: "closing",
      message:
        "Okay. If you had 60 seconds to brief the CEO on this metrics framework, what do you say?",
    },
  ],
  "churn-drop": [
    {
      triggerAfterUserTurns: 1,
      type: "neutral",
      message: "What's your leading hypothesis right now, before you've dug into any data?",
    },
    {
      triggerAfterUserTurns: 2,
      type: "specificity",
      message:
        "You said you'd 'look at the data.' What data, specifically? Tell me the exact query or dashboard you'd pull first.",
    },
    {
      triggerAfterUserTurns: 3,
      type: "pushback",
      message:
        "The 50–200 seat concentration — you glossed over that. That's the most unusual signal in the data. Why is it those accounts specifically?",
    },
    {
      triggerAfterUserTurns: 5,
      type: "hypothesis",
      message:
        "You have three hypotheses. Rank them. Which one do you bet money on, and what would make you wrong?",
    },
    {
      triggerAfterUserTurns: 7,
      type: "prioritize",
      message: "What's the fastest validation path here? What would give you confident signal in a week?",
    },
    {
      triggerAfterUserTurns: 9,
      type: "closing",
      message:
        "Last question: if you're wrong about your top hypothesis, what's the second-order consequence for the team?",
    },
  ],
  "ml-feature": [
    {
      triggerAfterUserTurns: 1,
      type: "pushback",
      message:
        "You're already listing pros and cons. What's your actual instinct — build it or kill it — before you hedge?",
    },
    {
      triggerAfterUserTurns: 2,
      type: "specificity",
      message:
        "What user problem does this solve? Be precise — what job is the user trying to get done that they can't do well today?",
    },
    {
      triggerAfterUserTurns: 3,
      type: "pushback",
      message:
        "Eight weeks is a big bet. What's the cheapest way to validate the core assumption before committing the sprint?",
    },
    {
      triggerAfterUserTurns: 5,
      type: "prioritize",
      message:
        "You're considering three things simultaneously. What's the single decision gate — the one question you need answered before anything else?",
    },
    {
      triggerAfterUserTurns: 7,
      type: "hypothesis",
      message:
        "Let's say you build it and 30% of users ignore it entirely. What does that tell you, and what do you do next?",
    },
    {
      triggerAfterUserTurns: 9,
      type: "closing",
      message:
        "Final call. Build, kill, or defer — and give me the one sentence you'd say to the engineering team to justify the decision.",
    },
  ],
};

/* ─── Interrupt type metadata ────────────────────────────────── */
export const INTERRUPT_META: Record<
  LumaInterruptType,
  { label: string; borderColor: string; labelColor: string }
> = {
  opening:    { label: "",            borderColor: "border-l-primary/40",          labelColor: "text-primary" },
  neutral:    { label: "",            borderColor: "border-l-transparent",          labelColor: "" },
  pushback:   { label: "Push back",   borderColor: "border-l-danger/60",            labelColor: "text-danger" },
  prioritize: { label: "Prioritize",  borderColor: "border-l-[var(--warning)]/70",  labelColor: "text-[var(--warning)]" },
  specificity:{ label: "Be specific", borderColor: "border-l-primary/60",           labelColor: "text-primary" },
  hypothesis: { label: "Hypothesis",  borderColor: "border-l-success/60",           labelColor: "text-success" },
  closing:    { label: "Final round", borderColor: "border-l-primary/40",           labelColor: "text-primary" },
};
