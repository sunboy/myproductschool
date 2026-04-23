import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: attemptId } = await params

  const { data: stepAttempts, error: saError } = await supabase
    .from('step_attempts')
    .select('question_id, step, selected_option_id, quality_label, competency_signal')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })

  if (saError) return NextResponse.json({ error: saError.message }, { status: 500 })
  if (!stepAttempts?.length) return NextResponse.json({ byStep: {} })

  const questionIds = [...new Set(stepAttempts.map(sa => sa.question_id))]

  const { data: questionRows } = await supabase
    .from('step_questions')
    .select('id, question_text, sequence')
    .in('id', questionIds)

  const { data: optionRows } = await supabase
    .from('flow_options')
    .select('id, question_id, option_label, option_text, quality, explanation, framework_hint')
    .in('question_id', questionIds)

  const byStep: Record<string, Array<{
    questionText: string
    selectedOptionId: string | null
    options: Array<{ id: string; option_label: string; option_text: string; quality: string; explanation: string; framework_hint?: string }>
  }>> = {}

  for (const sa of stepAttempts) {
    if (!byStep[sa.step]) byStep[sa.step] = []
    const qRow = questionRows?.find(q => q.id === sa.question_id)
    const opts = (optionRows ?? [])
      .filter(o => o.question_id === sa.question_id)
      .map(o => ({
        id: o.id,
        option_label: o.option_label,
        option_text: o.option_text,
        quality: o.quality,
        explanation: o.explanation,
        framework_hint: o.framework_hint ?? undefined,
      }))
    byStep[sa.step].push({
      questionText: qRow?.question_text ?? '',
      selectedOptionId: sa.selected_option_id,
      options: opts,
    })
  }

  return NextResponse.json({ byStep })
}
