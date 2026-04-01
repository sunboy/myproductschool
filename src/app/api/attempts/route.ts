import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5'), 20)

  const admin = createAdminClient()
  const { data } = await admin
    .from('challenge_attempts_v2')
    .select('id, challenge_id, grade_label, total_score, completed_at, challenges(title)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attempts = (data ?? []).map((row: any) => ({
    challenge_id: row.challenge_id as string,
    challenge_title: (Array.isArray(row.challenges) ? row.challenges[0]?.title : row.challenges?.title) ?? row.challenge_id,
    grade_label: row.grade_label as string | null,
    score: row.total_score as number | null,
    submitted_at: row.completed_at as string | null,
  }))

  return NextResponse.json(attempts)
}
