-- Seed company_profiles from mock personas
-- Uses slug as the human-readable identifier (matches companyId in frontend code)
INSERT INTO company_profiles (slug, name, icon, roles, interview_persona_prompt, industry, interview_style)
VALUES
  (
    'google', 'Google', 'corporate_fare',
    ARRAY['PM','SWE','Data Engineer','ML Engineer'],
    'You are a senior PM interviewer at Google. You care deeply about data-driven decision making, user empathy at scale, and how product decisions connect to Google''s core business model. Push candidates to quantify impact, name specific metrics, and think about ecosystem-level effects. You value structured thinking but reward candidates who can reason from first principles. Be rigorous but not hostile.',
    'tech',
    'Data-driven, user-first, and deeply tied to search/ads business model'
  ),
  (
    'meta', 'Meta', 'thumb_up',
    ARRAY['PM','SWE','Data Engineer'],
    'You are a staff PM interviewer at Meta. You think in terms of social graphs, network effects, and engagement loops. You want candidates to reason about two-sided dynamics (creator vs. consumer), how features affect the broader social ecosystem, and what guardrails prevent harm at scale. You push hard on tradeoffs between growth and wellbeing. Ask follow-up questions that expose whether the candidate is thinking about the user or the metric.',
    'tech',
    'Social graph dynamics, engagement loops, and cross-platform thinking'
  ),
  (
    'stripe', 'Stripe', 'payments',
    ARRAY['PM','SWE','Data Engineer'],
    NULL,
    'fintech',
    'Developer experience, API design philosophy, and fintech precision'
  ),
  (
    'airbnb', 'Airbnb', 'house',
    ARRAY['PM','SWE'],
    NULL,
    'marketplace',
    'Two-sided marketplace dynamics, trust, and community-driven growth'
  ),
  (
    'uber', 'Uber', 'local_taxi',
    ARRAY['PM'],
    NULL,
    'marketplace',
    'Real-time marketplace, driver/rider balance, and operations-heavy product thinking'
  ),
  (
    'netflix', 'Netflix', 'movie',
    ARRAY['PM'],
    NULL,
    'entertainment',
    'Content strategy, recommendation systems, and subscriber retention'
  ),
  (
    'figma', 'Figma', 'design_services',
    ARRAY['PM'],
    NULL,
    'tools',
    'Collaboration tools, design workflows, and developer handoff'
  ),
  (
    'notion', 'Notion', 'note_alt',
    ARRAY['PM'],
    NULL,
    'tools',
    'Flexible productivity, bottom-up adoption, and power user vs. new user tension'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  roles = EXCLUDED.roles,
  interview_persona_prompt = COALESCE(EXCLUDED.interview_persona_prompt, company_profiles.interview_persona_prompt),
  industry = EXCLUDED.industry,
  interview_style = EXCLUDED.interview_style;
