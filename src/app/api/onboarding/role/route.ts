import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { UserRoleV2 } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'
import { z, ZodError } from 'zod'

const VALID_ROLES = ['swe', 'data_eng', 'ml_eng', 'devops', 'em', 'founding_eng', 'tech_lead', 'pm', 'designer', 'data_scientist'] as const

const RequestSchema = z.object({
  role: z.enum(VALID_ROLES),
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
  const role: UserRoleV2 = body.role

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ preferred_role: role, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
