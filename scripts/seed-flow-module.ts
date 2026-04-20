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
// Renderer constraints (src/app/(app)/learn/[slug]/page.tsx): only # ## ###,
// **bold**, *italic*, --- hrules, and paragraph breaks. No lists, no links, no
// blockquotes. Every paragraph separated by a blank line. No em dashes. No
// second-person role framing.

const CHAPTER_1_BODY = `## The room

The room is a product review. The deck is open. A staff engineer has been asked what they think. They are the person in the room who has shipped the most, debugged the most, rewritten the most. They open their mouth and what comes out is "it depends" or "we could do A, but also B" or "let me think about what the user wants."

The CEO nods politely. A more junior PM takes the floor and runs with a framework. The staff engineer, who understood the problem better than anyone, watched it happen.

## The gap

Engineers do not lack product intuition. They lack vocabulary and reps.

The raw material is already there. Debugging is root-cause thinking. Architecture reviews are option-space thinking. Build-versus-buy is tradeoff naming. Shipping is hypothesis testing. These are the same four moves that a senior product thinker makes in a strategy meeting. The moves have different names in different rooms, but the shape is identical.

What engineers are missing is not intelligence. It is a vocabulary for the thing they already do, and a place to practice it when the stakes do not punish them for practicing.

Rahul Pandey's formulation of product sense names six competencies. Motivation theory. Cognitive empathy. Taste. Strategic thinking. Creative execution. Domain expertise. Five of these six are things engineers exercise every week. Taste is the one that gets called out as missing, and taste is not missing. It is uncalibrated because nobody told the engineer it was the thing being evaluated.

FLOW is the naming.

## What FLOW actually is

FLOW is four reasoning moves. Not a framework. A vocabulary for the moves you are already making, plus a gym for making them against decisions where the answer is not obvious.

**Frame.** The stated problem is almost never the real problem. The real problem is upstream. "Users are churning" is a symptom. The move is to keep asking what is upstream of the stated complaint until the description would still be true if every proposed solution already existed. That is the frame that is worth solving.

**List.** The options you missed matter more than the options you found. A list of five variations of the same idea is a list of one idea. A real option space contains structurally distinct approaches, solving different underlying jobs, making different bets. If your list has a clear winner before you write the second option, the list is too narrow.

**Optimize.** A tradeoff you cannot name is not a tradeoff. It is a preference. The move is to name the criterion you are optimizing for, then name the thing you are explicitly giving up. "We will ship speed at the cost of visual polish, because this audience will forgive ugly before it forgives slow." That sentence is worth more than any scorecard.

**Win.** A recommendation is a falsifiable hypothesis. If you cannot say what outcome would prove you wrong, you are not recommending. You are hedging. A crisp recommendation picks a direction, predicts a measurable result, and commits to a timeline. Everything else is a status update.

Four moves. Four anti-patterns they correct. That is the whole framework.

## Why this beats "learn product management"

The alternative is to read ten books and guess at the distillation. Inspired. Empowered. Obviously Awesome. The Build Trap. Measure What Matters. Competing Against Luck. Upstream. The Mom Test. Working Backwards. The Making of a Manager.

All of these books are good. Reading them is not the same as being able to make the move they are pointing at when it counts. The books are written for people who already have the reps. FLOW gives you the four moves and a way to practice each one until the motion is yours.

This module teaches the vocabulary. The challenges in the rest of the product are the reps.

## What the module will do

Chapter 2 is Frame. The root-cause move. Why the stated problem is the enemy of the real problem, and how to find what is upstream without getting lost.

Chapter 3 is List. How to widen the option space on purpose, not by accident. Why structurally distinct beats many variations.

Chapter 4 is Optimize. Naming the criterion and the sacrifice. Why "it depends" is not an answer and what an answer looks like instead.

Chapter 5 is Win. The recommendation as a falsifiable hypothesis. How to make a call someone can actually disagree with.

Chapter 6 maps the four moves onto seven reasoning traditions from Shreyas Doshi, April Dunford, Marty Cagan, Rahul Pandey, Gergely Orosz, and Gibson Biddle. You will recognize the moves because you already make them. The chapter names them.

Chapter 7 is the engineer-to-product shift. What engineers already have that most PMs envy. What engineers need to learn that most PMs take for granted.

Chapter 8 is FLOW in a real meeting. How to run the four moves when the clock is ticking and the CEO is watching.

## One handle to take with you

Product thinking is not more thinking. It is different thinking. Four moves. The real problem is upstream. The best option was not on the list. The tradeoff is a sacrifice, not a preference. The recommendation is a hypothesis that could be wrong.

When the next review meeting opens, that is the vocabulary to reach for.`.trim()

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
