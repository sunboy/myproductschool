import { getAllConcepts } from '@/lib/data/concepts'
import { getDomains } from '@/lib/data/domains'
import Link from 'next/link'

export default async function VocabularyPage() {
  const [concepts, domains] = await Promise.all([getAllConcepts(), getDomains()])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold text-on-surface">Vocabulary</h1>
        <p className="text-on-surface-variant mt-1">Master the language of product thinking.</p>
      </div>

      {/* Group by domain */}
      {domains.map(domain => {
        const domainConcepts = concepts.filter(c => c.domain_id === domain.id)
        if (!domainConcepts.length) return null
        return (
          <div key={domain.id} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">{domain.icon ?? 'grid_view'}</span>
              <h2 className="font-headline text-lg font-bold text-on-surface">{domain.title}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {domainConcepts.map(concept => (
                <Link
                  key={concept.id}
                  href={`/vocabulary/${concept.id}`}
                  className="p-4 bg-surface-container rounded-xl border border-outline-variant hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-on-surface">{concept.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      concept.difficulty === 'beginner' ? 'bg-primary-container text-on-primary-container' :
                      concept.difficulty === 'intermediate' ? 'bg-tertiary-container text-on-tertiary-container' :
                      'bg-error-container text-on-error-container'
                    }`}>{concept.difficulty}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{concept.definition}</p>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
