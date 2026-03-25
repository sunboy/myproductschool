import { Domain, Concept, Flashcard, ChallengePrompt, CompanyProfile, LumaFeedbackItem, AnalyticsSummary, ChallengeDiscussion, RecentAttempt, GlossaryTerm, ProfileData, WeeklyDigest, Topic, StudyPlan, StudyPlanItem } from '@/lib/types'

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
    sub_questions: [
      'Diagnose the root cause of low discovery — what data would you look at and what hypotheses do you have?',
      'Identify the user segments most likely to convert and why',
      'Propose 2-3 product changes that could improve podcast discovery and following',
      'How would you measure success? Define a primary metric and 2 guardrail metrics.',
      'What trade-offs do you see in your top proposal?',
    ],
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
    sub_questions: [
      'What are the key strategic questions you\'d need to answer before committing to payments?',
      'Who are the main competitors and what would your differentiation be?',
      'What does a successful first 6 months look like — what milestone proves the strategy is working?',
      'What are the top 3 risks and how would you mitigate them?',
    ],
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
    sub_questions: [
      'What is your primary research question?',
      'What research method would you use and why? (qualitative vs quantitative, remote vs in-person)',
      'Who would you recruit as participants and how many?',
      'Write 3 interview questions you\'d ask',
      'What would you do if research findings contradict the CEO\'s hypothesis that users want summaries?',
    ],
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
    sub_questions: [
      'Walk through your investigation process step by step',
      'What data would you pull first and why?',
      'List at least 5 hypotheses for the drop, ranging from technical to product to external causes',
      'How would you validate or rule out each hypothesis?',
      'What is your communication plan while you investigate?',
    ],
  },
]

export const MOCK_FEEDBACK: LumaFeedbackItem[] = [
  {
    dimension: 'diagnostic_accuracy',
    score: 8,
    commentary: 'Strong identification of the core retention problem and the user segment most likely to churn. You correctly pointed to the 8% follow rate as a symptom rather than the root cause, which shows good diagnostic instinct.',
    suggestions: [
      'Segment the diagnosis further by user cohort (new vs returning listeners)',
      'Explicitly name the root cause hypothesis before proposing solutions',
    ],
  },
  {
    dimension: 'metric_fluency',
    score: 6,
    commentary: 'Good instinct on metric selection but the choices lean too heavily on lagging indicators. Revenue and MAU are outcomes — the stronger signal here is the ratio of browsing sessions to follow actions.',
    suggestions: [
      'Add DAU/MAU ratio or browse-to-follow conversion as a leading indicator',
      'Explicitly label which metrics are leading vs lagging in your answer',
    ],
  },
  {
    dimension: 'framing_precision',
    score: 7,
    commentary: 'Framework usage is solid — you implicitly used a jobs-to-be-done framing without naming it. Naming the framework explicitly signals product fluency and makes your reasoning easier to follow.',
    suggestions: [
      'Be explicit about which framework you\'re applying (CIRCLES, JTBD, etc.)',
      'Structure the problem statement before jumping to diagnosis',
    ],
  },
  {
    dimension: 'recommendation_strength',
    score: 7,
    commentary: 'Recommendations are directionally right and technically reasonable. The personalized discovery feature is well-scoped. However, the social proof idea lacks acknowledgment of the privacy trade-off it introduces.',
    suggestions: [
      'For each recommendation, name one thing you give up by choosing it',
      'Add rough effort estimates (small/medium/large) to signal feasibility awareness',
    ],
  },
]

export const MOCK_FEEDBACK_FULL = {
  overall: "Your response demonstrates solid problem decomposition but lacks metric specificity. The diagnosis is accurate and the recommendations are directionally right, but the gap between good and great here is learning to lead with north star metrics and name your frameworks explicitly.",
  what_worked: ["Accurate persona identification", "Strategic business goal alignment", "Clear problem-to-solution structure"],
  what_to_fix: ["Metric selection too vague — specify leading indicators", "Recommendations need clearer prioritization rationale"],
  dimensions: [
    { dimension: 'diagnostic_accuracy', score: 8, commentary: "Strong identification of the core retention problem.", suggestions: ["Consider segmenting by user cohort"] },
    { dimension: 'metric_fluency', score: 6, commentary: "Good instinct but metrics are too lagging-focused.", suggestions: ["Add DAU/MAU ratio as leading indicator"] },
    { dimension: 'framing_precision', score: 7, commentary: "Framework usage is solid.", suggestions: ["Be more explicit about which framework you're using"] },
    { dimension: 'recommendation_strength', score: 7, commentary: "Recommendations are directionally right.", suggestions: ["Add implementation timeline estimates"] },
  ],
  key_insight: "The gap between good and great here is metric specificity — learn to lead with north star metrics.",
  percentile: 72,
  detected_patterns: [
    {
      pattern_id: 'FP-09',
      pattern_name: 'Unprioritized Investigation',
      confidence: 0.85,
      evidence: 'Listed 5 investigation areas without indicating which to pursue first',
      question: 'q2',
    },
    {
      pattern_id: 'FP-04',
      pattern_name: 'Metric Recitation',
      confidence: 0.75,
      evidence: 'Named DAU, MAU, retention rate without explaining metric selection rationale',
      question: 'q1',
    },
  ],
}

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

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  productiq_score: 72.4,
  productiq_delta: 2.4,
  streak_days: 5,
  total_attempts: 12,
  dimensions: {
    diagnostic_accuracy: { score: 68, delta: 3, sparkline: [55, 60, 58, 62, 65, 68, 70, 68] },
    metric_fluency: { score: 74, delta: -2, sparkline: [70, 72, 76, 78, 76, 74, 75, 74] },
    framing_precision: { score: 71, delta: 5, sparkline: [60, 63, 65, 67, 68, 70, 72, 71] },
    recommendation_strength: { score: 76, delta: 1, sparkline: [72, 73, 74, 75, 76, 77, 76, 76] },
  },
  weekly_activity: [2, 1, 3, 0, 2, 1, 2],
  recent_attempts: [
    {
      id: 'attempt-mock-1',
      challenge_title: 'Spotify podcast discovery drop',
      domain: 'Metrics & Analytics',
      score: 74,
      status: 'completed',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      trend: [65, 68, 70, 72, 74],
    },
    {
      id: 'attempt-mock-2',
      challenge_title: 'B2B fintech payments friction',
      domain: 'Product Strategy',
      score: 68,
      status: 'completed',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      trend: [60, 62, 65, 67, 68],
    },
    {
      id: 'attempt-mock-3',
      challenge_title: 'UX research design for churn',
      domain: 'User Research',
      score: 0,
      status: 'in_progress',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      trend: [55, 58, 60, 0, 0],
    },
  ],
}

export const MOCK_DISCUSSIONS: ChallengeDiscussion[] = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    challenge_id: 'c1000000-0000-0000-0000-000000000001',
    user_id: 'u1000000-0000-0000-0000-000000000001',
    content: "I started by anchoring on the metric drop — DAU fell 18% over 6 weeks. The key was tracing it back to a specific cohort: new users from the recent referral campaign who never hit the 'aha moment'. They weren't finding relevant content in the first session.",
    is_expert_pick: true,
    upvote_count: 12,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    username: 'Alex R.',
    reply_count: 3,
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    challenge_id: 'c1000000-0000-0000-0000-000000000001',
    user_id: 'u1000000-0000-0000-0000-000000000002',
    content: "The key insight I missed was stakeholder translation — I diagnosed the problem well but never explained how I'd communicate the investigation plan to the engineering lead. Luma flagged that as FP-14. Will revisit.",
    is_expert_pick: false,
    upvote_count: 8,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    username: 'Priya S.',
    reply_count: 1,
  },
]

export const MOCK_GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: 'NSM', fullName: 'North Star Metric', definition: 'A single metric that best captures the core value your product delivers to users, aligned with long-term business growth.', conceptId: 'c1000000-0000-0000-0000-000000000009' },
  { term: 'PMF', fullName: 'Product-Market Fit', definition: 'The degree to which a product satisfies a strong market demand, often described as the moment when growth becomes organic.', conceptId: 'c1000000-0000-0000-0000-000000000002' },
  { term: 'JTBD', fullName: 'Jobs To Be Done', definition: 'A framework that views products as "hired" by users to accomplish an underlying job or outcome.', conceptId: 'c1000000-0000-0000-0000-000000000004' },
  { term: 'DAU', fullName: 'Daily Active Users', definition: 'The number of unique users who engage with a product within a 24-hour period.' },
  { term: 'MAU', fullName: 'Monthly Active Users', definition: 'The number of unique users who engage with a product within a 30-day period.' },
  { term: 'ARPU', fullName: 'Average Revenue Per User', definition: 'Total revenue divided by the number of active users, indicating monetization efficiency.' },
  { term: 'LTV', fullName: 'Lifetime Value', definition: 'The total revenue a business expects from a single customer over their entire relationship.' },
  { term: 'CAC', fullName: 'Customer Acquisition Cost', definition: 'The total cost of acquiring a new customer, including marketing, sales, and onboarding expenses.' },
  { term: 'MRR', fullName: 'Monthly Recurring Revenue', definition: 'Predictable revenue earned each month from active subscriptions.' },
  { term: 'ARR', fullName: 'Annual Recurring Revenue', definition: 'The annualized value of recurring subscription revenue, used as a key SaaS growth metric.' },
  { term: 'NPS', fullName: 'Net Promoter Score', definition: 'A loyalty metric based on the question: "How likely are you to recommend us?" Scored from -100 to 100.' },
  { term: 'RICE', fullName: 'Reach, Impact, Confidence, Effort', definition: 'A prioritization scoring model that evaluates ideas by Reach, Impact, Confidence, and Effort.' },
  { term: 'ICE', fullName: 'Impact, Confidence, Ease', definition: 'A lightweight prioritization framework: Impact x Confidence x Ease, each rated 1-10.' },
  { term: 'OKR', fullName: 'Objectives and Key Results', definition: 'A goal-setting framework pairing a qualitative objective with 2-5 measurable key results.' },
  { term: 'KPI', fullName: 'Key Performance Indicator', definition: 'A measurable value that demonstrates how effectively a team is achieving its business objectives.' },
  { term: 'PLG', fullName: 'Product-Led Growth', definition: 'A go-to-market strategy where the product itself drives user acquisition, expansion, and retention.', conceptId: 'c1000000-0000-0000-0000-000000000018' },
  { term: 'MVP', fullName: 'Minimum Viable Product', definition: 'The smallest version of a product that can be released to validate a core hypothesis with real users.' },
  { term: 'PRD', fullName: 'Product Requirements Document', definition: 'A document outlining the purpose, features, functionality, and behavior of a product or feature.' },
  { term: 'TAM', fullName: 'Total Addressable Market', definition: 'The total revenue opportunity available if a product achieved 100% market share.' },
  { term: 'SAM', fullName: 'Serviceable Addressable Market', definition: 'The portion of TAM that your product can realistically serve given its capabilities and go-to-market.' },
  { term: 'SOM', fullName: 'Serviceable Obtainable Market', definition: 'The portion of SAM you can realistically capture in the near term given competition and resources.' },
  { term: 'GTM', fullName: 'Go-to-Market', definition: 'The strategy and plan for launching a product to market, covering positioning, channels, and pricing.' },
  { term: 'Churn Rate', definition: 'The percentage of customers or subscribers who stop using a product within a given time period.' },
  { term: 'Retention Cohort', definition: 'A group of users segmented by signup date, tracked over time to measure what percentage remain active.', conceptId: 'c1000000-0000-0000-0000-000000000011' },
  { term: 'Activation Rate', definition: 'The percentage of new users who complete a key action indicating they have experienced core product value.', conceptId: 'c1000000-0000-0000-0000-000000000020' },
]

export const MOCK_ACTIVITIES = [
  { date: 'Mar 21', title: 'Spotify podcast discovery drop', score: 74, pattern: 'Metric Recitation' },
  { date: 'Mar 19', title: 'B2B fintech payments friction', score: 68 },
  { date: 'Mar 17', title: 'E-commerce cart abandonment', score: 81, pattern: 'Vague Segmentation' },
  { date: 'Mar 15', title: 'Social app DAU stagnation', score: 72 },
  { date: 'Mar 13', title: 'SaaS onboarding churn analysis', score: 65, pattern: 'Missing Prioritization' },
]

export const MOCK_PATTERNS = [
  { name: 'Metric Recitation', count: 5 },
  { name: 'Vague Segmentation', count: 3 },
  { name: 'Missing Prioritization', count: 2 },
]

export const MOCK_PROFILE_DATA: ProfileData = {
  name: 'Alex Chen',
  email: 'alex.chen@example.com',
  role: 'Software Engineer',
  tier: 'free',
  member_since: '2025-11-15',
  avatar_initials: 'AC',
}

export const MOCK_WEEKLY_DIGEST: WeeklyDigest = {
  period: 'Mar 15 - Mar 21, 2026',
  challenges_completed: 4,
  patterns_resolved: ['Metric Recitation', 'Vague Segmentation'],
  top_delta: { dimension: 'framing_precision', change: 5 },
  insight: 'Your framing precision improved the most this week. You are consistently naming frameworks before applying them, which signals strong product fluency. Next focus area: strengthen metric selection rationale.',
}

export const MOCK_ORIENTATION_CHALLENGE: ChallengePrompt = {
  id: 'ch100000-0000-0000-0000-000000000099',
  domain_id: 'd1000000-0000-0000-0000-000000000001',
  title: 'Your first product sense question',
  prompt_text: `Welcome to your first challenge. This is a short warm-up to help you understand the format.

Scenario: You are a PM at a mid-size e-commerce company. The CEO mentions that cart abandonment rate has increased from 65% to 78% over the past quarter.

1. What are your top 3 hypotheses for why cart abandonment increased?
2. How would you prioritize investigating these hypotheses?`,
  difficulty: 'beginner',
  tags: ['orientation', 'warm-up', 'e-commerce'],
  estimated_minutes: 5,
  is_published: true,
  created_at: '2024-01-01T00:00:00Z',
  sub_questions: [
    'What are your top 3 hypotheses for why cart abandonment increased?',
    'How would you prioritize investigating these hypotheses?',
  ],
}

// ── Topics (5 per domain, 25 total) ─────────────────────────────

export const MOCK_TOPICS: Topic[] = [
  // Product Strategy (d1)
  {
    id: 't1000000-0000-0000-0000-000000000001',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    slug: 'vision-and-mission',
    title: 'Vision & Mission',
    description: 'Crafting and communicating a compelling product direction that aligns teams and inspires users.',
    icon: 'flag',
    order_index: 1,
    difficulty_range: 'beginner–intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000002',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    slug: 'competitive-analysis',
    title: 'Competitive Analysis',
    description: 'Systematically evaluating competitors to find differentiation opportunities and strategic gaps.',
    icon: 'compare_arrows',
    order_index: 2,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000003',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    slug: 'market-sizing',
    title: 'Market Sizing',
    description: 'Estimating TAM, SAM, and SOM using top-down and bottom-up approaches.',
    icon: 'pie_chart',
    order_index: 3,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000004',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    slug: 'product-roadmapping',
    title: 'Product Roadmapping',
    description: 'Building and communicating roadmaps that balance near-term execution with long-term strategy.',
    icon: 'map',
    order_index: 4,
    difficulty_range: 'beginner–intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000005',
    domain_id: 'd1000000-0000-0000-0000-000000000001',
    slug: 'opportunity-assessment',
    title: 'Opportunity Assessment',
    description: 'Evaluating whether a product opportunity is worth pursuing before committing resources.',
    icon: 'search_insights',
    order_index: 5,
    difficulty_range: 'intermediate–advanced',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  // User Research (d2)
  {
    id: 't1000000-0000-0000-0000-000000000006',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    slug: 'user-interviews',
    title: 'User Interviews',
    description: 'Designing and running effective user interviews to uncover problems, motivations, and mental models.',
    icon: 'record_voice_over',
    order_index: 1,
    difficulty_range: 'beginner–intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000007',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    slug: 'survey-design',
    title: 'Survey Design',
    description: 'Creating unbiased surveys that yield actionable quantitative insights at scale.',
    icon: 'assignment',
    order_index: 2,
    difficulty_range: 'beginner',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000008',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    slug: 'persona-building',
    title: 'Persona Building',
    description: 'Synthesizing research into actionable personas that represent real user segments.',
    icon: 'person',
    order_index: 3,
    difficulty_range: 'beginner–intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000009',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    slug: 'jobs-to-be-done',
    title: 'Jobs To Be Done',
    description: 'Applying the JTBD framework to uncover underlying user motivations beyond surface-level requests.',
    icon: 'work',
    order_index: 4,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000010',
    domain_id: 'd1000000-0000-0000-0000-000000000002',
    slug: 'usability-testing',
    title: 'Usability Testing',
    description: 'Running moderated and unmoderated usability tests to identify where users struggle in your product.',
    icon: 'touch_app',
    order_index: 5,
    difficulty_range: 'beginner–intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  // Metrics & Analytics (d3)
  {
    id: 't1000000-0000-0000-0000-000000000011',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    slug: 'metric-definition',
    title: 'Metric Definition',
    description: 'Selecting and defining the right metrics — north star, input metrics, and guardrails — for a product.',
    icon: 'straighten',
    order_index: 1,
    difficulty_range: 'beginner–intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000012',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    slug: 'metric-investigation',
    title: 'Metric Investigation',
    description: 'Structured approaches to diagnosing unexpected metric changes and communicating findings.',
    icon: 'manage_search',
    order_index: 2,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000013',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    slug: 'funnel-analysis',
    title: 'Funnel Analysis',
    description: 'Measuring and improving conversion rates at each stage of the user journey.',
    icon: 'filter_alt',
    order_index: 3,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000014',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    slug: 'experimentation-design',
    title: 'Experimentation Design',
    description: 'Designing statistically valid A/B tests and interpreting results without common pitfalls.',
    icon: 'science',
    order_index: 4,
    difficulty_range: 'intermediate–advanced',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000015',
    domain_id: 'd1000000-0000-0000-0000-000000000003',
    slug: 'data-storytelling',
    title: 'Data Storytelling',
    description: 'Communicating data insights to non-technical stakeholders in a compelling, decision-driving way.',
    icon: 'bar_chart',
    order_index: 5,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  // Prioritization (d4)
  {
    id: 't1000000-0000-0000-0000-000000000016',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    slug: 'impact-vs-effort',
    title: 'Impact vs Effort',
    description: 'Evaluating feature candidates by weighing expected impact against implementation effort.',
    icon: 'balance',
    order_index: 1,
    difficulty_range: 'beginner',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000017',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    slug: 'rice-scoring',
    title: 'RICE Scoring',
    description: 'Applying the Reach, Impact, Confidence, Effort framework to rank competing initiatives.',
    icon: 'leaderboard',
    order_index: 2,
    difficulty_range: 'beginner–intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000018',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    slug: 'stakeholder-alignment',
    title: 'Stakeholder Alignment',
    description: 'Navigating competing stakeholder priorities and building consensus around a roadmap.',
    icon: 'groups',
    order_index: 3,
    difficulty_range: 'intermediate–advanced',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000019',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    slug: 'resource-allocation',
    title: 'Resource Allocation',
    description: 'Making trade-off decisions about where to invest engineering time and product bandwidth.',
    icon: 'account_tree',
    order_index: 4,
    difficulty_range: 'intermediate–advanced',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000020',
    domain_id: 'd1000000-0000-0000-0000-000000000004',
    slug: 'sprint-planning',
    title: 'Sprint Planning',
    description: 'Structuring sprint backlogs and communicating scope trade-offs within delivery cycles.',
    icon: 'sprint',
    order_index: 5,
    difficulty_range: 'beginner–intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  // Go-to-Market (d5)
  {
    id: 't1000000-0000-0000-0000-000000000021',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    slug: 'acquisition-channels',
    title: 'Acquisition Channels',
    description: 'Identifying and evaluating channels to drive new user or customer acquisition efficiently.',
    icon: 'ads_click',
    order_index: 1,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000022',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    slug: 'activation-optimization',
    title: 'Activation Optimization',
    description: 'Improving the onboarding experience to get more users to their first "aha moment" faster.',
    icon: 'bolt',
    order_index: 2,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000023',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    slug: 'retention-loops',
    title: 'Retention Loops',
    description: 'Designing habit-forming product loops and re-engagement strategies to reduce churn.',
    icon: 'loop',
    order_index: 3,
    difficulty_range: 'intermediate–advanced',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000024',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    slug: 'pricing-strategy',
    title: 'Pricing Strategy',
    description: 'Selecting pricing models and structures that align with value delivery and business goals.',
    icon: 'sell',
    order_index: 4,
    difficulty_range: 'intermediate–advanced',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't1000000-0000-0000-0000-000000000025',
    domain_id: 'd1000000-0000-0000-0000-000000000005',
    slug: 'launch-planning',
    title: 'Launch Planning',
    description: 'Coordinating cross-functional launch activities and defining the right launch tier for a feature.',
    icon: 'rocket_launch',
    order_index: 5,
    difficulty_range: 'intermediate',
    is_published: true,
    created_at: '2024-01-01T00:00:00Z',
  },
]

// ── Challenge-Topic junction ─────────────────────────────────────

export const MOCK_CHALLENGE_TOPICS: { challenge_id: string; topic_id: string }[] = [
  // ch1 (Spotify podcast discovery) → product-strategy + metric-investigation + funnel-analysis
  { challenge_id: 'ch100000-0000-0000-0000-000000000001', topic_id: 't1000000-0000-0000-0000-000000000004' }, // product-roadmapping
  { challenge_id: 'ch100000-0000-0000-0000-000000000001', topic_id: 't1000000-0000-0000-0000-000000000012' }, // metric-investigation
  { challenge_id: 'ch100000-0000-0000-0000-000000000001', topic_id: 't1000000-0000-0000-0000-000000000013' }, // funnel-analysis
  // ch2 (B2B fintech payments) → competitive-analysis + opportunity-assessment + pricing-strategy
  { challenge_id: 'ch100000-0000-0000-0000-000000000002', topic_id: 't1000000-0000-0000-0000-000000000002' }, // competitive-analysis
  { challenge_id: 'ch100000-0000-0000-0000-000000000002', topic_id: 't1000000-0000-0000-0000-000000000005' }, // opportunity-assessment
  { challenge_id: 'ch100000-0000-0000-0000-000000000002', topic_id: 't1000000-0000-0000-0000-000000000024' }, // pricing-strategy
  // ch3 (user research plan) → user-interviews + survey-design + persona-building
  { challenge_id: 'ch100000-0000-0000-0000-000000000003', topic_id: 't1000000-0000-0000-0000-000000000006' }, // user-interviews
  { challenge_id: 'ch100000-0000-0000-0000-000000000003', topic_id: 't1000000-0000-0000-0000-000000000007' }, // survey-design
  { challenge_id: 'ch100000-0000-0000-0000-000000000003', topic_id: 't1000000-0000-0000-0000-000000000008' }, // persona-building
  // ch4 (activation rate drop) → metric-investigation + funnel-analysis + experimentation-design
  { challenge_id: 'ch100000-0000-0000-0000-000000000004', topic_id: 't1000000-0000-0000-0000-000000000012' }, // metric-investigation
  { challenge_id: 'ch100000-0000-0000-0000-000000000004', topic_id: 't1000000-0000-0000-0000-000000000013' }, // funnel-analysis
  { challenge_id: 'ch100000-0000-0000-0000-000000000004', topic_id: 't1000000-0000-0000-0000-000000000014' }, // experimentation-design
]

// ── Concept-Topic junction ────────────────────────────────────────

export const MOCK_CONCEPT_TOPICS: { concept_id: string; topic_id: string }[] = [
  // Product Vision (c1) → vision-and-mission
  { concept_id: 'c1000000-0000-0000-0000-000000000001', topic_id: 't1000000-0000-0000-0000-000000000001' },
  // Product-Market Fit (c2) → opportunity-assessment + vision-and-mission
  { concept_id: 'c1000000-0000-0000-0000-000000000002', topic_id: 't1000000-0000-0000-0000-000000000005' },
  { concept_id: 'c1000000-0000-0000-0000-000000000002', topic_id: 't1000000-0000-0000-0000-000000000001' },
  // Strategic Moat (c3) → competitive-analysis + opportunity-assessment
  { concept_id: 'c1000000-0000-0000-0000-000000000003', topic_id: 't1000000-0000-0000-0000-000000000002' },
  { concept_id: 'c1000000-0000-0000-0000-000000000003', topic_id: 't1000000-0000-0000-0000-000000000005' },
  // JTBD (c4) → jobs-to-be-done + user-interviews
  { concept_id: 'c1000000-0000-0000-0000-000000000004', topic_id: 't1000000-0000-0000-0000-000000000009' },
  { concept_id: 'c1000000-0000-0000-0000-000000000004', topic_id: 't1000000-0000-0000-0000-000000000006' },
  // User Interview (c5) → user-interviews
  { concept_id: 'c1000000-0000-0000-0000-000000000005', topic_id: 't1000000-0000-0000-0000-000000000006' },
  // Affinity Mapping (c6) → user-interviews + persona-building
  { concept_id: 'c1000000-0000-0000-0000-000000000006', topic_id: 't1000000-0000-0000-0000-000000000006' },
  { concept_id: 'c1000000-0000-0000-0000-000000000006', topic_id: 't1000000-0000-0000-0000-000000000008' },
  // Persona (c7) → persona-building
  { concept_id: 'c1000000-0000-0000-0000-000000000007', topic_id: 't1000000-0000-0000-0000-000000000008' },
  // Usability Testing (c8) → usability-testing
  { concept_id: 'c1000000-0000-0000-0000-000000000008', topic_id: 't1000000-0000-0000-0000-000000000010' },
  // North Star Metric (c9) → metric-definition
  { concept_id: 'c1000000-0000-0000-0000-000000000009', topic_id: 't1000000-0000-0000-0000-000000000011' },
  // Funnel Analysis (c10) → funnel-analysis + metric-definition
  { concept_id: 'c1000000-0000-0000-0000-000000000010', topic_id: 't1000000-0000-0000-0000-000000000013' },
  { concept_id: 'c1000000-0000-0000-0000-000000000010', topic_id: 't1000000-0000-0000-0000-000000000011' },
  // Retention Cohort (c11) → metric-investigation + experimentation-design
  { concept_id: 'c1000000-0000-0000-0000-000000000011', topic_id: 't1000000-0000-0000-0000-000000000012' },
  { concept_id: 'c1000000-0000-0000-0000-000000000011', topic_id: 't1000000-0000-0000-0000-000000000014' },
  // A/B Testing (c12) → experimentation-design
  { concept_id: 'c1000000-0000-0000-0000-000000000012', topic_id: 't1000000-0000-0000-0000-000000000014' },
  // ICE Scoring (c13) → impact-vs-effort + rice-scoring
  { concept_id: 'c1000000-0000-0000-0000-000000000013', topic_id: 't1000000-0000-0000-0000-000000000016' },
  { concept_id: 'c1000000-0000-0000-0000-000000000013', topic_id: 't1000000-0000-0000-0000-000000000017' },
  // Opportunity Scoring (c14) → impact-vs-effort + stakeholder-alignment
  { concept_id: 'c1000000-0000-0000-0000-000000000014', topic_id: 't1000000-0000-0000-0000-000000000016' },
  { concept_id: 'c1000000-0000-0000-0000-000000000014', topic_id: 't1000000-0000-0000-0000-000000000018' },
  // Now/Next/Later Roadmap (c15) → product-roadmapping + stakeholder-alignment
  { concept_id: 'c1000000-0000-0000-0000-000000000015', topic_id: 't1000000-0000-0000-0000-000000000004' },
  { concept_id: 'c1000000-0000-0000-0000-000000000015', topic_id: 't1000000-0000-0000-0000-000000000018' },
  // Trade-off Analysis (c16) → resource-allocation + stakeholder-alignment
  { concept_id: 'c1000000-0000-0000-0000-000000000016', topic_id: 't1000000-0000-0000-0000-000000000019' },
  { concept_id: 'c1000000-0000-0000-0000-000000000016', topic_id: 't1000000-0000-0000-0000-000000000018' },
  // Product Positioning (c17) → acquisition-channels + launch-planning
  { concept_id: 'c1000000-0000-0000-0000-000000000017', topic_id: 't1000000-0000-0000-0000-000000000021' },
  { concept_id: 'c1000000-0000-0000-0000-000000000017', topic_id: 't1000000-0000-0000-0000-000000000025' },
  // PLG (c18) → acquisition-channels + retention-loops + activation-optimization
  { concept_id: 'c1000000-0000-0000-0000-000000000018', topic_id: 't1000000-0000-0000-0000-000000000021' },
  { concept_id: 'c1000000-0000-0000-0000-000000000018', topic_id: 't1000000-0000-0000-0000-000000000023' },
  { concept_id: 'c1000000-0000-0000-0000-000000000018', topic_id: 't1000000-0000-0000-0000-000000000022' },
  // Launch Tier (c19) → launch-planning
  { concept_id: 'c1000000-0000-0000-0000-000000000019', topic_id: 't1000000-0000-0000-0000-000000000025' },
  // Activation Rate (c20) → activation-optimization + funnel-analysis
  { concept_id: 'c1000000-0000-0000-0000-000000000020', topic_id: 't1000000-0000-0000-0000-000000000022' },
  { concept_id: 'c1000000-0000-0000-0000-000000000020', topic_id: 't1000000-0000-0000-0000-000000000013' },
]

// ── Study Plans ──────────────────────────────────────────────────

export const MOCK_STUDY_PLANS: StudyPlan[] = [
  {
    id: 'sp100000-0000-0000-0000-000000000001',
    slug: 'product-sense-20',
    title: 'Product Sense in 20 Days',
    description: 'A structured daily practice plan covering the five core domains of product thinking — one domain per week, building toward interview-ready fluency.',
    icon: 'school',
    difficulty: 'beginner',
    estimated_hours: 10,
    is_published: true,
    order_index: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sp100000-0000-0000-0000-000000000002',
    slug: 'metrics-mastery',
    title: 'Metrics Mastery',
    description: 'Deep-dive into product metrics: defining north star metrics, investigating drops, running experiments, and communicating data to stakeholders.',
    icon: 'analytics',
    difficulty: 'intermediate',
    estimated_hours: 6,
    is_published: true,
    order_index: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sp100000-0000-0000-0000-000000000003',
    slug: 'interview-ready',
    title: 'Interview Ready',
    description: 'A focused sprint for engineers with PM interviews in the next 2 weeks. Hits the highest-frequency question types and common failure patterns.',
    icon: 'emoji_events',
    difficulty: 'intermediate',
    estimated_hours: 8,
    is_published: true,
    order_index: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sp100000-0000-0000-0000-000000000004',
    slug: 'hackproduct-75',
    title: 'HackProduct 75',
    description: 'The complete 75-day program: 4 challenges per week across all domains, escalating in difficulty. The full stack of product thinking.',
    icon: 'local_fire_department',
    difficulty: 'advanced',
    estimated_hours: 40,
    is_published: true,
    order_index: 4,
    created_at: '2024-01-01T00:00:00Z',
  },
]

// ── Study Plan Items ──────────────────────────────────────────────

export const MOCK_STUDY_PLAN_ITEMS: StudyPlanItem[] = [
  // ── Product Sense in 20 Days ──────────────────────────────────
  // Chapter 1: Product Strategy
  {
    id: 'spi10000-0000-0000-0000-000000000001',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000001',
    chapter_title: 'Week 1: Product Strategy',
    order_index: 1,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000002',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000003',
    chapter_title: 'Week 1: Product Strategy',
    order_index: 2,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000003',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000001',
    concept_id: null,
    chapter_title: 'Week 1: Product Strategy',
    order_index: 3,
  },
  // Chapter 2: User Research
  {
    id: 'spi10000-0000-0000-0000-000000000004',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000005',
    chapter_title: 'Week 2: User Research',
    order_index: 4,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000005',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000007',
    chapter_title: 'Week 2: User Research',
    order_index: 5,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000006',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000003',
    concept_id: null,
    chapter_title: 'Week 2: User Research',
    order_index: 6,
  },
  // Chapter 3: Metrics
  {
    id: 'spi10000-0000-0000-0000-000000000007',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000009',
    chapter_title: 'Week 3: Metrics & Analytics',
    order_index: 7,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000008',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000010',
    chapter_title: 'Week 3: Metrics & Analytics',
    order_index: 8,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000009',
    plan_id: 'sp100000-0000-0000-0000-000000000001',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000004',
    concept_id: null,
    chapter_title: 'Week 3: Metrics & Analytics',
    order_index: 9,
  },
  // ── Metrics Mastery ───────────────────────────────────────────
  // Chapter 1: Foundations
  {
    id: 'spi10000-0000-0000-0000-000000000010',
    plan_id: 'sp100000-0000-0000-0000-000000000002',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000009',
    chapter_title: 'Chapter 1: Metric Foundations',
    order_index: 1,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000011',
    plan_id: 'sp100000-0000-0000-0000-000000000002',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000010',
    chapter_title: 'Chapter 1: Metric Foundations',
    order_index: 2,
  },
  // Chapter 2: Investigation
  {
    id: 'spi10000-0000-0000-0000-000000000012',
    plan_id: 'sp100000-0000-0000-0000-000000000002',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000011',
    chapter_title: 'Chapter 2: Investigating Drops',
    order_index: 3,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000013',
    plan_id: 'sp100000-0000-0000-0000-000000000002',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000004',
    concept_id: null,
    chapter_title: 'Chapter 2: Investigating Drops',
    order_index: 4,
  },
  // Chapter 3: Experimentation
  {
    id: 'spi10000-0000-0000-0000-000000000014',
    plan_id: 'sp100000-0000-0000-0000-000000000002',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000012',
    chapter_title: 'Chapter 3: Experimentation',
    order_index: 5,
  },
  // ── Interview Ready ───────────────────────────────────────────
  // Chapter 1: Quick-build fundamentals
  {
    id: 'spi10000-0000-0000-0000-000000000015',
    plan_id: 'sp100000-0000-0000-0000-000000000003',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000001',
    chapter_title: 'Part 1: Strategy Fundamentals',
    order_index: 1,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000016',
    plan_id: 'sp100000-0000-0000-0000-000000000003',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000002',
    chapter_title: 'Part 1: Strategy Fundamentals',
    order_index: 2,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000017',
    plan_id: 'sp100000-0000-0000-0000-000000000003',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000002',
    concept_id: null,
    chapter_title: 'Part 1: Strategy Fundamentals',
    order_index: 3,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000018',
    plan_id: 'sp100000-0000-0000-0000-000000000003',
    item_type: 'concept',
    challenge_id: null,
    concept_id: 'c1000000-0000-0000-0000-000000000009',
    chapter_title: 'Part 2: Metrics Under Pressure',
    order_index: 4,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000019',
    plan_id: 'sp100000-0000-0000-0000-000000000003',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000004',
    concept_id: null,
    chapter_title: 'Part 2: Metrics Under Pressure',
    order_index: 5,
  },
  // ── HackProduct 75 ────────────────────────────────────────────
  // Week 1
  {
    id: 'spi10000-0000-0000-0000-000000000020',
    plan_id: 'sp100000-0000-0000-0000-000000000004',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000001',
    concept_id: null,
    chapter_title: 'Week 1: Product Strategy',
    order_index: 1,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000021',
    plan_id: 'sp100000-0000-0000-0000-000000000004',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000002',
    concept_id: null,
    chapter_title: 'Week 1: Product Strategy',
    order_index: 2,
  },
  // Week 2
  {
    id: 'spi10000-0000-0000-0000-000000000022',
    plan_id: 'sp100000-0000-0000-0000-000000000004',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000003',
    concept_id: null,
    chapter_title: 'Week 2: User Research',
    order_index: 3,
  },
  {
    id: 'spi10000-0000-0000-0000-000000000023',
    plan_id: 'sp100000-0000-0000-0000-000000000004',
    item_type: 'challenge',
    challenge_id: 'ch100000-0000-0000-0000-000000000004',
    concept_id: null,
    chapter_title: 'Week 3: Metrics & Analytics',
    order_index: 4,
  },
]
