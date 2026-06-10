import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError } from '@/lib/api/error'
import { assertCareerOpsFeature } from '@/lib/careerops/assert-feature'

const PatchSchema = z.object({
  target_role: z.string().trim().max(160).nullish(),
  seniority: z.string().trim().max(80).nullish(),
  locations: z.array(z.string().trim().max(80)).max(20).optional(),
  key_skills: z.array(z.string().trim().max(60)).max(40).optional(),
  resume_text: z.string().max(20000).nullish(),
  comp_expectation: z.string().trim().max(120).nullish(),
  notes: z.string().max(4000).nullish(),
})

export async function GET() {
  const gate = assertCareerOpsFeature('master')
  if (gate) return gate

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

  const admin = createAdminClient()
  const { data } = await admin
    .from('career_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ profile: data ?? null })
}

export async function PATCH(req: NextRequest) {
  const gate = assertCareerOpsFeature('master')
  if (gate) return gate

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError(401, 'auth_required', 'Unauthorized')

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
    .from('career_profiles')
    .upsert(
      { user_id: user.id, ...body, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single()

  if (error) return apiError(500, 'profile_save_failed', 'Failed to save profile')
  return NextResponse.json({ profile: data })
}
