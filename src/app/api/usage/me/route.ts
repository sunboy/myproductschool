import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsageForUser } from '@/lib/usage/check-limit'
import { getEffectiveUserPlan } from '@/lib/billing/entitlements'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { plan } = await getEffectiveUserPlan(admin, user.id)
  const usage = await getUsageForUser(user.id, plan)

  return NextResponse.json(usage)
}
