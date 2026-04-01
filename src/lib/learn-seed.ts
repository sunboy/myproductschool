import type { LearnModule, LearnChapter } from './types'

// SVG art for each module cover. Inline strings, rendered via dangerouslySetInnerHTML
// inside a sized div. Each SVG is 100% width/height of its container.

export const MODULE_SVG_ART: Record<string, string> = {
  flow: `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="50" r="22" fill="none" stroke="#4a7c59" stroke-width="2.5"/>
    <text x="40" y="55" text-anchor="middle" fill="#8ecf9e" font-size="12" font-family="sans-serif" font-weight="700">F</text>
    <circle cx="120" cy="50" r="22" fill="none" stroke="#4a7c59" stroke-width="2.5"/>
    <text x="120" y="55" text-anchor="middle" fill="#8ecf9e" font-size="12" font-family="sans-serif" font-weight="700">L·O</text>
    <circle cx="200" cy="50" r="22" fill="none" stroke="#4a7c59" stroke-width="2.5"/>
    <text x="200" y="55" text-anchor="middle" fill="#8ecf9e" font-size="12" font-family="sans-serif" font-weight="700">W</text>
    <line x1="62" y1="50" x2="98" y2="50" stroke="#4a7c59" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="142" y1="50" x2="178" y2="50" stroke="#4a7c59" stroke-width="1.5" marker-end="url(#arr)"/>
    <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4a7c59"/></marker></defs>
  </svg>`,

  'user-models': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="120" cy="50" r="18" fill="#3b5bdb" opacity="0.7"/>
    <circle cx="50" cy="50" r="10" fill="none" stroke="#5c7cfa" stroke-width="1.5"/>
    <circle cx="190" cy="50" r="10" fill="none" stroke="#5c7cfa" stroke-width="1.5"/>
    <circle cx="120" cy="15" r="10" fill="none" stroke="#5c7cfa" stroke-width="1.5"/>
    <circle cx="120" cy="85" r="10" fill="none" stroke="#5c7cfa" stroke-width="1.5"/>
    <line x1="60" y1="50" x2="102" y2="50" stroke="#5c7cfa" stroke-width="1.5" opacity="0.6"/>
    <line x1="138" y1="50" x2="180" y2="50" stroke="#5c7cfa" stroke-width="1.5" opacity="0.6"/>
    <line x1="120" y1="25" x2="120" y2="32" stroke="#5c7cfa" stroke-width="1.5" opacity="0.6"/>
    <line x1="120" y1="68" x2="120" y2="75" stroke="#5c7cfa" stroke-width="1.5" opacity="0.6"/>
  </svg>`,

  'root-cause': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="95" y="8" width="50" height="20" rx="4" fill="none" stroke="#fca5a5" stroke-width="1.5"/>
    <text x="120" y="22" text-anchor="middle" fill="#fca5a5" font-size="8" font-family="sans-serif">Symptom</text>
    <line x1="120" y1="28" x2="80" y2="50" stroke="#ef4444" stroke-width="1.5" opacity="0.7"/>
    <line x1="120" y1="28" x2="160" y2="50" stroke="#ef4444" stroke-width="1.5" opacity="0.7"/>
    <rect x="55" y="50" width="50" height="18" rx="4" fill="none" stroke="#ef4444" stroke-width="1.5"/>
    <rect x="135" y="50" width="50" height="18" rx="4" fill="none" stroke="#ef4444" stroke-width="1.5"/>
    <line x1="80" y1="68" x2="60" y2="82" stroke="#ef4444" stroke-width="1.5" opacity="0.5"/>
    <line x1="80" y1="68" x2="100" y2="82" stroke="#ef4444" stroke-width="1.5" opacity="0.5"/>
    <circle cx="60" cy="85" r="5" fill="#ef4444" opacity="0.5"/>
    <circle cx="100" cy="85" r="5" fill="#ef4444" opacity="0.5"/>
    <circle cx="165" cy="82" r="8" fill="#ef4444" opacity="0.8"/>
    <text x="165" y="86" text-anchor="middle" fill="#fff" font-size="7" font-family="sans-serif">Root</text>
  </svg>`,

  'product-debug': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="30" width="20" height="55" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="50" y="20" width="20" height="65" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="80" y="35" width="20" height="50" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="110" y="15" width="20" height="70" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="140" y="45" width="20" height="40" rx="2" fill="#ef4444" opacity="0.9"/>
    <rect x="170" y="55" width="20" height="30" rx="2" fill="#ef4444" opacity="0.7"/>
    <rect x="200" y="60" width="20" height="25" rx="2" fill="#ef4444" opacity="0.6"/>
    <polyline points="20,25 50,15 80,28 120,10 150,40 180,50 210,55" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="4,2"/>
  </svg>`,

  'north-star': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="120,10 128,38 158,38 134,56 142,84 120,68 98,84 106,56 82,38 112,38" fill="none" stroke="#fbbf24" stroke-width="2"/>
    <polygon points="120,20 126,38 146,38 130,50 136,70 120,58 104,70 110,50 94,38 114,38" fill="#fbbf24" opacity="0.2"/>
    <circle cx="120" cy="50" r="30" fill="none" stroke="#fbbf24" stroke-width="0.5" opacity="0.4"/>
    <circle cx="120" cy="50" r="42" fill="none" stroke="#fbbf24" stroke-width="0.5" opacity="0.2"/>
  </svg>`,

  'trade-offs': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <line x1="120" y1="45" x2="120" y2="90" stroke="#f59e0b" stroke-width="2"/>
    <line x1="70" y1="48" x2="170" y2="42" stroke="#f59e0b" stroke-width="2.5"/>
    <rect x="35" y="44" width="38" height="24" rx="3" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
    <rect x="168" y="38" width="38" height="24" rx="3" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.6"/>
    <text x="54" y="60" text-anchor="middle" fill="#f59e0b" font-size="7" font-family="sans-serif">Speed</text>
    <text x="187" y="54" text-anchor="middle" fill="#f59e0b" font-size="7" font-family="sans-serif" opacity="0.7">Quality</text>
    <circle cx="120" cy="90" r="5" fill="#f59e0b"/>
  </svg>`,

  'growth-loops': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="120" cy="50" rx="80" ry="35" fill="none" stroke="#10b981" stroke-width="2"/>
    <circle cx="40" cy="50" r="10" fill="#10b981" opacity="0.8"/>
    <circle cx="120" cy="15" r="10" fill="#10b981" opacity="0.8"/>
    <circle cx="200" cy="50" r="10" fill="#10b981" opacity="0.8"/>
    <circle cx="120" cy="85" r="10" fill="#10b981" opacity="0.8"/>
    <polygon points="195,42 205,50 195,58" fill="#34d399"/>
  </svg>`,

  'ai-products': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="25" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="20" cy="50" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="20" cy="75" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="100" cy="20" r="8" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <circle cx="100" cy="40" r="8" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <circle cx="100" cy="60" r="8" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <circle cx="100" cy="80" r="8" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
    <circle cx="180" cy="35" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="180" cy="65" r="8" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="230" cy="50" r="12" fill="#a855f7" opacity="0.8"/>
    <line x1="28" y1="25" x2="92" y2="20" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="25" x2="92" y2="40" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="50" x2="92" y2="40" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="50" x2="92" y2="60" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="75" x2="92" y2="60" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="28" y1="75" x2="92" y2="80" stroke="#a855f7" stroke-width="0.8" opacity="0.5"/>
    <line x1="108" y1="20" x2="172" y2="35" stroke="#7c3aed" stroke-width="0.8" opacity="0.5"/>
    <line x1="108" y1="40" x2="172" y2="35" stroke="#7c3aed" stroke-width="0.8" opacity="0.5"/>
    <line x1="108" y1="60" x2="172" y2="65" stroke="#7c3aed" stroke-width="0.8" opacity="0.5"/>
    <line x1="108" y1="80" x2="172" y2="65" stroke="#7c3aed" stroke-width="0.8" opacity="0.5"/>
    <line x1="188" y1="35" x2="218" y2="50" stroke="#a855f7" stroke-width="1" opacity="0.7"/>
    <line x1="188" y1="65" x2="218" y2="50" stroke="#a855f7" stroke-width="1" opacity="0.7"/>
  </svg>`,

  'product-sense': `<svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="120,15 148,32 148,68 120,85 92,68 92,32" fill="none" stroke="#4a7c59" stroke-width="2"/>
    <polygon points="120,30 138,40 138,60 120,70 102,60 102,40" fill="#4a7c59" opacity="0.25"/>
    <polygon points="120,45 128,50 128,60 120,65 112,60 112,50" fill="#8ecf9e" opacity="0.7"/>
    <line x1="120" y1="15" x2="120" y2="45" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="148" y1="32" x2="128" y2="50" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="148" y1="68" x2="128" y2="60" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="120" y1="85" x2="120" y2="65" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="92" y1="68" x2="112" y2="60" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
    <line x1="92" y1="32" x2="112" y2="50" stroke="#4a7c59" stroke-width="0.8" opacity="0.5"/>
  </svg>`,
}

export const LEARN_MODULES_SEED: Omit<LearnModule, 'id' | 'created_at'>[] = [
  {
    slug: 'flow',
    name: 'FLOW',
    tagline: 'The 4-step framework behind every challenge on this platform',
    difficulty: 'foundation',
    chapter_count: 7,
    est_minutes: 45,
    cover_color: '#1a3a2a',
    accent_color: '#4a7c59',
    sort_order: 1,
  },
  {
    slug: 'user-models',
    name: 'User Models',
    tagline: 'Represent users the way you represent data structures',
    difficulty: 'beginner',
    chapter_count: 7,
    est_minutes: 40,
    cover_color: '#1a2a3a',
    accent_color: '#3b5bdb',
    sort_order: 2,
  },
  {
    slug: 'root-cause',
    name: 'Root Cause',
    tagline: 'Engineers already debug systems. Now apply it to products.',
    difficulty: 'intermediate',
    chapter_count: 7,
    est_minutes: 40,
    cover_color: '#2a1a1a',
    accent_color: '#ef4444',
    sort_order: 3,
  },
  {
    slug: 'product-debug',
    name: 'Product Debug',
    tagline: 'DAU dropped 15%. Walk me through your diagnosis.',
    difficulty: 'intermediate',
    chapter_count: 7,
    est_minutes: 45,
    cover_color: '#0f1a2e',
    accent_color: '#3b82f6',
    sort_order: 4,
  },
  {
    slug: 'north-star',
    name: 'North Star',
    tagline: 'One metric that captures the value you actually deliver',
    difficulty: 'intermediate',
    chapter_count: 7,
    est_minutes: 45,
    cover_color: '#1a1a2e',
    accent_color: '#fbbf24',
    sort_order: 5,
  },
  {
    slug: 'trade-offs',
    name: 'Trade-offs',
    tagline: '"It depends" is not an answer. Name what you\'re optimizing for.',
    difficulty: 'advanced',
    chapter_count: 7,
    est_minutes: 50,
    cover_color: '#1e1a0e',
    accent_color: '#f59e0b',
    sort_order: 6,
  },
  {
    slug: 'growth-loops',
    name: 'Growth Loops',
    tagline: 'Systems that compound. Engineers already think this way.',
    difficulty: 'intermediate',
    chapter_count: 7,
    est_minutes: 45,
    cover_color: '#0e1a12',
    accent_color: '#10b981',
    sort_order: 7,
  },
  {
    slug: 'ai-products',
    name: 'AI Products',
    tagline: 'When execution is cheap, judgment is the differentiator',
    difficulty: 'new-era',
    chapter_count: 8,
    est_minutes: 55,
    cover_color: '#1a0e2a',
    accent_color: '#a855f7',
    sort_order: 8,
  },
  {
    slug: 'product-sense',
    name: 'Product Sense',
    tagline: 'The thing they say you need. Now defined, demystified, learnable.',
    difficulty: 'entry-point',
    chapter_count: 7,
    est_minutes: 40,
    cover_color: '#1a2e1a',
    accent_color: '#4a7c59',
    sort_order: 9,
  },
]

// Chapter titles per module — used for mock data
export const LEARN_CHAPTERS_SEED: Record<string, { title: string; subtitle: string; hook_text: string }[]> = {
  flow: [
    { title: 'Why engineers think backwards', subtitle: 'How before why — the default engineer trap', hook_text: 'The best engineers jump to solutions instantly. In interviews, that kills you.' },
    { title: 'F — Frame', subtitle: 'Define before you solve', hook_text: 'A precise problem statement is worth more than ten solutions.' },
    { title: 'L — List', subtitle: 'Map the full solution space', hook_text: 'The first idea is never the best idea. List before you commit.' },
    { title: 'O — Optimize', subtitle: 'Weigh, don\'t guess', hook_text: 'Every trade-off has a right answer — if you name the criteria first.' },
    { title: 'W — Win', subtitle: 'Make a specific, defensible call', hook_text: 'Interviewers don\'t remember hedgers. They remember people who committed and showed their reasoning.' },
    { title: 'Anti-patterns', subtitle: 'What FLOW corrects', hook_text: 'Knowing the framework isn\'t enough. Know what it\'s saving you from.' },
    { title: 'FLOW in a real interview', subtitle: 'Full walkthrough', hook_text: 'Watch the framework close a real PM question from "I don\'t know where to start" to a confident answer.' },
  ],
  'user-models': [
    { title: 'Why engineers design for themselves', subtitle: 'And why it fails', hook_text: 'You are not the user. You\'re the worst possible proxy for the user.' },
    { title: 'Segment by behavior, not demographics', subtitle: 'The age-23-female fallacy', hook_text: 'Demographics describe people. Behavior predicts decisions.' },
    { title: 'Jobs to Be Done', subtitle: 'Functional, emotional, social', hook_text: 'Nobody buys a drill. They buy a hole. Nobody uses Instagram. They buy belonging.' },
    { title: 'Multi-sided markets', subtitle: 'The chicken-and-egg problem', hook_text: 'Your product has multiple users. Solving for one often breaks the other.' },
    { title: 'The Reach × Underservedness matrix', subtitle: 'Where to focus', hook_text: 'A segment that\'s large and ignored is a product waiting to be built.' },
    { title: 'Accessibility as product signal', subtitle: 'Not a checkbox', hook_text: 'Accessibility constraints surface the assumptions baked into your design.' },
    { title: 'Case: Spotify Wrapped', subtitle: 'The social job nobody spec\'d', hook_text: 'Spotify didn\'t plan Wrapped as a viral feature. They planned a summary. Users turned it into an identity signal.' },
  ],
  'root-cause': [
    { title: 'The engineer\'s superpower', subtitle: 'You already know how to debug', hook_text: 'The skill that makes you great at debugging systems is the same skill PM interviewers are testing. You just haven\'t applied it to products yet.' },
    { title: 'Symptoms vs. root causes', subtitle: '5 Whys, applied to products', hook_text: '"Users are churning" is not a problem. It\'s a symptom. The problem is three levels deeper.' },
    { title: 'Frequency × Severity × Underservedness', subtitle: 'The triage matrix', hook_text: 'Not all user problems are worth solving. Here\'s how to rank them.' },
    { title: 'Connecting problems to mission fit', subtitle: 'The filter interviewers use', hook_text: 'A real problem the company doesn\'t care about is still the wrong answer.' },
    { title: 'The problems users stop complaining about', subtitle: 'The Gmail story', hook_text: 'The most dangerous user problems are the ones they\'ve given up on.' },
    { title: 'Writing a crisp problem statement', subtitle: 'One sentence, no hedging', hook_text: 'If you can\'t write the problem in one sentence, you haven\'t understood it yet.' },
    { title: 'Case: When the bug you fixed wasn\'t the real problem', subtitle: 'Engineering gone wrong', hook_text: 'The team shipped a fix in 48 hours. Six weeks later, the metric hadn\'t moved. Here\'s why.' },
  ],
  'product-debug': [
    { title: 'DAU dropped 15%. Now what?', subtitle: 'The diagnostic loop', hook_text: 'Your first instinct will be wrong. The discipline is in the process, not the guess.' },
    { title: 'External vs. internal causes', subtitle: 'Seasonality, bugs, competitors', hook_text: 'Before you blame the product, check whether the world changed.' },
    { title: 'Funnel decomposition', subtitle: 'Where did users drop off?', hook_text: 'A metric drop has a location. Find it before you theorize about causes.' },
    { title: 'Cohort analysis', subtitle: 'New users or existing users?', hook_text: 'Same drop, two completely different root causes depending on which cohort is affected.' },
    { title: 'Instrumentation gaps', subtitle: 'The metric you can\'t see', hook_text: 'The worst kind of problem is one you can\'t measure. How to diagnose what\'s invisible.' },
    { title: 'Communicating findings', subtitle: 'Without overclaiming', hook_text: 'Data tells you what happened. It rarely tells you why. Know the difference before you present.' },
    { title: 'Case: Instagram feed change', subtitle: 'That tanked creator reach', hook_text: 'Instagram\'s algorithm shift looked like a bug from the outside. Inside, it was a deliberate call. Here\'s the diagnosis both sides missed.' },
  ],
  'north-star': [
    { title: 'Output metrics vs. outcome metrics', subtitle: 'Latency ≠ user value', hook_text: 'You can ship fast and still build the wrong thing. Output metrics make this invisible.' },
    { title: 'The North Star Metric framework', subtitle: 'One number that captures value', hook_text: 'A team that optimizes for the right number can make bad individual decisions and still win.' },
    { title: 'AARRR: Pirate metrics', subtitle: 'For the real world', hook_text: 'Acquisition. Activation. Retention. Referral. Revenue. The framework every PM knows — and most misapply.' },
    { title: 'Guardrail metrics', subtitle: 'Preventing dark patterns', hook_text: 'Every optimization has a dark side. Guardrails are the safeguards against winning the battle and losing the war.' },
    { title: 'When metrics lie', subtitle: 'Goodhart\'s Law', hook_text: 'When a measure becomes a target, it ceases to be a good measure.' },
    { title: 'Case: Netflix', subtitle: '$1B saved with one metric change', hook_text: 'Netflix stopped counting titles in the catalog. What they started measuring instead is a masterclass in North Star thinking.' },
    { title: 'Picking metrics in a PM interview', subtitle: 'What they\'re actually scoring', hook_text: 'Interviewers aren\'t checking if you know AARRR. They\'re checking whether your metric actually captures user value.' },
  ],
  'trade-offs': [
    { title: '"It depends" is not an answer', subtitle: 'Name what you\'re optimizing for', hook_text: 'Every experienced PM says "it depends." The best ones immediately say what it depends on.' },
    { title: 'RICE scoring', subtitle: 'Reach × Impact × Confidence ÷ Effort', hook_text: 'Prioritization frameworks don\'t make decisions for you. They force you to make your assumptions explicit.' },
    { title: 'The 2×2 impact-effort matrix', subtitle: 'A tool, not an answer', hook_text: 'Impact-effort is the most used framework in product. It\'s also the most abused.' },
    { title: 'The Naming Move', subtitle: '"We get X, we sacrifice Y, because Z"', hook_text: 'The most senior PMs don\'t hedge. They name the trade-off explicitly and own it.' },
    { title: 'Tech debt as a product decision', subtitle: 'Not just an engineering one', hook_text: 'Every time you defer a refactor, you\'re making a product bet. Most PMs don\'t know they\'re making it.' },
    { title: 'Brand, trust, and regulatory constraints', subtitle: 'What engineers miss', hook_text: 'The best idea technically is often the wrong idea commercially. Here\'s the checklist PMs carry.' },
    { title: 'Case: Spotify Wrapped', subtitle: 'Zero revenue, 100M shares, right call', hook_text: 'Spotify built a feature with no direct monetization path. The trade-off was obvious in hindsight. Here\'s how to see it in the moment.' },
  ],
  'growth-loops': [
    { title: 'Funnels vs. loops', subtitle: 'Why engineers get this intuitively', hook_text: 'A funnel is a pipeline. A loop is a recursive call. You already think in loops.' },
    { title: 'Acquisition, engagement, monetization loops', subtitle: 'The three archetypes', hook_text: 'Not every loop is a growth loop. Some just spin in place. Here\'s how to tell the difference.' },
    { title: 'Viral coefficient', subtitle: 'What makes a loop compound', hook_text: 'A viral coefficient > 1 means every user makes more than one user. That\'s exponential. Most products never get there — here\'s why.' },
    { title: 'Retention curves', subtitle: 'The "smile" vs. the flatline', hook_text: 'A flatline retention curve means you have a real product. A declining curve means you\'re buying users you can\'t keep.' },
    { title: 'Network effects as compounding loops', subtitle: 'When value grows with users', hook_text: 'Network effects are the hardest moat to build and the easiest to handwave. Here\'s how to distinguish real ones from fake.' },
    { title: 'When growth hacks kill the product', subtitle: 'Dark patterns in disguise', hook_text: 'Every dark pattern started as a growth experiment that worked. The question is what it cost.' },
    { title: 'Case: TikTok\'s algorithm as a growth loop', subtitle: 'The loop nobody designed', hook_text: 'TikTok\'s For You page isn\'t just a recommendation system. It\'s a perpetual retention loop. Here\'s the engineering.' },
  ],
  'ai-products': [
    { title: 'The spectrum: AI-assisted → AI-native', subtitle: 'Where your product sits', hook_text: 'AI-assisted is a feature. AI-native is a different product category entirely. Most builders are confused about which they\'re building.' },
    { title: 'When execution is cheap, judgment is expensive', subtitle: 'Shreyas Doshi\'s frame', hook_text: 'If AI can generate 100 options in seconds, the bottleneck is no longer execution. It\'s knowing which option is right.' },
    { title: 'Designing for agents', subtitle: 'New UX primitives', hook_text: 'Agents don\'t fill out forms. They don\'t wait for confirmation dialogs. UI built for humans breaks for agents.' },
    { title: 'Trust, safety, and the agentic loop', subtitle: 'The new product constraint', hook_text: 'Every agentic feature has a trust budget. Once spent, it\'s very hard to recover.' },
    { title: 'Accuracy vs. latency', subtitle: 'The MLE trade-off as product decision', hook_text: 'Is a 50ms response with 70% accuracy better than a 500ms response with 95% accuracy? The right answer depends entirely on the use case.' },
    { title: 'What makes an AI feature defensible?', subtitle: 'The moat question', hook_text: 'AI commoditizes execution. Data, feedback loops, and trust are the new moats.' },
    { title: 'Shadow mode, A/B, and eval design for AI features', subtitle: 'How to ship AI responsibly', hook_text: 'You can\'t A/B test your way to good AI. Evals are different from experiments. Here\'s the mental model.' },
    { title: 'Case: When agentic went wrong', subtitle: 'A product autopsy', hook_text: 'The feature worked exactly as designed. The problem was the design assumed a level of user trust that didn\'t exist.' },
  ],
  'product-sense': [
    { title: 'Engineers don\'t lack intuition', subtitle: 'They lack vocabulary', hook_text: 'You\'ve been making product decisions your entire career. You just didn\'t have the words for it.' },
    { title: 'The "how" vs. "why" mindset shift', subtitle: 'The single biggest unlock', hook_text: 'Engineers default to how. Product thinking starts with why. The shift is smaller than it sounds.' },
    { title: 'The 9 traits of a product-minded engineer', subtitle: 'Gergely Orosz\'s framework', hook_text: 'There\'s a name for engineers who think this way. Here\'s the map.' },
    { title: 'Why-First Check', subtitle: 'User impact, business viability, engineering sense', hook_text: 'Three filters. Every feature decision runs through all three. Most engineers only run one.' },
    { title: 'The 4 common failure modes', subtitle: 'In PM interviews', hook_text: 'Interviewers see the same four mistakes in every loop. Knowing them is the easiest edge you can get.' },
    { title: 'Framework recitation vs. actual thinking', subtitle: 'The trap the internet set', hook_text: 'Saying "I\'d use the RICE framework" is not an answer. It\'s the beginning of an answer that most people never finish.' },
    { title: 'How to build product reps', subtitle: 'Without switching roles', hook_text: 'You don\'t need a PM job to develop product sense. You need a deliberate practice habit.' },
  ],
}
