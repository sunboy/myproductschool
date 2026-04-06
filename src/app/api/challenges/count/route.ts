import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Paradigm } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'

const VALID_PARADIGMS: Paradigm[] = ['traditional', 'ai-assisted', 'agentic', 'ai-native']

export async function GET(req: NextRequest) {
  const paradigm = req.nextUrl.searchParams.get('paradigm') as Paradigm | null

  if (IS_MOCK) {
    return NextResponse.json({ count: 42 })
  }

  if (paradigm && !VALID_PARADIGMS.includes(paradigm)) {
    return NextResponse.json({ error: 'Invalid paradigm' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  let query = adminClient
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)

  if (paradigm) {
    query = query.eq('paradigm', paradigm)
  }

  const { count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ count: count ?? 0 })
}
