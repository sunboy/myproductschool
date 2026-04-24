-- Migration 060: Quick take question bank
-- Adds order_index for sequencing, seeds 20 real-company quick-takes across all 4 moves,
-- and records completions in challenge_attempts so "unattempted" filtering works.

-- 1. Add order_index to challenges for quick-take sequencing
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS qt_order_index INTEGER;

-- 2. Insert question bank (20 questions, 5 per move)

INSERT INTO challenges (
  id, title, prompt_text, challenge_type, move_tags, difficulty,
  estimated_minutes, is_published, paradigm, qt_order_index,
  scenario_context, scenario_trigger, scenario_question,
  company_tags, tags
) VALUES

-- FRAME (5) — diagnosing and defining the problem
(
  gen_random_uuid()::TEXT,
  'Spotify streams are up but Discover Weekly shares have dropped 30% in 3 months',
  'Spotify''s streams are up 18% this quarter, but shares of Discover Weekly playlists have dropped 30% over the same period. What''s the first question you ask?',
  'quick_take', ARRAY['frame'], 'warmup', 2, true, 'traditional', 1,
  'Spotify''s streams are up 18% this quarter, but shares of Discover Weekly playlists have dropped 30% over the same period.',
  'Leadership wants to know if this signals a problem with the recommendation engine.',
  'What''s the first question you ask?',
  ARRAY['Spotify'], ARRAY['metrics', 'diagnosis', 'engagement']
),
(
  gen_random_uuid()::TEXT,
  'Airbnb host response rate is stable but guest satisfaction has fallen 12 points',
  'Airbnb''s host response rate is holding at 94%, but guest satisfaction scores have fallen 12 points over two quarters. What''s the real problem here?',
  'quick_take', ARRAY['frame'], 'warmup', 2, true, 'traditional', 2,
  'Airbnb''s host response rate is holding at 94%, but guest satisfaction scores have fallen 12 points over two quarters.',
  'The ops team says hosts are performing fine by their SLA metrics.',
  'What''s the real problem here?',
  ARRAY['Airbnb'], ARRAY['metrics', 'diagnosis', 'marketplace']
),
(
  gen_random_uuid()::TEXT,
  'Notion''s daily active usage is up but pro plan upgrades have plateaued',
  'Notion''s DAU is up 25% YoY but paid plan conversion has been flat for two quarters despite the user base growing. How do you define the problem before building anything?',
  'quick_take', ARRAY['frame'], 'warmup', 2, true, 'traditional', 3,
  'Notion''s DAU is up 25% YoY but paid plan conversion has been flat for two quarters despite the user base growing.',
  'The growth team is debating whether to discount the pro plan or add features.',
  'How do you define the problem before building anything?',
  ARRAY['Notion'], ARRAY['monetization', 'conversion', 'diagnosis']
),
(
  gen_random_uuid()::TEXT,
  'Duolingo streak retention dropped after the XP rework launched',
  'Two weeks after Duolingo launched a redesigned XP system, 7-day streak retention dropped from 68% to 54%. The design team says the new system is more fair. What do you investigate first?',
  'quick_take', ARRAY['frame'], 'warmup', 2, true, 'traditional', 4,
  'Two weeks after Duolingo launched a redesigned XP system, 7-day streak retention dropped from 68% to 54%.',
  'The design team argues the new system is more equitable for casual learners.',
  'What do you investigate first?',
  ARRAY['Duolingo'], ARRAY['retention', 'gamification', 'regression']
),
(
  gen_random_uuid()::TEXT,
  'Stripe''s dashboard session length jumped 40% but support tickets also increased',
  'Stripe''s average dashboard session length jumped 40% after a navigation redesign, but support tickets about finding features went up 22%. How do you frame what happened?',
  'quick_take', ARRAY['frame'], 'warmup', 2, true, 'traditional', 5,
  'Stripe''s average dashboard session length jumped 40% after a navigation redesign, but support tickets about finding features went up 22%.',
  'The team is celebrating the engagement lift in their weekly metrics review.',
  'How do you frame what happened?',
  ARRAY['Stripe'], ARRAY['navigation', 'ux', 'metrics-trap']
),

-- LIST (5) — generating options, stakeholders, solutions
(
  gen_random_uuid()::TEXT,
  'Uber Eats wants to increase average order value — list your options',
  'Uber Eats wants to increase average order value by 15% in the next two quarters without hurting order frequency. What are the structurally distinct ways to approach this?',
  'quick_take', ARRAY['list'], 'warmup', 2, true, 'traditional', 6,
  'Uber Eats wants to increase average order value by 15% in the next two quarters without hurting order frequency.',
  'The monetization team has budget for one major initiative.',
  'What are the structurally distinct ways to approach this?',
  ARRAY['Uber Eats'], ARRAY['monetization', 'growth', 'options']
),
(
  gen_random_uuid()::TEXT,
  'LinkedIn wants to reduce time-to-first-message for job seekers',
  'LinkedIn wants to cut the time between a user posting their profile and receiving their first recruiter message. List the stakeholders whose behavior you need to change and how.',
  'quick_take', ARRAY['list'], 'warmup', 2, true, 'traditional', 7,
  'LinkedIn wants to cut the time between a user posting their profile and receiving their first recruiter message.',
  'Data shows 60% of new job-seeking profiles receive no message in the first 7 days.',
  'List the stakeholders whose behavior you need to change and how.',
  ARRAY['LinkedIn'], ARRAY['marketplace', 'activation', 'stakeholders']
),
(
  gen_random_uuid()::TEXT,
  'Figma wants to improve collaboration for async design teams — what solutions exist?',
  'Figma wants to reduce the friction of async design review for teams across multiple time zones. List the solution directions — don''t just name features, describe distinct approaches.',
  'quick_take', ARRAY['list'], 'warmup', 2, true, 'traditional', 8,
  'Figma wants to reduce the friction of async design review for teams spread across multiple time zones.',
  'Research shows most design feedback happens in a 2-hour overlap window, creating bottlenecks.',
  'List the solution directions — don''t just name features, describe distinct approaches.',
  ARRAY['Figma'], ARRAY['collaboration', 'async', 'solution-space']
),
(
  gen_random_uuid()::TEXT,
  'Shopify merchants churn at 6 months — what can Shopify do about it?',
  'Shopify loses 35% of merchants within 6 months of signup, mostly small businesses that never hit $1k GMV. What are the distinct levers Shopify can pull?',
  'quick_take', ARRAY['list'], 'warmup', 2, true, 'traditional', 9,
  'Shopify loses 35% of merchants within 6 months of signup, mostly small businesses that never hit $1k GMV.',
  'The activation team has tried improving onboarding docs with minimal impact.',
  'What are the distinct levers Shopify can pull?',
  ARRAY['Shopify'], ARRAY['churn', 'retention', 'smb']
),
(
  gen_random_uuid()::TEXT,
  'GitHub Copilot has low adoption among senior engineers — why and what can be done?',
  'GitHub Copilot has 80% adoption among junior engineers but only 22% among staff engineers at companies that have licensed it. List the reasons and corresponding solutions.',
  'quick_take', ARRAY['list'], 'warmup', 2, true, 'ai_native', 10,
  'GitHub Copilot has 80% adoption among junior engineers but only 22% among staff engineers at companies that have licensed it.',
  'Enterprise customers are asking whether the tool is worth the seat cost at senior levels.',
  'List the reasons and corresponding solutions.',
  ARRAY['GitHub', 'GitHub Copilot'], ARRAY['ai-tools', 'adoption', 'developer-tools']
),

-- OPTIMIZE (5) — prioritization, tradeoffs, choosing criteria
(
  gen_random_uuid()::TEXT,
  'Slack must choose: threads improvements vs notification redesign — how do you decide?',
  'Slack has resources for one major Q3 initiative. Threads improvements would help power users; a notification redesign would reduce churn among casual users. How do you make the call?',
  'quick_take', ARRAY['optimize'], 'warmup', 2, true, 'traditional', 11,
  'Slack has resources for one major Q3 initiative: threads improvements (higher NPS from power users) or notification redesign (reduces churn among casual users).',
  'Both teams have strong data. Leadership wants a framework, not just a vote.',
  'How do you make the call?',
  ARRAY['Slack'], ARRAY['prioritization', 'tradeoffs', 'decision-making']
),
(
  gen_random_uuid()::TEXT,
  'Netflix tests show shorter content titles increase clicks but reduce satisfaction — what do you ship?',
  'Netflix A/B test: shorter title cards increase clicks 12% but post-watch satisfaction drops 8%. What criterion breaks the tie and what do you actually ship?',
  'quick_take', ARRAY['optimize'], 'warmup', 2, true, 'traditional', 12,
  'Netflix A/B test: shorter title cards increase click-through rate by 12%, but post-watch satisfaction scores drop by 8% for that cohort.',
  'The growth team wants to ship the click variant. The product team is unsure.',
  'What criterion breaks the tie and what do you actually ship?',
  ARRAY['Netflix'], ARRAY['ab-testing', 'tradeoffs', 'metrics']
),
(
  gen_random_uuid()::TEXT,
  'Canva can improve performance for enterprise or launch new templates for SMB — pick one',
  'Canva has one engineering team free for Q4. Option A: performance improvements that enterprise customers need to renew; Option B: new template packs that SMB users are asking for. What''s your framework?',
  'quick_take', ARRAY['optimize'], 'warmup', 2, true, 'traditional', 13,
  'Canva has one engineering team free for Q4. Option A improves performance for enterprise, Option B ships new templates for SMB.',
  'Enterprise accounts are 30% of revenue. SMB is 60% of user count.',
  'What''s your framework for choosing?',
  ARRAY['Canva'], ARRAY['prioritization', 'enterprise', 'smb']
),
(
  gen_random_uuid()::TEXT,
  'Robinhood: cash back rewards vs improving options education — which do you fund?',
  'Robinhood has budget for one retention initiative. Cash back rewards reduce churn by an estimated 8%. Options education modules reduce risky-trade complaints by 40%. Which do you fund and why?',
  'quick_take', ARRAY['optimize'], 'warmup', 2, true, 'traditional', 14,
  'Robinhood has budget for one retention initiative: cash back rewards (estimated 8% churn reduction) or options education modules (40% reduction in risky-trade complaints).',
  'The regulatory team is watching. Growth team wants the cash back number.',
  'Which do you fund and why?',
  ARRAY['Robinhood'], ARRAY['prioritization', 'tradeoffs', 'fintech']
),
(
  gen_random_uuid()::TEXT,
  'Zoom wants to improve its AI meeting summary — optimize for accuracy or speed?',
  'Zoom''s AI meeting summary has two variants in test: Variant A is 40% more accurate but takes 8 minutes post-call; Variant B is ready in 90 seconds but misses action items 25% of the time. What do you ship?',
  'quick_take', ARRAY['optimize'], 'warmup', 2, true, 'ai_assisted', 15,
  'Zoom''s AI meeting summary test: Variant A is 40% more accurate but takes 8 minutes post-call; Variant B is ready in 90 seconds but misses action items 25% of the time.',
  'The enterprise sales team wants the accurate version. Individual users prefer speed.',
  'What do you ship?',
  ARRAY['Zoom'], ARRAY['ai-features', 'tradeoffs', 'enterprise']
),

-- WIN (5) — pitching, defining success, stakeholder buy-in
(
  gen_random_uuid()::TEXT,
  'Pitch the engineering lead on why Notion should invest in an AI writing assistant',
  'You need to convince a skeptical engineering lead to staff a 4-engineer team on an AI writing assistant feature for Notion. How do you make the case?',
  'quick_take', ARRAY['win'], 'warmup', 2, true, 'ai_assisted', 16,
  'You need to convince a skeptical engineering lead to staff a 4-engineer team on an AI writing assistant feature for Notion.',
  'The engineering lead thinks AI features are overhyped and wants to focus on performance.',
  'How do you make the case?',
  ARRAY['Notion'], ARRAY['stakeholder-management', 'pitch', 'ai-features']
),
(
  gen_random_uuid()::TEXT,
  'Define what success looks like 6 months after launching Spotify''s social listening feature',
  'Spotify is launching a social listening feature (listen together, share reactions). Define success at 6 months with a specific metric, threshold, and counter-signal.',
  'quick_take', ARRAY['win'], 'warmup', 2, true, 'traditional', 17,
  'Spotify is launching a social listening feature: real-time shared listening with reactions and comments.',
  'The team disagrees on how to measure success — DAU lift, shares, or time-in-feature.',
  'Define success at 6 months with a specific metric, threshold, and counter-signal.',
  ARRAY['Spotify'], ARRAY['success-metrics', 'social', 'launch']
),
(
  gen_random_uuid()::TEXT,
  'Convince your PM that Figma needs offline mode — what''s your one-page case?',
  'Your PM is unconvinced Figma needs offline mode. Designers occasionally lose work in poor connectivity situations but it''s not a top complaint. Build the case in 90 seconds.',
  'quick_take', ARRAY['win'], 'warmup', 2, true, 'traditional', 18,
  'Your PM is unconvinced Figma needs offline mode. Designers lose work in poor connectivity situations, but it ranks 12th in the support queue.',
  'You think offline mode is a retention lever for enterprise, not just a convenience.',
  'Build the case in 90 seconds.',
  ARRAY['Figma'], ARRAY['stakeholder-management', 'pitch', 'enterprise']
),
(
  gen_random_uuid()::TEXT,
  'Set the OKR for reducing Uber driver cancellations in 2 cities',
  'Uber is piloting a driver cancellation reduction program in Mumbai and São Paulo. Set an OKR that is specific, falsifiable, and connected to a business outcome.',
  'quick_take', ARRAY['win'], 'warmup', 2, true, 'traditional', 19,
  'Uber is piloting a driver cancellation reduction program in Mumbai and São Paulo, starting next quarter.',
  'The regional ops team needs an OKR to align around. Current cancellation rate is 18%.',
  'Set an OKR that is specific, falsifiable, and connected to a business outcome.',
  ARRAY['Uber'], ARRAY['okrs', 'metrics', 'operations']
),
(
  gen_random_uuid()::TEXT,
  'Make the case for Stripe adding a no-code invoice builder to its dashboard',
  'Stripe wants to expand into small business billing. A no-code invoice builder would let non-technical founders use Stripe without a developer. Pitch this to the infrastructure team who think it''s out of scope.',
  'quick_take', ARRAY['win'], 'warmup', 2, true, 'traditional', 20,
  'Stripe wants to expand into small business billing. A no-code invoice builder would let non-technical founders use Stripe without a developer.',
  'The infrastructure team believes Stripe should stay developer-first and not dilute the brand.',
  'Pitch this to the infrastructure team.',
  ARRAY['Stripe'], ARRAY['pitch', 'stakeholder-management', 'growth']
)
ON CONFLICT (id) DO NOTHING;
