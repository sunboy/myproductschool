import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { challengeId, mode, response } = await req.json()

  if (!challengeId || !mode || !response?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json({ attemptId: 'mock' })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('challenge_attempts').insert({
    user_id: user.id,
    prompt_id: challengeId,
    mode,
    response_text: response,
    submitted_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })

  return NextResponse.json({ attemptId: data.id })
}
