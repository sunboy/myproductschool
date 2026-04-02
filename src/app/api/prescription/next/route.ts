import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FAILURE_PATTERNS } from '@/lib/luma/system-prompt'
import type { Prescription, PatternSummary } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

// Pattern-to-mode mapping (prescribed_mode from FAILURE_PATTERNS)
// diagnose → spotlight, debate → workshop
const PATTERN_TO_MODE: Record<string, string> = Object.fromEntries(
  FAILURE_PATTERNS.map(p => [p.id, p.prescribed_mode])
)

// Mock prescription for USE_MOCK_DATA mode
const MOCK_PRESCRIPTION: Prescription = {
  type: 'prescription',
  primary_pattern: {
    pattern_id: 'FP-09',
    pattern_name: 'Unprioritized Investigation',
    occurrence_count: 4,
    last_seen: new Date().toISOString(),
  },
  prescription: {
    mode: 'live',
    challenge_slug: 'c1000000-0000-0000-0000-000000000001',
    challenge_title: 'Improve Retention for a B2C App',
    reason: 'Your last 4 submissions listed investigations without ordering them. Live mode forces you to prioritize in real time.',
  },
  secondary_patterns: [
    { pattern_id: 'FP-04', pattern_name: 'Metric Recitation', occurrence_count: 2 },
  ],
  confidence_calibration: {
    avg_mismatch: 1.3,
    tendency: 'overconfident',
    detail: 'You rate yourself 1.3 points higher than your scores on average.',
  },
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')

  // Mock mode
  if (IS_MOCK || !userId || userId === 'mock') {
    return NextResponse.json(MOCK_PRESCRIPTION)
  }

  try {
    const supabaseAdmin = createAdminClient()

    // Get total submission count for this user
    const { count: submissionCount } = await supabaseAdmin
      .from('challenge_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('submitted_at', 'is', null)

    // Fallback: not enough submissions
    if (!submissionCount || submissionCount < 2) {
      return NextResponse.json({
        type: 'onboarding',
        message: 'Complete more challenges to unlock your personalized diagnosis.',
      } satisfies Prescription)
    }

    // Get pattern summary
    const { data: patterns } = await supabaseAdmin
      .from('user_pattern_summary')
      .select('*')
      .eq('user_id', userId)
      .order('occurrence_count', { ascending: false })
      .limit(10)

    const recurringPatterns = ((patterns ?? []) as PatternSummary[]).filter(p => p.occurrence_count >= 2)

    // Fallback: no recurring patterns
    if (recurringPatterns.length === 0) {
      // Find least-used mode
      const { data: attempts } = await supabaseAdmin
        .from('challenge_attempts')
        .select('mode')
        .eq('user_id', userId)

      const modeCounts: Record<string, number> = { spotlight: 0, workshop: 0, live: 0, solo: 0 }
      for (const a of attempts ?? []) {
        if (a.mode in modeCounts) modeCounts[a.mode]++
      }
      const leastUsedMode = Object.entries(modeCounts).sort((a, b) => a[1] - b[1])[0][0]

      return NextResponse.json({
        type: 'explore',
        message: `No recurring patterns yet — try a ${leastUsedMode} session to diversify your practice.`,
        prescription: {
          mode: leastUsedMode,
          challenge_slug: '',
          challenge_title: 'Any challenge',
          reason: 'Exploring different modes builds versatility.',
        },
      } satisfies Prescription)
    }

    // Build prescription from top pattern
    const topPattern = recurringPatterns[0]
    const prescribedMode = PATTERN_TO_MODE[topPattern.pattern_id] ?? 'live'

    // Get next uncompleted challenge
    const { data: completedAttempts } = await supabaseAdmin
      .from('challenge_attempts')
      .select('prompt_id')
      .eq('user_id', userId)
      .not('submitted_at', 'is', null)

    const completedIds = (completedAttempts ?? []).map((a: { prompt_id: string }) => a.prompt_id)

    const { data: nextChallenge } = await supabaseAdmin
      .from('challenge_prompts')
      .select('id, title, tags')
      .eq('is_published', true)
      .not('id', 'in', completedIds.length > 0 ? `(${completedIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
      .limit(1)
      .single()

    return NextResponse.json({
      type: 'prescription',
      primary_pattern: {
        pattern_id: topPattern.pattern_id,
        pattern_name: topPattern.pattern_name,
        occurrence_count: topPattern.occurrence_count,
        last_seen: topPattern.last_seen,
      },
      prescription: {
        mode: prescribedMode,
        challenge_slug: nextChallenge?.id ?? '',
        challenge_title: nextChallenge?.title ?? 'Next challenge',
        reason: `Your last ${topPattern.occurrence_count} submissions show "${topPattern.pattern_name}". ${prescribedMode === 'live' ? 'Live mode forces real-time prioritization with Luma coaching.' : 'Solo mode gives you space to practice without pressure.'}`,
      },
      secondary_patterns: recurringPatterns.slice(1, 3).map(p => ({
        pattern_id: p.pattern_id,
        pattern_name: p.pattern_name,
        occurrence_count: p.occurrence_count,
      })),
    } satisfies Prescription)

  } catch (error) {
    console.error('Prescription engine error:', error)
    return NextResponse.json(MOCK_PRESCRIPTION)
  }
}
