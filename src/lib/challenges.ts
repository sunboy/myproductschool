export type Difficulty = "Easy" | "Medium" | "Hard";
export type ChallengeStatus = "not-started" | "in-progress" | "completed";
export type Domain =
  | "Payments"
  | "Marketplace"
  | "Social"
  | "SaaS"
  | "Logistics"
  | "Healthcare"
  | "Fintech"
  | "E-commerce"
  | "Dev Tools";

export type Company =
  | "Meta"
  | "Airbnb"
  | "Uber"
  | "Stripe"
  | "Google"
  | "DoorDash"
  | "Amazon"
  | "Spotify"
  | "Netflix"
  | "Figma";

export interface Challenge {
  id: string;        // e.g. "E1", "M3", "H7"
  title: string;
  difficulty: Difficulty;
  domain: Domain;
  companies: Company[];
  estimatedMin: number;
  status: ChallengeStatus;
  score?: string;    // e.g. "12/16" — only when completed
  locked: boolean;
  description: string;
}

export const CHALLENGES: Challenge[] = [
  // ─── Easy ────────────────────────────────────────────────────
  {
    id: "E1", title: "Design a payment failure recovery flow", difficulty: "Easy",
    domain: "Payments", companies: ["Stripe"], estimatedMin: 15,
    status: "completed", score: "14/16", locked: false,
    description: "A subscription product sees 8% of renewals fail silently. Design the recovery UX.",
  },
  {
    id: "E2", title: "Define success metrics for a new feed", difficulty: "Easy",
    domain: "Social", companies: ["Meta"], estimatedMin: 15,
    status: "completed", score: "12/16", locked: false,
    description: "A social app launches a vertical video feed. What does success look like at 30 days?",
  },
  {
    id: "E3", title: "Prioritize three competing feature requests", difficulty: "Easy",
    domain: "SaaS", companies: ["Figma", "Google"], estimatedMin: 15,
    status: "in-progress", locked: false,
    description: "Three customer segments each want something different. How do you decide?",
  },
  {
    id: "E4", title: "Improve driver earnings transparency", difficulty: "Easy",
    domain: "Marketplace", companies: ["Uber", "DoorDash"], estimatedMin: 15,
    status: "not-started", locked: false,
    description: "Drivers say they don't understand how their earnings are calculated. Fix it.",
  },
  {
    id: "E5", title: "Reduce checkout abandonment on mobile", difficulty: "Easy",
    domain: "E-commerce", companies: ["Amazon"], estimatedMin: 15,
    status: "not-started", locked: false,
    description: "Mobile checkout has 68% abandonment vs. 42% on desktop. What do you investigate first?",
  },
  {
    id: "E6", title: "Design a first-week onboarding for a dev tool", difficulty: "Easy",
    domain: "Dev Tools", companies: ["Figma", "Stripe"], estimatedMin: 15,
    status: "not-started", locked: false,
    description: "60% of free trial users never reach the 'aha moment'. Design an activation flow.",
  },
  {
    id: "E7", title: "Define a north star metric for a logistics app", difficulty: "Easy",
    domain: "Logistics", companies: ["DoorDash", "Amazon"], estimatedMin: 15,
    status: "not-started", locked: false,
    description: "A last-mile delivery startup needs one metric that captures long-term health.",
  },
  {
    id: "E8", title: "Diagnose a drop in daily active users", difficulty: "Easy",
    domain: "Social", companies: ["Meta"], estimatedMin: 15,
    status: "not-started", locked: false,
    description: "DAU dropped 12% week-over-week with no recent releases. Walk through your investigation.",
  },
  {
    id: "E9", title: "Design a guest checkout experience", difficulty: "Easy",
    domain: "E-commerce", companies: ["Amazon"], estimatedMin: 15,
    status: "not-started", locked: false,
    description: "Forcing account creation loses 23% of buyers. Design a guest checkout that still captures value.",
  },
  {
    id: "E10", title: "Improve chargeback rate for a marketplace", difficulty: "Easy",
    domain: "Payments", companies: ["Airbnb", "Stripe"], estimatedMin: 15,
    status: "not-started", locked: false,
    description: "Chargebacks hit 1.1%. Visa is watching. What's your 30-day plan?",
  },

  // ─── Medium ───────────────────────────────────────────────────
  {
    id: "M1", title: "Build a seller trust score system", difficulty: "Medium",
    domain: "Marketplace", companies: ["Airbnb", "Amazon"], estimatedMin: 20,
    status: "completed", score: "11/16", locked: false,
    description: "Buyers cite 'not trusting sellers' as top reason for abandonment. Design a trust signal system.",
  },
  {
    id: "M2", title: "Prioritize instant payouts vs. fraud detection", difficulty: "Medium",
    domain: "Payments", companies: ["Stripe", "Uber"], estimatedMin: 20,
    status: "not-started", locked: false,
    description: "Finance wants faster payouts. Risk wants stricter checks. You have one sprint. Choose.",
  },
  {
    id: "M3", title: "Design a route optimization feature for couriers", difficulty: "Medium",
    domain: "Logistics", companies: ["DoorDash", "Uber"], estimatedMin: 20,
    status: "completed", score: "12/16", locked: false,
    description: "Couriers are rejecting 34% of offers. Better routing might help. Define the solution.",
  },
  {
    id: "M4", title: "Redesign marketplace search ranking", difficulty: "Medium",
    domain: "Marketplace", companies: ["Airbnb", "Amazon"], estimatedMin: 20,
    status: "in-progress", locked: false,
    description: "Search returns relevant results but users say they can't find what they need. Diagnose and fix.",
  },
  {
    id: "M5", title: "Improve subscription renewal rates for SaaS", difficulty: "Medium",
    domain: "SaaS", companies: ["Spotify", "Netflix"], estimatedMin: 20,
    status: "not-started", locked: false,
    description: "Annual renewals are 5pp below industry benchmarks. Design a 90-day retention intervention.",
  },
  {
    id: "M6", title: "Design a content moderation escalation system", difficulty: "Medium",
    domain: "Social", companies: ["Meta"], estimatedMin: 20,
    status: "not-started", locked: false,
    description: "Automated moderation has 4% false positive rate. 1M posts/day. Design the human review tier.",
  },
  {
    id: "M7", title: "Build a health record access feature", difficulty: "Medium",
    domain: "Healthcare", companies: ["Google"], estimatedMin: 20,
    status: "not-started", locked: false,
    description: "Patients want to share records with new providers. Design a secure, low-friction sharing flow.",
  },
  {
    id: "M8", title: "Define a pricing model for an API product", difficulty: "Medium",
    domain: "Dev Tools", companies: ["Stripe", "Figma"], estimatedMin: 20,
    status: "not-started", locked: false,
    description: "Your API is free during beta. You need to monetize without losing the developer community.",
  },
  {
    id: "M9", title: "Improve payment acceptance in emerging markets", difficulty: "Medium",
    domain: "Fintech", companies: ["Stripe", "Google"], estimatedMin: 20,
    status: "not-started", locked: false,
    description: "India launch has 34% lower auth rates than US. Local payment methods aren't supported. Fix it.",
  },
  {
    id: "M10", title: "Design a returns experience for e-commerce", difficulty: "Medium",
    domain: "E-commerce", companies: ["Amazon"], estimatedMin: 20,
    status: "not-started", locked: false,
    description: "Returns take 12 days to process. Industry average is 5. What's your 6-month roadmap?",
  },

  // ─── Hard ─────────────────────────────────────────────────────
  {
    id: "H1", title: "A spike in chargebacks — diagnose and respond", difficulty: "Hard",
    domain: "Payments", companies: ["Stripe", "Airbnb"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "Chargebacks up 3x in 48h. Visa monitoring program triggered. CEO wants answers in 2 hours.",
  },
  {
    id: "H2", title: "Launch a B2B payments product in 90 days", difficulty: "Hard",
    domain: "Fintech", companies: ["Stripe", "Google"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "SMBs want to pay invoices via your platform. Define the MVP, the risks, and the launch plan.",
  },
  {
    id: "H3", title: "Build a creator monetization platform", difficulty: "Hard",
    domain: "Social", companies: ["Meta", "Spotify"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "Top creators are leaving for competitors. Design a monetization suite to retain them.",
  },
  {
    id: "H4", title: "Redesign the driver app for new gig regulations", difficulty: "Hard",
    domain: "Marketplace", companies: ["Uber", "DoorDash"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "New law requires minimum hourly pay. It breaks your current pricing model. Redesign the system.",
  },
  {
    id: "H5", title: "Design an AI-assisted code review tool", difficulty: "Hard",
    domain: "Dev Tools", companies: ["Google", "Figma"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "Engineers say code review is their biggest time sink. Define a PM-led AI solution.",
  },
  {
    id: "H6", title: "Build a supply chain visibility product", difficulty: "Hard",
    domain: "Logistics", companies: ["Amazon", "Google"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "Enterprise customers can't see where their inventory is. Design a real-time visibility layer.",
  },
  {
    id: "H7", title: "Redesign healthcare prior authorization", difficulty: "Hard",
    domain: "Healthcare", companies: ["Google"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "Prior auth delays treatment by 2 weeks average. You have 6 months to halve it. Go.",
  },
  {
    id: "H8", title: "Compete with a free competitor entering your market", difficulty: "Hard",
    domain: "SaaS", companies: ["Google", "Figma"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "Google just launched a free version of your core product. Define your response strategy.",
  },
  {
    id: "H9", title: "Build a cross-border payment product", difficulty: "Hard",
    domain: "Fintech", companies: ["Stripe", "Airbnb"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "International expansion requires multi-currency payouts in 40 countries in 12 months.",
  },
  {
    id: "H10", title: "Design fraud detection for a social commerce feature", difficulty: "Hard",
    domain: "E-commerce", companies: ["Meta", "Amazon"], estimatedMin: 30,
    status: "not-started", locked: true,
    description: "Social commerce is growing 40% MoM. Fraud is growing 80% MoM. Ship a solution.",
  },
];

export const ALL_DOMAINS: Domain[] = [
  "Payments", "Marketplace", "Social", "SaaS",
  "Logistics", "Healthcare", "Fintech", "E-commerce", "Dev Tools",
];

export const ALL_COMPANIES: Company[] = [
  "Meta", "Airbnb", "Uber", "Stripe", "Google",
  "DoorDash", "Amazon", "Spotify", "Netflix", "Figma",
];

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  Easy: 0, Medium: 1, Hard: 2,
};
