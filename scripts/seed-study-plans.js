#!/usr/bin/env node
// Seed 7 study plans with real challenge IDs from challenge_prompts

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://tikkhvxlclivixqqqjyb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa2todnhsY2xpdml4cXFxanliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMzI5MCwiZXhwIjoyMDc2ODg5MjkwfQ.SLtlceDB4vzlDWukbFpeYNQoXglqL1U41nuAKoRdSlM'
)

// ── Challenge IDs by paradigm & difficulty (from challenge_prompts) ──────────

// Traditional
const T_BEG = [
  'c0000001-0000-0000-0000-000000000001', // Spotify's 15% Session Drop
  'c0000001-0000-0000-0000-000000000002', // DAU/MAU Looks Great But Revenue Is Flat
  'c0000001-0000-0000-0000-000000000003', // Free Plan Cannibalizing Paid Conversions
  'c0000001-0000-0000-0000-000000000004', // On-Call Alert Volume is Killing Team Morale
  'c0000001-0000-0000-0000-000000000005', // New Feature vs. Tech Debt
]
const T_INT = [
  'c0000001-0000-0000-0000-000000000006', // Checkout Funnel
  'c0000001-0000-0000-0000-000000000007', // Should Notion Build a Native Calendar?
  'c0000001-0000-0000-0000-000000000008', // The Activation Metric That Lied
  'c0000001-0000-0000-0000-000000000009', // Platform vs. Product: Slack's Dilemma
  'c0000001-0000-0000-0000-000000000010', // Why Did Power Users Churn?
  'c0000001-0000-0000-0000-000000000011', // International Expansion
  'c0000001-0000-0000-0000-000000000012', // Search Relevance vs. Monetization Tradeoff
  'c0000001-0000-0000-0000-000000000013', // The Competitor Cloned Your Core Feature
]
const T_ADV = [
  'c0000001-0000-0000-0000-000000000014', // Monetize the API Without Killing the Ecosystem
  'c0000001-0000-0000-0000-000000000015', // Redesign Causes Metric Split
]

// AI-Assisted
const AI_BEG = [
  'c0000001-0000-0000-0000-000000000016', // Your ML Model is 95% Accurate But Users Hate It
  'c0000001-0000-0000-0000-000000000017', // AI Feature Adoption is 8% After 3 Months
  'c0000001-0000-0000-0000-000000000018', // The CEO Wants an AI Chatbot by Friday
  'c0000001-0000-0000-0000-000000000019', // AI Summarization: Fast but Wrong 12% of the Time
  'c0000001-0000-0000-0000-000000000020', // Build AI On Top or Build Your Own Model?
]
const AI_INT = [
  'c0000001-0000-0000-0000-000000000021', // RAG Retrieval Quality
  'c0000001-0000-0000-0000-000000000022', // AI Copilot Causing Code Review Shortcuts
  'c0000001-0000-0000-0000-000000000023', // Prompt Engineering ROI
  'c0000001-0000-0000-0000-000000000024', // AI Pricing
  'c0000001-0000-0000-0000-000000000025', // LLM Costs Are 3x Higher
  'c0000001-0000-0000-0000-000000000026', // Should You Show Confidence Score?
]
const AI_ADV = [
  'a0000001-0000-0000-0000-000000000001', // Model Accuracy Up, Engagement Down
  'c0000001-0000-0000-0000-000000000027', // Eval Suite Says 91% But Users Still Complain
  'c0000001-0000-0000-0000-000000000028', // Multi-Model Strategy
  'c0000001-0000-0000-0000-000000000029', // AI Fairness Audit
  'c0000001-0000-0000-0000-000000000030', // Competitor Announces GPT-5
]

// Agentic
const AG_BEG = [
  'c0000001-0000-0000-0000-000000000031', // Your AI Agent Booked the Wrong Meeting
  'c0000001-0000-0000-0000-000000000032', // Agent Task Completion Rate is 43%
  'c0000001-0000-0000-0000-000000000033', // How Much Autonomy Should Your AI Agent Have?
]
const AG_INT = [
  'c0000001-0000-0000-0000-000000000034', // Agentic Loop is Burning API Tokens
  'c0000001-0000-0000-0000-000000000035', // Multi-Agent System: Debugging Emergent Failures
  'c0000001-0000-0000-0000-000000000036', // AI Coding Agent Introduced a Security Vulnerability
  'c0000001-0000-0000-0000-000000000037', // Measuring Success for an Agentic Feature
  'c0000001-0000-0000-0000-000000000038', // Agent Economy
]
const AG_ADV = [
  'c0000001-0000-0000-0000-000000000039', // Building Trust for a Fully Autonomous Financial Agent
  'c0000001-0000-0000-0000-000000000040', // Agentic System Latency
]

// AI-Native
const AN_BEG = [
  'c0000001-0000-0000-0000-000000000041', // Designing the First Screen of an AI-Native App
  'c0000001-0000-0000-0000-000000000042', // How Do You Know If Your AI-Native Product Is Working?
]
const AN_INT = [
  'c0000001-0000-0000-0000-000000000043', // Context Window as Product Real Estate
  'c0000001-0000-0000-0000-000000000044', // AI-Native App Retention Cliff at Day 7
  'c0000001-0000-0000-0000-000000000045', // When to Trust the AI's Answer
  'c0000001-0000-0000-0000-000000000046', // Pricing an AI-Native Product
  'c0000001-0000-0000-0000-000000000047', // Personalizing an AI-Native Experience
]
const AN_ADV = [
  'c0000001-0000-0000-0000-000000000048', // Defensibility in an AI-Native World
  'c0000001-0000-0000-0000-000000000049', // AI-Native Product at Scale
  'c0000001-0000-0000-0000-000000000050', // The UI Is the AI
]

// ── Study plan definitions ────────────────────────────────────────────────────

const PLANS = [
  {
    plan: {
      title: 'Staff Engineer Path',
      slug: 'staff-engineer-path',
      description: 'A 6-week comprehensive track covering all paradigms at intermediate to advanced level. Built for engineers growing into product influence without switching roles.',
      role_tags: ['SWE', 'EM'],
      challenge_count: 30,
      estimated_hours: 7.5,
      is_published: true,
    },
    chapters: [
      {
        title: 'Week 1 — Product Fundamentals',
        order_index: 0,
        challenge_ids: T_BEG,
      },
      {
        title: 'Week 2 — Metrics & Decision-Making',
        order_index: 1,
        challenge_ids: T_INT.slice(0, 4),
      },
      {
        title: 'Week 3 — Strategy & Stakeholders',
        order_index: 2,
        challenge_ids: [...T_INT.slice(4), ...T_ADV],
      },
      {
        title: 'Week 4 — AI-Assisted Product Decisions',
        order_index: 3,
        challenge_ids: [...AI_BEG.slice(0, 3), ...AI_INT.slice(0, 3)],
      },
      {
        title: 'Week 5 — Agentic Systems',
        order_index: 4,
        challenge_ids: [...AG_BEG, ...AG_INT.slice(0, 2)],
      },
      {
        title: 'Week 6 — AI-Native & Advanced',
        order_index: 5,
        challenge_ids: [...AI_ADV.slice(0, 3), ...AN_ADV],
      },
    ],
  },

  {
    plan: {
      title: '7-Day Interview Prep',
      slug: '7-day-interview-prep',
      description: 'A fast-track 14-challenge gauntlet for engineers facing PM interviews next week. Focuses on traditional product sense, progressively harder each day.',
      role_tags: ['SWE', 'EM', 'Founding Eng', 'ML Eng', 'Data Eng', 'DevOps'],
      challenge_count: 14,
      estimated_hours: 3.5,
      is_published: true,
    },
    chapters: [
      {
        title: 'Days 1–2 — Metrics Fundamentals',
        order_index: 0,
        challenge_ids: T_BEG.slice(0, 3),
      },
      {
        title: 'Days 3–4 — Product Strategy',
        order_index: 1,
        challenge_ids: T_BEG.slice(3),
      },
      {
        title: 'Days 5–6 — Intermediate Cases',
        order_index: 2,
        challenge_ids: T_INT.slice(0, 4),
      },
      {
        title: 'Day 7 — Advanced Interview Simulation',
        order_index: 3,
        challenge_ids: [...T_INT.slice(4, 7), ...T_ADV],
      },
    ],
  },

  {
    plan: {
      title: 'AI Product Fluency',
      slug: 'ai-product-fluency',
      description: 'A 4-week deep dive into AI-Assisted and AI-Native paradigms. For engineers building AI features or AI-first products who want to think like product owners.',
      role_tags: ['SWE', 'ML Eng'],
      challenge_count: 20,
      estimated_hours: 5.0,
      is_published: true,
    },
    chapters: [
      {
        title: 'Week 1 — AI Feature Fundamentals',
        order_index: 0,
        challenge_ids: AI_BEG,
      },
      {
        title: 'Week 2 — LLM Product Decisions',
        order_index: 1,
        challenge_ids: AI_INT,
      },
      {
        title: 'Week 3 — AI-Native Product Design',
        order_index: 2,
        challenge_ids: [...AN_BEG, ...AN_INT.slice(0, 3)],
      },
      {
        title: 'Week 4 — Advanced AI Product Strategy',
        order_index: 3,
        challenge_ids: [...AI_ADV.slice(0, 3), ...AN_ADV.slice(0, 2)],
      },
    ],
  },

  {
    plan: {
      title: 'Data Eng → Product',
      slug: 'data-eng-to-product',
      description: 'A 3-week track for data engineers learning product thinking. Emphasizes metrics, data reasoning, and the transition from analytical to strategic thinking.',
      role_tags: ['Data Eng'],
      challenge_count: 15,
      estimated_hours: 3.75,
      is_published: true,
    },
    chapters: [
      {
        title: 'Week 1 — Metrics That Matter',
        order_index: 0,
        challenge_ids: [T_BEG[0], T_BEG[1], T_INT[0], T_INT[2], T_INT[5]],
      },
      {
        title: 'Week 2 — Data-Driven Decisions',
        order_index: 1,
        challenge_ids: [T_ADV[1], AI_INT[0], AI_INT[2], AI_ADV[0], AI_ADV[1]],
      },
      {
        title: 'Week 3 — ML & AI Product Context',
        order_index: 2,
        challenge_ids: [AI_ADV[2], AI_ADV[3], AN_BEG[1], AG_INT[0], AN_ADV[2]],
      },
    ],
  },

  {
    plan: {
      title: 'EM Product Leadership',
      slug: 'em-product-leadership',
      description: 'A 4-week track for engineering managers learning to own product outcomes. Covers communication, stakeholder management, and strategic tradeoffs.',
      role_tags: ['EM'],
      challenge_count: 16,
      estimated_hours: 4.0,
      is_published: true,
    },
    chapters: [
      {
        title: 'Week 1 — Team & Prioritization',
        order_index: 0,
        challenge_ids: [T_BEG[3], T_BEG[4], T_INT[2], T_INT[3]],
      },
      {
        title: 'Week 2 — Strategy & Competitive',
        order_index: 1,
        challenge_ids: [T_INT[4], T_INT[6], T_INT[7], T_ADV[0]],
      },
      {
        title: 'Week 3 — AI Feature Ownership',
        order_index: 2,
        challenge_ids: [AI_BEG[2], AI_INT[3], AI_INT[5], AI_ADV[4]],
      },
      {
        title: 'Week 4 — Agentic & AI-Native Leadership',
        order_index: 3,
        challenge_ids: [AG_INT[3], AG_INT[4], AN_INT[1], AN_ADV[0]],
      },
    ],
  },

  {
    plan: {
      title: 'Founding Engineer',
      slug: 'founding-engineer',
      description: 'A 2-week crash course for founding engineers who need to act as PM, tech lead, and strategist at the same time. Covers agentic and AI-native challenges.',
      role_tags: ['Founding Eng'],
      challenge_count: 12,
      estimated_hours: 3.0,
      is_published: true,
    },
    chapters: [
      {
        title: 'Week 1 — Build vs. Buy & AI Strategy',
        order_index: 0,
        challenge_ids: [T_BEG[2], T_BEG[4], AI_BEG[4], AI_INT[4], AI_ADV[4], AN_BEG[0]],
      },
      {
        title: 'Week 2 — Agentic Products & Defensibility',
        order_index: 1,
        challenge_ids: [AG_BEG[2], AG_INT[4], AG_ADV[0], AN_INT[2], AN_ADV[0], AN_ADV[1]],
      },
    ],
  },

  {
    plan: {
      title: 'DevOps → Product Impact',
      slug: 'devops-to-product',
      description: 'A 3-week track for DevOps engineers building product intuition. Starts with traditional reliability/ops product challenges, moves into AI-assisted and agentic systems.',
      role_tags: ['DevOps'],
      challenge_count: 12,
      estimated_hours: 3.0,
      is_published: true,
    },
    chapters: [
      {
        title: 'Week 1 — Reliability as Product',
        order_index: 0,
        challenge_ids: [T_BEG[3], T_INT[0], T_INT[2], T_ADV[1]],
      },
      {
        title: 'Week 2 — AI-Assisted Ops Decisions',
        order_index: 1,
        challenge_ids: [AI_BEG[2], AI_INT[1], AI_INT[2], AI_INT[4]],
      },
      {
        title: 'Week 3 — Agentic Systems & Infrastructure',
        order_index: 2,
        challenge_ids: [AG_BEG[1], AG_INT[1], AG_INT[2], AG_ADV[1]],
      },
    ],
  },
]

// ── Seed function ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding study plans...\n')

  for (const { plan, chapters } of PLANS) {
    console.log(`→ ${plan.title}`)

    // Upsert the plan (by slug)
    const { data: existing } = await supabase
      .from('study_plans')
      .select('id')
      .eq('slug', plan.slug)
      .single()

    let planId

    if (existing) {
      const { error } = await supabase
        .from('study_plans')
        .update(plan)
        .eq('id', existing.id)
      if (error) { console.error('  update error:', error.message); continue }
      planId = existing.id
      console.log(`  updated (id: ${planId})`)

      // Delete old chapters before reinserting
      await supabase.from('study_plan_chapters').delete().eq('plan_id', planId)
    } else {
      const { data, error } = await supabase
        .from('study_plans')
        .insert(plan)
        .select('id')
        .single()
      if (error) { console.error('  insert error:', error.message); continue }
      planId = data.id
      console.log(`  inserted (id: ${planId})`)
    }

    // Insert chapters
    const chapterRows = chapters.map(ch => ({
      plan_id: planId,
      title: ch.title,
      order_index: ch.order_index,
      challenge_ids: ch.challenge_ids,
    }))

    const { error: chErr } = await supabase
      .from('study_plan_chapters')
      .insert(chapterRows)

    if (chErr) {
      console.error(`  chapters error: ${chErr.message}`)
    } else {
      console.log(`  ${chapterRows.length} chapters seeded (${chapters.reduce((s, c) => s + c.challenge_ids.length, 0)} challenges total)`)
    }
  }

  console.log('\nVerifying counts...')
  const { count: planCount } = await supabase
    .from('study_plans')
    .select('*', { count: 'exact', head: true })
  const { count: chapCount } = await supabase
    .from('study_plan_chapters')
    .select('*', { count: 'exact', head: true })

  console.log(`\nDone. study_plans: ${planCount}, study_plan_chapters: ${chapCount}`)
}

seed().catch(console.error)
