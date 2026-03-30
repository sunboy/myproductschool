import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Gather user data
  const [profileRes, attemptsRes, moveLevelsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, email, role, plan, streak_days, xp_total, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('challenge_attempts')
      .select('id, challenge_id, score, submitted_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('user_move_levels')
      .select('move, level, xp, progress_pct')
      .eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileRes.data,
    attempts: attemptsRes.data ?? [],
    move_levels: moveLevelsRes.data ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="hackproduct-data-export.json"',
    },
  })
}
