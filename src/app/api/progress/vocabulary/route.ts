import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IS_MOCK } from '@/lib/mock'

export async function GET(request: Request) {
  if (IS_MOCK) {
    const { MOCK_FLASHCARDS, MOCK_CONCEPTS } = await import('@/lib/mock-data')
    const { searchParams } = new URL(request.url)
    const domainSlug = searchParams.get('domainSlug')
    const cards = MOCK_FLASHCARDS.map(f => {
      const concept = MOCK_CONCEPTS.find(c => c.id === f.concept_id)
      return { ...f, concept_id: f.concept_id, domain_slug: domainSlug, concept_title: concept?.title, definition: concept?.definition, progress: null }
    })
    return NextResponse.json({ cards, total_due: 0, total_new: cards.length })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const domainSlug = searchParams.get('domainSlug')

  const adminClient = createAdminClient()

  // Base concepts query
  let conceptsQuery = adminClient
    .from('concepts')
    .select('*, domains!inner(slug), flashcards(id, front, back, hint)')
    .eq('is_published', true)

  if (domainSlug) {
    conceptsQuery = conceptsQuery.eq('domains.slug', domainSlug)
  }

  const { data: concepts, error: conceptsError } = await conceptsQuery
  if (conceptsError) return NextResponse.json({ error: conceptsError.message }, { status: 500 })

  // Get user progress for these concepts
  const conceptIds = (concepts ?? []).map(c => c.id)
  const { data: progress } = await adminClient
    .from('vocabulary_progress')
    .select('concept_id, confidence, next_review_at, review_count')
    .eq('user_id', user.id)
    .in('concept_id', conceptIds)

  const progressMap = new Map((progress ?? []).map(p => [p.concept_id, p]))
  const now = new Date()

  // Classify cards
  const dueCards = []
  const newCards = []

  for (const concept of concepts ?? []) {
    const p = progressMap.get(concept.id)
    if (!p) {
      newCards.push({ ...concept, progress: null })
    } else if (new Date(p.next_review_at) <= now) {
      dueCards.push({ ...concept, progress: p })
    }
  }

  // Order: overdue first, then new, limit 20
  const cards = [...dueCards, ...newCards].slice(0, 20)

  return NextResponse.json({
    cards,
    total_due: dueCards.length,
    total_new: newCards.length,
  })
}

export async function POST(req: NextRequest) {
  const { conceptId, confidence } = await req.json()

  if (!conceptId || typeof confidence !== 'number' || confidence < 1 || confidence > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  if (IS_MOCK) {
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
