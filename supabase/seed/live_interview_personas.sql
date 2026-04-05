-- Seed company profiles with interview personas for live interview feature
-- Idempotent: uses ON CONFLICT (slug) DO UPDATE SET

INSERT INTO company_profiles (slug, name, industry, stage, product_focus, interview_style, interview_persona_prompt, roles)
VALUES
  (
    'google',
    'Google',
    'Technology',
    'enterprise',
    'Search, ads, cloud, and consumer products at global scale',
    'Data-driven, structured, focused on impact and scale',
    'Ask for specific metrics on every claim. Push back if the candidate doesn''t quantify impact. Focus on scale — how does this work at 1 billion users? Favor long-term strategic thinking over quick wins.',
    ARRAY['PM','SWE','Data Engineer','ML Engineer']
  ),
  (
    'meta',
    'Meta',
    'Social Media & Technology',
    'enterprise',
    'Social connectivity, messaging, and immersive experiences',
    'Engagement-focused, network-effects oriented, metric-driven',
    'Probe social graph dynamics. Ask how features affect engagement metrics (DAU, time-on-app, session depth). Push for two-sided network effects. Reference Facebook, Instagram, and WhatsApp product domains.',
    ARRAY['PM','SWE','Data Engineer','ML Engineer']
  ),
  (
    'stripe',
    'Stripe',
    'Financial Technology',
    'enterprise',
    'Developer-first payment infrastructure and financial services',
    'Developer-empathy driven, precision-focused, API-first',
    'Focus on developer experience above all else. Ask how an API would be designed for developers. Probe financial infrastructure tradeoffs (reliability, latency, compliance). Expect precision on error handling.',
    ARRAY['PM','SWE','Data Engineer']
  ),
  (
    'airbnb',
    'Airbnb',
    'Travel & Marketplace',
    'enterprise',
    'Two-sided marketplace for short-term accommodation and experiences',
    'Trust-first, community-centered, marketplace dynamics focused',
    'Trust and safety are first-class concerns in every decision. Ask about both host and guest perspectives equally. Probe marketplace dynamics, community effects, and how to handle fraud at scale.',
    ARRAY['PM','SWE','Data Engineer']
  ),
  (
    'uber',
    'Uber',
    'Transportation & Logistics',
    'enterprise',
    'Ride-hailing, delivery, and logistics at global scale',
    'Operations-heavy, real-time systems focused, multi-sided marketplace',
    'Ask about operational complexity and real-time system constraints. Always probe both driver and rider sides. Focus on reliability at massive scale and geographic variance.',
    ARRAY['PM','SWE','Data Engineer','ML Engineer']
  ),
  (
    'netflix',
    'Netflix',
    'Entertainment & Streaming',
    'enterprise',
    'Global streaming platform for video content and original productions',
    'Experimentation-driven, personalization-focused, retention-oriented',
    'Personalization and content discovery are central to everything. Ask about A/B testing rigor and statistical significance. Probe retention metrics, content investment ROI, and global content tradeoffs.',
    ARRAY['PM','ML Engineer','Data Engineer']
  ),
  (
    'figma',
    'Figma',
    'Design & Productivity Tools',
    'enterprise',
    'Collaborative design and prototyping platform for product teams',
    'Craft-obsessed, collaboration-first, power-user aware',
    'Product craft and multiplayer collaboration UX are the lens for every decision. Ask how features behave when 10 people are editing simultaneously. Probe power user workflows and developer ecosystem.',
    ARRAY['PM','SWE']
  ),
  (
    'notion',
    'Notion',
    'Productivity & Knowledge Management',
    'enterprise',
    'All-in-one workspace for notes, docs, databases, and team collaboration',
    'Bottoms-up growth focused, flexibility vs. opinionation tension',
    'Bottoms-up growth and flexibility vs. opinionation are the core tensions. Ask about how features serve both individuals and large teams. Probe horizontal vs. vertical product strategy.',
    ARRAY['PM','SWE']
  )
ON CONFLICT (slug) DO UPDATE SET
  interview_persona_prompt = EXCLUDED.interview_persona_prompt,
  roles = EXCLUDED.roles,
  industry = EXCLUDED.industry,
  stage = EXCLUDED.stage,
  product_focus = EXCLUDED.product_focus,
  interview_style = EXCLUDED.interview_style;
