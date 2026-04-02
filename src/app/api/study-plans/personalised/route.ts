import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Mock data ─────────────────────────────────────────────────

const MOCK_PLAN = {
  id: 'mock-plan-001',
  title: '4-Week List Move Bootcamp',
  luma_rationale:
    'Your list move is at Level 1 — the weakest in your FLOW. This plan sequences 4 challenges that drill breakdown thinking, from structured decomposition to user segmentation.',
  move_sequence: [
    {
      week: 1,
      focus_move: 'list',
      challenge_ids: ['c1-notification-fatigue', 'c2-spotify-podcasts'],
      theme: 'Problem decomposition',
    },
    {
      week: 2,
      focus_move: 'list',
      challenge_ids: ['c3-airbnb-trust', 'c4-uber-safety'],
      theme: 'User segmentation',
    },
    {
      week: 3,
      focus_move: 'weigh',
      challenge_ids: ['c5-slack-threads', 'c6-netflix-discovery'],
      theme: 'Trade-off analysis',
    },
    {
      week: 4,
      focus_move: 'sell',
      challenge_ids: ['c7-twitter-retention'],
      theme: 'Stakeholder communication',
    },
  ],
  status: 'active',
}

// ── Route handler ─────────────────────────────────────────────

export async function GET() {
  // ── Mock short-circuit ────────────────────────────────────
  if (IS_MOCK) {
    return NextResponse.json({ plan: MOCK_PLAN })
  }

  // ── Auth ──────────────────────────────────────────────────
  let userId: string
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    userId = user.id
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Fetch active plan ─────────────────────────────────────
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_study_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned — that's fine, return null plan
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ plan: data ?? null })
}
