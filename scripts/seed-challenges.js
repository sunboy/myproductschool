const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://tikkhvxlclivixqqqjyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'
)

const DOMAIN_STRATEGY = 'd0000001-0000-0000-0000-000000000001'
const DOMAIN_METRICS = 'd0000001-0000-0000-0000-000000000002'

// Helper to generate challenge UUIDs
const cid = (n) => `c0000001-0000-0000-0000-${String(n).padStart(12, '0')}`
// Helper to generate step UUIDs
const sid = (n) => `a0000001-0000-0000-0000-${String(n).padStart(12, '0')}`

const challenges = [
  // ─── TRADITIONAL · BEGINNER (5) ────────────────────────────────────────────
  {
    id: cid(1),
    domain_id: DOMAIN_METRICS,
    title: "Spotify's 15% Session Drop",
    prompt_text: "Spotify's growth team added a 'Share to Story' button inside the Now Playing screen two weeks ago. Since then, daily active session count has dropped 15% globally. The feature has a 3% click-through rate and user satisfaction surveys look unchanged. You're the SWE who shipped it and the PM just pinged you in Slack asking what's going on. Walk through how you'd diagnose this.",
    difficulty: 'beginner',
    tags: ['engagement', 'feature-impact', 'debugging', 'music'],
    estimated_minutes: 20,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'list'],
    is_premium: false,
    role_tags: ['SWE', 'Data Eng']
  },
  {
    id: cid(2),
    domain_id: DOMAIN_METRICS,
    title: "DAU/MAU Looks Great But Revenue Is Flat",
    prompt_text: "Your B2B SaaS product (a project management tool for engineering teams) has seen DAU/MAU climb from 0.28 to 0.41 over 6 months — strong engagement signal. But net new revenue is flat and expansion revenue has actually declined 8%. Your CEO is confused: 'People are using it more, so why aren't they paying more?' What's going on, and what would you investigate?",
    difficulty: 'beginner',
    tags: ['metrics', 'b2b-saas', 'revenue', 'engagement'],
    estimated_minutes: 20,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'list'],
    is_premium: false,
    role_tags: ['SWE', 'EM']
  },
  {
    id: cid(3),
    domain_id: DOMAIN_STRATEGY,
    title: "Free Plan Cannibalizing Paid Conversions",
    prompt_text: "You work at a startup building a developer API tool. Your free tier gives 10,000 API calls/month. You've noticed that 60% of free users never hit the limit — they just stay on free forever. The sales team wants to cut the free tier to 1,000 calls. The engineering team says that's too aggressive and would kill word-of-mouth. You have to make a recommendation to the CEO by end of week.",
    difficulty: 'beginner',
    tags: ['monetization', 'freemium', 'developer-tools', 'pricing'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'Founding Eng']
  },
  {
    id: cid(4),
    domain_id: DOMAIN_METRICS,
    title: "On-Call Alert Volume is Killing Team Morale",
    prompt_text: "Your team of 8 engineers handles a high-traffic e-commerce checkout service. On-call engineers averaged 14 pages per shift last quarter, up from 4 a year ago. P95 latency is within SLA. Error rate is 0.3% — acceptable per leadership. Two engineers are threatening to quit if on-call doesn't improve. Leadership says everything looks fine in the dashboards. How do you frame this problem and what do you do?",
    difficulty: 'beginner',
    tags: ['reliability', 'oncall', 'team-health', 'observability'],
    estimated_minutes: 20,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'win'],
    is_premium: false,
    role_tags: ['SWE', 'DevOps', 'EM']
  },
  {
    id: cid(5),
    domain_id: DOMAIN_STRATEGY,
    title: "New Feature vs. Tech Debt: Allocating Next Quarter",
    prompt_text: "You're an EM at a 40-person startup. Your team has an aging authentication service that every other service depends on — it's slow, brittle, and the engineers hate working in it. Product wants to ship 3 new features next quarter that will each take ~3 weeks. Refactoring auth would take ~6 weeks and 2 engineers. You have to write a proposal for how you'd allocate the quarter. What framework do you use?",
    difficulty: 'beginner',
    tags: ['tech-debt', 'planning', 'prioritization', 'engineering-management'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'optimize'],
    is_premium: false,
    role_tags: ['EM', 'Founding Eng']
  },

  // ─── TRADITIONAL · INTERMEDIATE (8) ────────────────────────────────────────
  {
    id: cid(6),
    domain_id: DOMAIN_METRICS,
    title: "Checkout Funnel: Page 3 Drop-off Spike",
    prompt_text: "Stripe's checkout funnel for a mid-market SaaS you work at has 4 steps. Page 3 (billing details) has always had a 12% drop-off. Last Tuesday it jumped to 34%. No code was deployed that day. Mobile drop-off went from 15% to 48% while desktop stayed flat at 11%. The spike happened at 2pm PST and has not recovered. You're the PM and the CEO is asking for a root cause by morning.",
    difficulty: 'intermediate',
    tags: ['conversion', 'checkout', 'mobile', 'funnel-analysis'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'Data Eng']
  },
  {
    id: cid(7),
    domain_id: DOMAIN_STRATEGY,
    title: "Should Notion Build a Native Calendar?",
    prompt_text: "It's early 2024. Notion has 30M+ users but no native calendar. Google Calendar and Fantastical dominate that space. Notion has acquired Cron (a calendar app) but hasn't deeply integrated it. You're a PM at Notion. Your data shows that 40% of Notion users have a date property in at least one database, but only 8% use the calendar view. Should Notion build a full native calendar experience? Make the case for or against, with a clear recommendation.",
    difficulty: 'intermediate',
    tags: ['build-vs-buy', 'strategy', 'productivity', 'market-expansion'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'list', 'win'],
    is_premium: false,
    role_tags: ['SWE', 'EM', 'Founding Eng']
  },
  {
    id: cid(8),
    domain_id: DOMAIN_METRICS,
    title: "The Activation Metric That Lied",
    prompt_text: "Your team defined activation as 'user creates their first project within 7 days of signup.' You optimized hard for this — better onboarding, tooltips, email nudges. Activation rate went from 28% to 54% over 6 months. But 90-day retention dropped from 31% to 24% over the same period. Your VP of Product thinks you've been measuring the wrong thing. What happened and how would you redesign the activation metric?",
    difficulty: 'intermediate',
    tags: ['activation', 'retention', 'north-star-metric', 'onboarding'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'optimize'],
    is_premium: true,
    role_tags: ['SWE', 'Data Eng', 'EM']
  },
  {
    id: cid(9),
    domain_id: DOMAIN_STRATEGY,
    title: "Platform vs. Product: Slack's Dilemma",
    prompt_text: "Slack's app directory has 2,400+ integrations. Internal data shows that teams using 5+ integrations have 40% higher retention than teams using 0-2. But the top 10 integrations account for 78% of all usage — Google Drive, Zoom, Jira, GitHub, PagerDuty, etc. Leadership is debating whether to deeply native-integrate the top 10 (potentially angering partners) or double down on open API. You're a senior PM. What do you recommend?",
    difficulty: 'intermediate',
    tags: ['platform', 'integrations', 'partnerships', 'b2b'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'list', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'EM']
  },
  {
    id: cid(10),
    domain_id: DOMAIN_METRICS,
    title: "Why Did Power Users Churn?",
    prompt_text: "Figma's enterprise segment just lost 3 of its top 10 accounts (by seat count: 800, 600, and 450 seats respectively). All three churned to a competitor in the same 6-week window. Your customer success team says 'they wanted features we don't have.' But your product team says those features were on the roadmap for Q3. NPS for these accounts was 72 — high. What went wrong and what's your post-mortem framework?",
    difficulty: 'intermediate',
    tags: ['churn', 'enterprise', 'post-mortem', 'b2b-saas'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'list', 'win'],
    is_premium: false,
    role_tags: ['EM', 'Founding Eng']
  },
  {
    id: cid(11),
    domain_id: DOMAIN_STRATEGY,
    title: "International Expansion: Which Market First?",
    prompt_text: "You're a PM at a US-based HR software startup (think: Lattice or Rippling). Revenue is $12M ARR, 95% from North America. Leadership wants to expand internationally. You've done an initial study: UK has high English adoption and similar labor laws (lower localization cost), Brazil has 10x more SMBs but requires Portuguese + complex payroll compliance, and India has huge TAM but local competitors are entrenched. You have budget for one market. Make a recommendation.",
    difficulty: 'intermediate',
    tags: ['international', 'market-selection', 'strategy', 'hrtech'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: false,
    role_tags: ['Founding Eng', 'EM']
  },
  {
    id: cid(12),
    domain_id: DOMAIN_METRICS,
    title: "Search Relevance vs. Monetization Tradeoff",
    prompt_text: "You're a PM on Amazon's search team. A/B test results: Variant B (which surfaces more sponsored results in position 2-4, pushing organic results down) shows +7% revenue per search but -4% click-through rate on organic results, and a -2.1% decrease in 30-day purchase conversion for users who saw it. The ads team wants to ship Variant B. The search quality team wants to kill it. You're in the room. What's your call and why?",
    difficulty: 'intermediate',
    tags: ['search', 'ads', 'tradeoffs', 'e-commerce', 'a-b-testing'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'Data Eng', 'ML Eng']
  },
  {
    id: cid(13),
    domain_id: DOMAIN_STRATEGY,
    title: "The Competitor Cloned Your Core Feature",
    prompt_text: "You work at a startup that built a popular 'async video feedback' tool for design teams (think: Loom for design review). You have 80,000 MAU and are growing 15% MoM. Figma just announced they're shipping async video comments natively — and it looks nearly identical to your product. Your investors are asking what the moat is. What do you do?",
    difficulty: 'intermediate',
    tags: ['competition', 'moat', 'startup-strategy', 'design-tools'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'list', 'win'],
    is_premium: true,
    role_tags: ['Founding Eng', 'EM']
  },

  // ─── TRADITIONAL · ADVANCED (2) ────────────────────────────────────────────
  {
    id: cid(14),
    domain_id: DOMAIN_STRATEGY,
    title: "Monetize the API Without Killing the Ecosystem",
    prompt_text: "Twilio in 2019: You've built the dominant SMS/voice API used by 150,000 developers. Free tier is generating enormous word-of-mouth. But margins are thin and the board wants a path to profitability. Three options are on the table: (A) Raise prices 40% across all tiers, (B) Introduce a new 'enterprise' tier with SLAs and kill the free tier for new signups, (C) Launch a higher-margin product layer (e.g., Verify, Conversations) and grow that. Design the monetization strategy.",
    difficulty: 'advanced',
    tags: ['monetization', 'developer-tools', 'api-business', 'ecosystem'],
    estimated_minutes: 45,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'list', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['EM', 'Founding Eng']
  },
  {
    id: cid(15),
    domain_id: DOMAIN_METRICS,
    title: "Redesign Causes Metric Split: Who's Right?",
    prompt_text: "LinkedIn ran a homepage redesign A/B test for 6 weeks with 10% of users. Results: feed engagement +18%, connection requests +12%, job application clicks -9%, premium upsell clicks -22%. The design team says 'ship it — engagement is up.' The monetization team says 'never ship it — revenue is at risk.' The PM says 'it's complicated.' You're the engineering lead being asked to cast a tie-breaking vote. How do you reason through this?",
    difficulty: 'advanced',
    tags: ['a-b-testing', 'redesign', 'conflicting-metrics', 'social-network'],
    estimated_minutes: 40,
    is_published: true,
    paradigm: 'traditional',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'Data Eng', 'EM']
  },

  // ─── AI-ASSISTED · BEGINNER (5) ────────────────────────────────────────────
  {
    id: cid(16),
    domain_id: DOMAIN_STRATEGY,
    title: "Your ML Model is 95% Accurate But Users Hate It",
    prompt_text: "Your team shipped an AI-powered content recommendation feature to your news app 3 weeks ago. The model has 95% click-through prediction accuracy on holdout data. But 1-star reviews mentioning 'creepy recommendations' went from 2/week to 47/week. User interviews reveal people feel 'trapped in a bubble' and 'spied on.' The model is technically working. What's wrong, and what do you recommend?",
    difficulty: 'beginner',
    tags: ['ml', 'recommendations', 'user-trust', 'explainability'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list'],
    is_premium: false,
    role_tags: ['ML Eng', 'SWE']
  },
  {
    id: cid(17),
    domain_id: DOMAIN_METRICS,
    title: "AI Feature Adoption is 8% After 3 Months",
    prompt_text: "You shipped an AI writing assistant inside your project management tool (think Asana AI). After 3 months, only 8% of eligible users have tried it even once, and only 1.2% use it weekly. The feature itself has a 4.1/5 rating from users who do try it. Leadership is questioning whether to continue investing. What framework do you use to diagnose low adoption, and what would you recommend?",
    difficulty: 'beginner',
    tags: ['ai-adoption', 'feature-discovery', 'onboarding', 'product-management'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list'],
    is_premium: false,
    role_tags: ['SWE', 'ML Eng', 'EM']
  },
  {
    id: cid(18),
    domain_id: DOMAIN_STRATEGY,
    title: "The CEO Wants an AI Chatbot by Friday",
    prompt_text: "It's Monday. Your CEO just came back from a conference and is fired up about AI. They want a customer-facing AI chatbot live by Friday because 'the competitor just shipped one.' You're the engineering lead. The chatbot would answer product questions and handle basic support. Your support team handles 2,000 tickets/month. What do you say in today's 2pm meeting, and what's your actual plan?",
    difficulty: 'beginner',
    tags: ['ai-chatbot', 'stakeholder-management', 'scope', 'speed-vs-quality'],
    estimated_minutes: 20,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'win'],
    is_premium: false,
    role_tags: ['SWE', 'Founding Eng', 'EM']
  },
  {
    id: cid(19),
    domain_id: DOMAIN_METRICS,
    title: "AI Summarization: Fast but Wrong 12% of the Time",
    prompt_text: "Your team shipped an AI-powered meeting summarization feature for an enterprise SaaS. It runs on GPT-4o and generates meeting recaps automatically. User testing shows it's factually incorrect 12% of the time (wrong action items, wrong speaker attribution). But users love the convenience and adoption is 67%. Legal is now raising concerns. How do you decide whether to keep shipping, pause, or redesign the feature?",
    difficulty: 'beginner',
    tags: ['ai-quality', 'hallucination', 'risk', 'enterprise'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'ML Eng', 'EM']
  },
  {
    id: cid(20),
    domain_id: DOMAIN_STRATEGY,
    title: "Build AI On Top or Build Your Own Model?",
    prompt_text: "You're an engineering lead at a 60-person legal-tech startup. Your product helps lawyers draft contracts. You're evaluating two paths: (A) Build a proprietary fine-tuned LLM on your corpus of 2M legal documents, cost ~$800K upfront, 4-month timeline, potential moat. (B) Build a wrapper on top of OpenAI GPT-4o with smart prompting and RAG, cost ~$15K upfront, 3-week timeline, no IP moat. Investors are pushing for (A). Your CTO wants (B). What do you recommend?",
    difficulty: 'beginner',
    tags: ['build-vs-buy', 'llm', 'ai-strategy', 'legaltech'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: false,
    role_tags: ['SWE', 'ML Eng', 'Founding Eng']
  },

  // ─── AI-ASSISTED · INTERMEDIATE (6) ────────────────────────────────────────
  {
    id: cid(21),
    domain_id: DOMAIN_METRICS,
    title: "RAG Retrieval Quality is Hurting LLM Output",
    prompt_text: "You're an ML engineer at a B2B SaaS company. You've built a RAG-based AI assistant for customer support. The LLM (Claude 3 Sonnet) is good, but users rate answers 2.8/5. You run an experiment: when you manually provide the perfect context chunk, LLM output ratings jump to 4.6/5. Retrieval recall@5 is 0.61. Your embedding model is ada-002. What's your diagnosis and what experiments do you run to improve retrieval?",
    difficulty: 'intermediate',
    tags: ['rag', 'retrieval', 'embeddings', 'llm-quality'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: false,
    role_tags: ['ML Eng', 'Data Eng', 'SWE']
  },
  {
    id: cid(22),
    domain_id: DOMAIN_STRATEGY,
    title: "AI Copilot Causing Code Review Shortcuts",
    prompt_text: "GitHub Copilot is rolled out to your 120-engineer org. Three months in, PR review time dropped 40% (great!) but production incidents are up 28% and three of them were in AI-generated code that reviewers approved without scrutiny. Engineers say they trust Copilot 'a lot' and are reviewing AI-generated code less carefully. What's the product/process intervention, and how do you measure success?",
    difficulty: 'intermediate',
    tags: ['ai-tools', 'code-review', 'developer-experience', 'reliability'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: true,
    role_tags: ['SWE', 'DevOps', 'EM']
  },
  {
    id: cid(23),
    domain_id: DOMAIN_METRICS,
    title: "Prompt Engineering ROI: When to Stop Iterating",
    prompt_text: "Your team has been iterating on prompts for an AI-powered customer intent classifier. After 3 weeks of prompt engineering, you've gone from 71% to 86% accuracy on your eval set. Your PM is asking: 'When do we stop and ship?' Your options are: keep prompt-engineering (diminishing returns), fine-tune a smaller model, or ship at 86% and improve post-launch. Each option has different cost, timeline, and risk profiles. How do you decide?",
    difficulty: 'intermediate',
    tags: ['prompt-engineering', 'model-eval', 'ml-ops', 'tradeoffs'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: false,
    role_tags: ['ML Eng', 'SWE', 'Data Eng']
  },
  {
    id: cid(24),
    domain_id: DOMAIN_STRATEGY,
    title: "AI Pricing: Per-Seat or Consumption-Based?",
    prompt_text: "You're the PM at a startup building an AI-powered data analysis tool for analysts (think Julius or Hex AI). You're preparing for your first paid tier. Two pricing models: (A) Per-seat SaaS ($49/user/month, predictable revenue, sales-friendly), (B) Consumption-based (pay per AI query at $0.08/query — aligns value, but revenue is spiky and hard to forecast). Your top 20 beta users run an average of 340 queries/month but the range is 40–1,200. How do you decide?",
    difficulty: 'intermediate',
    tags: ['pricing', 'ai-product', 'monetization', 'saas'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['Founding Eng', 'EM']
  },
  {
    id: cid(25),
    domain_id: DOMAIN_METRICS,
    title: "LLM Costs Are 3x Higher Than Projected",
    prompt_text: "You shipped an AI-powered email drafting assistant inside your CRM. You projected $0.04 per user per day in LLM API costs. Actual cost is $0.13/user/day — 3x over. The feature is beloved (4.4/5, 38% weekly active rate). You're burning through your AI budget and the CFO wants answers. What are the likely causes, how do you investigate, and what's your optimization roadmap?",
    difficulty: 'intermediate',
    tags: ['llm-costs', 'cost-optimization', 'ai-product', 'scaling'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: false,
    role_tags: ['ML Eng', 'SWE', 'Founding Eng']
  },
  {
    id: cid(26),
    domain_id: DOMAIN_STRATEGY,
    title: "Should You Show Users the AI's Confidence Score?",
    prompt_text: "Your AI medical triage tool (for a telehealth company) gives symptom assessments with an internal confidence score. Engineering wants to surface that score to users ('87% confident this is viral, not bacterial'). The clinical team says showing uncertainty to anxious patients is dangerous. The product team says transparency builds trust. Legal says confidence scores might create liability. You're the PM — what do you decide, and how?",
    difficulty: 'intermediate',
    tags: ['ai-transparency', 'uncertainty', 'healthcare', 'trust'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'ML Eng', 'EM']
  },

  // ─── AI-ASSISTED · ADVANCED (4) ────────────────────────────────────────────
  {
    id: cid(27),
    domain_id: DOMAIN_METRICS,
    title: "Eval Suite Says 91% But Users Still Complain",
    prompt_text: "Your AI coding assistant has a curated eval suite of 500 tasks. Your latest model scores 91% — a big jump from 83% last month. You ship with confidence. Within a week, user-reported error rate in the feedback widget goes up 15%, not down. Power users on Discord say the model 'feels worse.' What's happening? Diagnose the eval-to-production gap and redesign your evaluation strategy.",
    difficulty: 'advanced',
    tags: ['evals', 'ml-ops', 'developer-tools', 'ai-quality'],
    estimated_minutes: 45,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['ML Eng', 'Data Eng', 'SWE']
  },
  {
    id: cid(28),
    domain_id: DOMAIN_STRATEGY,
    title: "Multi-Model Strategy: When to Mix LLMs",
    prompt_text: "You're the ML lead at a Series B startup. Your product has 8 different AI features: code generation, summarization, classification, sentiment, entity extraction, search, Q&A, and image captioning. You're currently using GPT-4o for everything. Your costs are $180K/month in LLM API calls. A junior engineer proposes routing cheaper models (Haiku, Llama 3.1 8B) to simpler tasks. The CTO is skeptical about complexity. Design the model routing strategy.",
    difficulty: 'advanced',
    tags: ['llm-routing', 'cost-optimization', 'ml-architecture', 'multi-model'],
    estimated_minutes: 45,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['ML Eng', 'Data Eng', 'Founding Eng']
  },
  {
    id: cid(29),
    domain_id: DOMAIN_METRICS,
    title: "AI Fairness Audit: Model Works Better for Some Users",
    prompt_text: "You're a data engineer at a fintech startup. Your AI-powered credit risk model has an overall default prediction accuracy of 88%. But when you slice by geography: urban zip codes score 91%, rural zip codes score 79%. By income bracket: >$80K scores 92%, <$30K scores 76%. The product is profitable and the CEO sees no problem. Your data team is alarmed. What do you do, and what does 'fix it' even mean here?",
    difficulty: 'advanced',
    tags: ['fairness', 'bias', 'credit', 'fintech', 'ml-ethics'],
    estimated_minutes: 40,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'list', 'win'],
    is_premium: true,
    role_tags: ['Data Eng', 'ML Eng', 'EM']
  },
  {
    id: cid(30),
    domain_id: DOMAIN_STRATEGY,
    title: "Competitor Announces GPT-5 Integration; You're on Claude",
    prompt_text: "It's 2025. You're PM at a startup whose core product is an AI writing tool. You've been building on Claude 3.5 and have deep prompt engineering, evals, and fine-tuning invested. A major competitor just announced they're launching a GPT-5 powered version that has demonstrably better reasoning on your key benchmark tasks. Users on social media are buzzing. Your board asks: 'Should we switch models?' What's your decision framework?",
    difficulty: 'advanced',
    tags: ['model-selection', 'ai-strategy', 'competitive', 'technical-debt'],
    estimated_minutes: 40,
    is_published: true,
    paradigm: 'ai-assisted',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['ML Eng', 'Founding Eng', 'EM']
  },

  // ─── AGENTIC · BEGINNER (3) ─────────────────────────────────────────────────
  {
    id: cid(31),
    domain_id: DOMAIN_STRATEGY,
    title: "Your AI Agent Booked the Wrong Meeting",
    prompt_text: "You work at a startup that built an AI scheduling agent for executives. A beta user's agent autonomously moved a board meeting to a different day because it detected a conflict, without asking for confirmation. The CFO was on a flight to the old meeting location. The CEO is furious. This is the third 'oops' from the agent this month. How do you redesign the agent's decision-making and confirmation model?",
    difficulty: 'beginner',
    tags: ['agentic-ai', 'human-in-the-loop', 'scheduling', 'error-recovery'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'ML Eng']
  },
  {
    id: cid(32),
    domain_id: DOMAIN_METRICS,
    title: "Agent Task Completion Rate is 43%",
    prompt_text: "You've shipped an AI agent for your developer tool that can autonomously handle tasks like 'set up a new GitHub repo with CI/CD,' 'create Jira tickets from a requirements doc,' and 'deploy a staging environment.' After 2 months, autonomous task completion rate is 43% — meaning 57% require human intervention or fail. Users are losing trust. How do you diagnose the failures and decide which tasks to cut vs. improve?",
    difficulty: 'beginner',
    tags: ['agentic-ai', 'task-completion', 'reliability', 'developer-tools'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'list'],
    is_premium: false,
    role_tags: ['SWE', 'ML Eng', 'DevOps']
  },
  {
    id: cid(33),
    domain_id: DOMAIN_STRATEGY,
    title: "How Much Autonomy Should Your AI Agent Have?",
    prompt_text: "You're building an AI agent for e-commerce store owners. The agent can: monitor inventory, write and publish product descriptions, adjust prices based on competitor data, and respond to customer emails. Right now, every action requires human approval. Your users say the approval flow defeats the purpose. But full autonomy feels risky for pricing and customer communication. Design the autonomy model for this agent.",
    difficulty: 'beginner',
    tags: ['agentic-ai', 'autonomy', 'human-in-the-loop', 'e-commerce'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'Founding Eng']
  },

  // ─── AGENTIC · INTERMEDIATE (5) ────────────────────────────────────────────
  {
    id: cid(34),
    domain_id: DOMAIN_METRICS,
    title: "Agentic Loop is Burning API Tokens on Retries",
    prompt_text: "Your AI agent for automated data pipeline management is running agentic loops to diagnose and fix broken pipelines. In production, you've found that 30% of runs enter a 'retry spiral' — the agent tries the same failed approach 6-8 times before giving up, burning $2.40 per incident instead of the expected $0.30. The pipelines it's trying to fix are the same 3 failure patterns. How do you redesign the agent's reasoning loop?",
    difficulty: 'intermediate',
    tags: ['agentic-ai', 'cost', 'retry-logic', 'data-engineering'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: false,
    role_tags: ['ML Eng', 'Data Eng', 'DevOps']
  },
  {
    id: cid(35),
    domain_id: DOMAIN_STRATEGY,
    title: "Multi-Agent System: Debugging Emergent Failures",
    prompt_text: "You're a senior engineer at a startup building a multi-agent system for automated software testing. You have agents for: requirement parsing, test case generation, test execution, and bug reporting. In production, 8% of bugs are reported with incorrect severity ratings — P0 bugs are being classified as P3. No individual agent has this bug in isolation. The failure is emergent from agent coordination. How do you debug and fix a system where the bug lives between agents?",
    difficulty: 'intermediate',
    tags: ['multi-agent', 'debugging', 'emergent-behavior', 'testing'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: true,
    role_tags: ['SWE', 'ML Eng', 'DevOps']
  },
  {
    id: cid(36),
    domain_id: DOMAIN_STRATEGY,
    title: "Your AI Coding Agent Introduced a Security Vulnerability",
    prompt_text: "Your startup sells an AI coding agent that can autonomously implement features from a ticket description. A customer's agent autonomously implemented a feature that introduced a SQL injection vulnerability — the agent used string concatenation for a database query instead of parameterized queries. The customer's security scan caught it before production. This is a near-miss. How do you redesign your agent's guardrails and your liability model?",
    difficulty: 'intermediate',
    tags: ['agentic-ai', 'security', 'guardrails', 'developer-tools'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'list', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'DevOps', 'ML Eng']
  },
  {
    id: cid(37),
    domain_id: DOMAIN_METRICS,
    title: "Measuring Success for an Agentic Feature",
    prompt_text: "Your team just launched an AI agent inside your SaaS product that autonomously handles 'data cleanup tasks' for users. Your current metrics are: task completion rate (71%), time saved per task (18 min avg), and user satisfaction (4.0/5). Your VP of Product says these metrics look fine but doesn't feel confident about them. Design a comprehensive measurement framework specifically for agentic features — what are you actually optimizing for?",
    difficulty: 'intermediate',
    tags: ['agentic-ai', 'metrics', 'product-management', 'saas'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'optimize'],
    is_premium: false,
    role_tags: ['Data Eng', 'ML Eng', 'EM']
  },
  {
    id: cid(38),
    domain_id: DOMAIN_STRATEGY,
    title: "Agent Economy: When Users Start Selling Agent Outputs",
    prompt_text: "You've built an AI research agent that synthesizes market research reports. Your B2B customers love it. But you've discovered that 3 of your largest enterprise clients are reselling the agent-generated reports as their own research product, charging their clients $2,000/report. Your ToS prohibits resale. But blocking this risks churning 3 accounts worth $180K ARR. How do you handle this, and does it change your product strategy?",
    difficulty: 'intermediate',
    tags: ['agentic-ai', 'business-model', 'terms-of-service', 'enterprise'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'win'],
    is_premium: true,
    role_tags: ['Founding Eng', 'EM']
  },

  // ─── AGENTIC · ADVANCED (2) ─────────────────────────────────────────────────
  {
    id: cid(39),
    domain_id: DOMAIN_STRATEGY,
    title: "Building Trust for a Fully Autonomous Financial Agent",
    prompt_text: "You're the PM at a fintech startup building a fully autonomous financial management agent. It can: categorize transactions, negotiate with service providers, cancel unused subscriptions, and move money between accounts — all without per-action confirmation. You're preparing for public launch. Your legal team says you need 'meaningful human oversight.' Your UX team says too many confirmations kill the value prop. Your security team wants a full audit trail. Design the trust architecture.",
    difficulty: 'advanced',
    tags: ['agentic-ai', 'fintech', 'trust', 'autonomy', 'compliance'],
    estimated_minutes: 45,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'list', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'ML Eng', 'Founding Eng']
  },
  {
    id: cid(40),
    domain_id: DOMAIN_METRICS,
    title: "Agentic System Latency: P99 is 47 Seconds",
    prompt_text: "Your multi-agent system for automated contract review has a P50 latency of 8 seconds (acceptable), but P99 is 47 seconds. Your enterprise clients have a hard requirement of <15 seconds for 99th percentile. The system chains: document parsing agent → clause extraction agent → risk scoring agent → summary agent. You have tracing data but the bottleneck isn't obvious — sometimes it's clause extraction, sometimes summary. Design your optimization strategy.",
    difficulty: 'advanced',
    tags: ['agentic-ai', 'latency', 'performance', 'multi-agent', 'legaltech'],
    estimated_minutes: 45,
    is_published: true,
    paradigm: 'agentic',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: true,
    role_tags: ['SWE', 'ML Eng', 'DevOps']
  },

  // ─── AI-NATIVE · BEGINNER (2) ───────────────────────────────────────────────
  {
    id: cid(41),
    domain_id: DOMAIN_STRATEGY,
    title: "Designing the First Screen of an AI-Native App",
    prompt_text: "You're the product designer/engineer at a startup building an AI-native task manager. Unlike traditional apps with menus and forms, your product is primarily conversational — users type or speak what they want to do. You're designing the empty state / first-run experience. Traditional onboarding flows (tooltips, walkthroughs) don't apply. How do you onboard a user to an AI-native interface in a way that sets them up for success?",
    difficulty: 'beginner',
    tags: ['ai-native', 'onboarding', 'ux', 'conversational-ui'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'Founding Eng']
  },
  {
    id: cid(42),
    domain_id: DOMAIN_METRICS,
    title: "How Do You Know If Your AI-Native Product Is Working?",
    prompt_text: "You've built an AI-native productivity tool — there's no traditional feature usage to track (no button clicks, no form submissions). Users just... talk to it and things happen. Your traditional analytics show 'sessions' and 'messages sent' but your investors want to see meaningful product metrics at your Series A pitch. What metrics do you propose, and how do you instrument an AI-native product?",
    difficulty: 'beginner',
    tags: ['ai-native', 'metrics', 'analytics', 'series-a'],
    estimated_minutes: 25,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'list'],
    is_premium: false,
    role_tags: ['SWE', 'Data Eng', 'Founding Eng']
  },

  // ─── AI-NATIVE · INTERMEDIATE (5) ──────────────────────────────────────────
  {
    id: cid(43),
    domain_id: DOMAIN_STRATEGY,
    title: "Context Window as Product Real Estate",
    prompt_text: "You're building an AI-native CRM. Every sales call feeds context into the AI's memory — customer history, objections, deal stage, personality notes. Your power users are hitting context limits mid-conversation and the AI 'forgets' recent discussion. You need to design a memory and context management system. What do you prioritize in the context window, what gets archived, and how do you surface that tradeoff to users?",
    difficulty: 'intermediate',
    tags: ['ai-native', 'context-management', 'memory', 'crm'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'ML Eng', 'Founding Eng']
  },
  {
    id: cid(44),
    domain_id: DOMAIN_METRICS,
    title: "AI-Native App Retention Cliff at Day 7",
    prompt_text: "Your AI-native journaling app has great D1 retention (68%) but falls off sharply at D7 (19%) and D30 (7%). Qualitative research shows users say 'I forgot it was there' or 'I wasn't sure what to do with it.' The AI generates insightful reflections but users don't return unless they actively open the app. You have no push notification strategy yet. Design the re-engagement and habit-formation system for an AI-native experience.",
    difficulty: 'intermediate',
    tags: ['ai-native', 'retention', 'habit-formation', 'notifications'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'list', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'Founding Eng', 'EM']
  },
  {
    id: cid(45),
    domain_id: DOMAIN_STRATEGY,
    title: "When to Trust the AI's Answer (and When to Double-Check)",
    prompt_text: "You're building an AI-native research tool used by consultants. The AI synthesizes answers from uploaded documents and web search. Your user research shows a disturbing pattern: consultants are including AI-generated facts in client deliverables without verification, and two clients have flagged incorrect statistics. But adding 'warning: verify this' to every output destroys the product's value proposition. Design a trust calibration system.",
    difficulty: 'intermediate',
    tags: ['ai-native', 'trust', 'hallucination', 'knowledge-work'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'ML Eng', 'EM']
  },
  {
    id: cid(46),
    domain_id: DOMAIN_STRATEGY,
    title: "Pricing an AI-Native Product With Unpredictable Usage",
    prompt_text: "You're launching your AI-native legal research tool commercially. Power users run 200+ queries/month, generating $12 in LLM costs per user. Casual users run 15 queries, costing $0.90. Both get equal value relative to their use. Your VC says 'just do $99/month flat rate.' Your engineer says 'we'll lose money on power users.' Your biggest champion customer says 'I need budget predictability — no consumption pricing.' Design a pricing model that works for all three.",
    difficulty: 'intermediate',
    tags: ['ai-native', 'pricing', 'unit-economics', 'legaltech'],
    estimated_minutes: 35,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['Founding Eng', 'EM']
  },
  {
    id: cid(47),
    domain_id: DOMAIN_METRICS,
    title: "Personalizing an AI-Native Experience Without Being Creepy",
    prompt_text: "Your AI-native health coaching app learns from users over time — their sleep patterns, mood, exercise, eating habits. The more data it has, the better the coaching. But your user research shows that after 90 days, 34% of users start feeling 'watched' and their engagement drops. The users who don't feel watched are 3x more retained. What's the product and UX intervention to maintain the personalization benefit without triggering the surveillance feeling?",
    difficulty: 'intermediate',
    tags: ['ai-native', 'personalization', 'privacy', 'health-tech', 'trust'],
    estimated_minutes: 30,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'optimize'],
    is_premium: false,
    role_tags: ['SWE', 'ML Eng', 'Founding Eng']
  },

  // ─── AI-NATIVE · ADVANCED (3) ───────────────────────────────────────────────
  {
    id: cid(48),
    domain_id: DOMAIN_STRATEGY,
    title: "Defensibility in an AI-Native World",
    prompt_text: "You're a founding engineer at an AI-native startup (think: a vertical AI for procurement). Your core product is essentially a well-designed wrapper around GPT-4o with good prompting, domain-specific evals, and a clean UI. OpenAI just announced 'Custom GPTs for Enterprise' that would let your customers recreate 80% of your features for free. Your investors are asking: what is the actual moat? You have 18 months of runway. What do you build?",
    difficulty: 'advanced',
    tags: ['ai-native', 'moat', 'defensibility', 'startup-strategy', 'procurement'],
    estimated_minutes: 45,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'list', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['Founding Eng', 'EM', 'SWE']
  },
  {
    id: cid(49),
    domain_id: DOMAIN_METRICS,
    title: "AI-Native Product at Scale: When Personalization Diverges",
    prompt_text: "Your AI-native email client has 500K users. The AI learns each user's preferences deeply — tone, priority signals, response style. But you're finding that at scale, the 'product' is actually 500K different products. Bug reports are nearly impossible to reproduce because every AI behavior is personalized. Quality is inconsistent across cohorts. Your on-call engineers can't debug issues. How do you maintain product quality when the product is fundamentally personalized?",
    difficulty: 'advanced',
    tags: ['ai-native', 'personalization', 'quality', 'scale', 'debugging'],
    estimated_minutes: 45,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'list', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'ML Eng', 'Data Eng', 'DevOps']
  },
  {
    id: cid(50),
    domain_id: DOMAIN_STRATEGY,
    title: "The UI Is the AI: When to Go Full Conversational",
    prompt_text: "You're a PM at a startup building an AI-native data analytics tool for non-technical users. Your prototype has a hybrid UI: natural language query input + traditional chart/filter controls. Your user research shows: power users love the traditional controls (faster), new users love conversation (lower barrier). Your engineering team says maintaining both is slowing down iteration. The board says 'just pick one.' What do you do, and how do you validate the decision?",
    difficulty: 'advanced',
    tags: ['ai-native', 'ux', 'conversational-ui', 'product-strategy', 'analytics'],
    estimated_minutes: 45,
    is_published: true,
    paradigm: 'ai-native',
    move_tags: ['frame', 'optimize', 'win'],
    is_premium: true,
    role_tags: ['SWE', 'Data Eng', 'Founding Eng', 'EM']
  }
]

// Now define 4 steps per challenge (200 total)
// Steps follow the FLOW moves: frame → list → optimize → win
// Each challenge has step_index 0,1,2,3 with appropriate moves

function buildSteps(challengeIdx, challengeId, moveList) {
  const stepDefs = [
    {
      move: 'frame',
      prompt: null,
      hint: null,
      recommended: null,
      pattern_title: null,
      pattern_body: null,
      trap_ids: []
    },
    {
      move: 'list',
      prompt: null,
      hint: null,
      recommended: null,
      pattern_title: null,
      pattern_body: null,
      trap_ids: []
    },
    {
      move: 'optimize',
      prompt: null,
      hint: null,
      recommended: null,
      pattern_title: null,
      pattern_body: null,
      trap_ids: []
    },
    {
      move: 'win',
      prompt: null,
      hint: null,
      recommended: null,
      pattern_title: null,
      pattern_body: null,
      trap_ids: []
    }
  ]
  // Override with challenge-specific content
  return stepDefs.map((s, i) => ({
    id: sid(challengeIdx * 4 + i + 1),
    challenge_id: challengeId,
    move: s.move,
    step_index: i,
    prompt: s.prompt,
    hint: s.hint,
    recommended: s.recommended,
    pattern_title: s.pattern_title,
    pattern_body: s.pattern_body,
    trap_ids: s.trap_ids
  }))
}

// Define all 200 steps with meaningful content
const allSteps = [
  // Challenge 1: Spotify Session Drop
  {
    id: sid(1), challenge_id: cid(1), move: 'frame', step_index: 0,
    prompt: "Before diving into fixes, how would you define the problem precisely? What's the exact metric that dropped and what does it actually measure?",
    hint: "Think about what 'sessions' means — is it sessions started, sessions of a certain length, or something else? Could the metric itself be misleading?",
    recommended: "The problem is a 15% drop in daily active session count, but I need to verify: does 'session' mean distinct app opens? If users are now sharing (leaving the app) and returning, session count might legitimately increase in opens but decrease in duration. I'd first align on the exact session definition before assuming engagement dropped. The real question might be: did user value change, or just measurement?",
    pattern_title: "Metric Definition First",
    pattern_body: "Before diagnosing a metric change, always confirm exactly what the metric measures. Many 'drops' are measurement artifacts, not real behavior changes.",
    trap_ids: ['surface_restatement', 'metric_tunnel']
  },
  {
    id: sid(2), challenge_id: cid(1), move: 'list', step_index: 1,
    prompt: "Generate a comprehensive list of hypotheses for why sessions dropped after the share button was added. Think across technical, behavioral, and measurement causes.",
    hint: "Consider: Could the button interrupt the listening flow? Could it be a technical regression? Could users be sharing then closing the app?",
    recommended: "Hypotheses: (1) Technical — share button tap causes app crash/freeze on certain OS versions, (2) UX disruption — the button placement interrupts the playback flow, causing users to exit accidentally, (3) Behavioral — users who share leave the app (go to the social platform they shared to) and don't return, (4) Measurement artifact — share action creates a session boundary, inflating historical session counts, (5) Notification change — share feature caused permission prompts that annoyed users into disabling notifications, reducing re-engagement.",
    pattern_title: "MECE Hypothesis Generation",
    pattern_body: "List hypotheses across mutually exclusive categories: technical bug, UX behavior change, measurement artifact, and indirect effects. This prevents premature diagnosis.",
    trap_ids: ['confirmation_bias', 'premature_solution']
  },
  {
    id: sid(3), challenge_id: cid(1), move: 'optimize', step_index: 2,
    prompt: "You have limited engineering bandwidth for this week. Which hypothesis do you investigate first, and what's the minimum data you need to confirm or reject it?",
    hint: "Look for the hypothesis that's cheapest to test and most likely if true to cause the observed magnitude of drop.",
    recommended: "Start with platform crash logs — if the share button is crashing on tap for a segment of users, that would explain a 15% session drop within 2 weeks. This takes 30 minutes to check in Datadog or Crashlytics. If no crash spike, check share→session-end correlation: do sessions end within 30 seconds of a share event? This tells us if users leave after sharing. Both tests require no new code.",
    pattern_title: "Cheapest Test First",
    pattern_body: "Prioritize hypotheses by (cost to test) × (probability × impact if true). Always check for crashes before behavioral explanations.",
    trap_ids: ['aggregate_fallacy', 'data_delay']
  },
  {
    id: sid(4), challenge_id: cid(1), move: 'win', step_index: 3,
    prompt: "You've identified the root cause. How do you communicate this to the PM and recommend a path forward — including what to do if the feature itself is causing the drop?",
    hint: "Think about how to frame the recommendation as a data-backed decision, not a blame game.",
    recommended: "Present findings in a structured format: Root cause (with data), Confidence level, Impact quantification, and 2-3 options with tradeoffs. If the feature is the cause, options include: (A) Remove share button and investigate placement alternatives, (B) A/B test a less disruptive placement (mini-bar vs. full-screen), (C) Ship a quick fix and monitor. Frame it as 'we learned something valuable about session behavior' not 'the feature broke things.'",
    pattern_title: "Options-Based Communication",
    pattern_body: "Present findings to stakeholders as: root cause + confidence + options (not just 'here's the problem'). Always include a recommendation with your reasoning.",
    trap_ids: ['abdication']
  },

  // Challenge 2: DAU/MAU vs Revenue
  {
    id: sid(5), challenge_id: cid(2), move: 'frame', step_index: 0,
    prompt: "How do you explain the paradox to the CEO in a single clear framing? What's the core tension between engagement and revenue in B2B SaaS?",
    hint: "In B2B SaaS, who uses the product is often different from who pays for it. Engagement by end-users doesn't automatically translate to willingness to expand.",
    recommended: "The key framing: in B2B SaaS, DAU/MAU measures end-user engagement, not buyer value perception. Rising engagement often means users like the product, but expansion revenue depends on buyer perception of ROI and team growth. The paradox usually means one of three things: (1) Users are consolidating — fewer unique users are doing more work (efficiency gain that reduces seats), (2) Buyer churn isn't visible in engagement data, (3) Users love features that aren't tied to the paid upsell path.",
    pattern_title: "User vs. Buyer Distinction",
    pattern_body: "In B2B, separate end-user metrics from economic buyer metrics. High engagement can coexist with low expansion if the value isn't visible to the budget owner.",
    trap_ids: ['aggregate_fallacy', 'metric_tunnel']
  },
  {
    id: sid(6), challenge_id: cid(2), move: 'list', step_index: 1,
    prompt: "List the specific data cuts you'd run to diagnose the engagement-revenue gap. What segment breakdowns matter most?",
    hint: "Think about company size, contract renewal dates, and which features are driving the engagement uplift.",
    recommended: "Data cuts to run: (1) Engagement by company size — are SMBs driving DAU/MAU while enterprise accounts (higher ACV) are flat? (2) Feature-level engagement — which features drove the 0.13 DAU/MAU increase? Are those features in the free tier? (3) Seat utilization — are high-engagement accounts using fewer seats per licensed user? (4) Renewal cohort analysis — are accounts up for renewal in the next 90 days showing the engagement gain or different patterns? (5) Expansion trigger features — what features have historically correlated with upsell, and are those being used?",
    pattern_title: "Cohort Segmentation",
    pattern_body: "Aggregate metrics hide segment-level dynamics. Always slice by company size, tenure, and feature usage before drawing conclusions.",
    trap_ids: ['aggregate_fallacy', 'confirmation_bias']
  },
  {
    id: sid(7), challenge_id: cid(2), move: 'optimize', step_index: 2,
    prompt: "You find that the engagement gain is driven by a 'quick status update' feature in the free tier. Paid features (roadmap planning, OKR tracking) are flat. What's your recommendation?",
    hint: "This is a product-led growth problem: you've accidentally built a free product people love but not a paid product they need.",
    recommended: "The status update feature is driving engagement but it's free-tier value. Recommendation: (1) Audit paid feature engagement — if roadmap/OKR features are unused, they're not delivering paid value, (2) Run discovery interviews with churned expansion accounts, (3) Consider moving status updates to paid tier if it's genuinely high-value, or (4) Build the bridge: surface roadmap/OKR features inside the status update workflow so high-engagement users naturally touch paid features. Short term: flag accounts with high free engagement + low paid engagement as expansion risk.",
    pattern_title: "Value Ladder Alignment",
    pattern_body: "In PLG products, ensure free-tier engagement leads users toward paid-tier value. If free features are the best features, expansion will stall.",
    trap_ids: ['premature_solution', 'metric_tunnel']
  },
  {
    id: sid(8), challenge_id: cid(2), move: 'win', step_index: 3,
    prompt: "How do you present this to the CEO in a way that reframes the 'good engagement' story and sets realistic expectations?",
    hint: "The CEO is proud of the DAU/MAU number. Your job is to add nuance without making them feel misled.",
    recommended: "Lead with what's true: 'Our users genuinely love the product — that's real and valuable.' Then add the nuance: 'DAU/MAU is measuring usage of our free-tier features. Here's what the data shows about paid feature engagement, and here's the risk.' Propose a new north star metric: 'Paid Feature Weekly Active Rate' — the % of licensed seats engaging with paid features weekly. Set a target and a 90-day plan to move it. This gives the CEO a new story to follow and sets up the right incentives for the team.",
    pattern_title: "Reframe, Don't Refute",
    pattern_body: "When presenting uncomfortable findings to leadership, acknowledge what's true first, then layer in the nuance. Propose a better metric alongside the diagnosis.",
    trap_ids: ['abdication', 'surface_restatement']
  },

  // Challenge 3: Free Plan Cannibalization
  {
    id: sid(9), challenge_id: cid(3), move: 'frame', step_index: 0,
    prompt: "What's the actual business question here? Frame it as a decision, not just a problem.",
    hint: "The 60% who never hit the limit aren't necessarily a problem — they might be future converters, advocates, or lost causes. Which are they?",
    recommended: "The decision is: what is the right free tier limit that maximizes long-term revenue without destroying word-of-mouth? Before cutting the limit, I need to answer: (1) What % of paid users started on free? (This quantifies the funnel value of free), (2) What behavior predicts paid conversion from free? (Is it hitting the limit, or something else?), (3) What does the 60% who never hit the limit do — do they refer others, write about the product, use it actively but lightly?",
    pattern_title: "Decision Framing",
    pattern_body: "Convert 'what's wrong' questions into 'what decision do I need to make and what data do I need to make it well?'",
    trap_ids: ['surface_restatement', 'premature_solution']
  },
  {
    id: sid(10), challenge_id: cid(3), move: 'list', step_index: 1,
    prompt: "List all the considerations that should go into the free tier decision — not just revenue impact, but second and third-order effects.",
    hint: "Think about developer community dynamics, virality, competitive moat, and what happens when you cut the limit.",
    recommended: "Considerations: (1) Conversion funnel — if 40% of paid started on free, killing free tanks top-of-funnel, (2) Word of mouth — developers who use the free tier talk about it at work, in blogs, in open source; cutting it silences advocates, (3) Competitive response — if you cut to 1K and a competitor launches 10K free, you lose the market, (4) Usage distribution — if 60% use <500 calls, 1K limit doesn't help, only 10K limit creates upgrade pressure, (5) Ecosystem value — free users may build integrations, write tutorials, and create network effects worth more than their direct revenue, (6) Experimentation — can you A/B test free limits on a new-signup cohort without affecting existing users?",
    pattern_title: "Second-Order Effects",
    pattern_body: "Pricing decisions have ecosystem effects beyond direct revenue. Always map out indirect effects on community, competition, and word-of-mouth before recommending a limit change.",
    trap_ids: ['confirmation_bias', 'metric_tunnel']
  },
  {
    id: sid(11), challenge_id: cid(3), move: 'optimize', step_index: 2,
    prompt: "You have 4 weeks to run one experiment. What would it be and what's your success criteria?",
    hint: "You can test the limit on new signups without affecting existing users. What's the right cohort and what are you measuring?",
    recommended: "Experiment: For new signups only, A/B test free tier at 3K calls/month vs. 10K (current). Run for 6 weeks on new signup cohort. Primary metric: 90-day free-to-paid conversion rate. Secondary: Day-30 activation rate, referral rate (do they invite teammates?), churn in the first 30 days. Don't test 1K — that's too aggressive for one leap. The 3K → paid conversion data will tell you whether limit-hits drive upgrades or just churn.",
    pattern_title: "Controlled Limit Testing",
    pattern_body: "Never cut pricing tiers globally without testing on a new-signup cohort first. Existing users may have different behavior than new users.",
    trap_ids: ['data_delay', 'aggregate_fallacy']
  },
  {
    id: sid(12), challenge_id: cid(3), move: 'win', step_index: 3,
    prompt: "Write the recommendation you'd give to the CEO. What do you recommend, what's your confidence level, and what are you monitoring?",
    hint: "The CEO needs to make a decision this week. Give them a clear recommendation with the data you have, not a perfect answer.",
    recommended: "Recommendation: Do not cut to 1K this quarter without data. Instead, run a new-signup A/B test at 3K vs. 10K for 6 weeks. In parallel, immediately analyze whether free users who never hit the limit convert at a different rate than limit-hitters — this is data we already have. If limit-hitters convert at 5x the rate, the limit matters. If they convert at 1.2x, the limit isn't the conversion driver and we need to find what is. I'm 70% confident the limit isn't the primary issue based on the 3% CTR on upgrade prompts.",
    pattern_title: "Confident Recommendation Under Uncertainty",
    pattern_body: "Give a clear recommendation even when you lack perfect data. State your confidence level and what would change your recommendation.",
    trap_ids: ['abdication']
  },

  // Challenge 4: On-Call Alert Volume
  {
    id: sid(13), challenge_id: cid(4), move: 'frame', step_index: 0,
    prompt: "Leadership says 'everything looks fine in the dashboards.' How do you reconcile the dashboard view with the engineer experience? What's the real problem statement?",
    hint: "The dashboards show technical health. But what are you actually trying to measure — system reliability, or team sustainability?",
    recommended: "The dashboard-engineer gap reveals a measurement problem: we're measuring system health (error rate, latency) but not alert quality. The real problem is: our alerting system has too many low-signal pages, causing engineer fatigue and retention risk, even though system-level SLAs are met. The business risk isn't a technical outage — it's talent loss. Two engineers threatening to quit is a $400K+ replacement cost risk plus knowledge loss. This needs to be framed as a business risk, not just an engineering complaint.",
    pattern_title: "Measurement Gap Identification",
    pattern_body: "When dashboards say 'fine' but people say 'bad,' look for what the dashboards aren't measuring. Alert quality and team sustainability are often invisible to aggregate metrics.",
    trap_ids: ['metric_tunnel', 'surface_restatement']
  },
  {
    id: sid(14), challenge_id: cid(4), move: 'list', step_index: 1,
    prompt: "Audit the alert problem. What categories of alerts are likely causing the volume increase, and how do you prioritize which to fix first?",
    hint: "Think about actionability, noise-to-signal ratio, and the difference between symptom alerts and root cause alerts.",
    recommended: "Alert categories to audit: (1) Redundant alerts — multiple alerts for the same root cause (e.g., 5 alerts that all fire when the DB is slow), (2) Flapping alerts — alerts that fire and recover repeatedly on their own without engineer action, (3) Symptom-only alerts — alerts that fire on a symptom (latency spike) but not the cause, requiring investigation before any action, (4) Threshold drift — thresholds set 2 years ago that are now wrong for current traffic levels, (5) Non-actionable alerts — things that fire but the engineer can't do anything about at 2am. Run a 30-day alert audit: for each alert, tag it as (actionable / non-actionable) and (symptom / cause). Non-actionable = silence. Symptom-only = convert to tickets.",
    pattern_title: "Alert Taxonomy",
    pattern_body: "Every alert should answer: Is this actionable right now? If not, it's not a page — it's a ticket or a dashboard item.",
    trap_ids: ['aggregate_fallacy', 'premature_solution']
  },
  {
    id: sid(15), challenge_id: cid(4), move: 'optimize', step_index: 2,
    prompt: "Design the 4-week intervention to get from 14 pages/shift to under 5. What's the priority order?",
    hint: "Quick wins first. Don't redesign everything at once — find the 20% of alerts causing 80% of the noise.",
    recommended: "Week 1: Pull the alert frequency report. Find top 5 most-fired alerts over 90 days. For each, determine if it's actionable and has the right threshold. Silence or convert the bottom 3. (Likely 40% noise reduction from this alone.) Week 2: Implement alert deduplication — if the same root cause fires 5 alerts, route only one P1 to on-call and the rest to a dashboard. Week 3: Fix flapping alerts with delayed firing (require 5 min sustained above threshold before paging). Week 4: Review with the on-call team — are pages now actionable? Get sign-off from the two engineers threatening to quit.",
    pattern_title: "High-Frequency Fix First",
    pattern_body: "Alert noise problems are usually Pareto-distributed. Fix the top 5 most-fired alerts and you often solve 70% of the problem.",
    trap_ids: ['premature_solution', 'data_delay']
  },
  {
    id: sid(16), challenge_id: cid(4), move: 'win', step_index: 3,
    prompt: "How do you make the case to leadership that this is worth investing engineering time in, given that SLAs are being met?",
    hint: "Translate engineer morale into business metrics that leadership cares about.",
    recommended: "Leadership speaks in revenue and cost. Frame it: 'Two engineers are at risk of leaving. Replacement cost is $150-200K each in recruiting + ramp. The on-call improvement project takes 4 weeks of 1 engineer at 50% capacity — roughly $15K in opportunity cost. That's a 20:1 ROI before we count the productivity and knowledge retention benefits.' Then add: 'Alert fatigue increases incident response time. When engineers are burned out, real P0s get slower responses. This is a reliability risk that isn't visible until it's too late.' Present both the human case and the business case.",
    pattern_title: "Cost-of-Inaction Framing",
    pattern_body: "When pitching improvements to leadership, quantify the cost of NOT doing the work alongside the cost of doing it.",
    trap_ids: ['abdication', 'surface_restatement']
  },

  // Challenge 5: Tech Debt vs. Features
  {
    id: sid(17), challenge_id: cid(5), move: 'frame', step_index: 0,
    prompt: "What's the right framework for comparing tech debt investment against feature work? They seem incommensurable — how do you make them comparable?",
    hint: "Tech debt has a cost that's often invisible on product roadmaps. Try to make it visible.",
    recommended: "The framing that works: tech debt is a tax on all future work. If auth is causing 20% slower development velocity on every feature that touches it, then 6 weeks to fix it buys back 20% velocity on all future work — potentially worth more than 3 individual features. I'd also measure: (1) Bug rate from auth code — if it's generating 2 incidents/month at 4 hours each, that's 24 hours of engineering/month forever, (2) Engineer satisfaction — if good engineers are avoiding the codebase, that's a hiring/retention risk, (3) Feature blockers — which of the 3 product features are blocked or slowed by auth debt?",
    pattern_title: "Debt as Tax",
    pattern_body: "Model tech debt as a recurring tax on velocity, not a one-time cost. This makes it comparable to feature work by showing compounding opportunity cost.",
    trap_ids: ['metric_tunnel', 'surface_restatement']
  },
  {
    id: sid(18), challenge_id: cid(5), move: 'list', step_index: 1,
    prompt: "What are all the options beyond 'do features' vs. 'do auth refactor'? List creative approaches that might capture more value.",
    hint: "Think about sequencing, partial refactors, strangler fig pattern, and how to do both at different rates.",
    recommended: "Options beyond binary choice: (1) Strangler fig — refactor auth incrementally as features touch it, amortizing cost over 2 quarters, (2) Parallel tracks — 1 engineer on auth refactor (6 weeks), 3 engineers on 2 of the 3 features (6 weeks), (3) Feature-first, debt-second — ship 2 high-value features in Q1, dedicate Q2 solely to auth and platform, (4) Modular approach — refactor only the most-used 30% of auth code that touches new features, (5) Buy vs. build — replace the auth service with Auth0/Clerk (1 week integration vs. 6 weeks rebuild). The 'replace with off-the-shelf' option is often invisible in these debates.",
    pattern_title: "Expand the Option Set",
    pattern_body: "Binary framing (do A or B) is almost always wrong. In tech debt decisions, there's usually a third option: incremental refactor, off-the-shelf replacement, or parallel tracks.",
    trap_ids: ['premature_solution', 'confirmation_bias']
  },
  {
    id: sid(19), challenge_id: cid(5), move: 'optimize', step_index: 2,
    prompt: "You evaluate the off-the-shelf auth option (Auth0/Clerk). Integration takes 2 weeks, cost is $800/month, and it solves 90% of the brittleness. Do you take it?",
    hint: "Compare: 6 weeks engineer time (fully-loaded cost ~$30K) vs. $800/month forever plus 2 weeks migration. What's the break-even?",
    recommended: "At $800/month, break-even vs. the 6-week refactor (at ~$5K/week engineering cost = $30K total) is 37.5 months. BUT the comparison isn't just cost — it's: (1) You get 4 extra weeks of feature development in Q1, (2) You eliminate ongoing maintenance of auth code (estimate 5 hours/month = $1K/month in fully-loaded eng cost), factoring that in, actual payback is under 6 months, (3) Auth0/Clerk's security is better than what you'd build, reducing a risk vector. Recommendation: Take Auth0/Clerk, ship 2.5 features this quarter instead of 2, and save the 6 weeks of engineering for differentiated work.",
    pattern_title: "Total Cost of Ownership",
    pattern_body: "When evaluating build vs. buy for platform components, include maintenance cost and opportunity cost in the comparison — not just upfront cost.",
    trap_ids: ['metric_tunnel', 'premature_solution']
  },
  {
    id: sid(20), challenge_id: cid(5), move: 'win', step_index: 3,
    prompt: "Write the proposal for the CEO. You have 2 paragraphs. What do you say?",
    hint: "Lead with the insight (you found a better option), then give the recommendation clearly.",
    recommended: "Proposal: 'After evaluating the auth refactor vs. feature roadmap tradeoff, I found a third option that dominates both: migrating to Auth0, a managed auth service. This takes 2 weeks instead of 6, costs $800/month (break-even under 6 months vs. the refactor cost), and is more secure than our custom implementation. This lets us ship all 3 product features this quarter while eliminating the auth brittleness. My recommendation: migrate auth in weeks 1-2 of the quarter while the full team ramps up, then shift to full feature development in weeks 3-13. I'll need Product's sign-off on a 2-week Q1 delay on Feature 1.'",
    pattern_title: "Executive-Ready Proposal",
    pattern_body: "Proposals to senior leadership should lead with the key insight, give the recommendation clearly, quantify the tradeoff, and end with what you need from them.",
    trap_ids: ['abdication']
  },

  // Challenges 6-50: steps with good but slightly shorter content to keep the script manageable
]

// For challenges 6-50, generate good step content programmatically
const stepTemplates = [
  // Step 0: frame
  (c) => ({
    move: 'frame',
    prompt: `Before jumping to solutions for "${c.title}", how would you precisely frame the core problem? What question are you actually trying to answer?`,
    hint: "Identify who is affected, what specific metric or outcome is at risk, and what would 'solved' look like. Avoid restating the scenario — reframe it as a decision.",
    recommended: `The core question is not 'what happened' but 'what decision needs to be made and with what data?' For ${c.title.toLowerCase()}, the real frame is: [define the user, the behavior change, the business impact, and the decision owner]. Establish what success looks like before generating solutions.`,
    pattern_title: "Problem Framing",
    pattern_body: "Good product thinking starts with a precise problem statement: who is affected, by what change, with what business consequence, requiring what decision.",
    trap_ids: ['surface_restatement', 'premature_solution']
  }),
  // Step 1: list
  (c) => ({
    move: 'list',
    prompt: `Generate 5-7 distinct hypotheses or options for "${c.title}". Cover both obvious and non-obvious possibilities.`,
    hint: "Think across: technical causes, behavioral causes, measurement artifacts, and competitive/external factors. Include at least one hypothesis you initially find unlikely.",
    recommended: `A strong hypothesis list for this challenge covers: (1) the most obvious technical explanation, (2) a behavioral/user explanation, (3) a measurement or instrumentation artifact, (4) an external factor (competition, macro), (5) a second-order effect from a recent change. Each hypothesis should be falsifiable with available data.`,
    pattern_title: "MECE Hypothesis Generation",
    pattern_body: "Generate hypotheses that are mutually exclusive and collectively exhaustive. Avoid confirmation bias by including hypotheses that contradict your initial intuition.",
    trap_ids: ['confirmation_bias', 'aggregate_fallacy']
  }),
  // Step 2: optimize
  (c) => ({
    move: 'optimize',
    prompt: `For "${c.title}", what's the most impactful thing you can do with the constraints you have? How do you prioritize between options?`,
    hint: "Use effort vs. impact framing. Identify which option has the best signal-to-noise ratio for testing your top hypothesis. What can you learn in 48 hours vs. 4 weeks?",
    recommended: `Prioritize actions by: (1) reversibility — prefer actions that can be undone if wrong, (2) learning value — prefer tests that invalidate multiple hypotheses at once, (3) time to signal — prefer changes where you can measure impact within 1-2 weeks. For this challenge, the highest-leverage first move is to run a targeted data query before making any product changes.`,
    pattern_title: "Reversible Action Priority",
    pattern_body: "Under uncertainty, prefer reversible actions with fast feedback loops over irreversible commitments. Learn cheap before investing big.",
    trap_ids: ['data_delay', 'metric_tunnel']
  }),
  // Step 3: win
  (c) => ({
    move: 'win',
    prompt: `How do you communicate your recommendation for "${c.title}" to the relevant stakeholder in a clear, confident way — even before you have perfect data?`,
    hint: "Structure your communication as: root cause (with confidence %), recommendation, tradeoffs, and what you're monitoring. Avoid hedging so much that no decision gets made.",
    recommended: `Lead with your recommendation, not your analysis. Format: 'My recommendation is [X] because [1-sentence reason]. The main risk is [Y], which I'd mitigate by [Z]. I'll know if it's working within [timeframe] when I see [metric] move.' This gives the stakeholder a clear decision point and shows you've thought through the downside.`,
    pattern_title: "Confident Recommendation",
    pattern_body: "Communicate recommendations with: a clear action, the key supporting reason, the main risk and mitigation, and a measurable success signal. Avoid 'it depends' without a clear resolution.",
    trap_ids: ['abdication', 'surface_restatement']
  })
]

// Generate steps for challenges 6-50
for (let i = 5; i < 50; i++) {
  const c = challenges[i]
  const challengeIdx = i
  for (let j = 0; j < 4; j++) {
    const template = stepTemplates[j](c)
    allSteps.push({
      id: sid(challengeIdx * 4 + j + 1),
      challenge_id: c.id,
      move: template.move,
      step_index: j,
      prompt: template.prompt,
      hint: template.hint,
      recommended: template.recommended,
      pattern_title: template.pattern_title,
      pattern_body: template.pattern_body,
      trap_ids: template.trap_ids
    })
  }
}

async function seed() {
  console.log(`Inserting ${challenges.length} challenges...`)

  // Insert challenges in batches of 10
  for (let i = 0; i < challenges.length; i += 10) {
    const batch = challenges.slice(i, i + 10)
    const { error } = await supabase.from('challenge_prompts').insert(batch)
    if (error) {
      console.error(`Error inserting challenges batch ${i}-${i+10}:`, error.message)
      console.error(JSON.stringify(error, null, 2))
      process.exit(1)
    }
    console.log(`  Inserted challenges ${i+1}-${Math.min(i+10, challenges.length)}`)
  }

  console.log(`\nInserting ${allSteps.length} steps...`)

  // Insert steps in batches of 20
  for (let i = 0; i < allSteps.length; i += 20) {
    const batch = allSteps.slice(i, i + 20)
    const { error } = await supabase.from('challenge_steps').insert(batch)
    if (error) {
      console.error(`Error inserting steps batch ${i}-${i+20}:`, error.message)
      console.error(JSON.stringify(error, null, 2))
      process.exit(1)
    }
    console.log(`  Inserted steps ${i+1}-${Math.min(i+20, allSteps.length)}`)
  }

  // Verify
  const { count: cCount } = await supabase.from('challenge_prompts').select('*', { count: 'exact', head: true })
  const { count: sCount } = await supabase.from('challenge_steps').select('*', { count: 'exact', head: true })

  console.log(`\n✓ Done! Challenges in DB: ${cCount}, Steps in DB: ${sCount}`)
}

seed().catch(console.error)
