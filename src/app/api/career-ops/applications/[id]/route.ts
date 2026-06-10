import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'
import { APPLICATION_STATUSES } from '@/lib/careerops/types'

const PatchSchema = z.object({
  company: z.string().trim().max(160).nullish(),
  role_title: z.string().trim().max(200).nullish(),
  status: z.enum(APPLICATION_STATUSES as [string, ...string[]]).optional(),
  next_action: z.string().trim().max(400).nullish(),
  next_action_due: z.string().trim().max(40).nullish(),
  notes: z.string().max(4000).nullish(),
  sort_order: z.number().int().optional(),
})

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = assertCareerOpsFeature('tracker')
  if (gate) return gate
  const user = await requireUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')
  const { id } = await params

  const admin = createAdminClient()
  const { data } = await admin
    .from('job_applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return apiError(404, 'not_found', 'Application not found')
  return NextResponse.json({ application: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = assertCareerOpsFeature('tracker')
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
    .from('job_applications')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) return apiError(500, 'application_update_failed', 'Failed to update application')
  return NextResponse.json({ application: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = assertCareerOpsFeature('tracker')
  if (gate) return gate
  const user = await requireUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')
  const { id } = await params

  const admin = createAdminClient()
  const { error } = await admin
    .from('job_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return apiError(500, 'application_delete_failed', 'Failed to delete application')
  return NextResponse.json({ ok: true })
}
