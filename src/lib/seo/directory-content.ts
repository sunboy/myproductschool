import { canonicalUrl, imageUrl, SITE_NAME, SITE_URL } from './site'

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
  headline: 'The AI-native learning platform for product-minded engineers.',
  subhead:
    'Practice product sense, system design, data modeling, SQL, coding, and live interviews with Hatch coaching you in real time. Build the judgment AI cannot hand you.',
  llmSummary:
    'HackProduct helps engineers, PMs, data builders, and students practice durable tech judgment in an AI world: product sense, systems thinking, data modeling, SQL, coding, and live interview communication.',
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

export function getSkill(slug: string) {
  return SKILL_DIRECTORIES.find((entry) => entry.slug === slug) ?? null
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
  '/skills',
  ...SKILL_DIRECTORIES.map((entry) => `/skills/${entry.slug}`),
  '/companies',
  ...COMPANY_DIRECTORIES.map((entry) => `/companies/${entry.slug}`),
  '/study-plans',
  ...STUDY_PLAN_DIRECTORIES.map((entry) => `/study-plans/${entry.slug}`),
  '/practice',
  ...PRACTICE_DIRECTORIES.map((entry) => `/practice/${entry.slug}`),
  '/glossary',
  ...GLOSSARY_DIRECTORIES.map((entry) => `/glossary/${entry.slug}`),
  '/interviews/live-ai-interviews',
  '/alternatives/leetcode',
  '/pricing',
  '/privacy',
  '/terms',
  '/waitlist',
]

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: imageUrl('/images/hackylogo.png'),
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
