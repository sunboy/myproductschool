import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'

const PatchSchema = z.object({
  title: z.string().trim().max(160).nullish(),
  situation: z.string().max(4000).nullish(),
  task: z.string().max(4000).nullish(),
  action: z.string().max(4000).nullish(),
  result: z.string().max(4000).nullish(),
  reflection: z.string().max(4000).nullish(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  competencies: z.array(z.string().trim().max(40)).max(10).optional(),
})

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = assertCareerOpsFeature('stories')
  if (gate) return gate
  const user = await requireUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')
  const { id } = await params

  let body: z.infer<typeof PatchSchema>
  try {
    body = PatchSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, 'invalid_request', 'Invalid request body', {
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      })
    }
    return apiError(400, 'invalid_json', 'Invalid JSON body')
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('interview_stories')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) return apiError(500, 'story_update_failed', 'Failed to update story')
  return NextResponse.json({ story: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = assertCareerOpsFeature('stories')
  if (gate) return gate
  const user = await requireUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')
  const { id } = await params

  const admin = createAdminClient()
  const { error } = await admin
    .from('interview_stories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return apiError(500, 'story_delete_failed', 'Failed to delete story')
  return NextResponse.json({ ok: true })
}
