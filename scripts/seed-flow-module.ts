// scripts/seed-flow-module.ts
//
// Seeds the FLOW course module into learn_modules + learn_chapters.
// Idempotent. Safe to re-run.
//
// Run: npx tsx --tsconfig tsconfig.json scripts/seed-flow-module.ts
//
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const MODULE_SLUG = 'flow'

const MODULE_ROW = {
  slug: MODULE_SLUG,
  name: 'FLOW',
  tagline: 'The four reasoning moves that separate product thinking from technical thinking.',
  difficulty: 'foundation' as const,
  chapter_count: 8,
  est_minutes: 80,
  cover_color: '#4a7c59',
  accent_color: '#c4a66a',
  sort_order: 1,
}

// ── Chapter 1: full body ─────────────────────────────────────────────────────
//
// Renderer supports: headings, bold, italic, code, hrules, lists, links, and
// pass-through for block-level HTML (svg, figure, div, ul, ol, table).
// Voice: direct, no scene-setting, diagrams carry the load.

const CHAPTER_1_BODY = `## What FLOW is

Four reasoning moves that make the difference between technical thinking and product thinking. Not a framework to memorize. A vocabulary for moves you already make.

<figure>
<svg viewBox="0 0 720 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The four FLOW moves">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4a4e4a"/></marker>
  </defs>
  <g font-family="Nunito Sans, sans-serif" font-size="13">
    <g><rect x="8" y="30" width="160" height="100" rx="14" fill="#d8f0de" stroke="#4a7c59" stroke-width="1.5"/><text x="88" y="62" text-anchor="middle" font-weight="700" fill="#2e3230">Frame</text><text x="88" y="88" text-anchor="middle" fill="#4a4e4a" font-size="11">Find the real</text><text x="88" y="104" text-anchor="middle" fill="#4a4e4a" font-size="11">problem</text><text x="88" y="122" text-anchor="middle" fill="#b83230" font-size="10" font-style="italic">not the stated one</text></g>
    <g><rect x="188" y="30" width="160" height="100" rx="14" fill="#f0e8db" stroke="#6b6358" stroke-width="1.5"/><text x="268" y="62" text-anchor="middle" font-weight="700" fill="#2e3230">List</text><text x="268" y="88" text-anchor="middle" fill="#4a4e4a" font-size="11">Widen the</text><text x="268" y="104" text-anchor="middle" fill="#4a4e4a" font-size="11">option space</text><text x="268" y="122" text-anchor="middle" fill="#b83230" font-size="10" font-style="italic">structurally distinct</text></g>
    <g><rect x="368" y="30" width="160" height="100" rx="14" fill="#c4a66a33" stroke="#705c30" stroke-width="1.5"/><text x="448" y="62" text-anchor="middle" font-weight="700" fill="#2e3230">Optimize</text><text x="448" y="88" text-anchor="middle" fill="#4a4e4a" font-size="11">Name the</text><text x="448" y="104" text-anchor="middle" fill="#4a4e4a" font-size="11">criterion + sacrifice</text><text x="448" y="122" text-anchor="middle" fill="#b83230" font-size="10" font-style="italic">not a preference</text></g>
    <g><rect x="548" y="30" width="160" height="100" rx="14" fill="#78a88644" stroke="#4a7c59" stroke-width="1.5"/><text x="628" y="62" text-anchor="middle" font-weight="700" fill="#2e3230">Win</text><text x="628" y="88" text-anchor="middle" fill="#4a4e4a" font-size="11">Falsifiable</text><text x="628" y="104" text-anchor="middle" fill="#4a4e4a" font-size="11">recommendation</text><text x="628" y="122" text-anchor="middle" fill="#b83230" font-size="10" font-style="italic">not a hedge</text></g>
    <line x1="168" y1="80" x2="186" y2="80" stroke="#4a4e4a" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="348" y1="80" x2="366" y2="80" stroke="#4a4e4a" stroke-width="1.5" marker-end="url(#arr)"/>
    <line x1="528" y1="80" x2="546" y2="80" stroke="#4a4e4a" stroke-width="1.5" marker-end="url(#arr)"/>
  </g>
</svg>
<figcaption>The four moves. Each corrects a specific anti-pattern (red italic).</figcaption>
</figure>

## Why engineers already have most of this

Five of the six competencies that define product sense show up in engineering work every week. Engineers do not lack product intuition. They lack vocabulary and reps.

<figure>
<svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Product sense competencies mapped to engineering work">
  <g font-family="Nunito Sans, sans-serif" font-size="12">
    <text x="140" y="26" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="13">Product sense competency</text>
    <text x="480" y="26" text-anchor="middle" font-weight="700" fill="#2e3230" font-size="13">Where engineers already do it</text>

    <g transform="translate(0,44)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Motivation theory</text>
      <text x="300" y="20" fill="#4a4e4a">On-call. Why users rage. Why metrics move.</text>
    </g>
    <g transform="translate(0,82)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Cognitive empathy</text>
      <text x="300" y="20" fill="#4a4e4a">API design. Imagining the next caller.</text>
    </g>
    <g transform="translate(0,120)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#f0e8db" stroke="#b83230" stroke-dasharray="4 3"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Taste</text>
      <text x="300" y="20" fill="#b83230" font-style="italic">Uncalibrated. Nobody named this as the thing being judged.</text>
    </g>
    <g transform="translate(0,158)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Strategic thinking</text>
      <text x="300" y="20" fill="#4a4e4a">Build vs buy. Tech debt payoff timing.</text>
    </g>
    <g transform="translate(0,196)">
      <rect x="16" y="0" width="248" height="30" rx="6" fill="#d8f0de" stroke="#4a7c59"/>
      <text x="32" y="20" fill="#2e3230" font-weight="600">Creative execution</text>
      <text x="300" y="20" fill="#4a4e4a">Architecture reviews. Structurally distinct options.</text>
    </g>
  </g>
</svg>
<figcaption>Rahul Pandey's six competencies, minus domain expertise. Five are already in the engineering week. Taste is the one that usually gets flagged as missing, and it is not missing. It is uncalibrated.</figcaption>
</figure>

The raw material is there. What is missing is a name for the move and a place to practice it where the stakes do not punish practice.

## The four moves, concretely

Each move corrects one anti-pattern. If you can name which anti-pattern is active in a room, you can name the move that breaks it.

**Frame.** The stated problem is almost never the real problem. *"Users are churning"* is a symptom. Keep asking what is upstream until the complaint would still be true if every proposed fix already existed. That is the frame worth solving.

**List.** A list of five variations of the same idea is a list of one idea. Real options are structurally distinct: different paradigms, different bets. If the winner is obvious before the second option is written, the list is too narrow.

**Optimize.** A tradeoff you cannot name is a preference. Name the criterion you are optimizing for, then name the thing you are giving up. *"We ship speed at the cost of polish, because this audience forgives ugly before it forgives slow"* is more useful than any scorecard.

**Win.** If the recommendation cannot be proven wrong, it is not a recommendation. It is a hedge. A real call picks a direction, predicts a measurable result, and commits to a timeline.

## Where this shows up in engineering language

The same four moves already exist in engineering work. They have different names there.

<figure>
<svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FLOW moves mapped to engineering practices">
  <g font-family="Nunito Sans, sans-serif" font-size="12">
    <rect x="16" y="12" width="688" height="30" fill="#eae6de" stroke="#c4c8bc"/>
    <text x="32" y="32" font-weight="700" fill="#2e3230">FLOW move</text>
    <text x="200" y="32" font-weight="700" fill="#2e3230">Engineering version</text>
    <text x="440" y="32" font-weight="700" fill="#2e3230">Product version</text>

    <g transform="translate(0,42)">
      <rect x="16" y="0" width="688" height="40" fill="#faf6f0" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a7c59" font-weight="700">Frame</text>
      <text x="200" y="24" fill="#4a4e4a">Root-cause debugging</text>
      <text x="440" y="24" fill="#4a4e4a">Problem upstream of the stated complaint</text>
    </g>
    <g transform="translate(0,82)">
      <rect x="16" y="0" width="688" height="40" fill="#f5f1ea" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#6b6358" font-weight="700">List</text>
      <text x="200" y="24" fill="#4a4e4a">Architecture review options</text>
      <text x="440" y="24" fill="#4a4e4a">Structurally distinct solution paths</text>
    </g>
    <g transform="translate(0,122)">
      <rect x="16" y="0" width="688" height="40" fill="#faf6f0" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#705c30" font-weight="700">Optimize</text>
      <text x="200" y="24" fill="#4a4e4a">Build vs buy. Latency vs cost.</text>
      <text x="440" y="24" fill="#4a4e4a">Criterion named, sacrifice named</text>
    </g>
    <g transform="translate(0,162)">
      <rect x="16" y="0" width="688" height="40" fill="#f5f1ea" stroke="#c4c8bc"/>
      <text x="32" y="24" fill="#4a7c59" font-weight="700">Win</text>
      <text x="200" y="24" fill="#4a4e4a">PR with a rollout plan + metric</text>
      <text x="440" y="24" fill="#4a4e4a">Falsifiable recommendation + timeline</text>
    </g>
  </g>
</svg>
<figcaption>Same reasoning move, different room.</figcaption>
</figure>

## Why not just read the books

The alternative is ten books and guessing at the distillation. *Inspired*. *Empowered*. *Obviously Awesome*. *The Build Trap*. *Measure What Matters*. *Competing Against Luck*. *Upstream*. *The Mom Test*. *Working Backwards*. *The Making of a Manager*.

They are all worth reading. None of them alone gives you the four moves named cleanly. FLOW is the compression. The challenges that follow are the reps.

## What is in this module

- **Ch 2. Frame.** The root-cause move. How to find what is upstream without getting lost.
- **Ch 3. List.** Widening the option space on purpose, not by accident.
- **Ch 4. Optimize.** Naming the criterion and the sacrifice. What an answer looks like instead of *"it depends"*.
- **Ch 5. Win.** The recommendation as a falsifiable hypothesis.
- **Ch 6. Seven themes.** Mapping the four moves to Doshi, Dunford, Cagan, Pandey, Orosz, and Biddle.
- **Ch 7. Engineer to product.** What you already have. What you still need.
- **Ch 8. FLOW live.** Running the four moves when the clock is ticking.

## One handle to take with you

Four moves. Real problem is upstream. Best option was not on the list. Tradeoff is a sacrifice, not a preference. Recommendation is a hypothesis that could be wrong.

That is the vocabulary to reach for in the next review meeting.`.trim()

const PLACEHOLDER_BODY = '## In draft\n\nThis chapter is being written. Check back soon.'

const CHAPTERS = [
  {
    slug: 'why-flow',
    title: 'Why FLOW',
    subtitle: 'And why engineers with strong intuition freeze in product reviews.',
    hook_text: 'Engineers do not lack product intuition. They lack vocabulary and reps.',
    body_mdx: CHAPTER_1_BODY,
    sort_order: 1,
  },
  {
    slug: 'frame',
    title: 'Frame',
    subtitle: 'The real problem is never the stated one.',
    hook_text: 'The stated problem is the enemy of the real problem.',
    body_mdx: PLACEHOLDER_BODY,
    sort_order: 2,
  },
  {
    slug: 'list',
    title: 'List',
    subtitle: 'The options you missed matter more than the ones you found.',
    hook_text: 'A list of five variations of one idea is a list of one idea.',
    body_mdx: PLACEHOLDER_BODY,
    sort_order: 3,
  },
  {
    slug: 'optimize',
    title: 'Optimize',
    subtitle: 'Name the criterion. Name the sacrifice.',
    hook_text: 'A tradeoff you cannot name is a preference, not a tradeoff.',
    body_mdx: PLACEHOLDER_BODY,
    sort_order: 4,
  },
  {
    slug: 'win',
    title: 'Win',
    subtitle: 'A recommendation is a falsifiable hypothesis.',
    hook_text: 'If you cannot say what would prove you wrong, you are not recommending.',
    body_mdx: PLACEHOLDER_BODY,
    sort_order: 5,
  },
  {
    slug: 'seven-themes',
    title: 'The seven themes behind the rubric',
    subtitle: 'Which reasoning move each FLOW step is training, and which tradition it comes from.',
    hook_text: 'FLOW is the compression. These are the traditions it compresses.',
    body_mdx: PLACEHOLDER_BODY,
    sort_order: 6,
  },
  {
    slug: 'engineer-to-product',
    title: 'Engineer to product',
    subtitle: 'What engineers already have. What engineers still need.',
    hook_text: 'Five of the six competencies are already in your week. One is not.',
    body_mdx: PLACEHOLDER_BODY,
    sort_order: 7,
  },
  {
    slug: 'using-flow-live',
    title: 'Using FLOW live',
    subtitle: 'In a meeting, in a review, in an interview.',
    hook_text: 'The four moves when the clock is ticking and the CEO is watching.',
    body_mdx: PLACEHOLDER_BODY,
    sort_order: 8,
  },
]

async function run() {
  console.log(`[seed-flow-module] Upserting module "${MODULE_SLUG}"...`)
  const { data: mod, error: modErr } = await supabase
    .from('learn_modules')
    .upsert(MODULE_ROW, { onConflict: 'slug' })
    .select('id, slug, name')
    .single()

  if (modErr || !mod) {
    console.error('[seed-flow-module] Failed to upsert module:', modErr)
    process.exit(1)
  }
  console.log(`[seed-flow-module] ✓ module: ${mod.slug} (${mod.id})`)

  console.log(`[seed-flow-module] Upserting ${CHAPTERS.length} chapters...`)
  for (const ch of CHAPTERS) {
    const { error: chErr } = await supabase
      .from('learn_chapters')
      .upsert(
        { module_id: mod.id, ...ch },
        { onConflict: 'module_id,slug' }
      )
    if (chErr) {
      console.error(`[seed-flow-module] ✗ chapter "${ch.slug}" failed:`, chErr)
      process.exit(1)
    }
    const isPlaceholder = ch.body_mdx === PLACEHOLDER_BODY
    console.log(`  ${isPlaceholder ? '○' : '●'} ${ch.sort_order}. ${ch.slug} — ${ch.title}`)
  }

  console.log('\n[seed-flow-module] Done.')
  console.log(`[seed-flow-module] Visit http://localhost:3000/learn/${MODULE_SLUG} to review.`)
}

run().catch(err => {
  console.error('[seed-flow-module] Fatal:', err)
  process.exit(1)
})
