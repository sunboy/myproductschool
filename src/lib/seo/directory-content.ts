import { canonicalUrl, imageUrl, SITE_NAME, SITE_URL } from './site'
import { autopsyStories, companyHubs } from '@/lib/autopsies/data'

export interface DirectoryLink {
  label: string
  href: string
  description?: string
}

export interface SkillDirectoryEntry {
  slug: string
  title: string
  shortTitle: string
  eyebrow: string
  metaTitle: string
  metaDescription: string
  summary: string
  thesis: string
  audience: string[]
  outcomes: string[]
  practiceTypes: string[]
  samplePrompts: string[]
  related: DirectoryLink[]
  faqs: Array<{ q: string; a: string }>
}

export interface CompanyDirectoryEntry {
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  summary: string
  interviewStyle: string
  roles: string[]
  practiceAreas: string[]
  sampleQuestions: string[]
  /** Optional primary CTA override. Defaults to the free-signin flow when absent. */
  ctaLabel?: string
  ctaHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export interface RoleTransitionDirectoryEntry {
  slug: string
  title: string
  shortTitle: string
  eyebrow: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  heroTitle: string
  heroSubtitle: string
  summary: string
  ctaLabel: string
  ctaHref: string
  secondaryLabel: string
  secondaryHref: string
  whatChanges: Array<{ title: string; body: string }>
  flowTracks: Array<{ eyebrow: string; title: string; body: string }>
  proofPoints: Array<{ title: string; body: string }>
  audience: Array<{ title: string; body: string }>
  faqs: Array<{ q: string; a: string }>
}

export interface AlternativeDirectoryEntry {
  slug: string
  competitor: string
  eyebrow: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  heroTitle: string
  summary: string
  ctaLabel: string
  ctaHref: string
  secondaryLabel: string
  secondaryHref: string
  comparisons: Array<[dimension: string, competitor: string, hackproduct: string]>
  betterFit: string[]
  closingTitle: string
  closingSubtitle: string
}

export interface StudyPlanDirectoryEntry {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  summary: string
  weeks: number
  level: string
  audience: string
  chapters: string[]
  outcomes: string[]
}

export interface PracticeDirectoryEntry {
  slug: string
  title: string
  discipline: string
  metaTitle: string
  metaDescription: string
  summary: string
  scenario: string
  skills: string[]
  prompts: string[]
}

export interface GlossaryDirectoryEntry {
  slug: string
  term: string
  metaTitle: string
  metaDescription: string
  definition: string
  whyItMatters: string
  example: string
  related: string[]
}

export const HACKPRODUCT_POSITIONING = {
  headline: 'Train for the career moments where judgment gets tested.',
  subhead:
    'HackProduct helps you prepare for interviews, transition roles, uplevel on the job, and negotiate from stronger evidence by practicing product sense, systems, data, SQL, coding, and AI-native workflows with Hatch.',
  llmSummary:
    'HackProduct is an AI-native practice gym for career-changing product and technical judgment. Learners run reps across product sense, systems thinking, data modeling, SQL, coding, AI-native workflows, and live interview communication with Hatch coaching and FLOW feedback.',
  primaryAudiences: ['Software engineers', 'Product managers', 'Data engineers', 'ML engineers', 'technical founders', 'students preparing for tech interviews'],
}

export const SKILL_DIRECTORIES: SkillDirectoryEntry[] = [
  {
    slug: 'product-sense',
    title: 'Product sense practice',
    shortTitle: 'Product sense',
    eyebrow: 'AI-era product judgment',
    metaTitle: 'Product Sense Practice for Engineers and PMs | HackProduct',
    metaDescription:
      'Practice product sense interviews, metrics, prioritization, and product strategy with AI coaching. Built for engineers who want to become product-minded builders.',
    summary:
      'Product sense is the skill of making clear product decisions under ambiguity: who the user is, what changed, which metric matters, and what trade-off is worth making.',
    thesis:
      'As LLMs make routine coding cheaper, engineers who can connect technical work to product outcomes become harder to replace and easier to trust.',
    audience: ['Engineers moving toward product leadership', 'PMs preparing for product sense interviews', 'Students targeting APM and new-grad PM loops'],
    outcomes: ['Frame ambiguous user problems', 'Define useful product metrics', 'Prioritize trade-offs under constraints', 'Explain recommendations crisply'],
    practiceTypes: ['Metric diagnosis', 'Feature prioritization', 'Product strategy', 'Growth loops', 'AI product judgment'],
    samplePrompts: [
      'Spotify listening time is down but DAU is flat. Diagnose what changed.',
      'Should a developer tool add an AI agent or improve its existing workflow first?',
      'How would you improve discovery for a marketplace where supply is uneven?',
    ],
    related: [
      { label: 'Live product sense interviews', href: '/interviews/live-ai-interviews' },
      { label: 'Engineer to product study plan', href: '/study-plans/engineer-to-product' },
      { label: 'North star metric glossary', href: '/glossary/north-star-metric' },
      { label: 'LeetCode alternative', href: '/alternatives/leetcode' },
    ],
    faqs: [
      {
        q: 'Is product sense only for PM interviews?',
        a: 'No. Product sense is also how engineers decide what to build, how to debug with business context, and how to communicate trade-offs to leadership.',
      },
      {
        q: 'How is HackProduct different from reading frameworks?',
        a: 'HackProduct is rep-based. You answer real scenarios, Hatch critiques your reasoning, and the product tracks which parts of your judgment break down.',
      },
    ],
  },
  {
    slug: 'system-design',
    title: 'System design practice',
    shortTitle: 'System design',
    eyebrow: 'Architecture under pressure',
    metaTitle: 'System Design Practice with AI Interview Coaching | HackProduct',
    metaDescription:
      'Practice system design interviews with AI follow-ups, trade-off coaching, and scenarios that connect architecture to product constraints.',
    summary:
      'System design is the discipline of translating product requirements into scalable components, interfaces, storage choices, and trade-offs.',
    thesis:
      'AI can draft diagrams, but senior engineers still need to choose the right bottleneck, defend consistency choices, and explain what breaks first.',
    audience: ['Senior engineers', 'Staff engineers', 'Engineering managers', 'Backend and infrastructure candidates'],
    outcomes: ['Clarify requirements', 'Map data flow and APIs', 'Choose storage and scaling patterns', 'Defend reliability, latency, and cost trade-offs'],
    practiceTypes: ['Scalable feeds', 'Notifications', 'Search systems', 'Queues and workers', 'Realtime collaboration'],
    samplePrompts: [
      'Design a realtime notification system for 50M users.',
      'Design product analytics ingestion for a fast-growing SaaS company.',
      'Design a collaborative document editor with offline support.',
    ],
    related: [
      { label: 'Data modeling practice', href: '/skills/data-modeling' },
      { label: 'Live AI interviews', href: '/interviews/live-ai-interviews' },
      { label: 'Realtime notifications preview', href: '/practice/realtime-notification-system' },
    ],
    faqs: [
      {
        q: 'Does HackProduct teach system design or only interview prep?',
        a: 'Both. The public directory explains the skill, and the app gives you scenario reps, live follow-ups, and rubric-driven feedback.',
      },
      {
        q: 'Why include product context in system design?',
        a: 'Architecture choices only make sense relative to user needs, traffic shape, durability requirements, and business constraints.',
      },
    ],
  },
  {
    slug: 'data-modeling',
    title: 'Data modeling practice',
    shortTitle: 'Data modeling',
    eyebrow: 'Schema design for real products',
    metaTitle: 'Data Modeling Practice for Product and Engineering Interviews | HackProduct',
    metaDescription:
      'Practice schema design, event taxonomies, entity relationships, access patterns, and data-model trade-offs with AI coaching.',
    summary:
      'Data modeling is how builders represent a product domain so the system can answer questions, enforce rules, and evolve without collapsing.',
    thesis:
      'AI can generate tables, but product-minded engineers know which entities matter, which access patterns dominate, and where denormalization is worth it.',
    audience: ['Backend engineers', 'Data engineers', 'Analytics engineers', 'PMs working with data-heavy products'],
    outcomes: ['Identify core entities', 'Model relationships and constraints', 'Design event taxonomies', 'Optimize for access patterns'],
    practiceTypes: ['Multi-tenant SaaS', 'Billing and metering', 'Audit logs', 'Marketplace entities', 'Event tracking plans'],
    samplePrompts: [
      'Model a multi-tenant SaaS product with billing, usage metering, and audit logs.',
      'Design the event taxonomy for an AI assistant product.',
      'Model listings, bookings, payments, and disputes for a marketplace.',
    ],
    related: [
      { label: 'SQL practice', href: '/skills/sql' },
      { label: 'Multi-tenant SaaS preview', href: '/practice/multi-tenant-saas-data-model' },
      { label: 'Event taxonomy glossary', href: '/glossary/event-taxonomy' },
    ],
    faqs: [
      {
        q: 'Is data modeling different from SQL?',
        a: 'Yes. SQL asks how to retrieve or transform data. Data modeling asks what data should exist, how it relates, and which constraints the system should enforce.',
      },
      {
        q: 'Why does data modeling matter for product sense?',
        a: 'A strong data model determines which product questions can be answered later: retention, monetization, fraud, usage, and customer health.',
      },
    ],
  },
  {
    slug: 'sql',
    title: 'SQL practice',
    shortTitle: 'SQL',
    eyebrow: 'Product analytics with queries',
    metaTitle: 'SQL Practice for Product Analytics and Tech Interviews | HackProduct',
    metaDescription:
      'Practice SQL interview questions for product analytics, joins, funnels, cohorts, retention, and business metrics with AI feedback.',
    summary:
      'SQL practice on HackProduct focuses on business questions: funnels, cohorts, retention, monetization, and operational decisions.',
    thesis:
      'Writing syntax is table stakes. The harder skill is translating messy product questions into correct queries and trustworthy conclusions.',
    audience: ['Engineers preparing for SQL interviews', 'PMs who need analytics fluency', 'Data analysts moving into product work'],
    outcomes: ['Join product data correctly', 'Compute retention and cohorts', 'Diagnose funnel drop-offs', 'Explain query assumptions'],
    practiceTypes: ['Funnels', 'Cohorts', 'Window functions', 'Aggregations', 'Experiment analysis'],
    samplePrompts: [
      'Find weekly retention by signup cohort.',
      'Identify the funnel step causing checkout conversion to drop.',
      'Calculate top customers by expansion revenue over the last quarter.',
    ],
    related: [
      { label: 'Data modeling practice', href: '/skills/data-modeling' },
      { label: 'SQL analytics preview', href: '/practice/sql-product-analytics-retention' },
      { label: 'Retention cohort glossary', href: '/glossary/retention-cohort' },
    ],
    faqs: [
      {
        q: 'Is this an alternative to generic SQL drills?',
        a: 'Yes. HackProduct frames SQL as product analytics: the query must answer a decision, not just pass a toy test.',
      },
      {
        q: 'Do SQL scenarios include schemas?',
        a: 'Practice previews are public; full app drills include schemas, sample data, execution, and feedback.',
      },
    ],
  },
  {
    slug: 'coding',
    title: 'Coding practice',
    shortTitle: 'Coding',
    eyebrow: 'Beyond rote LeetCode',
    metaTitle: 'Coding Practice for AI-Assisted Engineering Interviews | HackProduct',
    metaDescription:
      'Practice coding interviews with problem framing, edge cases, complexity, AI-assisted refinement, and communication coaching.',
    summary:
      'Coding practice on HackProduct emphasizes the parts AI does not remove: problem framing, edge cases, trade-offs, correctness, and explaining your thinking.',
    thesis:
      'The best engineers will not be the fastest at typing boilerplate. They will be the clearest at turning ambiguous requirements into correct, maintainable solutions.',
    audience: ['Software engineers preparing for interviews', 'Students seeking practical coding reps', 'Engineers adapting to AI-assisted development'],
    outcomes: ['Clarify constraints', 'Compare approaches', 'Handle edge cases', 'Use AI output critically', 'Explain complexity'],
    practiceTypes: ['Algorithms', 'Data structures', 'Streaming data', 'API implementation', 'AI-assisted debugging'],
    samplePrompts: [
      'Return the top-K events in a sliding time window.',
      'Design and implement an idempotent retry queue.',
      'Debug an AI-generated solution that passes samples but fails edge cases.',
    ],
    related: [
      { label: 'LeetCode alternative', href: '/alternatives/leetcode' },
      { label: 'Coding preview', href: '/practice/ai-assisted-coding-debugging' },
      { label: 'Live AI interviews', href: '/interviews/live-ai-interviews' },
    ],
    faqs: [
      {
        q: 'Is HackProduct trying to replace LeetCode?',
        a: 'HackProduct is an alternative for builders who need more than algorithm recall: judgment, communication, product context, and AI-era coding discipline.',
      },
      {
        q: 'Does coding practice include product thinking?',
        a: 'Yes. Real engineering interviews increasingly test whether you understand constraints, users, APIs, data, and trade-offs, not just syntax.',
      },
    ],
  },
  {
    slug: 'ai-native-workflows',
    title: 'AI-native workflow practice',
    shortTitle: 'AI-native workflows',
    eyebrow: 'Work judgment with AI in the loop',
    metaTitle: 'AI-Native Workflow Practice for Product-Minded Builders | HackProduct',
    metaDescription:
      'Practice AI-native workflows: context engineering, model evaluation, agent handoffs, human review, and product judgment with Hatch coaching.',
    summary:
      'AI-native workflow practice trains the judgment behind using models well: what context to provide, when to trust output, how to review it, and how to turn model work into product value.',
    thesis:
      'AI raises the floor on execution. Career leverage shifts toward people who can design, evaluate, and communicate AI-assisted work instead of merely prompting for output.',
    audience: ['Engineers adapting to AI-assisted development', 'PMs shipping AI products', 'Founders building model-backed workflows'],
    outcomes: ['Design useful human-in-the-loop workflows', 'Review AI output critically', 'Define evals and acceptance criteria', 'Communicate AI trade-offs'],
    practiceTypes: ['Context engineering', 'AI-assisted debugging', 'Evals', 'Agentic workflow design', 'Model quality trade-offs'],
    samplePrompts: [
      'Design an AI support triage workflow that escalates safely.',
      'Review a generated implementation plan and find the missing constraints.',
      'Define evaluation criteria for an AI feature that summarizes customer calls.',
    ],
    related: [
      { label: 'Coding practice', href: '/skills/coding' },
      { label: 'AI-assisted coding preview', href: '/practice/ai-assisted-coding-debugging' },
      { label: 'AI product sense study plan', href: '/study-plans/ai-product-sense' },
      { label: 'Role transitions', href: '/role-transitions' },
    ],
    faqs: [
      {
        q: 'Is this just prompt engineering?',
        a: 'No. Prompts are one piece. The harder skill is designing the workflow, choosing evidence, reviewing output, and deciding what should happen next.',
      },
      {
        q: 'Why practice AI-native workflows for interviews?',
        a: 'More interviews now ask how you use AI responsibly: constraints, evals, review loops, and trade-offs matter more than flashy demos.',
      },
    ],
  },
  {
    slug: 'live-data-analyst',
    title: 'Live data analyst practice',
    shortTitle: 'Live data analyst',
    eyebrow: 'AI-native data analysis on real datasets',
    metaTitle: 'Live Data Analyst Practice with Claude Code | HackProduct',
    metaDescription:
      'Drive a live Claude Code agent against a real BigQuery dataset, investigate a business question end to end, and earn a graded analyst scorecard.',
    summary:
      'Live data analyst practice puts you in the driver seat of a real analysis. You direct a Claude Code agent against a live BigQuery dataset to find the cause behind a metric, prove it with numbers, and write a reproducible report.',
    thesis:
      'Anyone can run a query. The skill that moves a career is knowing which metric to chase, which segment reveals the story, and which guardrail catches a fix that backfires.',
    audience: ['Engineers moving toward data work', 'Analysts sharpening investigation judgment', 'PMs who need analytics fluency', 'Founders making decisions from data'],
    outcomes: ['Frame a business question into a measurable investigation', 'Read a schema and grain before querying', 'Segment a metric to isolate the real cause', 'Write a finding with a number, a recommendation, and a guardrail'],
    practiceTypes: ['Funnel drop investigation', 'Schema exploration', 'Conversion segmentation', 'Reproducible reporting', 'Reusable analysis skills'],
    samplePrompts: [
      'Find the funnel step where conversion drops the most, with the percentage.',
      'Break the worst step down by device type and compare mobile to desktop.',
      'Summarize the cause, the number that proves it, and one guardrail metric to watch.',
    ],
    related: [
      { label: 'Claude Code analytics', href: '/claude-code-analytics' },
      { label: 'SQL practice', href: '/skills/sql' },
      { label: 'Data modeling practice', href: '/skills/data-modeling' },
      { label: 'AI-native workflows', href: '/skills/ai-native-workflows' },
    ],
    faqs: [
      {
        q: 'Do I need to know SQL first?',
        a: 'No. You direct the analysis in plain language and the agent runs the queries. The practice trains the judgment behind the questions, not query syntax.',
      },
      {
        q: 'Is the data real?',
        a: 'Yes. Each session runs against a live BigQuery dataset, so the schema, the row counts, and the funnel drops are real, not a fixed script.',
      },
    ],
  },
]

export const COMPANY_DIRECTORIES: CompanyDirectoryEntry[] = [
  {
    slug: 'meta',
    name: 'Meta',
    metaTitle: 'Meta Interview Prep for Product Sense, Systems, SQL, and Coding | HackProduct',
    metaDescription:
      'Prepare for Meta-style product sense, execution, system design, SQL, and coding interviews with HackProduct practice directories and AI coaching.',
    summary: 'Meta interviews reward structured thinking, metric fluency, user empathy, and clear trade-off communication under time pressure.',
    interviewStyle: 'Fast, signal-heavy loops that test whether you can structure ambiguity and defend decisions.',
    roles: ['Product Manager', 'Software Engineer', 'Data Engineer', 'Engineering Manager'],
    practiceAreas: ['Product sense', 'Execution metrics', 'System design', 'SQL analytics', 'Coding communication'],
    sampleQuestions: [
      'How would you improve Facebook Groups discovery?',
      'Diagnose a drop in Instagram Reels creation.',
      'Design a notification system for billions of events.',
    ],
  },
  {
    slug: 'google',
    name: 'Google',
    metaTitle: 'Google Interview Prep for Product, System Design, SQL, and Coding | HackProduct',
    metaDescription:
      'Practice Google-style product sense, analytical, system design, SQL, and coding interviews with AI-guided feedback.',
    summary: 'Google-style loops value principled trade-offs, user-first product thinking, and rigorous technical reasoning.',
    interviewStyle: 'Open-ended prompts where candidates must make assumptions explicit and reason from first principles.',
    roles: ['Product Manager', 'Software Engineer', 'TPM', 'Data Analyst'],
    practiceAreas: ['Product design', 'Strategy', 'System design', 'Data modeling', 'Algorithms'],
    sampleQuestions: [
      'How would you improve Google Maps for commuters?',
      'Design YouTube recommendations for a new market.',
      'Model search quality events for experimentation.',
    ],
  },
  {
    slug: 'amazon',
    name: 'Amazon',
    metaTitle: 'Amazon Interview Prep for Product Judgment and Technical Loops | HackProduct',
    metaDescription:
      'Prepare for Amazon product, engineering, system design, SQL, and leadership-oriented interview loops with HackProduct.',
    summary: 'Amazon interviews often connect product decisions to customer obsession, operational scale, and crisp ownership.',
    interviewStyle: 'Scenario-driven loops that expect strong examples, trade-offs, metrics, and operational thinking.',
    roles: ['Product Manager', 'Software Development Engineer', 'Data Engineer', 'Engineering Manager'],
    practiceAreas: ['Customer problems', 'Operational metrics', 'System reliability', 'SQL', 'Coding'],
    sampleQuestions: [
      'How would you improve Prime delivery reliability?',
      'Design a product review abuse detection system.',
      'Analyze why checkout conversion dropped after a launch.',
    ],
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    metaTitle: 'Stripe Interview Prep for Product-Minded Engineers | HackProduct',
    metaDescription:
      'Practice Stripe-style product, system design, data modeling, API, SQL, and coding scenarios with AI coaching from HackProduct.',
    summary: 'Stripe-style interviews reward API taste, systems clarity, data correctness, and product judgment for developer-facing products.',
    interviewStyle: 'Builder-focused loops where technical architecture and customer experience are tightly linked.',
    roles: ['Software Engineer', 'Product Manager', 'Data Engineer', 'Engineering Manager'],
    practiceAreas: ['API design', 'Payments data modeling', 'Reliability trade-offs', 'Developer experience', 'SQL'],
    sampleQuestions: [
      'Design payment retry logic for a subscription product.',
      'Model balances, payouts, disputes, and audit trails.',
      'Prioritize developer experience improvements for checkout.',
    ],
  },
  {
    slug: 'microsoft',
    name: 'Microsoft',
    metaTitle: 'Microsoft Interview Prep for Product Judgment and Engineering Loops | HackProduct',
    metaDescription:
      'Practice product sense, system design, data modeling, coding, and product judgment for Microsoft-style interviews.',
    summary: 'Microsoft interviews often connect customer empathy, platform trade-offs, collaboration, and engineering judgment.',
    interviewStyle: 'Structured product and technical loops where candidates must combine clarity, depth, and pragmatic prioritization.',
    roles: ['Product Manager', 'Software Engineer', 'Data Engineer', 'Engineering Manager'],
    practiceAreas: ['Product sense', 'Platform systems', 'Data modeling', 'Coding', 'Collaboration'],
    sampleQuestions: [
      'How would you improve Teams meeting reliability?',
      'Design a permissions model for enterprise collaboration.',
      'Prioritize latency, quality, and adoption for a productivity feature.',
    ],
  },
  {
    slug: 'google-pm-interview',
    name: 'Google PM',
    metaTitle: 'Google PM Interview Prep for Product Sense and Strategy | HackProduct',
    metaDescription:
      'Practice the Google PM interview loop: product sense, analytical estimation, strategy, and technical reasoning, scored by Hatch and mapped to FLOW.',
    summary:
      'The Google PM loop rewards principled trade-offs, user-first product judgment, and reasoning you can defend from first principles rather than a memorized framework.',
    interviewStyle:
      'Open-ended prompts where the interviewer expects you to make assumptions explicit, structure the space, and show the reasoning behind the recommendation.',
    roles: ['Associate Product Manager', 'Product Manager', 'Senior Product Manager', 'Technical Program Manager'],
    practiceAreas: ['Product design', 'Product strategy', 'Analytical estimation', 'Metrics diagnosis', 'System reasoning'],
    sampleQuestions: [
      'How would you improve Google Maps for daily commuters?',
      'Pick a metric for YouTube Shorts and defend why it matters.',
      'A core Search feature loses 10% of queries after a launch. Where do you look first?',
    ],
    ctaLabel: 'Find your product-thinking archetype',
    ctaHref: '/quiz/archetype',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
  },
  {
    slug: 'meta-product-sense',
    name: 'Meta Product Sense',
    metaTitle: 'Meta Product Sense Interview Prep for Engineers and PMs | HackProduct',
    metaDescription:
      'Prepare for the Meta product sense interview: framing ambiguity, choosing execution metrics, and defending trade-offs under a fast signal-heavy loop.',
    summary:
      'Meta product sense interviews move fast and read for signal. The bar is whether you can structure an ambiguous prompt, choose the metric that matters, and defend a decision without stalling.',
    interviewStyle:
      'Fast loops that reward a clean structure, a metric you can justify, and a recommendation you hold under follow-up pressure instead of retreating to hedged answers.',
    roles: ['Product Manager', 'Software Engineer moving toward product', 'Data Engineer', 'Engineering Manager'],
    practiceAreas: ['Product sense framing', 'Execution metrics', 'Growth reasoning', 'Trade-off communication', 'Follow-up pressure'],
    sampleQuestions: [
      'How would you improve discovery in Facebook Groups?',
      'Reels creation dropped 12% week over week. Diagnose it.',
      'Choose the north star metric for Instagram Threads and explain the guardrail.',
    ],
    ctaLabel: 'Find your product-thinking archetype',
    ctaHref: '/quiz/archetype',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
  },
  {
    slug: 'stripe-interview-prep',
    name: 'Stripe',
    metaTitle: 'Stripe Interview Prep for Product-Minded Engineers | HackProduct',
    metaDescription:
      'Practice the Stripe interview loop: API taste, payments data modeling, reliability trade-offs, and developer-experience judgment, with Hatch coaching.',
    summary:
      'Stripe loops read for API taste and systems clarity. The work is developer-facing, so architecture and customer experience are judged as one decision, not two separate rounds.',
    interviewStyle:
      'Builder-focused loops where the interviewer ties technical architecture to the developer experience and expects you to reason about correctness, reliability, and API design together.',
    roles: ['Software Engineer', 'Product Manager', 'Data Engineer', 'Engineering Manager'],
    practiceAreas: ['API design', 'Payments data modeling', 'Reliability trade-offs', 'Developer experience', 'SQL analytics'],
    sampleQuestions: [
      'Design idempotent retry logic for a subscription billing product.',
      'Model balances, payouts, disputes, and audit trails for a payments ledger.',
      'Prioritize three developer-experience fixes for a checkout integration.',
    ],
    ctaLabel: 'Find your product-thinking archetype',
    ctaHref: '/quiz/archetype',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
  },
]

export const STUDY_PLAN_DIRECTORIES: StudyPlanDirectoryEntry[] = [
  {
    slug: 'engineer-to-product',
    title: 'Engineer to product-minded builder',
    metaTitle: 'Engineer to Product Study Plan | HackProduct',
    metaDescription:
      'A public preview of HackProduct’s study plan for engineers building product sense, metrics fluency, prioritization, and interview judgment.',
    summary: 'A sequenced path for engineers who want to speak product, make sharper decisions, and move toward PM or staff-level influence.',
    weeks: 6,
    level: 'Intermediate',
    audience: 'Software engineers, data engineers, ML engineers, and founding engineers',
    chapters: ['Product sense foundations', 'Metrics and diagnosis', 'Prioritization under constraints', 'Stakeholder trade-offs', 'AI product judgment', 'Live interview synthesis'],
    outcomes: ['Think beyond implementation', 'Diagnose product metrics', 'Frame trade-offs for leadership', 'Answer product sense interviews clearly'],
  },
  {
    slug: 'ai-product-sense',
    title: 'AI product sense foundations',
    metaTitle: 'AI Product Sense Study Plan | HackProduct',
    metaDescription:
      'Practice AI product judgment: model behavior, evaluations, trust, latency, UX, and product strategy in the LLM era.',
    summary: 'A plan for builders shipping AI products who need to reason about value, reliability, evaluation, and user trust.',
    weeks: 4,
    level: 'Intermediate',
    audience: 'PMs, engineers, founders, and AI builders',
    chapters: ['AI product primitives', 'Trust and evaluation', 'Agentic workflows', 'Cost and latency trade-offs'],
    outcomes: ['Define AI product value', 'Design practical evals', 'Prioritize model quality vs. UX speed', 'Communicate AI trade-offs'],
  },
  {
    slug: 'staff-engineer-product-strategy',
    title: 'Staff engineer product strategy',
    metaTitle: 'Product Strategy Study Plan for Staff Engineers | HackProduct',
    metaDescription:
      'A HackProduct study plan for senior and staff engineers who need product judgment, influence, strategy, and system trade-off communication.',
    summary: 'A path for senior engineers whose next level depends on judgment, influence, and business context as much as code.',
    weeks: 5,
    level: 'Advanced',
    audience: 'Senior, staff, and principal engineers',
    chapters: ['Problem framing', 'Business constraints', 'System strategy', 'Influence narratives', 'Executive recommendations'],
    outcomes: ['Connect architecture to product outcomes', 'Communicate trade-offs to executives', 'Lead ambiguous technical decisions'],
  },
  {
    slug: 'system-design-data-modeling',
    title: 'System design and data modeling sprint',
    metaTitle: 'System Design and Data Modeling Study Plan | HackProduct',
    metaDescription:
      'Practice system design and data modeling together: requirements, entities, APIs, storage, scaling, and trade-offs.',
    summary: 'A technical interview sprint that treats systems and data models as one coherent product architecture skill.',
    weeks: 4,
    level: 'Intermediate',
    audience: 'Backend, full-stack, data, and platform engineers',
    chapters: ['Requirements and constraints', 'Entities and relationships', 'APIs and access patterns', 'Scale and reliability'],
    outcomes: ['Design cleaner schemas', 'Map data flow', 'Defend storage choices', 'Explain architecture trade-offs'],
  },
  {
    slug: 'ai-native-data-fluency',
    title: 'AI-native data fluency',
    metaTitle: 'AI-Native Data Fluency Study Plan | HackProduct',
    metaDescription:
      'Build data analyst judgment by driving a live Claude Code agent against real datasets: schema reading, funnel analysis, segmentation, reporting, and reusable skills.',
    summary: 'A plan for builders who want to investigate data with an AI agent and reach a defensible answer, not just run a query.',
    weeks: 4,
    level: 'Intermediate',
    audience: 'Engineers, analysts, PMs, and founders working with data',
    chapters: ['Connect the tools and read the schema', 'Find the drop and segment it', 'Land a finding with a guardrail', 'Write the report and a reusable skill'],
    outcomes: ['Frame a metric question into an investigation', 'Isolate a cause by segmenting', 'Write a finding backed by a number', 'Encode the analysis as a reusable skill'],
  },
]

export const PRACTICE_DIRECTORIES: PracticeDirectoryEntry[] = [
  {
    slug: 'spotify-session-drop-product-sense',
    title: 'Diagnose a Spotify session drop',
    discipline: 'Product sense',
    metaTitle: 'Spotify Session Drop Product Sense Practice | HackProduct',
    metaDescription:
      'Practice a product sense scenario about diagnosing a session-length drop with metrics, hypotheses, prioritization, and AI feedback.',
    summary: 'A product sense preview for diagnosing product metrics when DAU is steady but engagement falls.',
    scenario: 'DAU is steady, but average session length has fallen 15% over six weeks. Engineering says nothing changed. Where do you start?',
    skills: ['Metric framing', 'Hypothesis ranking', 'Segment analysis', 'Recommendation clarity'],
    prompts: ['Which user segment do you inspect first?', 'What hypotheses explain flat DAU but lower session depth?', 'What would you ship or test first?'],
  },
  {
    slug: 'realtime-notification-system',
    title: 'Design a realtime notification system',
    discipline: 'System design',
    metaTitle: 'Realtime Notification System Design Practice | HackProduct',
    metaDescription:
      'Practice system design for realtime notifications: requirements, fan-out, queues, delivery guarantees, storage, and trade-offs.',
    summary: 'A system design preview for a high-volume notification product with clear trade-off pressure.',
    scenario: 'Design a realtime notification system for 50M users across mobile, web, and email channels.',
    skills: ['Requirements framing', 'Fan-out strategy', 'Queue design', 'Delivery guarantees', 'Reliability trade-offs'],
    prompts: ['What are the hard latency and durability requirements?', 'Where do you store notification state?', 'How do you handle retries and dedupe?'],
  },
  {
    slug: 'multi-tenant-saas-data-model',
    title: 'Model a multi-tenant SaaS data layer',
    discipline: 'Data modeling',
    metaTitle: 'Multi-Tenant SaaS Data Modeling Practice | HackProduct',
    metaDescription:
      'Practice data modeling for multi-tenant SaaS with tenant isolation, billing, usage metering, audit logs, and access patterns.',
    summary: 'A data modeling preview for a SaaS product that needs reliable tenant isolation and billing-grade usage data.',
    scenario: 'Model the data layer for a multi-tenant SaaS with per-tenant billing, usage metering, roles, and audit logs.',
    skills: ['Entity modeling', 'Tenant isolation', 'Billing events', 'Auditability', 'Access patterns'],
    prompts: ['Do tenants share tables, schemas, or databases?', 'Which events power invoices?', 'What audit records must be immutable?'],
  },
  {
    slug: 'sql-product-analytics-retention',
    title: 'Query product retention cohorts',
    discipline: 'SQL',
    metaTitle: 'SQL Retention Cohort Practice for Product Analytics | HackProduct',
    metaDescription:
      'Practice SQL for retention cohorts, product analytics, joins, date windows, and explaining assumptions.',
    summary: 'A SQL preview for converting messy product analytics questions into trustworthy cohort queries.',
    scenario: 'Given users, sessions, and subscription events, compute weekly retention by signup cohort.',
    skills: ['Cohort windows', 'Date truncation', 'Joins', 'Aggregation', 'Metric explanation'],
    prompts: ['What counts as retained?', 'How do you handle users with multiple sessions?', 'How would you explain the result to a PM?'],
  },
  {
    slug: 'ai-assisted-coding-debugging',
    title: 'Debug an AI-generated coding solution',
    discipline: 'Coding',
    metaTitle: 'AI-Assisted Coding Debugging Practice | HackProduct',
    metaDescription:
      'Practice coding in the AI era by debugging generated code, identifying edge cases, and explaining correctness.',
    summary: 'A coding preview focused on the durable engineering skill: checking AI output against constraints and edge cases.',
    scenario: 'An AI-generated solution passes sample tests for a sliding-window problem but fails production-like edge cases.',
    skills: ['Constraint framing', 'Edge cases', 'Complexity analysis', 'AI output review', 'Communication'],
    prompts: ['Which hidden edge case is most likely?', 'How do you prove the fix?', 'What complexity trade-off is acceptable?'],
  },
  {
    slug: 'analytics-funnel-drop-investigation',
    title: 'Investigate a funnel conversion drop',
    discipline: 'Analytics',
    metaTitle: 'Funnel Drop Investigation Practice with Live Data | HackProduct',
    metaDescription:
      'Drive a live Claude Code agent against a real BigQuery dataset to find where a funnel drops, segment the cause, and land a finding with a guardrail metric.',
    summary: 'A live analytics preview where you direct an AI agent through a real dataset to find the cause behind a conversion drop.',
    scenario: 'A checkout funnel is leaking. You direct a Claude Code agent against the live events table to rank the steps by drop, segment the worst one, and write the finding.',
    skills: ['Schema reading', 'Funnel measurement', 'Segmentation', 'Evidence', 'Guardrail metrics'],
    prompts: ['Which funnel step has the biggest drop, with the percentage?', 'Does the drop concentrate on mobile or desktop?', 'What guardrail would tell us if the fix backfired?'],
  },
]

export const GLOSSARY_DIRECTORIES: GlossaryDirectoryEntry[] = [
  {
    slug: 'product-sense',
    term: 'Product sense',
    metaTitle: 'Product Sense Definition and Practice | HackProduct Glossary',
    metaDescription:
      'Product sense means making good product decisions under ambiguity. Learn the definition, example, and how HackProduct helps you practice it.',
    definition: 'Product sense is the ability to identify user needs, define success, reason through trade-offs, and recommend what a product should do next.',
    whyItMatters: 'It is the durable skill that lets engineers and PMs turn technical work into user and business value.',
    example: 'Instead of saying “add AI search,” a product-sense answer asks who is failing to find what, which metric proves it, and whether AI is the right intervention.',
    related: ['north-star-metric', 'trade-off', 'retention-cohort'],
  },
  {
    slug: 'north-star-metric',
    term: 'North star metric',
    metaTitle: 'North Star Metric Definition and Examples | HackProduct Glossary',
    metaDescription:
      'A north star metric captures the core value a product delivers. Learn examples and practice product metrics with HackProduct.',
    definition: 'A north star metric is the primary measure that reflects the recurring value a product creates for users and the business.',
    whyItMatters: 'It keeps product teams from optimizing vanity metrics that do not represent durable value.',
    example: 'A music product might care more about weekly listening hours than signups because listening is the value users came for.',
    related: ['product-sense', 'retention-cohort', 'funnel-analysis'],
  },
  {
    slug: 'retention-cohort',
    term: 'Retention cohort',
    metaTitle: 'Retention Cohort Definition for Product Analytics | HackProduct Glossary',
    metaDescription:
      'A retention cohort groups users by start date and tracks whether they return. Learn the concept and practice cohort SQL.',
    definition: 'A retention cohort groups users by when they started and measures how many return or remain active over time.',
    whyItMatters: 'Retention reveals whether a product creates repeat value after the first session.',
    example: 'Users who signed up in week one may have 42% week-four retention, while week-two users may have 31%, suggesting an onboarding or acquisition-quality change.',
    related: ['north-star-metric', 'sql', 'funnel-analysis'],
  },
  {
    slug: 'event-taxonomy',
    term: 'Event taxonomy',
    metaTitle: 'Event Taxonomy Definition for Data Modeling | HackProduct Glossary',
    metaDescription:
      'An event taxonomy defines product analytics events and properties. Learn why it matters for data modeling and product decisions.',
    definition: 'An event taxonomy is the agreed structure for naming product events, properties, actors, and contexts in analytics data.',
    whyItMatters: 'Without a taxonomy, teams cannot trust funnels, cohorts, experiments, or AI-product evaluations.',
    example: 'A checkout taxonomy might separate checkout_started, payment_submitted, payment_failed, and order_completed with consistent cart and payment properties.',
    related: ['data-modeling', 'retention-cohort', 'funnel-analysis'],
  },
  {
    slug: 'api-contract',
    term: 'API contract',
    metaTitle: 'API Contract Definition for Product-Minded Engineers | HackProduct Glossary',
    metaDescription:
      'An API contract defines how systems communicate. Learn the definition, product relevance, and interview examples.',
    definition: 'An API contract defines request and response shapes, behavior, errors, versioning, and expectations between systems.',
    whyItMatters: 'Good API contracts make developer experience, reliability, and product evolution easier to manage.',
    example: 'A payments API should clearly define idempotency behavior so clients can retry safely without double-charging customers.',
    related: ['system-design', 'data-modeling', 'trade-off'],
  },
  {
    slug: 'trade-off',
    term: 'Trade-off',
    metaTitle: 'Trade-Off Definition for Product and Engineering Interviews | HackProduct Glossary',
    metaDescription:
      'A trade-off is a decision between competing values like speed, quality, reliability, cost, or user experience.',
    definition: 'A trade-off is a decision where improving one important quality makes another important quality worse.',
    whyItMatters: 'Strong candidates do not pretend every option is free. They name the criterion that decides between competing values.',
    example: 'Choosing stronger consistency may improve correctness but increase latency and operational cost.',
    related: ['product-sense', 'system-design', 'api-contract'],
  },
]

export const COMPARISON_DIRECTORIES = {
  leetcode: {
    title: 'HackProduct as a LeetCode alternative for product judgment',
    metaTitle: 'LeetCode Alternative for Product Sense, Systems, SQL, and AI Interviews | HackProduct',
    metaDescription:
      'HackProduct is a LeetCode alternative for AI-era tech careers: practice product sense, system design, data modeling, SQL, coding communication, and live interviews.',
    summary:
      'LeetCode trains algorithm repetition. HackProduct trains the broader judgment layer: product sense, system design, data modeling, SQL, AI-assisted coding, and live interview communication.',
    comparisons: [
      ['Primary skill', 'Algorithm recall and coding speed', 'Product-minded technical judgment'],
      ['Interview formats', 'Mostly coding prompts', 'Product sense, systems, SQL, data modeling, coding, and live interviews'],
      ['AI-era relevance', 'Useful, but narrower as code generation improves', 'Built around judgment, communication, and deciding what should be built'],
      ['Feedback', 'Pass/fail test cases', 'Rubric feedback from Hatch across framing, trade-offs, and recommendation quality'],
    ],
  },
}

export const ROLE_TRANSITION_DIRECTORIES: RoleTransitionDirectoryEntry[] = [
  {
    slug: 'swe-to-pm',
    title: 'Software engineer to product manager',
    shortTitle: 'SWE to PM',
    eyebrow: 'Software engineer to PM',
    metaTitle: 'Software Engineer to PM Transition Practice | HackProduct',
    metaDescription:
      'Move from software engineering into product management with reps on product sense, metrics, prioritization, and trade-off communication, scored by Hatch.',
    keywords: [
      'software engineer to product manager',
      'swe to pm transition',
      'engineer to pm interview',
      'product sense for software engineers',
      'become a product manager from engineering',
    ],
    heroTitle: 'You can ship the feature. Now practice choosing which feature is worth shipping.',
    heroSubtitle:
      'The move from software engineering to product management is not a vocabulary swap. The technical depth carries over. The judgment underneath a product decision, framing ambiguity, naming a trade-off, defending a recommendation, is a separate skill, and it is trainable with reps.',
    summary:
      'Software engineers already reason in systems and trade-offs. The PM transition routes that instinct toward user outcomes and business impact instead of implementation detail.',
    ctaLabel: 'Find your product-thinking archetype',
    ctaHref: '/quiz/archetype',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
    whatChanges: [
      {
        title: 'The question moves from how to why',
        body: 'Writing the code proved the thing could be built. The PM question is whether it was worth building at all, and for whom, before anyone opens an editor.',
      },
      {
        title: 'Ambiguity becomes the job',
        body: 'A vague ticket used to mean someone skipped the spec. In product work the ambiguity is the assignment, and framing it well is the first move rather than a blocker.',
      },
      {
        title: 'Trade-offs get said out loud',
        body: 'Engineers make trade-offs constantly and keep most of them in their head. Product work means naming the trade-off in a room and defending the one you picked.',
      },
    ],
    flowTracks: [
      {
        eyebrow: 'Frame',
        title: 'Diagnose before you propose',
        body: 'Take a vague signal, usage dropped or a competitor shipped something, and find the real problem before reaching for a fix.',
      },
      {
        eyebrow: 'List',
        title: 'Widen the option space',
        body: 'Generate more than the first two ideas, including the option to do nothing, and account for everyone the decision touches.',
      },
      {
        eyebrow: 'Optimize',
        title: 'Pick a criterion and defend it',
        body: 'State what you are optimizing for, name the metric and the guardrail, and say what you will give up to get it.',
      },
      {
        eyebrow: 'Win',
        title: 'Land a recommendation someone can act on',
        body: 'Write the decision in one sentence: what you will do, how you will know it worked, and how you will know it failed.',
      },
    ],
    proofPoints: [
      {
        title: 'Product sense reps built for technical backgrounds',
        body: 'Scenarios that respect what you already know about systems and data, then push you to apply it to user and business outcomes.',
      },
      {
        title: 'Hatch grades reasoning, not vocabulary',
        body: 'Feedback targets the move you missed, a skipped stakeholder or a preference dressed up as a trade-off, instead of rewarding buzzwords.',
      },
      {
        title: 'A skill map that shows where you actually stand',
        body: 'Six competencies tracked from your practice history, not from a self-assessment form you filled out about yourself.',
      },
    ],
    audience: [
      {
        title: 'Engineers interviewing for PM or APM roles',
        body: 'Practice the product sense round the way it gets graded, with follow-up pressure instead of one static answer.',
      },
      {
        title: 'Engineers doing product work without the title',
        body: 'Senior engineers who already own roadmap calls and want sharper judgment, not a certificate.',
      },
      {
        title: 'Founding engineers and early hires',
        body: 'Small teams where the person writing the code also decides what to build next.',
      },
    ],
    faqs: [
      {
        q: 'Do I need to leave engineering to benefit from this?',
        a: 'No. The same reps sharpen product judgment whether you change titles or stay technical and start owning roadmap decisions.',
      },
      {
        q: 'How is this different from reading PM frameworks?',
        a: 'Frameworks tell you the moves. This gives you reps at making them under ambiguity, then critiques the reasoning you actually used.',
      },
    ],
  },
  {
    slug: 'staff-engineer-promotion',
    title: 'Staff engineer promotion prep',
    shortTitle: 'Staff promotion',
    eyebrow: 'Senior to staff engineer',
    metaTitle: 'Staff Engineer Promotion Prep for Product Judgment | HackProduct',
    metaDescription:
      'Build the promotion signal that moves senior engineers to staff: product strategy, architecture trade-offs, and recommendations leaders can act on.',
    keywords: [
      'staff engineer promotion',
      'senior to staff engineer',
      'staff engineer interview prep',
      'promotion to staff engineer',
      'staff engineer product judgment',
    ],
    heroTitle: 'The staff jump is judgment, not more code.',
    heroSubtitle:
      'Senior engineers who reach staff make the next decision easier for everyone else in the room. That means framing ambiguous bets, connecting architecture to outcomes, and writing recommendations leaders can act on without a follow-up meeting. Those are the reps here.',
    summary:
      'Promotion to staff shows up when your answer reduces uncertainty for the whole team. This path trains the framing, trade-off, and communication moves that make that level visible.',
    ctaLabel: 'Find your product-thinking archetype',
    ctaHref: '/quiz/archetype',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
    whatChanges: [
      {
        title: 'Scope stops being a single system',
        body: 'The senior job is to build the thing well. The staff job is to decide which thing, why now, and what it means for the systems next to it.',
      },
      {
        title: 'Influence replaces raw output',
        body: 'At staff level the signal is whether your framing changes what other people build, not how many lines you shipped this quarter.',
      },
      {
        title: 'Executives read your reasoning',
        body: 'A pull request is read by engineers. A staff recommendation is read by a director with five minutes who needs the trade-off in one sentence.',
      },
    ],
    flowTracks: [
      {
        eyebrow: 'Frame',
        title: 'Frame the bet before the design',
        body: 'Turn an ambiguous initiative into a clear problem statement with the constraint that actually decides the outcome.',
      },
      {
        eyebrow: 'List',
        title: 'Map the option space and the blast radius',
        body: 'Lay out structurally different approaches and name the systems and teams each one touches.',
      },
      {
        eyebrow: 'Optimize',
        title: 'Choose the criterion out loud',
        body: 'Name what you are optimizing for across reliability, cost, and speed, and defend the sacrifice you accept.',
      },
      {
        eyebrow: 'Win',
        title: 'Write the recommendation leaders act on',
        body: 'One decision, the metric that proves it worked, and the signal that would tell you to reverse course.',
      },
    ],
    proofPoints: [
      {
        title: 'Staff-level reasoning reps, not trivia',
        body: 'Scenarios that connect architecture choices to product outcomes, the exact bridge a promotion packet needs to show.',
      },
      {
        title: 'Hatch critiques the missing move',
        body: 'Feedback points at the skipped constraint or the trade-off you dodged, so you fix the reasoning, not the phrasing.',
      },
      {
        title: 'A history that reads like promotion evidence',
        body: 'Saved reps become an evidence trail of judgment across framing, trade-offs, and executive communication.',
      },
    ],
    audience: [
      {
        title: 'Senior engineers targeting the staff jump',
        body: 'Practice the judgment your promotion committee is looking for before the review cycle, not during it.',
      },
      {
        title: 'Tech leads owning ambiguous bets',
        body: 'Engineers already making calls that touch multiple teams who want sharper framing and defensible trade-offs.',
      },
      {
        title: 'Staff candidates prepping the interview loop',
        body: 'Practice the strategy and system-trade-off rounds with follow-up pressure instead of a rehearsed monologue.',
      },
    ],
    faqs: [
      {
        q: 'Is this only for interview loops?',
        a: 'No. The same reps build the on-the-job signal a promotion committee looks for and the answers an external staff loop tests.',
      },
      {
        q: 'What is the promotion signal you keep referring to?',
        a: 'It is whether your reasoning makes the next decision easier for everyone else. This path trains and surfaces exactly that.',
      },
    ],
  },
  {
    slug: 'em-interview-prep',
    title: 'Engineering manager interview prep',
    shortTitle: 'EM interview prep',
    eyebrow: 'IC to engineering manager',
    metaTitle: 'Engineering Manager Interview Prep for Judgment and Trade-offs | HackProduct',
    metaDescription:
      'Prepare for the engineering manager interview: prioritization under constraints, cross-team trade-offs, and decisions you can defend to leadership.',
    keywords: [
      'engineering manager interview prep',
      'em interview questions',
      'engineering manager interview',
      'ic to engineering manager',
      'engineering manager product judgment',
    ],
    heroTitle: 'The EM loop tests decisions, not delegation theater.',
    heroSubtitle:
      'Engineering manager interviews read for judgment under constraint: how you prioritize when three teams want the same sprint, how you name a trade-off leadership can live with, and how you land a decision without stalling. That is the practice here, drop into the situation and make the call.',
    summary:
      'The EM interview is a judgment test wearing a management costume. This path trains prioritization, cross-team trade-offs, and clear recommendations under time pressure.',
    ctaLabel: 'Find your product-thinking archetype',
    ctaHref: '/quiz/archetype',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
    whatChanges: [
      {
        title: 'Priorities collide instead of queue',
        body: 'The IC job is to finish the work. The EM job is to decide whose work waits when the sprint cannot hold all of it.',
      },
      {
        title: 'You defend the trade-off, not the code',
        body: 'The interview reads whether you can name what you gave up and why leadership should accept it, calmly, under follow-up.',
      },
      {
        title: 'The decision has to be legible',
        body: 'A good EM answer leaves the room knowing what was decided, how it will be measured, and what would change it.',
      },
    ],
    flowTracks: [
      {
        eyebrow: 'Frame',
        title: 'Frame the real constraint',
        body: 'Separate the loud request from the underlying problem before committing a team to a direction.',
      },
      {
        eyebrow: 'List',
        title: 'Lay out the options and who they affect',
        body: 'Put structurally different plans on the table and account for every team and stakeholder each one touches.',
      },
      {
        eyebrow: 'Optimize',
        title: 'Prioritize against a named criterion',
        body: 'Say what you are optimizing for, name the metric and the guardrail, and hold the line on the sacrifice.',
      },
      {
        eyebrow: 'Win',
        title: 'Make the call and make it reversible',
        body: 'Land one recommendation with a measure of success and a visible path to change course if the bet is wrong.',
      },
    ],
    proofPoints: [
      {
        title: 'Scenarios that read like real management calls',
        body: 'Competing priorities, cross-team friction, and a leadership audience, the situations the EM loop actually probes.',
      },
      {
        title: 'Hatch grades the decision quality',
        body: 'Feedback targets the stakeholder you skipped or the criterion you never named, not the tone of your answer.',
      },
      {
        title: 'Follow-up pressure built in',
        body: 'Practice holding a decision when the interviewer pushes back, which is where most EM answers unravel.',
      },
    ],
    audience: [
      {
        title: 'ICs moving into their first management loop',
        body: 'Practice the judgment rounds before the interview, so the leap feels like a rep you have already run.',
      },
      {
        title: 'Tech leads formalizing into management',
        body: 'Engineers already coordinating teams who want to defend prioritization calls under scrutiny.',
      },
      {
        title: 'EMs interviewing for a bigger scope',
        body: 'Managers targeting a senior EM or director loop who need cross-team trade-off reps.',
      },
    ],
    faqs: [
      {
        q: 'Do you cover people-management scenarios too?',
        a: 'The focus is decision judgment, prioritization, and trade-off communication, the part of the EM loop that separates candidates most.',
      },
      {
        q: 'Is this useful if I already manage a team?',
        a: 'Yes. The reps sharpen the framing and trade-off moves that a larger-scope loop or a promotion review tests.',
      },
    ],
  },
]

export const ALTERNATIVE_DIRECTORIES: AlternativeDirectoryEntry[] = [
  {
    slug: 'exponent-alternative',
    competitor: 'Exponent',
    eyebrow: 'Exponent alternative',
    metaTitle: 'Exponent Alternative for Product Sense and Live Interview Reps | HackProduct',
    metaDescription:
      'HackProduct is an Exponent alternative built on graded reps: product sense, system design, SQL, and live interview pressure with Hatch feedback.',
    keywords: [
      'exponent alternative',
      'exponent interview prep alternative',
      'product sense practice alternative',
      'ai interview coaching',
      'live mock interview practice',
    ],
    heroTitle: 'Practice the reps, not the lecture library.',
    summary:
      'Exponent leans on course videos and peer mocks. HackProduct is rep-based: you answer real scenarios, Hatch critiques the reasoning move you missed, and the product tracks which part of your judgment keeps breaking.',
    ctaLabel: 'Try a product-sense rep',
    ctaHref: '/quiz/product-sense',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
    comparisons: [
      ['Core format', 'Course videos plus scheduled peer mocks', 'Graded reps with instant Hatch feedback'],
      ['Feedback source', 'Peers and coaches when available', 'Hatch critiques your reasoning on every attempt'],
      ['Progress signal', 'Videos watched and mocks booked', 'A skill map of six competencies from your practice history'],
      ['AI-era coverage', 'Product and PM interview tracks', 'Product sense, systems, SQL, coding, and AI-native workflows'],
    ],
    betterFit: [
      'You want feedback on reasoning quality, not only a video walkthrough.',
      'You would rather run a rep now than schedule a peer mock for next week.',
      'You are an engineer who wants product judgment reps, not a PM-only curriculum.',
      'You want a running map of where your judgment breaks, not a course-completion bar.',
    ],
    closingTitle: 'Keep the videos if you like them. Add the reps that grade your reasoning.',
    closingSubtitle:
      'Public previews show the map. The app gives you reps, Hatch follow-ups, FLOW feedback, weak-move drills, and saved proof of progress.',
  },
  {
    slug: 'igotanoffer-alternative',
    competitor: 'IGotAnOffer',
    eyebrow: 'IGotAnOffer alternative',
    metaTitle: 'IGotAnOffer Alternative for Practice Reps and AI Feedback | HackProduct',
    metaDescription:
      'HackProduct is an IGotAnOffer alternative built on graded practice reps and Hatch feedback across product sense, systems, SQL, and live interviews.',
    keywords: [
      'igotanoffer alternative',
      'igotanoffer interview prep alternative',
      'product interview practice alternative',
      'ai interview feedback',
      'product sense reps',
    ],
    heroTitle: 'Read the guides anywhere. Get the reps and feedback here.',
    summary:
      'IGotAnOffer sells answer guides and coach hours. HackProduct trains judgment through graded reps: you make the call, Hatch names the move you skipped, and your history becomes evidence of how you reason.',
    ctaLabel: 'Try a product-sense rep',
    ctaHref: '/quiz/product-sense',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
    comparisons: [
      ['Core format', 'Written answer guides and paid coach sessions', 'Graded reps with instant Hatch feedback'],
      ['Cost model', 'Per-hour coaching adds up fast', 'Practice as many reps as you want, then upgrade for depth'],
      ['Feedback loop', 'Delayed, tied to a booked session', 'Immediate critique on the reasoning you just used'],
      ['Skill tracking', 'None beyond the guide you bought', 'A competency map that updates as you practice'],
    ],
    betterFit: [
      'You want to practice the move, not memorize a model answer.',
      'You would rather get feedback now than wait for a coaching slot.',
      'You are an engineer who wants judgment reps across disciplines, not one track.',
      'You want proof of progress you can point at, not a folder of guides.',
    ],
    closingTitle: 'Keep the guides for reference. Add the reps that build the judgment.',
    closingSubtitle:
      'Public previews show the map. The app gives you reps, Hatch follow-ups, FLOW feedback, weak-move drills, and saved proof of progress.',
  },
  {
    slug: 'leetcode-for-product',
    competitor: 'LeetCode',
    eyebrow: 'LeetCode for product',
    metaTitle: 'LeetCode for Product: Practice Product Judgment, Not Just Algorithms | HackProduct',
    metaDescription:
      'HackProduct is LeetCode for product thinking: graded reps on product sense, system design, SQL, and live interview communication with Hatch feedback.',
    keywords: [
      'leetcode for product',
      'leetcode for product managers',
      'product sense practice',
      'product interview reps',
      'product thinking practice',
    ],
    heroTitle: 'The rep engine, pointed at product judgment.',
    summary:
      'LeetCode made algorithm practice a daily habit through sheer volume of graded reps. HackProduct does the same thing for the judgment layer: product sense, systems, SQL, and live interview communication, each scored and tracked.',
    ctaLabel: 'Try a product-sense rep',
    ctaHref: '/quiz/product-sense',
    secondaryLabel: 'Start free',
    secondaryHref: '/signup',
    comparisons: [
      ['Primary skill', 'Algorithm recall and coding speed', 'Product-minded judgment across disciplines'],
      ['Rep model', 'Endless graded coding problems', 'Endless graded product and reasoning scenarios'],
      ['Feedback', 'Pass or fail test cases', 'Hatch critique across framing, trade-offs, and recommendation quality'],
      ['AI-era relevance', 'Narrows as code generation improves', 'Built around deciding what to build and why'],
    ],
    betterFit: [
      'You liked the daily-rep habit of LeetCode and want it for product thinking.',
      'You want feedback on reasoning, not only a green or red test result.',
      'You are an engineer who wants product judgment reps alongside coding.',
      'You want a competency map that shows which reasoning move keeps failing.',
    ],
    closingTitle: 'Keep LeetCode for algorithms. Add HackProduct for product judgment.',
    closingSubtitle:
      'Public previews show the map. The app gives you reps, Hatch follow-ups, FLOW feedback, weak-move drills, and saved proof of progress.',
  },
]

export function getSkill(slug: string) {
  return SKILL_DIRECTORIES.find((entry) => entry.slug === slug) ?? null
}

export function getRoleTransition(slug: string) {
  return ROLE_TRANSITION_DIRECTORIES.find((entry) => entry.slug === slug) ?? null
}

export function getAlternative(slug: string) {
  return ALTERNATIVE_DIRECTORIES.find((entry) => entry.slug === slug) ?? null
}

export function getCompany(slug: string) {
  return COMPANY_DIRECTORIES.find((entry) => entry.slug === slug) ?? null
}

export function getStudyPlan(slug: string) {
  return STUDY_PLAN_DIRECTORIES.find((entry) => entry.slug === slug) ?? null
}

export function getPractice(slug: string) {
  return PRACTICE_DIRECTORIES.find((entry) => entry.slug === slug) ?? null
}

export function getGlossaryTerm(slug: string) {
  return GLOSSARY_DIRECTORIES.find((entry) => entry.slug === slug) ?? null
}

export const PUBLIC_DIRECTORY_PATHS = [
  '/',
  '/v3',
  '/about',
  '/interview-prep',
  '/role-transitions',
  '/role-transitions/engineer-to-product-manager',
  ...ROLE_TRANSITION_DIRECTORIES.map((entry) => `/role-transitions/${entry.slug}`),
  '/uplevel',
  '/salary-negotiation',
  '/flow',
  '/skills',
  ...SKILL_DIRECTORIES.map((entry) => `/skills/${entry.slug}`),
  '/companies',
  ...COMPANY_DIRECTORIES.map((entry) => `/companies/${entry.slug}`),
  '/study-plans',
  ...STUDY_PLAN_DIRECTORIES.map((entry) => `/study-plans/${entry.slug}`),
  '/practice',
  ...PRACTICE_DIRECTORIES.map((entry) => `/practice/${entry.slug}`),
  '/autopsies',
  ...companyHubs.map((entry) => `/autopsies/${entry.slug}`),
  ...autopsyStories
    .filter((entry) => entry.status === 'published')
    .map((entry) => entry.canonicalPath),
  '/glossary',
  ...GLOSSARY_DIRECTORIES.map((entry) => `/glossary/${entry.slug}`),
  '/interviews/live-ai-interviews',
  '/claude-code-analytics',
  '/alternatives/leetcode',
  ...ALTERNATIVE_DIRECTORIES.map((entry) => `/alternatives/${entry.slug}`),
  '/quiz/archetype',
  '/quiz/product-sense',
  '/pricing',
  '/contact',
  '/security',
  '/privacy',
  '/terms',
  '/help',
  '/changelog',
  '/waitlist',
]

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: imageUrl('/images/logo.png'),
    description: HACKPRODUCT_POSITIONING.llmSummary,
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: HACKPRODUCT_POSITIONING.llmSummary,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/practice?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE_NAME,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    image: imageUrl(),
    description: HACKPRODUCT_POSITIONING.llmSummary,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free starting access with paid plans for advanced practice.',
    },
  }
}

export function itemListJsonLd(name: string, items: DirectoryLink[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => {
      const listItem: {
        '@type': 'ListItem'
        position: number
        name: string
        url: string
        description?: string
      } = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        url: canonicalUrl(item.href),
      }
      if (item.description) listItem.description = item.description
      return listItem
    }),
  }
}
