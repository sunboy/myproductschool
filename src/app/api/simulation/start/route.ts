import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IS_MOCK } from '@/lib/mock'

export async function POST(req: NextRequest) {
  const { companyId } = await req.json()

  if (IS_MOCK) {
    return NextResponse.json({ sessionId: 'mock-session-001' })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('simulation_sessions').insert({
    user_id: user.id,
    company_id: companyId || null,
    transcript_json: [],
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })

  return NextResponse.json({ sessionId: data.id })
}
