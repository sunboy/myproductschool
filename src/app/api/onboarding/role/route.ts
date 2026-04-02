import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { UserRoleV2 } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const VALID_ROLES: UserRoleV2[] = ['swe', 'data_eng', 'ml_eng', 'devops', 'em', 'founding_eng', 'tech_lead', 'pm', 'designer', 'data_scientist']

export async function POST(request: Request) {
  if (IS_MOCK) {
    return NextResponse.json({ success: true })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { role } = body as { role: UserRoleV2 }

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ preferred_role: role, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
