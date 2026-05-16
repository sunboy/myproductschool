import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'
import {
  DISCIPLINE_META,
  challengeTypeToDiscipline,
  normalizeDiscipline,
  type LiveInterviewDiscipline,
} from '@/lib/live-interview/disciplines'

function humanizeValue(value: string | null | undefined, fallback: string) {
  if (!value || value.toLowerCase() === 'unknown') return fallback
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatRoleValue(value: string | null | undefined) {
  if (!value || value.toLowerCase() === 'unknown') return 'PM'
  const normalized = value.toLowerCase().replace(/[-\s]+/g, '_')
  const labels: Record<string, string> = {
    pm: 'PM',
    swe: 'SWE',
    tpm: 'TPM',
    em: 'EM',
    ml_engineer: 'ML Engineer',
    data_engineer: 'Data Engineer',
    product_manager: 'Product Manager',
  }
  return labels[normalized] ?? humanizeValue(value, 'PM')
}

function readSnapshotString(snapshot: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = snapshot?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10')

  const adminClient = createAdminClient()

  const { data: sessions } = await adminClient
    .from('live_interview_sessions')
    .select('id, company_id, role_id, challenge_id, status, started_at, ended_at, duration_seconds, debrief_json, flow_coverage, calibration_snapshot')
    .eq('user_id', user.id)
    .in('status', ['completed', 'abandoned'])
    .order('ended_at', { ascending: false })
    .limit(limit)

  if (!sessions || sessions.length === 0) {
    return Response.json({ sessions: [] })
  }

  // live_interview_sessions.company_id stores company_profiles.slug, not id.
  const companyIds = [...new Set(sessions.filter((s) => s.company_id).map((s) => s.company_id!))]
  const companyMap = new Map<string, string>()
  if (companyIds.length > 0) {
    const { data: companies } = await adminClient
      .from('company_profiles')
      .select('slug, name')
      .in('slug', companyIds)
    for (const c of companies ?? []) {
      companyMap.set(c.slug, c.name)
    }
  }

  const challengeIds = [...new Set(sessions.filter((s) => s.challenge_id).map((s) => s.challenge_id!))]
  const challengeMap = new Map<string, { title: string | null; discipline: LiveInterviewDiscipline | null }>()
  if (challengeIds.length > 0) {
    const { data: challenges } = await adminClient
      .from('challenges')
      .select('id, title, challenge_type')
      .in('id', challengeIds)
    for (const challenge of challenges ?? []) {
      challengeMap.set(challenge.id, {
        title: challenge.title ?? null,
        discipline: challengeTypeToDiscipline(challenge.challenge_type),
      })
    }
  }

  const result = sessions.map((s) => {
    const debrief = s.debrief_json as Record<string, unknown> | null
    const overallScore = typeof debrief?.overallScore === 'number' ? debrief.overallScore : null
    const grade = typeof debrief?.grade === 'string' ? debrief.grade : null
    const snapshot = (s.calibration_snapshot && typeof s.calibration_snapshot === 'object')
      ? s.calibration_snapshot as Record<string, unknown>
      : null
    const challenge = s.challenge_id ? challengeMap.get(s.challenge_id) : null
    const snapshotDiscipline = normalizeDiscipline(readSnapshotString(snapshot, ['effectiveDiscipline', 'discipline']))
    const discipline = challenge?.discipline ?? snapshotDiscipline
    const snapshotCompany = readSnapshotString(snapshot, ['companyName', 'target_company'])
    const snapshotTitle = readSnapshotString(snapshot, ['scenarioTitle'])

    return {
      id: s.id,
      companyName: snapshotCompany ?? (s.company_id ? companyMap.get(s.company_id) ?? humanizeValue(s.company_id, 'General') : 'General'),
      roleId: formatRoleValue(s.role_id),
      challengeId: s.challenge_id ?? null,
      scenarioTitle: challenge?.title ?? snapshotTitle,
      discipline,
      disciplineLabel: discipline ? DISCIPLINE_META[discipline].label : null,
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
