// GET /api/adaptive/guidance
//
// The coaching register for the current user (adaptation contract). Mediums
// whose data loaders don't have a natural place to carry it (coding, canvas,
// live interviews) fetch it here once per attempt. Medium history = completed
// challenge attempts. Always answers; failure degrades to 'guided'.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadGuidanceInputs, deriveGuidanceLevel } from '@/lib/adaptive/guidance'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const admin = createAdminClient()
    const inputs = await loadGuidanceInputs(admin, user.id)
    const { count: completedAttempts } = await admin
      .from('challenge_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
    const guidance = deriveGuidanceLevel({ ...inputs, priorCcSessions: completedAttempts ?? 0 })
    return NextResponse.json({ guidance })
  } catch {
    return NextResponse.json({ guidance: 'guided' })
  }
}
