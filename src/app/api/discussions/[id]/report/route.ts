import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const RequestSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError(401, 'auth_required', 'Unauthorized')

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: validationIssues(error),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const admin = createAdminClient()
  const { data: discussion, error: discussionError } = await admin
    .from('challenge_discussions')
    .select('id, hidden_at')
    .eq('id', id)
    .maybeSingle()

  if (discussionError) return apiError(500, 'discussion_lookup_failed', 'Failed to load discussion')
  if (!discussion || discussion.hidden_at) return apiError(404, 'discussion_not_found', 'Discussion not found')

  const { data, error } = await admin
    .from('discussion_reports')
    .insert({
      discussion_id: id,
      reporter_id: user.id,
      reason: body.reason.trim(),
    })
    .select('id, status, created_at')
    .single()

  if (error) return apiError(500, 'discussion_report_failed', 'Failed to report discussion')

  return NextResponse.json(data, { status: 201 })
}
