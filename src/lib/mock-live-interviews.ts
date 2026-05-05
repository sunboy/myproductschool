import type { FlowStep } from '@/lib/types'

export interface LiveInterviewPersona {
  companyId: string
  companyName: string
  role: string
  slug: string
  icon: string
  interviewStyle: string
  difficulty: 'standard' | 'advanced' | 'staff_plus'
  estimatedMins: number
  personaPrompt?: string
}

export interface LiveInterviewSession {
  id: string
  userId: string
  companyId?: string
  companyName?: string
  role?: string
  status: 'pending' | 'active' | 'completed' | 'abandoned'
  flowCoverage: Record<FlowStep, number>
  totalTurns: number
  startedAt: string
  endedAt?: string
}

export interface LiveInterviewTurn {
  id: string
  sessionId: string
  turnIndex: number
  role: 'hatch' | 'user'
  content: string
  flowMoveDetected?: FlowStep
  createdAt: string
}

export interface LiveInterviewDebrief {
  overallScore: number
  grade: string
  flowScores: Record<FlowStep, number>
  competencySignals: Array<{ competency: string; signal: string; stepDetected: string }>
  failurePatternsDetected: Array<{ patternId: string; patternName: string; evidence: string }>
  strengths: string[]
  improvements: string[]
  nextChallengeRecommendation: string
}

export const MOCK_LIVE_INTERVIEW_PERSONAS: LiveInterviewPersona[] = [
  {
    companyId: 'google',
    companyName: 'Google',
    role: 'PM',
    slug: 'google-pm',
    icon: 'corporate_fare',
    interviewStyle: 'Data-driven, user-first, and deeply tied to search/ads business model',
    difficulty: 'advanced',
    estimatedMins: 45,
    personaPrompt:
      "You are a senior PM interviewer at Google. You care deeply about data-driven decision making, user empathy at scale, and how product decisions connect to Google's core business model. Push candidates to quantify impact, name specific metrics, and think about ecosystem-level effects. You value structured thinking but reward candidates who can reason from first principles. Be rigorous but not hostile.",
  },
  {
    companyId: 'google',
    companyName: 'Google',
    role: 'SWE',
    slug: 'google-swe',
    icon: 'corporate_fare',
    interviewStyle: 'Systems thinking meets product intuition — expect infra-scale constraints',
    difficulty: 'advanced',
    estimatedMins: 40,
  },
  {
    companyId: 'google',
    companyName: 'Google',
    role: 'Data Engineer',
    slug: 'google-data-engineer',
    icon: 'corporate_fare',
    interviewStyle: 'Pipeline design, schema tradeoffs, and how data supports product decisions',
    difficulty: 'advanced',
    estimatedMins: 40,
  },
  {
    companyId: 'google',
    companyName: 'Google',
    role: 'ML Engineer',
    slug: 'google-ml-engineer',
    icon: 'corporate_fare',
    interviewStyle: 'Model design, ranking systems, and responsible ML at massive scale',
    difficulty: 'staff_plus',
    estimatedMins: 50,
  },
  {
    companyId: 'meta',
    companyName: 'Meta',
    role: 'PM',
    slug: 'meta-pm',
    icon: 'thumb_up',
    interviewStyle: 'Social graph dynamics, engagement loops, and cross-platform thinking',
    difficulty: 'advanced',
    estimatedMins: 45,
    personaPrompt:
      "You are a staff PM interviewer at Meta. You think in terms of social graphs, network effects, and engagement loops. You want candidates to reason about two-sided dynamics (creator vs. consumer), how features affect the broader social ecosystem, and what guardrails prevent harm at scale. You push hard on tradeoffs between growth and wellbeing. Ask follow-up questions that expose whether the candidate is thinking about the user or the metric.",
  },
  {
    companyId: 'meta',
    companyName: 'Meta',
    role: 'SWE',
    slug: 'meta-swe',
    icon: 'thumb_up',
    interviewStyle: 'Distributed systems, scale, and product feature tradeoffs',
    difficulty: 'advanced',
    estimatedMins: 40,
  },
  {
    companyId: 'meta',
    companyName: 'Meta',
    role: 'Data Engineer',
    slug: 'meta-data-engineer',
    icon: 'thumb_up',
    interviewStyle: 'Real-time data pipelines and privacy-preserving analytics at scale',
    difficulty: 'advanced',
    estimatedMins: 40,
  },
  {
    companyId: 'stripe',
    companyName: 'Stripe',
    role: 'PM',
    slug: 'stripe-pm',
    icon: 'payments',
    interviewStyle: 'Developer experience, API design philosophy, and fintech precision',
    difficulty: 'advanced',
    estimatedMins: 45,
  },
  {
    companyId: 'stripe',
    companyName: 'Stripe',
    role: 'SWE',
    slug: 'stripe-swe',
    icon: 'payments',
    interviewStyle: 'API contracts, reliability engineering, and financial system correctness',
    difficulty: 'advanced',
    estimatedMins: 40,
  },
  {
    companyId: 'stripe',
    companyName: 'Stripe',
    role: 'Data Engineer',
    slug: 'stripe-data-engineer',
    icon: 'payments',
    interviewStyle: 'Financial data modeling, compliance constraints, and fraud signal design',
    difficulty: 'advanced',
    estimatedMins: 40,
  },
  {
    companyId: 'airbnb',
    companyName: 'Airbnb',
    role: 'PM',
    slug: 'airbnb-pm',
    icon: 'house',
    interviewStyle: 'Two-sided marketplace dynamics, trust, and community-driven growth',
    difficulty: 'standard',
    estimatedMins: 35,
  },
  {
    companyId: 'airbnb',
    companyName: 'Airbnb',
    role: 'SWE',
    slug: 'airbnb-swe',
    icon: 'house',
    interviewStyle: 'Search ranking, availability systems, and host/guest experience tradeoffs',
    difficulty: 'standard',
    estimatedMins: 35,
  },
  {
    companyId: 'uber',
    companyName: 'Uber',
    role: 'PM',
    slug: 'uber-pm',
    icon: 'local_taxi',
    interviewStyle: 'Real-time marketplace, driver/rider balance, and operations-heavy product thinking',
    difficulty: 'advanced',
    estimatedMins: 45,
  },
  {
    companyId: 'netflix',
    companyName: 'Netflix',
    role: 'PM',
    slug: 'netflix-pm',
    icon: 'movie',
    interviewStyle: 'Content strategy, recommendation systems, and subscriber retention',
    difficulty: 'advanced',
    estimatedMins: 45,
  },
  {
    companyId: 'figma',
    companyName: 'Figma',
    role: 'PM',
    slug: 'figma-pm',
    icon: 'design_services',
    interviewStyle: 'Collaboration tools, design workflows, and developer handoff',
    difficulty: 'standard',
    estimatedMins: 35,
  },
  {
    companyId: 'notion',
    companyName: 'Notion',
    role: 'PM',
    slug: 'notion-pm',
    icon: 'note_alt',
    interviewStyle: 'Flexible productivity, bottom-up adoption, and power user vs. new user tension',
    difficulty: 'standard',
    estimatedMins: 35,
  },
]

export const MOCK_LIVE_SESSION: LiveInterviewSession = {
  id: 'mock-session-id',
  userId: 'mock-user-id',
  companyId: 'uber',
  companyName: 'Uber',
  role: 'PM',
  status: 'active',
  flowCoverage: { frame: 0.6, list: 0.2, optimize: 0, win: 0 },
  totalTurns: 8,
  startedAt: '2026-04-05T06:00:00.000Z',
}

export const MOCK_LIVE_TURNS: LiveInterviewTurn[] = [
  {
    id: 'turn-0',
    sessionId: 'mock-session-id',
    turnIndex: 0,
    role: 'hatch',
    content:
      "Let's jump in. You're a PM at Uber. Driver churn is up 18% quarter-over-quarter, and your data team has flagged that drivers who contact support about earnings are 3x more likely to churn within 30 days. Your job is to design a solution. How do you think about this problem?",
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'turn-1',
    sessionId: 'mock-session-id',
    turnIndex: 1,
    role: 'user',
    content:
      "Drivers are churning because they're confused about their earnings. I'd build a better earnings dashboard — clearer breakdowns of base pay, surge, tips, and deductions. Maybe add weekly summaries and push notifications when pay is deposited.",
    flowMoveDetected: 'frame',
    createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'turn-2',
    sessionId: 'mock-session-id',
    turnIndex: 2,
    role: 'hatch',
    content:
      "You've jumped to a solution quickly. Why do you think earnings confusion is the core problem here? What's the actual job the driver is trying to do when they contact support — and what's blocking them from doing it?",
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: 'turn-3',
    sessionId: 'mock-session-id',
    turnIndex: 3,
    role: 'user',
    content:
      "You're right — I was at the symptom level. The job the driver is trying to do is trust that Uber is paying them correctly. The blocker isn't just poor UI — it's that drivers can't reconcile what they earned vs. what they received. When they can't verify the math independently, they assume they're being underpaid. That erodes trust, and trust is what keeps a driver on the platform instead of switching to Lyft.",
    flowMoveDetected: 'frame',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'turn-4',
    sessionId: 'mock-session-id',
    turnIndex: 4,
    role: 'hatch',
    content:
      "Good reframe. Trust is the job. Now walk me through who else is affected by this problem — not just individual drivers. Who are the stakeholders, and what does success look like from each of their perspectives?",
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'turn-5',
    sessionId: 'mock-session-id',
    turnIndex: 5,
    role: 'user',
    content:
      "At least three driver segments: gig drivers who treat Uber as one of many income sources and optimize ruthlessly on earnings — they'll churn fast if the numbers don't pencil; full-time drivers who depend on Uber income and feel most exposed when something seems off; and fleet operators managing 10-100 drivers, who care about aggregate earnings visibility across their fleet. On the Uber side: driver ops wants to reduce support volume, finance wants predictable payout liabilities, and the marketplace team cares about supply-side retention as a lever for rider ETAs.",
    flowMoveDetected: 'list',
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'turn-6',
    sessionId: 'mock-session-id',
    turnIndex: 6,
    role: 'hatch',
    content:
      "Strong stakeholder map. Now let's get into solutions. What are the structurally different approaches you could take — not variations on a dashboard, but genuinely distinct solution types?",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'turn-7',
    sessionId: 'mock-session-id',
    turnIndex: 7,
    role: 'user',
    content:
      "Three distinct approaches: First, radical transparency — expose every calculation step in the driver app with an auditable earnings log, so drivers can verify the math themselves. Second, proactive trust signals — instead of waiting for drivers to question earnings, push real-time confirmations: 'Your surge for that trip was $4.20, calculated at 1.8x on $2.33/mile.' Third, third-party verification — partner with an independent auditor or let drivers export earnings data to connect with tools like Keeper Tax, so trust is validated outside the Uber ecosystem entirely.",
    flowMoveDetected: 'list',
    createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
  },
]

export const MOCK_LIVE_DEBRIEF: LiveInterviewDebrief = {
  overallScore: 68,
  grade: 'Good',
  flowScores: { frame: 72, list: 65, optimize: 0, win: 0 },
  competencySignals: [
    {
      competency: 'motivation_theory',
      signal:
        "You correctly identified friction (earnings opacity) but didn't fully name what satisfaction looks like after the fix. What does a driver feel or do differently once trust is restored?",
      stepDetected: 'frame',
    },
    {
      competency: 'cognitive_empathy',
      signal:
        'Strong stakeholder enumeration — you simulated fleet operators as a distinct segment, not just individual drivers. That level of specificity signals real empathy for the B2B use case.',
      stepDetected: 'list',
    },
  ],
  failurePatternsDetected: [
    {
      patternId: 'FP-01',
      patternName: 'Symptom-level framing',
      evidence:
        "Initial response jumped to dashboard UI without diagnosing why drivers contact support. After pushback, the reframe to 'trust as the job' was strong — but the pattern suggests defaulting to solution before problem.",
    },
  ],
  strengths: [
    'Reframed the problem from UI confusion to trust deficit after a single prompt — shows coachability and depth',
    'Generated three structurally distinct solution types (transparency, proactive signals, third-party verification) rather than variations on one idea',
  ],
  improvements: [
    'Start with root cause before solutions — your first instinct was to build a dashboard, skipping the why',
    'Complete the FLOW arc: Optimize and Win steps were not reached — practice driving the conversation to a recommendation with a named success metric',
  ],
  nextChallengeRecommendation: 'Spotify: Redesign the podcast discovery experience for non-podcast listeners',
}
