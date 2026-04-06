import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10')

  const adminClient = createAdminClient()

  const { data: sessions } = await adminClient
    .from('live_interview_sessions')
    .select('id, company_id, role_id, status, started_at, ended_at, duration_seconds, debrief_json, flow_coverage')
    .eq('user_id', user.id)
    .in('status', ['completed', 'abandoned'])
    .order('ended_at', { ascending: false })
    .limit(limit)

  if (!sessions || sessions.length === 0) {
    return Response.json({ sessions: [] })
  }

  // Fetch company names for sessions that have company_id
  const companyIds = [...new Set(sessions.filter((s) => s.company_id).map((s) => s.company_id!))]
  let companyMap = new Map<string, string>()
  if (companyIds.length > 0) {
    const { data: companies } = await adminClient
      .from('company_profiles')
      .select('id, name')
      .in('id', companyIds)
    for (const c of companies ?? []) {
      companyMap.set(c.id, c.name)
    }
  }

  const result = sessions.map((s) => {
    const debrief = s.debrief_json as Record<string, unknown> | null
    const overallScore = typeof debrief?.overallScore === 'number' ? debrief.overallScore : null
    const grade = typeof debrief?.grade === 'string' ? debrief.grade : null

    return {
      id: s.id,
      companyName: s.company_id ? companyMap.get(s.company_id) ?? 'Unknown' : 'General',
      roleId: s.role_id ?? 'PM',
      status: s.status,
      overallScore,
      grade,
      durationSeconds: s.duration_seconds,
      flowCoverage: s.flow_coverage,
      endedAt: s.ended_at,
      startedAt: s.started_at,
    }
  })

  return Response.json({ sessions: result })
}
