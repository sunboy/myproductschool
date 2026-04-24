import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the persisted InterviewGrade for a canvas attempt, or 404 if none.
 * Used by the Submissions tab to re-render the grading screen for a past attempt.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: attemptId } = await params

  const { data: attempt } = await supabase
    .from('challenge_attempts')
    .select('user_id')
    .eq('id', attemptId)
    .single()
  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: grade } = await supabase
    .from('interview_grades')
    .select('overall_score, headline, dimensions, top_strength, top_improvement, canvas_annotations')
    .eq('attempt_id', attemptId)
    .order('graded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!grade) return NextResponse.json({ error: 'No grade found' }, { status: 404 })

  return NextResponse.json({ grade })
}
