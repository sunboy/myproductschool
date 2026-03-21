-- ============================================================
-- MyProductSchool — Seed Data
-- Realistic product-thinking content for engineers
-- ============================================================

-- ============================================================
-- DOMAINS (5)
-- ============================================================

INSERT INTO domains (id, slug, title, description, icon, order_index, is_published) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'product-strategy',   'Product Strategy',    'Learn to define vision, set direction, and make bets that create long-term value.',            'strategy',    1, true),
  ('d0000001-0000-0000-0000-000000000002', 'user-research',      'User Research',       'Understand how to discover what users actually need — beyond what they say they want.',           'search',      2, true),
  ('d0000001-0000-0000-0000-000000000003', 'metrics-analytics',  'Metrics & Analytics', 'Define success with the right metrics, read data clearly, and avoid vanity traps.',              'bar_chart',   3, true),
  ('d0000001-0000-0000-0000-000000000004', 'prioritization',     'Prioritization',      'Cut through noise to focus on the work that moves the needle for users and the business.',        'sort',        4, true),
  ('d0000001-0000-0000-0000-000000000005', 'go-to-market',       'Go-to-Market',        'Plan launches, pick channels, and align cross-functional teams for a successful release.',        'rocket_launch', 5, true);


-- ============================================================
-- CONCEPTS (4 per domain = 20 total)
-- ============================================================

-- Domain: product-strategy
INSERT INTO concepts (id, domain_id, title, definition, example, difficulty, tags, order_index) VALUES
  ('c0000001-0000-0000-0000-000000000001',
   'd0000001-0000-0000-0000-000000000001',
   'Product Vision',
   'A product vision is an inspirational, durable statement of the future state you are working toward. It answers "why does this product exist?" and stays stable across years even as tactics change.',
   'Spotify''s vision is "to unlock the potential of human creativity — by giving a million creative artists the opportunity to live off their art and billions of fans the opportunity to enjoy and be inspired by it." This is not a feature; it is a north star that guides every roadmap decision.',
   'beginner',
   ARRAY['strategy', 'vision', 'direction'],
   1),

  ('c0000001-0000-0000-0000-000000000002',
   'd0000001-0000-0000-0000-000000000001',
   'Strategic Bets',
   'A strategic bet is a deliberate, high-conviction decision to invest resources in an uncertain outcome that could create disproportionate value. Unlike incremental improvements, bets accept the risk of being wrong in exchange for the chance of outsized reward.',
   'When Amazon launched AWS in 2006, it was a strategic bet that cloud infrastructure would become a commodity utility. At the time it cannibalized nothing yet built the company''s most profitable division.',
   'intermediate',
   ARRAY['strategy', 'risk', 'investment'],
   2),

  ('c0000001-0000-0000-0000-000000000003',
   'd0000001-0000-0000-0000-000000000001',
   'Opportunity Sizing',
   'Opportunity sizing is the process of estimating the total addressable market (TAM), serviceable addressable market (SAM), and realistically capturable market (SOM) for a product or feature. It helps teams decide whether a problem is worth solving at all.',
   'Before building a B2B expense-report feature, a PM estimates: 50M knowledge workers in the US file expense reports → 20M at companies that use SaaS tools (SAM) → we could realistically reach 2M in 3 years at $10/user/month = $240M ARR potential (SOM).',
   'intermediate',
   ARRAY['strategy', 'tam', 'market-sizing'],
   3),

  ('c0000001-0000-0000-0000-000000000004',
   'd0000001-0000-0000-0000-000000000001',
   'Build / Buy / Partner',
   'The build/buy/partner framework helps product leaders decide how to acquire a capability: build it in-house, acquire it via M&A, or integrate a third-party partner. Each option trades time, control, cost, and differentiation differently.',
   'A fintech startup needs KYC (Know Your Customer) verification. Building it in-house takes 9 months and requires compliance expertise. Buying a company with the tech is too capital-intensive. Partnering with Jumio via API takes 2 weeks — so they partner, accepting vendor lock-in to move fast.',
   'advanced',
   ARRAY['strategy', 'make-vs-buy', 'partnerships'],
   4);

-- Domain: user-research
INSERT INTO concepts (id, domain_id, title, definition, example, difficulty, tags, order_index) VALUES
  ('c0000001-0000-0000-0000-000000000005',
   'd0000001-0000-0000-0000-000000000002',
   'Jobs to Be Done (JTBD)',
   'Jobs to Be Done is a framework that frames user needs as "jobs" they are trying to accomplish rather than features they want. Users "hire" a product to do a job. Understanding the job — functional, social, and emotional — reveals why they switch products.',
   'People don''t buy a drill because they want a drill — they "hire" a drill to make a hole. But the actual job is "hang a picture to make my home feel personal." This reframe opens up competing solutions: adhesive strips, art hanging services, even digital photo frames.',
   'beginner',
   ARRAY['research', 'jtbd', 'user-needs'],
   1),

  ('c0000001-0000-0000-0000-000000000006',
   'd0000001-0000-0000-0000-000000000002',
   'Continuous Discovery',
   'Continuous discovery is a practice where product teams conduct at least one customer touchpoint per week — interviews, usability tests, or contextual inquiry — rather than doing research in discrete "phases." It keeps learning embedded in the normal workflow.',
   'A team building a code review tool schedules 30-minute calls every Tuesday with developers. Over 6 weeks they notice that every interviewee mentions friction in reviewing large PRs. This recurring signal becomes the basis for a "split diff" feature — a decision they would not have reached through a single research sprint.',
   'intermediate',
   ARRAY['research', 'discovery', 'interviews'],
   2),

  ('c0000001-0000-0000-0000-000000000007',
   'd0000001-0000-0000-0000-000000000002',
   'Assumption Mapping',
   'Assumption mapping is a structured technique to surface the beliefs your team is making about users, the market, and technology, then rank them by importance and uncertainty. High-importance, high-uncertainty assumptions become your first experiments.',
   'A team building an AI writing assistant lists assumptions: "users will trust AI-generated suggestions," "users will pay $20/month," "users write long-form content more than 3x per week." They rate trust as most critical and uncertain, so they run a prototype test before building anything else.',
   'intermediate',
   ARRAY['research', 'assumptions', 'validation'],
   3),

  ('c0000001-0000-0000-0000-000000000008',
   'd0000001-0000-0000-0000-000000000002',
   'Desirability / Feasibility / Viability',
   'The three-lens innovation framework asks: Is the solution something users genuinely want (desirability)? Can we build it with available technology and talent (feasibility)? Does it support a sustainable business model (viability)? All three lenses must align for a product to succeed.',
   'A social music feature is desirable — users say they want to share playlists with friends. It''s technically feasible. But licensing costs make it not viable at the margin Spotify needs. The viability lens kills the feature even though the other two lenses are green.',
   'beginner',
   ARRAY['research', 'innovation', 'frameworks'],
   4);

-- Domain: metrics-analytics
INSERT INTO concepts (id, domain_id, title, definition, example, difficulty, tags, order_index) VALUES
  ('c0000001-0000-0000-0000-000000000009',
   'd0000001-0000-0000-0000-000000000003',
   'North Star Metric',
   'The North Star Metric (NSM) is the single metric that best captures the core value your product delivers to users. It acts as a proxy for long-term sustainable growth — distinct from revenue metrics which can be gamed in the short term.',
   'Airbnb''s North Star is "nights booked." It directly represents value exchange: a host earned income and a guest had a place to stay. Increasing ad spend can temporarily raise sessions or signups, but nights booked requires genuine supply-demand matching.',
   'beginner',
   ARRAY['metrics', 'north-star', 'kpis'],
   1),

  ('c0000001-0000-0000-0000-000000000010',
   'd0000001-0000-0000-0000-000000000003',
   'Counter Metrics',
   'Counter metrics (or guardrail metrics) are secondary measures that protect against optimizing your North Star Metric at the expense of user quality or business health. They set the boundaries of acceptable trade-offs.',
   'A team optimizing "weekly active users" adds a streak mechanic. WAU climbs. But support tickets and unsubscribe rates also climb — a counter metric. Without the counter, the team would have shipped a feature that inflated their headline number while destroying long-term retention.',
   'intermediate',
   ARRAY['metrics', 'guardrails', 'tradeoffs'],
   2),

  ('c0000001-0000-0000-0000-000000000011',
   'd0000001-0000-0000-0000-000000000003',
   'Funnel Analysis',
   'Funnel analysis tracks how users move through a defined sequence of steps — from awareness to activation to conversion to retention. It identifies where drop-off is highest so teams can prioritize interventions.',
   'An e-commerce checkout funnel: Visit → Add to Cart → Begin Checkout → Payment → Confirm. If 60% of users who add to cart abandon at "Begin Checkout," that step deserves investigation before any other part of the funnel. The team discovers it requires creating an account — removing that requirement increases conversion 18%.',
   'beginner',
   ARRAY['metrics', 'funnels', 'conversion'],
   3),

  ('c0000001-0000-0000-0000-000000000012',
   'd0000001-0000-0000-0000-000000000003',
   'Cohort Retention Analysis',
   'Cohort retention analysis groups users by their sign-up date (or first action date) and tracks what percentage remain active over time. It reveals whether retention is improving across cohorts — a stronger signal of product-market fit than snapshot DAU/MAU.',
   'An app launched v1 in Jan and v2 in April. Jan cohort: 40% retained at day 30. April cohort: 62% retained at day 30. The improvement is meaningful because it compares like-for-like user cohorts at the same point in their lifecycle — not an aggregate that could be distorted by growth.',
   'advanced',
   ARRAY['metrics', 'retention', 'cohorts'],
   4);

-- Domain: prioritization
INSERT INTO concepts (id, domain_id, title, definition, example, difficulty, tags, order_index) VALUES
  ('c0000001-0000-0000-0000-000000000013',
   'd0000001-0000-0000-0000-000000000004',
   'ICE Scoring',
   'ICE (Impact, Confidence, Ease) is a lightweight prioritization framework where each initiative is scored 1–10 on three dimensions. The ICE score = Impact × Confidence × Ease. It makes trade-offs explicit and reduces HiPPO-driven (Highest Paid Person''s Opinion) decisions.',
   'Team has two ideas: a redesigned onboarding flow (Impact 8, Confidence 7, Ease 6 → ICE 336) vs. dark mode (Impact 4, Confidence 9, Ease 9 → ICE 324). The onboarding wins narrowly but the team can now debate the confidence score openly rather than arguing subjectively.',
   'beginner',
   ARRAY['prioritization', 'ice', 'frameworks'],
   1),

  ('c0000001-0000-0000-0000-000000000014',
   'd0000001-0000-0000-0000-000000000004',
   'Opportunity Solution Tree',
   'The Opportunity Solution Tree (OST), developed by Teresa Torres, is a visual artifact that links a desired outcome → opportunities (unmet user needs) → solutions → experiments. It prevents teams from jumping to solutions before clearly understanding the opportunity they are addressing.',
   'Outcome: increase weekly retention. Opportunities: users forget to return, users don''t know what to do next, users lose progress. Under "users lose progress" the team maps solutions: auto-save, export to PDF, share with team. Under "share with team" they design a specific experiment. The tree prevents mixing levels.',
   'intermediate',
   ARRAY['prioritization', 'ost', 'opportunity-mapping'],
   2),

  ('c0000001-0000-0000-0000-000000000015',
   'd0000001-0000-0000-0000-000000000004',
   'RICE Scoring',
   'RICE (Reach, Impact, Confidence, Effort) extends ICE with a "Reach" dimension to account for how many users will be affected. RICE score = (Reach × Impact × Confidence) / Effort. The Effort denominator makes it a cost-adjusted priority score.',
   'Feature A touches 5,000 users/quarter with high impact (3), 80% confidence, 2 weeks effort → RICE = (5000 × 3 × 0.8) / 2 = 6,000. Feature B touches 500 users with very high impact (5), 90% confidence, 0.5 weeks → RICE = (500 × 5 × 0.9) / 0.5 = 4,500. Feature A wins on reach despite B being high-confidence.',
   'intermediate',
   ARRAY['prioritization', 'rice', 'frameworks'],
   3),

  ('c0000001-0000-0000-0000-000000000016',
   'd0000001-0000-0000-0000-000000000004',
   'Now / Next / Later Roadmap',
   'The Now/Next/Later roadmap is a time-horizon framework that communicates intent without committing to fixed dates. "Now" is committed work in flight. "Next" is planned but not yet started. "Later" is directional and subject to change as learning accumulates.',
   'Instead of a quarterly Gantt chart, a team publishes: Now — ship redesigned search (engineering in progress); Next — offline mode (design complete, ready to build); Later — team collaboration features (opportunity validated, solution TBD). Stakeholders see direction without locking engineers into brittle deadlines.',
   'beginner',
   ARRAY['prioritization', 'roadmap', 'communication'],
   4);

-- Domain: go-to-market
INSERT INTO concepts (id, domain_id, title, definition, example, difficulty, tags, order_index) VALUES
  ('c0000001-0000-0000-0000-000000000017',
   'd0000001-0000-0000-0000-000000000005',
   'Ideal Customer Profile (ICP)',
   'An Ideal Customer Profile (ICP) describes the specific type of company or user that gets the most value from your product, buys fastest, churns least, and generates the most revenue. It is not a demographic — it is a behavioral and contextual profile.',
   'A developer tools startup''s ICP: "Series A–C engineering teams of 20–100 devs, using microservices, with a dedicated DevOps hire, where the engineering lead has shipped a product before." Companies outside this profile buy but churn at 3× the rate of those within it.',
   'beginner',
   ARRAY['gtm', 'icp', 'segmentation'],
   1),

  ('c0000001-0000-0000-0000-000000000018',
   'd0000001-0000-0000-0000-000000000005',
   'Positioning Statement',
   'A positioning statement is an internal document (not a tagline) that defines: who you serve, what category you are in, what you uniquely do, and why users should believe you. It guides all external messaging and aligns marketing, sales, and product.',
   'Template: "For [target user] who [has this problem], [Product] is a [category] that [key benefit]. Unlike [alternative], we [differentiator]." Example: "For solo developers who ship too slowly, Vercel is a deployment platform that removes infrastructure friction. Unlike AWS, we auto-configure every deployment with zero config."',
   'intermediate',
   ARRAY['gtm', 'positioning', 'messaging'],
   2),

  ('c0000001-0000-0000-0000-000000000019',
   'd0000001-0000-0000-0000-000000000005',
   'Product-Led Growth (PLG)',
   'Product-Led Growth is a GTM strategy where the product itself — not sales or marketing — is the primary driver of acquisition, conversion, and expansion. Users discover value through free use, then upgrade. The product''s viral loops and frictionless activation are the growth engine.',
   'Figma uses PLG: sharing a file with a non-user forces them to create an account to view or comment. The product spreads through usage. Each new user is a distribution node. Sales only engages after companies already have teams using it — converting usage into contracts, not cold-selling value.',
   'intermediate',
   ARRAY['gtm', 'plg', 'growth'],
   3),

  ('c0000001-0000-0000-0000-000000000020',
   'd0000001-0000-0000-0000-000000000005',
   'Launch Tiers',
   'Launch tiers classify releases by their strategic importance and the scale of cross-functional effort they require. Tier 1 (major launch) involves PR, demand gen, sales enablement, and coordinated social. Tier 2 is a moderate announcement. Tier 3 is a silent ship or changelog entry. Picking the right tier prevents both under-investment and launch fatigue.',
   'A company over-launched 14 features in one quarter with press releases for each. Media stopped covering them and customers ignored announcements. After introducing tiers: Tier 1 reserved for 2 major launches/year, Tier 2 for monthly blog posts, Tier 3 for everything else. Media coverage and feature adoption both improved.',
   'advanced',
   ARRAY['gtm', 'launches', 'communication'],
   4);


-- ============================================================
-- FLASHCARDS (2 per concept = 40 total)
-- ============================================================

-- concept: Product Vision
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000001',
   'What is a product vision and why does it matter?',
   'A product vision is an inspirational, durable statement of the future state you are working toward. It matters because it provides a stable north star that aligns teams and guides roadmap decisions across years — even as tactics and strategies change.',
   'Think: what does "done" look like in 5 years?'),
  ('c0000001-0000-0000-0000-000000000001',
   'How does product vision differ from product strategy?',
   'Vision is the destination — the aspirational future state. Strategy is the current plan for how to reach it. Vision is stable for years; strategy shifts as you learn. A team can change strategy without changing vision.',
   'One is the "where," the other is the "how."');

-- concept: Strategic Bets
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000002',
   'What distinguishes a strategic bet from an incremental improvement?',
   'A strategic bet accepts the risk of being wrong in exchange for a chance at disproportionate reward. An incremental improvement optimizes what already exists. Bets are high-uncertainty, high-conviction decisions often taken on emerging opportunities.',
   'Think about AWS in 2006 vs. a UI polish sprint.'),
  ('c0000001-0000-0000-0000-000000000002',
   'What are the key inputs needed to make a confident strategic bet?',
   'Directional market data, a clear thesis about why the world is changing, evidence from early signals (customer interviews, competitor moves, technology shifts), and an honest assessment of your team''s ability to execute in that space.',
   'Data + thesis + signal + capability.');

-- concept: Opportunity Sizing
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000003',
   'Explain TAM, SAM, and SOM in your own words.',
   'TAM (Total Addressable Market) is the total demand if everyone bought. SAM (Serviceable Addressable Market) is the subset you can realistically serve with your product and distribution. SOM (Serviceable Obtainable Market) is the realistic share you can capture in the near term.',
   'Each ring narrows the previous one.'),
  ('c0000001-0000-0000-0000-000000000003',
   'Why is a large TAM alone not sufficient justification to build a product?',
   'A large TAM tells you there is demand, but not whether you can reach it, compete, or monetize it. You also need to validate that your team can capture a meaningful SOM at viable unit economics within a reasonable time horizon.',
   'Big market ≠ big opportunity for you specifically.');

-- concept: Build / Buy / Partner
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000004',
   'When is "partner" the right choice over "build"?',
   'Partnering is typically right when speed to market matters more than control, the capability is not a core differentiator, a quality solution already exists, and building would create cost or compliance complexity you are not equipped for.',
   'Ask: is this capability core to our differentiation?'),
  ('c0000001-0000-0000-0000-000000000004',
   'What is the main risk of a "buy" (acquisition) decision?',
   'Integration risk — acquired products, teams, and cultures often fail to merge effectively. Additionally, you may overbid on a capability that becomes commoditized, or the acquired team may leave after their vesting period ends.',
   'M&A math rarely survives first contact with integration.');

-- concept: Jobs to Be Done
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000005',
   'What are the three types of "jobs" in the JTBD framework?',
   'Functional job: the practical task the user wants to accomplish. Social job: how the user wants to be perceived by others. Emotional job: how the user wants to feel. Durable solutions often address all three layers.',
   'Function + social perception + internal feeling.'),
  ('c0000001-0000-0000-0000-000000000005',
   'How does JTBD change the way you identify your competition?',
   'JTBD expands your competitive set beyond similar products. If the job is "feel prepared for my morning commute," competitors include podcasts, audiobooks, morning news shows, and silence — not just other navigation apps.',
   'Competition = any solution hired for the same job.');

-- concept: Continuous Discovery
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000006',
   'What is the cadence goal of Continuous Discovery and why?',
   'At least one customer touchpoint per week. The goal is to keep the team''s understanding of customer problems current and to catch emerging needs before they become competitive threats. Weekly touchpoints prevent the "research big bang" anti-pattern.',
   'Weekly cadence, not quarterly research phases.'),
  ('c0000001-0000-0000-0000-000000000006',
   'What is the most common mistake teams make with customer interviews?',
   'Asking customers what they want (soliciting feature requests) rather than exploring past behavior and context. The question "What would you want us to build?" is far less useful than "Walk me through the last time you tried to do X."',
   'Past behavior > hypothetical desires.');

-- concept: Assumption Mapping
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000007',
   'How do you prioritize which assumptions to test first?',
   'Place assumptions on a 2×2: importance (high/low) on one axis, uncertainty (high/low) on the other. Test high-importance, high-uncertainty assumptions first — these are your "leap of faith" assumptions whose failure would kill the product.',
   'High importance + high uncertainty = test first.'),
  ('c0000001-0000-0000-0000-000000000007',
   'What is a "leap of faith assumption" in product development?',
   'A leap of faith assumption (LOFA) is a critical belief about your user, market, or technology that your entire business model depends on but that you have not yet validated. If it turns out to be false, your product strategy collapses.',
   'The assumption whose failure ends the project.');

-- concept: Desirability / Feasibility / Viability
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000008',
   'A feature tests well with users and engineering says it is buildable, but the CFO flags a margin problem. Which lens is failing and what should the team do?',
   'Viability is failing. The team should explore whether the business model can be adjusted (pricing, cost reduction, bundling), look for a different solution that achieves the same desirable outcome at a viable cost, or deprioritize the feature.',
   'Desirable ✓, Feasible ✓, Viable ✗ — one failure is still a failure.'),
  ('c0000001-0000-0000-0000-000000000008',
   'Why do most failed products fail on the desirability lens rather than feasibility?',
   'Engineering teams are skilled at assessing what can be built. The hard question — whether anyone truly wants the thing enough to change behavior and pay for it — is underinvestigated. Teams often ship technically impressive solutions to problems users have tolerable workarounds for.',
   'We can build almost anything. The question is whether it''s wanted badly enough.');

-- concept: North Star Metric
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000009',
   'What makes a good North Star Metric?',
   'A good NSM represents genuine value delivered to users (not just company revenue), is measurable and understandable by the whole team, correlates with long-term retention and growth, and cannot be easily gamed without actually creating value.',
   'It should capture real value exchange, not a proxy for it.'),
  ('c0000001-0000-0000-0000-000000000009',
   'Why is revenue usually a poor North Star Metric?',
   'Revenue is a lagging indicator — it shows up after value is delivered. It can be inflated through short-term tactics (discounting, dark patterns, one-time events) that destroy long-term retention. A better NSM sits one step earlier in the value chain.',
   'Lagging + gameable = poor north star.');

-- concept: Counter Metrics
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000010',
   'Give an example of a counter metric that should accompany "daily active users."',
   'Examples: average session quality (pages per session, actions taken), satisfaction score (NPS or CSAT), unsubscribe or account deletion rate, customer support contact rate. If DAU rises while any of these worsen, the growth may be low-quality.',
   'What''s the failure mode you''d miss if you only watch DAU?'),
  ('c0000001-0000-0000-0000-000000000010',
   'What is the risk of not defining counter metrics before running an experiment?',
   'Confirmation bias — the team ships a positive result on the primary metric while ignoring harmful second-order effects they were not tracking. Post-hoc rationalization makes it easy to dismiss negative signals that were not pre-registered as important.',
   'Pre-register your guardrails or you''ll explain away the damage.');

-- concept: Funnel Analysis
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000011',
   'What is the first step when you notice a large drop-off in a funnel?',
   'Segment the drop-off by cohort, device, acquisition channel, and user attribute to isolate whether it is a universal problem or concentrated in a specific population. Then investigate that segment qualitatively — session recordings, user interviews — before hypothesizing solutions.',
   'Segment first, hypothesize second, fix third.'),
  ('c0000001-0000-0000-0000-000000000011',
   'What is the difference between a top-of-funnel problem and a bottom-of-funnel problem, and why does it matter for prioritization?',
   'Top-of-funnel issues (low awareness, poor acquisition) mean you are not reaching the right people. Bottom-of-funnel issues (drop-off at payment, activation) mean people arrive but fail to convert. Fixing the bottom first is usually higher ROI — you already paid to acquire those users.',
   'Leaky bucket: fix the holes before adding more water.');

-- concept: Cohort Retention Analysis
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000012',
   'What does a "flattening retention curve" tell you about a product?',
   'A flattening curve means users who remain after an initial drop-off continue using the product — indicating a retained base of genuinely engaged users. This is a strong signal of product-market fit. A curve that keeps declining toward zero suggests the product has no sticky core.',
   'Flat = retained core. Zero = no one stays.'),
  ('c0000001-0000-0000-0000-000000000012',
   'Why is aggregate MAU growth a misleading signal compared to cohort retention?',
   'Aggregate MAU can grow while cohort retention declines — if you are acquiring new users faster than existing ones churn. Cohort analysis reveals whether each new group of users retains better or worse than previous ones, exposing the true health of the product independent of growth rate.',
   'Growth can mask churn. Cohorts cannot.');

-- concept: ICE Scoring
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000013',
   'What are the three dimensions of ICE scoring and what does each measure?',
   'Impact: the effect on the goal metric if the initiative succeeds. Confidence: how certain you are about your Impact and Ease estimates, based on available evidence. Ease: how easy it is to implement, inversely related to effort and complexity.',
   'Impact × Confidence × Ease = ICE score.'),
  ('c0000001-0000-0000-0000-000000000013',
   'What is the main criticism of ICE scoring?',
   'Scores feel objective but are still subjective estimates. Without a shared calibration process, two team members will score the same initiative very differently. ICE is a tool for structured conversation, not a substitute for judgment.',
   'Structured subjectivity ≠ objectivity.');

-- concept: Opportunity Solution Tree
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000014',
   'What are the four levels of an Opportunity Solution Tree?',
   'Desired Outcome (top) → Opportunities (unmet user needs or pain points) → Solutions (specific ideas that address an opportunity) → Experiments (how you will test a solution). Each level must connect to the one above.',
   'Outcome → Opportunity → Solution → Experiment.'),
  ('c0000001-0000-0000-0000-000000000014',
   'Why does the OST explicitly separate "opportunities" from "solutions"?',
   'Teams naturally jump to solutions. The OST forces discovery of the underlying opportunity first, ensuring multiple solutions are considered for each need. This prevents anchoring on the first idea and broadens the solution space before narrowing.',
   'Separate problem space from solution space.');

-- concept: RICE Scoring
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000015',
   'How does RICE differ from ICE scoring?',
   'RICE adds a "Reach" dimension to account for how many users are affected per time period, and divides by Effort (person-weeks) rather than multiplying by Ease. This makes it a cost-adjusted, volume-weighted score — better suited for larger teams with many feature candidates.',
   'RICE = (Reach × Impact × Confidence) / Effort.'),
  ('c0000001-0000-0000-0000-000000000015',
   'A niche power-user feature scores higher on Impact but lower on Reach than a broad improvement. How should a PM use RICE in this situation?',
   'RICE will penalize the niche feature through lower Reach, which may accurately reflect business priority. But the PM should also consider strategic value: if the power users are high-revenue accounts or critical to word-of-mouth, their strategic weight exceeds their numerical Reach.',
   'RICE is a starting point, not the final word.');

-- concept: Now / Next / Later Roadmap
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000016',
   'What is the key advantage of a Now/Next/Later roadmap over a date-based Gantt chart?',
   'It communicates direction and priority without creating false precision. Dates on Gantt charts become commitments that erode trust when missed. Now/Next/Later sets stakeholder expectations correctly: "Later" is intentional, not a promise.',
   'Direction without false precision.'),
  ('c0000001-0000-0000-0000-000000000016',
   'How often should a Now/Next/Later roadmap be reviewed and what typically triggers a change?',
   'Typically reviewed monthly or quarterly. Common triggers: significant new user research, a shift in company strategy, a major competitor move, a technical constraint discovered in implementation, or a change in business priority from leadership.',
   'Review on cadence; update on signal.');

-- concept: Ideal Customer Profile
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000017',
   'What is the difference between an ICP and a buyer persona?',
   'An ICP describes the ideal company or user segment — defined by firmographic/behavioral characteristics like company size, tech stack, job title, and buying patterns. A persona is a narrative profile of an individual within that segment. ICPs guide sales targeting; personas guide product decisions.',
   'ICP = who to sell to. Persona = who is using the product.'),
  ('c0000001-0000-0000-0000-000000000017',
   'How would you identify your ICP if your product is already live with customers?',
   'Analyze your best customers: who has the highest LTV, lowest churn, fastest time-to-value, most referrals, and best NPS? Look for common patterns in their attributes — industry, team size, job titles, use cases, acquisition channel. Your ICP is the profile that describes your happiest, most successful customers.',
   'Best customers → find the pattern → that''s your ICP.');

-- concept: Positioning Statement
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000018',
   'What are the five components of a strong positioning statement?',
   'Target user (who has the problem), the problem or need, the product category it belongs to, the key benefit or unique value delivered, and the reason to believe the claim is credible. All five must be specific — vague positioning helps no one.',
   'User + problem + category + benefit + proof.'),
  ('c0000001-0000-0000-0000-000000000018',
   'Why is positioning primarily an internal document rather than a tagline?',
   'Positioning guides how all teams — product, marketing, sales, support — understand and communicate the product''s role. Taglines are the compressed public output. Positioning is the reasoning behind the tagline that keeps everyone aligned on who the product is for and why it wins.',
   'Internal alignment first; public message second.');

-- concept: Product-Led Growth
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000019',
   'What are the three core PLG motions?',
   'Acquisition: the product spreads through usage (viral loops, freemium, sharing). Activation: users reach their "aha moment" without a salesperson. Expansion: users upgrade or invite teammates as they get more value. In PLG, the product does the work traditionally done by sales and marketing.',
   'Spread → Activate → Expand, all inside the product.'),
  ('c0000001-0000-0000-0000-000000000019',
   'PLG works well for some products and poorly for others. What product characteristics make PLG viable?',
   'PLG works best when: the product has a low barrier to trial (free tier, self-serve signup), value can be demonstrated quickly without a sales call, there is a natural sharing or collaboration use case, and the user who benefits is also the buyer (or influences the buyer).',
   'Self-serve + fast value + viral surface + user = buyer.');

-- concept: Launch Tiers
INSERT INTO flashcards (concept_id, front, back, hint) VALUES
  ('c0000001-0000-0000-0000-000000000020',
   'What criteria determine whether a launch should be Tier 1 vs. Tier 3?',
   'Tier 1: major new product or capability, large addressable audience, requires cross-functional effort (PR, sales enablement, demand gen), strategic market moment. Tier 3: incremental improvement, narrow audience, no external announcement needed. Tier 2 is anything in between.',
   'Scope + audience + cross-functional effort → tier.'),
  ('c0000001-0000-0000-0000-000000000020',
   'What is "launch fatigue" and how do tiered launches help prevent it?',
   'Launch fatigue happens when a company announces too many things too often, causing customers and media to stop paying attention. Tiered launches concentrate marketing energy on the moments that deserve it, making each major launch land harder and preserving audience attention.',
   'Reserve amplitude for when it counts.');


-- ============================================================
-- CHALLENGE PROMPTS (2 per domain = 10 total)
-- ============================================================

-- Domain: product-strategy
INSERT INTO challenge_prompts (id, domain_id, title, prompt_text, difficulty, tags, estimated_minutes, is_published) VALUES
  ('p0000001-0000-0000-0000-000000000001',
   'd0000001-0000-0000-0000-000000000001',
   'Define the vision for a developer tools product',
   'You have just joined a 12-person startup as PM. The product is a CLI tool that helps developers manage environment variables across multiple cloud providers. There is no written product vision.

Write a one-paragraph product vision for this tool. Then explain: (1) how you validated that this vision resonates with users, (2) one strategic bet the team should make in the next 12 months to advance toward that vision, and (3) one thing you would explicitly NOT build, and why staying focused matters.',
   'intermediate',
   ARRAY['vision', 'strategy', 'focus'],
   15,
   true),

  ('p0000001-0000-0000-0000-000000000002',
   'd0000001-0000-0000-0000-000000000001',
   'Make a build/buy/partner recommendation',
   'You are PM at a B2B SaaS company (project management tool, 50k users). Your CTO wants to add real-time video calling so teams can discuss tasks without leaving the app. The engineering team says building it from scratch would take 6 months. A startup called "MeshCall" offers a video SDK that can be integrated in 2 weeks for $8/month per active workspace.

Make a build/buy/partner recommendation. Structure your answer as: recommendation, key factors that drove your decision, the main risk with your choice, and how you would mitigate that risk.',
   'intermediate',
   ARRAY['strategy', 'make-vs-buy', 'tradeoffs'],
   12,
   true);

-- Domain: user-research
INSERT INTO challenge_prompts (id, domain_id, title, prompt_text, difficulty, tags, estimated_minutes, is_published) VALUES
  ('p0000001-0000-0000-0000-000000000003',
   'd0000001-0000-0000-0000-000000000002',
   'Design a discovery interview',
   'You are PM for a mobile expense-tracking app for freelancers. You have noticed that 60% of users who sign up never log a second expense. You want to understand why.

Design a 30-minute user discovery interview: (1) write three opening questions to understand the user''s context and current behavior, (2) write two questions to explore the specific drop-off moment without leading the witness, and (3) explain what you would do if every interviewee gives you a different reason for not returning. What pattern-finding method would you use?',
   'beginner',
   ARRAY['research', 'interviews', 'churn'],
   15,
   true),

  ('p0000001-0000-0000-0000-000000000004',
   'd0000001-0000-0000-0000-000000000002',
   'Apply JTBD to a food delivery app',
   'A food delivery app is trying to understand why users choose it over cooking at home. The current hypothesis is: "users want convenience."

Apply the Jobs to Be Done framework to challenge or deepen this hypothesis. Identify at least three distinct jobs users might be hiring the app to do (include functional, social, and emotional dimensions). For each job, describe a different user segment and a product feature or experience that would serve that specific job better than generic "convenience."',
   'intermediate',
   ARRAY['research', 'jtbd', 'segmentation'],
   15,
   true);

-- Domain: metrics-analytics
INSERT INTO challenge_prompts (id, domain_id, title, prompt_text, difficulty, tags, estimated_minutes, is_published) VALUES
  ('p0000001-0000-0000-0000-000000000005',
   'd0000001-0000-0000-0000-000000000003',
   'Define the North Star Metric for a note-taking app',
   'You are PM for a note-taking app similar to Notion. Monthly Active Users (MAU) is currently the key metric. Leadership wants to understand if MAU is the right North Star or whether the team should switch to something else.

Propose a new North Star Metric. Justify your choice by: (1) explaining why MAU is insufficient, (2) defining your proposed NSM and why it captures genuine user value, (3) naming two counter metrics that should accompany it, and (4) describing one way the team could game your NSM — and why that scenario is still acceptable or how you''d prevent it.',
   'intermediate',
   ARRAY['metrics', 'north-star', 'kpis'],
   15,
   true),

  ('p0000001-0000-0000-0000-000000000006',
   'd0000001-0000-0000-0000-000000000003',
   'Investigate a sudden drop in activation rate',
   'You are a PM at a SaaS analytics company. Your weekly activation rate (users who complete their first report within 7 days of signing up) dropped from 42% to 28% last week. No features shipped last week.

Walk through your investigation process step by step. What data would you look at first? What hypotheses would you form? How would you distinguish between a data/instrumentation bug vs. an actual product problem vs. an acquisition quality problem? What would your stakeholder communication look like while the investigation is ongoing?',
   'advanced',
   ARRAY['metrics', 'debugging', 'activation'],
   20,
   true);

-- Domain: prioritization
INSERT INTO challenge_prompts (id, domain_id, title, prompt_text, difficulty, tags, estimated_minutes, is_published) VALUES
  ('p0000001-0000-0000-0000-000000000007',
   'd0000001-0000-0000-0000-000000000004',
   'Prioritize a backlog using ICE or RICE',
   'You are PM for a B2C recipe app. Your backlog has four items:
A) Personalized meal plan generator (high engineering effort, could drive 20% DAU increase based on survey data)
B) Fix slow load time on recipe pages, currently 4.5s (low effort, affects all users)
C) Social feature: share recipes with friends (medium effort, uncertain engagement impact)
D) Dietary filter improvements: vegan, keto, etc. (low effort, requested by 15% of users in surveys)

Use ICE or RICE to score each item. Show your work. Then explain: which item do you ship first and why, and is there any item where your framework score conflicts with your intuition? How do you resolve that conflict?',
   'beginner',
   ARRAY['prioritization', 'ice', 'rice'],
   15,
   true),

  ('p0000001-0000-0000-0000-000000000008',
   'd0000001-0000-0000-0000-000000000004',
   'Handle a stakeholder pushing a low-priority feature',
   'You are PM at a fintech startup. Your VP of Sales is pushing hard for a feature: "custom CSV export templates." It has been on the roadmap as "Later" for three quarters. Three enterprise prospects mention it in sales calls. Your user research shows it would benefit less than 5% of your current user base.

How do you handle this situation? Walk through: (1) how you evaluate whether the sales signal should change the priority, (2) how you communicate your decision to the VP of Sales if you choose not to move it up, (3) whether there is a lower-effort solution that could unblock sales without full prioritization, and (4) how you track whether this becomes more urgent over time.',
   'intermediate',
   ARRAY['prioritization', 'stakeholders', 'communication'],
   15,
   true);

-- Domain: go-to-market
INSERT INTO challenge_prompts (id, domain_id, title, prompt_text, difficulty, tags, estimated_minutes, is_published) VALUES
  ('p0000001-0000-0000-0000-000000000009',
   'd0000001-0000-0000-0000-000000000005',
   'Write a positioning statement for a new developer tool',
   'You are launching a new product: a Git-integrated AI code review tool for small engineering teams (2–15 devs). It automatically flags security issues, suggests refactors, and learns the team''s code style over time. Current alternatives: manual peer review, SonarQube (complex, enterprise-focused), GitHub Copilot (generation, not review).

Write a full positioning statement using the standard template. Then: (1) explain your category choice and why it matters, (2) identify the single most important buyer objection to your positioning and how you''d address it, and (3) describe how this positioning would differ for an enterprise sales motion vs. a PLG motion.',
   'intermediate',
   ARRAY['gtm', 'positioning', 'messaging'],
   15,
   true),

  ('p0000001-0000-0000-0000-000000000010',
   'd0000001-0000-0000-0000-000000000005',
   'Design a launch plan for a major new feature',
   'You are PM for a project management SaaS (10k paying teams). You are about to launch AI-powered status summaries — a feature that auto-generates a weekly project health report using data from tasks, comments, and activity. Engineering ships in 3 weeks.

Design the launch plan. Decide the launch tier and justify it. Identify all cross-functional stakeholders who need to be involved. Write a one-paragraph internal announcement to align the company before launch. Describe how you will measure success in the first 30 days and what "good" looks like vs. "needs intervention."',
   'intermediate',
   ARRAY['gtm', 'launches', 'planning'],
   20,
   true);


-- ============================================================
-- COMPANY PROFILES (1)
-- ============================================================

INSERT INTO company_profiles (id, slug, name, industry, stage, product_focus, interview_style, notes) VALUES
  ('a0000001-0000-0000-0000-000000000001',
   'stripe',
   'Stripe',
   'Financial infrastructure / payments',
   'enterprise',
   'Developer-first payment APIs, billing, fraud prevention, and financial infrastructure for internet businesses.',
   'Stripe PM interviews are known for deep product sense questions around API design, developer experience, and global expansion. Expect metrics questions grounded in business impact. Interviewers value structured thinking, intellectual honesty about trade-offs, and comfort with ambiguity. Common prompt: "How would you improve Stripe Checkout?" or "Design a product to help small businesses access credit."',
   'Stripe values missionaries over mercenaries. Demonstrate genuine interest in the payment infrastructure problem space and the long-term vision of increasing GDP of the internet. Know their core products: Payments, Billing, Radar, Connect, Treasury, Issuing.');


-- ============================================================
-- FEATURE FLAGS
-- ============================================================

INSERT INTO feature_flags (key, enabled, rollout_percentage) VALUES
  ('ai_coach_luma',              true,  100),
  ('simulation_mode',            true,   50),
  ('pro_model_answers',          true,  100),
  ('live_interview_mode',        false,   0),
  ('social_leaderboard',         false,   0),
  ('vocabulary_spaced_repetition', true, 100),
  ('onboarding_v2',              false,  20),
  ('streak_notifications',       true,  100),
  ('company_profiles',           true,  100),
  ('admin_content_queue',        true,  100);
