import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { conceptId, confidence } = await req.json()

  if (!conceptId || typeof confidence !== 'number' || confidence < 1 || confidence > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  if (process.env.USE_MOCK_DATA === 'true') {
    return NextResponse.json({ success: true })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const intervals = [0, 1, 3, 7, 14, 30]
  const daysUntilReview = intervals[confidence] ?? 30
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + daysUntilReview)

  await supabase.from('vocabulary_progress').upsert({
    user_id: user.id,
    concept_id: conceptId,
    confidence,
    next_review_at: nextReview.toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,concept_id' })

  return NextResponse.json({ success: true })
}
