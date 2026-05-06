import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { IS_MOCK } from '@/lib/mock'
import { z, ZodError } from 'zod'

const MOCK_SETTINGS = {
  id: 'settings-1',
  user_id: 'mock-user',
  notifications: {
    weekly_summary: true,
    streak_reminder: true,
    new_challenges: false,
    cohort_updates: true,
  },
  daily_goal_count: 3,
  preferred_role: 'SWE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const RequestSchema = z.object({
  notifications: z.record(z.string(), z.boolean()).optional(),
  daily_goal_count: z.number().int().min(1).max(30).optional(),
  preferred_role: z.string().trim().min(1).max(100).nullable().optional(),
  flow_focus: z.string().trim().min(1).max(100).nullable().optional(),
  difficulty: z.string().trim().min(1).max(100).nullable().optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
}).superRefine((body, ctx) => {
  if (Object.keys(body).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: 'At least one settings field is required.',
    })
  }
})

function validationIssues(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function GET() {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_SETTINGS)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return defaults if no settings row yet
  if (!data) {
    return NextResponse.json({
      id: null,
      user_id: user.id,
      notifications: { weekly_summary: true, streak_reminder: true, new_challenges: true, cohort_updates: true },
      daily_goal_count: 3,
      preferred_role: null,
      flow_focus: 'List',
      difficulty: 'Mixed',
      timezone: 'Asia/Kolkata',
      created_at: null,
      updated_at: null,
    })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  if (IS_MOCK) {
    return NextResponse.json(MOCK_SETTINGS)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let updates: z.infer<typeof RequestSchema>
  try {
    updates = RequestSchema.parse(await request.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: validationIssues(error) },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('user_settings')
    .upsert(
      { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
