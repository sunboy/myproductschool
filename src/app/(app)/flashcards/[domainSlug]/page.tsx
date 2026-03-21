import { getDomainBySlug } from '@/lib/data/domains'
import { getFlashcardsForDomain, getConcepts } from '@/lib/data/concepts'
import { notFound } from 'next/navigation'
import { FlashcardSession } from '@/components/learning/FlashcardSession'

export default async function FlashcardDeckPage({ params }: { params: Promise<{ domainSlug: string }> }) {
  const { domainSlug } = await params
  const domain = await getDomainBySlug(domainSlug)
  if (!domain) notFound()

  const [flashcards, concepts] = await Promise.all([
    getFlashcardsForDomain(domain.id),
    getConcepts(domain.id),
  ])

  // Build a concept lookup map
  const conceptMap = Object.fromEntries(concepts.map(c => [c.id, c]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <FlashcardSession
        domain={domain}
        flashcards={flashcards}
        conceptMap={conceptMap}
      />
    </div>
  )
}
