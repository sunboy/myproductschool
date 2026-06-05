import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'
import { APPLICATION_STATUSES } from '@/lib/careerops/types'

const FREE_PIPELINE_CAP = 15

const CreateSchema = z.object({
  company: z.string().trim().max(160).nullish(),
  role_title: z.string().trim().max(200).nullish(),
  jd_url: z.string().trim().max(2000).nullish(),
  jd_text: z.string().max(20000).nullish(),
  status: z.enum(APPLICATION_STATUSES as [string, ...string[]]).optional(),
  fit_score: z.number().nullish(),
  fit_grade: z.string().max(4).nullish(),
  fit_breakdown: z.unknown().optional(),
  next_action: z.string().trim().max(400).nullish(),
  next_action_due: z.string().trim().max(40).nullish(),
  notes: z.string().max(4000).nullish(),
  source: z.string().trim().max(80).nullish(),
})

export async function GET() {
  const gate = assertCareerOpsFeature('tracker')
  if (gate) return gate

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

  const admin = createAdminClient()
  const { data } = await admin
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return NextResponse.json({ applications: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = assertCareerOpsFeature('tracker')
  if (gate) return gate

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

  let body: z.infer<typeof CreateSchema>
  try {
    body = CreateSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const admin = createAdminClient()
  const plan = await getUserPlanForBudget(user.id)

  if (plan !== 'pro') {
    const { count } = await admin
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('status', 'in', '("archived","rejected")')
    if ((count ?? 0) >= FREE_PIPELINE_CAP) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: 'careerops_pipeline',
        used: count ?? 0,
        limit: FREE_PIPELINE_CAP,
      })
    }
  }

  const { data, error } = await admin
    .from('job_applications')
    .insert({ user_id: user.id, ...body })
    .select('*')
    .single()

  if (error) return apiError(500, 'application_create_failed', 'Failed to create application')
  return NextResponse.json({ application: data })
}
