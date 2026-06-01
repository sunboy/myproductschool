import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { z, ZodError } from 'zod'

const VALID_ROLES = [
  'swe', 'data_eng', 'ml_eng', 'devops', 'em',
  'founding_eng', 'tech_lead', 'pm', 'designer', 'data_scientist',
] as const

const VALID_ROLE_CONTEXTS = ['engineer_pm_interview', 'engineer_on_job', 'both'] as const
const VALID_PRIMARY_GOALS = ['land_pm_adjacent', 'level_up_current', 'ship_better', 'explore'] as const
const VALID_PREP_TIMELINES = ['lt_1mo', '1_3mo', 'gt_3mo', 'no_timeline'] as const

const RequestSchema = z.object({
  role: z.enum(VALID_ROLES),
  role_context: z.enum(VALID_ROLE_CONTEXTS),
  primary_goal: z.enum(VALID_PRIMARY_GOALS),
  prep_timeline: z.enum(VALID_PREP_TIMELINES),
  interview_date: z.string().optional(),
  target_company: z.string().optional(),
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function POST(request: Request) {
  if (IS_MOCK) {
    return NextResponse.json({ success: true })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { role, role_context, primary_goal, prep_timeline, interview_date, target_company } = body

  const adminClient = createAdminClient()

  // Build interview_meta: merge target_company into existing jsonb
  let interview_meta: Record<string, unknown> | undefined
  if (target_company !== undefined) {
    // Fetch existing interview_meta so we don't clobber other keys
    const { data: profileRow } = await adminClient
      .from('profiles')
      .select('interview_meta')
      .eq('id', user.id)
      .single()
    const existing = (profileRow?.interview_meta as Record<string, unknown>) ?? {}
    interview_meta = { ...existing, target_company }
  }

  // One admin-client write with all collected fields.
  // Request body uses `role`; DB column is `preferred_role` (same mapping as role route).
  const updatePayload: Record<string, unknown> = {
    preferred_role: role,
    role_context,
    primary_goal,
    prep_timeline,
    updated_at: new Date().toISOString(),
  }
  if (interview_date !== undefined) updatePayload.interview_date = interview_date
  if (interview_meta !== undefined) updatePayload.interview_meta = interview_meta

  const { error } = await adminClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
