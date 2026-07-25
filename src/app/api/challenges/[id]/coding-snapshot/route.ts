import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withRoute } from '@/lib/api/withRoute'
import type { RunResult } from '@/lib/coding/types'

// Persists the submitted code + test results on the attempt WITHOUT grading.
// Hatch's review is on demand (coding-submit runs only when the user asks for
// feedback), so without this snapshot an attempt whose feedback was never
// requested would have no final_code — its history entry could not show the
// submitted query. No AI call, no completion, no XP; the attempt stays
// in_progress and coding-submit later overwrites these same fields.

const TestResultSchema = z.object({
  id: z.string().min(1).max(200),
  label: z.string().min(1).max(500),
  status: z.enum(['passed', 'failed', 'error', 'timeout', 'no_solution']),
  hidden: z.boolean(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  expected: z.unknown().optional(),
  actual: z.unknown().optional(),
  matchMode: z.string().max(80).optional(),
  errorMessage: z.string().max(4000).optional(),
  durationMs: z.number().finite().nonnegative().optional(),
})

const RequestSchema = z.object({
  attemptId: z.string().uuid(),
  finalCode: z.string().max(200000),
  language: z.string().trim().min(1).max(40),
  correctnessPayload: z.object({
    runId: z.string().min(1).max(200),
    testsPassed: z.number().int().min(0),
    testsTotal: z.number().int().min(0),
    results: z.array(TestResultSchema).max(1000),
  }),
})

// Mirrors serializeTestResults in coding-submit/route.ts (hidden cases keep
// their expected/actual out of the persisted payload).
function serializeTestResults(correctnessPayload: RunResult) {
  return {
    tests_passed: correctnessPayload.testsPassed,
    tests_total: correctnessPayload.testsTotal,
    results: correctnessPayload.results.map((result) => {
      const base = {
        id: result.id,
        label: result.label,
        status: result.status,
        hidden: result.hidden,
        input: result.hidden ? undefined : result.input,
        matchMode: result.matchMode,
        durationMs: result.durationMs,
      }
      if (result.hidden) return base
      return {
        ...base,
        output: result.output,
        expected: result.expected,
        actual: result.actual,
        errorMessage: result.errorMessage,
      }
    }),
  }
}

export const POST = withRoute(async (
  req: NextRequest,
  _ctx: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
    }
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { attemptId, finalCode, language, correctnessPayload } = body

  const { data: attempt } = await supabase
    .from('challenge_attempts')
    .select('user_id, status')
    .eq('id', attemptId)
    .single()

  if (!attempt || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Completed attempts are graded and final — never overwrite their record.
  if (attempt.status === 'completed') {
    return NextResponse.json({ ok: true, skipped: 'completed' })
  }

  const { error } = await supabase
    .from('challenge_attempts')
    .update({
      final_code: finalCode,
      final_language: language,
      test_results: { ...serializeTestResults(correctnessPayload as RunResult) },
    })
    .eq('id', attemptId)

  if (error) {
    return NextResponse.json({ error: 'snapshot_failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
})
