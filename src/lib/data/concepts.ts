import { Concept, Flashcard } from '@/lib/types'
import { MOCK_CONCEPTS, MOCK_FLASHCARDS } from '@/lib/mock-data'

export async function getConcepts(domainId: string): Promise<Concept[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return MOCK_CONCEPTS.filter(c => c.domain_id === domainId)
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('concepts').select('*').eq('domain_id', domainId).order('order_index')
  return data ?? []
}

export async function getConceptById(id: string): Promise<Concept | null> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return MOCK_CONCEPTS.find(c => c.id === id) ?? null
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('concepts').select('*').eq('id', id).single()
  return data
}

export async function getAllConcepts(): Promise<Concept[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return MOCK_CONCEPTS
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('concepts').select('*').order('domain_id').order('order_index')
  return data ?? []
}

export async function getFlashcards(conceptId: string): Promise<Flashcard[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return MOCK_FLASHCARDS.filter(f => f.concept_id === conceptId)
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.from('flashcards').select('*').eq('concept_id', conceptId)
  return data ?? []
}

export async function getFlashcardsForDomain(domainId: string): Promise<Flashcard[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    const conceptIds = MOCK_CONCEPTS.filter(c => c.domain_id === domainId).map(c => c.id)
    return MOCK_FLASHCARDS.filter(f => conceptIds.includes(f.concept_id))
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase
    .from('flashcards')
    .select('*, concepts!inner(domain_id)')
    .eq('concepts.domain_id', domainId)
  return data ?? []
}
