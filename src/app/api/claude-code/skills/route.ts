// GET /api/claude-code/skills
//
// Lists the .claude/skills the signed-in user has accumulated across sessions,
// read from their persisted ~/.claude state tarball (cc-user-state, pointer in
// profiles.cc_claude_state_uri). Powers the in-session Skills Library panel so a
// learner can browse and reload skills they've built — the compounding promise.
//
// Gated independently by getAnalyticsAccess (defense in depth: the analytics
// medium only mounts for entitled users, but the API must enforce too). Returns
// full skill content so the client can recreate the file in a session without a
// second round-trip; skills are small.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAnalyticsAccess } from '@/lib/flags/analytics'
import { listUserSkills } from '@/lib/coding-grading/workspace-inspector'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const access = await getAnalyticsAccess(admin, user.id)
  if (!access.hasAccess) {
    return NextResponse.json({ error: 'Analytics access required' }, { status: 403 })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('cc_claude_state_uri')
    .eq('id', user.id)
    .maybeSingle()

  const uri = (profile?.cc_claude_state_uri as string | null) ?? null
  const skills = await listUserSkills(uri)

  return NextResponse.json({ skills })
}
