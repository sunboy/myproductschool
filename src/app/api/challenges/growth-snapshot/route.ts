import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'

interface SnapshotEntry {
  excerpt: string
  grade_label: string
  total_score: number
}

export async function GET() {
  // Mock mode — return the same text that was previously hardcoded in the UI
  if (IS_MOCK) {
    return NextResponse.json({
      first: {
        excerpt: 'The main goal is to increase revenue by 10%. We should look at user acquisition and retention metrics to see where we can improve the funnel.',
        grade_label: 'Developing',
        total_score: 25,
      },
      latest: {
        excerpt: 'To frame this problem, we must first isolate the strategic intent: is this a defensibility play or pure growth? By splitting the ecosystem into supply-side liquidity and demand-side friction...',
        grade_label: 'Advanced',
        total_score: 72,
      },
    })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get first and latest completed attempts
  const [{ data: firstAttempts }, { data: latestAttempts }] = await Promise.all([
    admin.from('challenge_attempts')
      .select('id, challenge_id, grade_label, total_score, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true })
      .limit(1),
    admin.from('challenge_attempts')
      .select('id, challenge_id, grade_label, total_score, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1),
  ])

  const first = firstAttempts?.[0]
  const latest = latestAttempts?.[0]

  if (!first) {
    return NextResponse.json({ first: null, latest: null })
  }

  // Get Frame step user_text for each attempt to use as excerpt
  const attemptIds = [first.id, latest?.id].filter(Boolean) as string[]
  const { data: stepData } = await admin
    .from('step_attempts')
    .select('attempt_id, user_text, step')
    .in('attempt_id', attemptIds)
    .eq('step', 'frame')
    .not('user_text', 'is', null)

  const stepMap = new Map((stepData ?? []).map(s => [s.attempt_id, s.user_text as string]))

  const toEntry = (attempt: NonNullable<typeof firstAttempts>[number]): SnapshotEntry => {
    const rawText = stepMap.get(attempt.id) ?? ''
    return {
      excerpt: rawText.slice(0, 200),
      grade_label: (attempt.grade_label as string | null) ?? 'Unknown',
      total_score: (attempt.total_score as number | null) ?? 0,
    }
  }

  const isSameAttempt = first.id === latest?.id

  return NextResponse.json({
    first: toEntry(first),
    latest: !isSameAttempt && latest ? toEntry(latest) : null,
  })
}
