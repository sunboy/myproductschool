import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface VoiceViolationRow {
  id: string
  user_id: string | null
  route: string
  model: string
  rule: string
  needle: string
  replacement: string
  context_excerpt: string
  created_at: string
}

interface VoiceViolationGroup {
  rule: string
  route: string
  count: number
  latestAt: string
}

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user : null
}

function groupViolations(rows: VoiceViolationRow[]): VoiceViolationGroup[] {
  const grouped = new Map<string, VoiceViolationGroup>()

  for (const row of rows) {
    const key = `${row.rule}:${row.route}`
    const existing = grouped.get(key)
    if (existing) {
      existing.count += 1
      if (new Date(row.created_at).getTime() > new Date(existing.latestAt).getTime()) {
        existing.latestAt = row.created_at
      }
    } else {
      grouped.set(key, {
        rule: row.rule,
        route: row.route,
        count: 1,
        latestAt: row.created_at,
      })
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return b.latestAt.localeCompare(a.latestAt)
  })
}

export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_voice_violations')
    .select('id, user_id, route, model, rule, needle, replacement, context_excerpt, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const recent = (data ?? []) as VoiceViolationRow[]
  return NextResponse.json({
    groups: groupViolations(recent),
    recent,
  })
}
