import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { getUserPlanForBudget } from '@/lib/usage/ai-budget'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'

const FREE_STORY_CAP = 8
const STORY_XP = 15

const CreateSchema = z.object({
  title: z.string().trim().max(160).nullish(),
  situation: z.string().max(4000).nullish(),
  task: z.string().max(4000).nullish(),
  action: z.string().max(4000).nullish(),
  result: z.string().max(4000).nullish(),
  reflection: z.string().max(4000).nullish(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  competencies: z.array(z.string().trim().max(40)).max(10).optional(),
})

export async function GET() {
  const gate = assertCareerOpsFeature('stories')
  if (gate) return gate

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

  const admin = createAdminClient()
  const { data } = await admin
    .from('interview_stories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ stories: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = assertCareerOpsFeature('stories')
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
      .from('interview_stories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= FREE_STORY_CAP) {
      return apiError(402, 'limit_reached', 'limit_reached', {
        feature: 'careerops_stories', used: count ?? 0, limit: FREE_STORY_CAP,
      })
    }
  }

  const { data, error } = await admin
    .from('interview_stories')
    .insert({ user_id: user.id, ...body })
    .select('*')
    .single()

  if (error) return apiError(500, 'story_create_failed', 'Failed to create story')

  // Award XP for banking a story.
  const { data: prof } = await admin.from('profiles').select('xp_total').eq('id', user.id).single()
  if (prof) {
    await admin.from('profiles').update({ xp_total: (prof.xp_total ?? 0) + STORY_XP }).eq('id', user.id)
  }

  return NextResponse.json({ story: data, xp_earned: STORY_XP })
}
