import { VocabularyProgress } from '@/lib/types'

export async function getVocabularyProgress(userId: string): Promise<VocabularyProgress[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return []
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('vocabulary_progress').select('*').eq('user_id', userId)
  return data ?? []
}

export async function upsertVocabularyProgress(
  userId: string,
  conceptId: string,
  confidence: number
): Promise<void> {
  if (process.env.USE_MOCK_DATA === 'true') return

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // SM-2 spaced repetition: calculate next_review_at based on confidence
  const intervals = [0, 1, 3, 7, 14, 30] // days for confidence 0-5
  const daysUntilReview = intervals[confidence] ?? 30
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + daysUntilReview)

  await supabase.from('vocabulary_progress').upsert({
    user_id: userId,
    concept_id: conceptId,
    confidence,
    next_review_at: nextReview.toISOString(),
    review_count: 1,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,concept_id' })
}

export async function getDueFlashcards(userId: string, domainId?: string) {
  if (process.env.USE_MOCK_DATA === 'true') {
    const { MOCK_FLASHCARDS, MOCK_CONCEPTS } = await import('@/lib/mock-data')
    const concepts = domainId ? MOCK_CONCEPTS.filter(c => c.domain_id === domainId) : MOCK_CONCEPTS
    const conceptIds = concepts.map(c => c.id)
    return MOCK_FLASHCARDS.filter(f => conceptIds.includes(f.concept_id))
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  // ... real implementation
  return []
}
