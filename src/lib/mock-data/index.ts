import { Domain, Concept, Flashcard, ChallengePrompt, CompanyProfile, LumaFeedbackItem } from '@/lib/types'

export const MOCK_DOMAINS: Domain[] = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    slug: 'product-strategy',
    title: 'Product Strategy',
    description: 'Vision, roadmaps, and strategic thinking for product decisions',
    icon: 'map',
    order_index: 1,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    slug: 'user-research',
    title: 'User Research',
    description: 'Understanding users through qualitative and quantitative methods',
    icon: 'person_search',
    order_index: 2,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000003',
    slug: 'metrics-analytics',
    title: 'Metrics & Analytics',
    description: 'Defining, measuring, and interpreting product metrics',
    icon: 'analytics',
    order_index: 3,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000004',
    slug: 'prioritization',
    title: 'Prioritization',
    description: 'Frameworks and decision-making for what to build next',
    icon: 'sort',
    order_index: 4,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000005',
    slug: 'go-to-market',
    title: 'Go-to-Market',
    description: 'Launch strategy, positioning, and driving product adoption',
    icon: 'rocket_launch',
    order_index: 5,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const MOCK_CONCEPTS: Concept[] = [
  // Product Strategy
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    title: 'Product Vision',
    definition: 'A concise statement of where a product is headed and the impact it will have on users and the business over a 3–5 year horizon.',
    example: 'Airbnb\'s early vision: "Belong anywhere" — not just rent a room, but feel at home anywhere in the world.',
    difficulty: 'beginner',
    tags: ['vision', 'strategy', 'alignment'],
    order_index: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    title: 'Product-Market Fit',
    definition: 'The degree to which a product satisfies a strong market demand. Often described as the moment users pull the product — growth becomes organic.',
    example: 'Slack: Teams started using it so heavily that when Slack tried to get feedback, users begged them not to change anything.',
    difficulty: 'intermediate',
    tags: ['pmf', 'growth', 'validation'],
    order_index: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    title: 'Strategic Moat',
    definition: 'A durable competitive advantage that makes it hard for competitors to replicate your product\'s value. Examples: network effects, switching costs, proprietary data.',
    example: 'LinkedIn\'s moat is its professional network — the more professionals join, the more valuable it becomes for everyone.',
    difficulty: 'intermediate',
    tags: ['competitive-advantage', 'moat', 'defensibility'],
    order_index: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    title: 'Jobs To Be Done (JTBD)',
    definition: 'A framework that reframes products as "hired" by users to do a job. Focus on the underlying motivation, not the feature request.',
    example: 'People don\'t buy a drill — they hire it to make a hole. They don\'t want a hole — they want a shelf on the wall.',
    difficulty: 'beginner',
    tags: ['jtbd', 'user-needs', 'framework'],
    order_index: 4,
    created_at: '2024-01-01T00:00:00Z',
  },
  // User Research
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    title: 'User Interview',
    definition: 'A qualitative research method where you have structured conversations with users to understand their problems, behaviors, and mental models.',
    example: 'Asking "Walk me through the last time you tried to book travel" reveals workflow pain points that a survey would miss.',
    difficulty: 'beginner',
    tags: ['qualitative', 'research', 'interviews'],
    order_index: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    title: 'Affinity Mapping',
    definition: 'A synthesis technique where you cluster research findings (quotes, observations) into themes to identify patterns across multiple data points.',
    example: 'After 10 user interviews about onboarding friction, affinity mapping reveals 3 dominant themes: confusion about pricing, lack of templates, and no in-app guidance.',
    difficulty: 'intermediate',
    tags: ['synthesis', 'research', 'patterns'],
    order_index: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    title: 'Persona',
    definition: 'A fictional but research-grounded representation of a user segment, capturing goals, frustrations, behaviors, and context.',
    example: 'Not "25-35 year old female" but "Sarah, a marketing manager who spends 3 hours/week on manual reporting and wants to prove ROI to leadership."',
    difficulty: 'beginner',
    tags: ['persona', 'segmentation', 'user-model'],
    order_index: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000008',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    title: 'Usability Testing',
    definition: 'Watching real users attempt to complete tasks in your product to identify where they struggle, get confused, or give up.',
    example: 'A 5-participant test reveals 80% of users can\'t find the "Export" button because it\'s buried in a submenu — more valuable than 500 survey responses.',
    difficulty: 'beginner',
    tags: ['usability', 'testing', 'qualitative'],
    order_index: 4,
    created_at: '2024-01-01T00:00:00Z',
  },
  // Metrics & Analytics
  {
    id: 'c1000000-0000-0000-0000-000000000009',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    title: 'North Star Metric',
    definition: 'A single metric that best captures the core value your product delivers to users, aligned with long-term business growth.',
    example: 'Spotify: Monthly Active Listeners (not subscribers — listening is the value). Airbnb: Nights Booked.',
    difficulty: 'beginner',
    tags: ['nsm', 'metrics', 'alignment'],
    order_index: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000010',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    title: 'Funnel Analysis',
    definition: 'Measuring drop-off rates at each step of a user journey (e.g., awareness → acquisition → activation → retention) to identify the biggest bottleneck.',
    example: 'If 1000 users sign up, 400 complete onboarding, 200 create a project, 100 invite a teammate — the biggest drop is onboarding, not activation.',
    difficulty: 'intermediate',
    tags: ['funnel', 'conversion', 'analytics'],
    order_index: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000011',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    title: 'Retention Cohort',
    definition: 'Grouping users by when they signed up and tracking what percentage remain active over time. The shape of the retention curve reveals product health.',
    example: 'A flat retention curve (e.g., D30 retention = 40%) means you\'ve found product-market fit. A curve that hits zero means you haven\'t.',
    difficulty: 'intermediate',
    tags: ['retention', 'cohort', 'churn'],
    order_index: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000012',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    title: 'A/B Testing',
    definition: 'A controlled experiment comparing two (or more) variants of a feature to determine which produces better outcomes on a defined metric.',
    example: 'Testing two onboarding flows: Variant A (3-step wizard) vs Variant B (video tour). Measure activation rate (first value moment within 7 days).',
    difficulty: 'intermediate',
    tags: ['experimentation', 'ab-testing', 'statistics'],
    order_index: 4,
    created_at: '2024-01-01T00:00:00Z',
  },
  // Prioritization
  {
    id: 'c1000000-0000-0000-0000-000000000013',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    title: 'ICE Scoring',
    definition: 'A prioritization framework: Impact × Confidence × Ease. Each factor rated 1-10, multiplied together to rank initiatives.',
    example: 'Feature A: Impact 8, Confidence 7, Ease 9 = ICE 504. Feature B: Impact 10, Confidence 4, Ease 3 = ICE 120. Feature A wins despite lower impact.',
    difficulty: 'beginner',
    tags: ['prioritization', 'framework', 'scoring'],
    order_index: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000014',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    title: 'Opportunity Scoring',
    definition: 'A user-research-driven prioritization method: rate the importance of a user outcome and their satisfaction with current solutions. High importance + low satisfaction = high opportunity.',
    example: 'Outcome: "Track my team\'s time accurately" — Importance: 8/10, Satisfaction: 3/10 = Opportunity score 13. High priority.',
    difficulty: 'intermediate',
    tags: ['prioritization', 'user-research', 'opportunity'],
    order_index: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000015',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    title: 'Now/Next/Later Roadmap',
    definition: 'A horizon-based roadmap format that avoids false precision by grouping initiatives into three buckets based on confidence and readiness.',
    example: 'Now: Mobile push notifications (scoped, eng ready). Next: AI-powered summaries (research done, needs design). Later: Enterprise SSO (customer-requested, not yet scoped).',
    difficulty: 'beginner',
    tags: ['roadmap', 'planning', 'communication'],
    order_index: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000016',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    title: 'Trade-off Analysis',
    definition: 'Explicitly mapping the costs of a decision against its benefits across multiple dimensions (speed, quality, cost, user impact) to make the right choice transparent.',
    example: 'Build vs Buy vs Partner for payments: Build = max control but 6 months. Buy (Stripe) = fast but vendor lock-in. Partner = revenue share. Choosing Stripe optimizes for speed to market.',
    difficulty: 'intermediate',
    tags: ['trade-offs', 'decision-making', 'analysis'],
    order_index: 4,
    created_at: '2024-01-01T00:00:00Z',
  },
  // Go-to-Market
  {
    id: 'c1000000-0000-0000-0000-000000000017',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    title: 'Product Positioning',
    definition: 'How you define your product\'s unique place in the market relative to alternatives — who it\'s for, what it does, and why it\'s different.',
    example: 'Notion: "The all-in-one workspace" positions against Confluence (too complex), Google Docs (too simple), and Asana (task-only) in one line.',
    difficulty: 'beginner',
    tags: ['positioning', 'marketing', 'differentiation'],
    order_index: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000018',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    title: 'Product-Led Growth (PLG)',
    definition: 'A go-to-market strategy where the product itself drives acquisition, activation, and expansion — users experience value before or instead of talking to sales.',
    example: 'Figma: Free to use, invite teammates to collaborate → they sign up → team needs pro features → company buys seats. Product drives the entire funnel.',
    difficulty: 'intermediate',
    tags: ['plg', 'growth', 'go-to-market'],
    order_index: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000019',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    title: 'Launch Tier',
    definition: 'A classification of launches by scope and impact, determining the level of cross-functional coordination, communications, and metrics tracking required.',
    example: 'Tier 3: internal only (no comms). Tier 2: blog post + in-app notification (limited coordination). Tier 1: press release + sales enablement + paid campaign (full coordination).',
    difficulty: 'intermediate',
    tags: ['launch', 'go-to-market', 'communication'],
    order_index: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c1000000-0000-0000-0000-000000000020',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    title: 'Activation Rate',
    definition: 'The percentage of new users who reach a defined "aha moment" within a set time window, indicating they\'ve experienced core product value.',
    example: 'Twitter\'s activation: Users who follow 30 accounts in first week retain at 2x the rate of those who don\'t. Activation = "follow 30 accounts within 7 days."',
    difficulty: 'beginner',
    tags: ['activation', 'onboarding', 'metrics'],
    order_index: 4,
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const MOCK_FLASHCARDS: Flashcard[] = [
  { id: 'f1000000-0000-0000-0000-000000000001', concept_id: 'c1000000-0000-0000-0000-000000000001', front: 'What is a product vision?', back: 'A concise statement of where a product is headed and the impact it will have over a 3–5 year horizon.', hint: 'Think long-term direction, not features.', created_at: '2024-01-01T00:00:00Z' },
  { id: 'f1000000-0000-0000-0000-000000000002', concept_id: 'c1000000-0000-0000-0000-000000000001', front: 'What makes a product vision effective?', back: 'It\'s inspiring, specific enough to guide decisions, and short enough to remember. It answers "what world are we trying to create?"', hint: 'Would a new team member be energized reading it?', created_at: '2024-01-01T00:00:00Z' },
  { id: 'f1000000-0000-0000-0000-000000000003', concept_id: 'c1000000-0000-0000-0000-000000000002', front: 'How do you know you have product-market fit?', back: 'Users are pulling the product — high organic retention, word-of-mouth growth, users upset at the thought of losing it. Sean Ellis test: >40% would be "very disappointed" without the product.', hint: 'PMF is felt, not calculated.', created_at: '2024-01-01T00:00:00Z' },
  { id: 'f1000000-0000-0000-0000-000000000004', concept_id: 'c1000000-0000-0000-0000-000000000002', front: 'What is the Sean Ellis PMF test?', back: 'Survey active users: "How would you feel if you could no longer use [product]?" If >40% say "very disappointed," you likely have PMF.', hint: 'A number threshold, not just a feeling.', created_at: '2024-01-01T00:00:00Z' },
  { id: 'f1000000-0000-0000-0000-000000000005', concept_id: 'c1000000-0000-0000-0000-000000000009', front: 'What is a North Star Metric?', back: 'A single metric that best captures the core value your product delivers to users, aligned with long-term growth.', hint: 'It\'s about user value, not revenue.', created_at: '2024-01-01T00:00:00Z' },
  { id: 'f1000000-0000-0000-0000-000000000006', concept_id: 'c1000000-0000-0000-0000-000000000009', front: 'What\'s wrong with using revenue as a North Star Metric?', back: 'Revenue is a lagging indicator — it reflects past user value. A good NSM leads revenue by capturing value delivery in real time.', hint: 'Leading vs lagging indicators.', created_at: '2024-01-01T00:00:00Z' },
  { id: 'f1000000-0000-0000-0000-000000000007', concept_id: 'c1000000-0000-0000-0000-000000000013', front: 'What does ICE stand for in prioritization?', back: 'Impact × Confidence × Ease. Each rated 1-10, multiplied together to rank initiatives.', hint: 'Three factors, one number.', created_at: '2024-01-01T00:00:00Z' },
  { id: 'f1000000-0000-0000-0000-000000000008', concept_id: 'c1000000-0000-0000-0000-000000000013', front: 'What\'s a limitation of ICE scoring?', back: 'It\'s subjective — different people score the same initiative differently. Works best when the whole team calibrates scores together.', hint: 'Alignment matters more than precision.', created_at: '2024-01-01T00:00:00Z' },
]

export const MOCK_CHALLENGES: ChallengePrompt[] = [
  {
    id: 'ch100000-0000-0000-0000-000000000001',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    title: 'Improve Spotify\'s podcast discovery',
    prompt_text: `You are a PM at Spotify. The podcasts team has noticed that despite having 5M+ podcast titles, only 8% of users who open the Podcasts tab ever save or follow a podcast.

Your task:
1. Diagnose the root cause of low discovery (what data would you look at, what hypotheses do you have?)
2. Identify the user segments most likely to convert and why
3. Propose 2–3 product changes that could improve podcast discovery and following
4. How would you measure success? Define a primary metric and 2 guardrail metrics.
5. What trade-offs do you see in your top proposal?`,
    difficulty: 'intermediate',
    tags: ['discovery', 'engagement', 'metrics', 'spotify'],
    estimated_minutes: 15,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ch100000-0000-0000-0000-000000000002',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    title: 'Build a product strategy for a B2B fintech entering payments',
    prompt_text: `You're joining a Series B fintech that has built a successful invoicing tool for SMBs (10k customers, $5M ARR). The CEO wants to expand into payments — letting customers accept card payments through the same platform.

1. What are the key strategic questions you'd need to answer before committing to payments?
2. Who are the main competitors and what would your differentiation be?
3. What does a successful first 6 months look like — what milestone proves the strategy is working?
4. What are the top 3 risks and how would you mitigate them?`,
    difficulty: 'advanced',
    tags: ['strategy', 'b2b', 'fintech', 'competitive'],
    estimated_minutes: 20,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ch100000-0000-0000-0000-000000000003',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    title: 'Design a user research plan for a new feature',
    prompt_text: `Your team is considering adding an AI-generated summary feature to a project management tool. Before building, you want to run user research.

1. What is your primary research question?
2. What research method would you use and why? (qualitative vs quantitative, remote vs in-person)
3. Who would you recruit as participants and how many?
4. Write 3 interview questions you'd ask
5. What would you do if research findings contradict the CEO's hypothesis that users want summaries?`,
    difficulty: 'beginner',
    tags: ['research', 'planning', 'interviews'],
    estimated_minutes: 10,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ch100000-0000-0000-0000-000000000004',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    title: 'Investigate a sudden drop in activation rate',
    prompt_text: `You're a PM at a SaaS tool. Your weekly metrics report shows activation rate (users who complete 3 key actions within 7 days of signup) dropped from 42% to 31% over the last 2 weeks. No features were shipped.

1. Walk through your investigation process step by step
2. What data would you pull first and why?
3. List at least 5 hypotheses for the drop, ranging from technical to product to external causes
4. How would you validate or rule out each hypothesis?
5. What is your communication plan while you investigate?`,
    difficulty: 'intermediate',
    tags: ['metrics', 'investigation', 'activation', 'analytics'],
    estimated_minutes: 15,
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const MOCK_FEEDBACK: LumaFeedbackItem[] = [
  {
    dimension: 'clarity',
    score: 7,
    commentary: 'Your response is well-organized and easy to follow. The problem diagnosis section is particularly clear. Consider tightening the metrics section — the relationship between primary and guardrail metrics could be stated more explicitly.',
    suggestions: [
      'State your primary metric first, then explain why it\'s the right one',
      'Explicitly label which metrics are leading vs lagging indicators',
    ],
  },
  {
    dimension: 'structure',
    score: 8,
    commentary: 'Strong use of numbered sections following the prompt structure. You\'ve demonstrated a logical flow from problem → diagnosis → solution → measurement. One gap: the trade-off analysis at the end felt rushed compared to the proposal section.',
    suggestions: [
      'Give trade-offs the same depth as your proposals',
      'Consider using a 2x2 matrix or explicit "pros/cons" format for trade-offs',
    ],
  },
  {
    dimension: 'insight',
    score: 6,
    commentary: 'Good observations about the user segments, but the insight depth could be stronger. You identified the "8% follow rate" problem but didn\'t probe what behavior users ARE doing — understanding the gap between browsing and committing is key here.',
    suggestions: [
      'What are users doing instead of following? (passive listening? adding to queue?)',
      'Consider the job-to-be-done: are users discovering podcasts or browsing entertainment?',
      'Reference comparable discovery problems in music — how did Spotify solve it there?',
    ],
  },
  {
    dimension: 'feasibility',
    score: 7,
    commentary: 'Your proposals are technically reasonable and scoped appropriately for a PM context. The personalized recommendation feature is well-thought-out. The "social proof" idea (show friend activity) introduces privacy considerations you should acknowledge.',
    suggestions: [
      'Acknowledge privacy/trust considerations for social features',
      'Estimate rough effort level for each proposal (small/medium/large)',
    ],
  },
  {
    dimension: 'tradeoffs',
    score: 5,
    commentary: 'Trade-off analysis is the weakest section. You mentioned "may cannibalize music listening" but didn\'t explore it. In practice, podcast and music consumption patterns differ — this trade-off deserves more nuance.',
    suggestions: [
      'For each proposal, name one thing you give up by choosing it',
      'Consider: algorithmic vs editorial trade-offs in discovery',
      'Address the speed vs quality trade-off: fast experiment vs high-confidence solution',
    ],
  },
]

export const MOCK_COMPANIES: CompanyProfile[] = [
  {
    id: 'co100000-0000-0000-0000-000000000001',
    slug: 'stripe',
    name: 'Stripe',
    industry: 'Fintech / Payments',
    stage: 'enterprise',
    product_focus: 'Developer-first payment infrastructure',
    interview_style: 'Heavy on product sense for technical products, metric deep-dives, and systems thinking. Expect questions about API design tradeoffs and developer experience.',
    notes: 'Stripe PMs are expected to understand the technical stack deeply. Prepare to discuss payment flows, fraud, and global compliance tradeoffs.',
    created_at: '2024-01-01T00:00:00Z',
  },
]
