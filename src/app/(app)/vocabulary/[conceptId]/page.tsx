import { getConceptById } from '@/lib/data/concepts'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MOCK_DOMAINS } from '@/lib/mock-data'

export default async function ConceptDetailPage({ params }: { params: Promise<{ conceptId: string }> }) {
  const { conceptId } = await params
  const concept = await getConceptById(conceptId)
  if (!concept) notFound()

  const domain = MOCK_DOMAINS.find(d => d.id === concept.domain_id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link href="/vocabulary" className="hover:text-primary transition-colors">Vocabulary</Link>
        <span>/</span>
        {domain && <Link href={`/domains/${domain.slug}`} className="hover:text-primary transition-colors">{domain.title}</Link>}
        <span>/</span>
        <span className="text-on-surface">{concept.title}</span>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h1 className="font-headline text-3xl font-bold text-on-surface">{concept.title}</h1>
          <span className={`text-sm px-3 py-1 rounded-full ${
            concept.difficulty === 'beginner' ? 'bg-primary-container text-on-primary-container' :
            concept.difficulty === 'intermediate' ? 'bg-tertiary-container text-on-tertiary-container' :
            'bg-error-container text-on-error-container'
          }`}>{concept.difficulty}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {concept.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 bg-surface-container text-on-surface-variant rounded-lg">#{tag}</span>
          ))}
        </div>
      </div>

      {/* Definition */}
      <div className="p-5 bg-surface-container rounded-2xl">
        <div className="flex items-center gap-2 mb-2 text-primary">
          <span className="material-symbols-outlined text-base">menu_book</span>
          <span className="text-sm font-semibold uppercase tracking-wide">Definition</span>
        </div>
        <p className="text-on-surface leading-relaxed">{concept.definition}</p>
      </div>

      {/* Example */}
      {concept.example && (
        <div className="p-5 bg-secondary-container rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-secondary">
            <span className="material-symbols-outlined text-base">lightbulb</span>
            <span className="text-sm font-semibold uppercase tracking-wide">Real Example</span>
          </div>
          <p className="text-on-secondary-container leading-relaxed">{concept.example}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href={`/flashcards/${domain?.slug ?? ''}`}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">style</span>
          Practice with flashcards
        </Link>
        {domain && (
          <Link
            href={`/challenges?domain=${domain.slug}`}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-sm">fitness_center</span>
            Try a challenge
          </Link>
        )}
      </div>
    </div>
  )
}
