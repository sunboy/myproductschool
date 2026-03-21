import { getDomainBySlug } from '@/lib/data/domains'
import { getConcepts } from '@/lib/data/concepts'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function DomainDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const domain = await getDomainBySlug(slug)
  if (!domain) notFound()

  const [concepts, challenges] = await Promise.all([
    getConcepts(domain.id),
    getChallenges({ domainId: domain.id }),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl">{domain.icon ?? 'grid_view'}</span>
        </div>
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">{domain.title}</h1>
          <p className="text-on-surface-variant mt-1">{domain.description}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href={`/challenges?domain=${domain.slug}`} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-sm">fitness_center</span>
          Practice challenges
        </Link>
        <Link href={`/flashcards/${domain.slug}`} className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm">style</span>
          Flashcards
        </Link>
      </div>

      <section>
        <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
          Key Concepts <span className="text-on-surface-variant font-normal text-base ml-1">({concepts.length})</span>
        </h2>
        <div className="space-y-3">
          {concepts.map(concept => (
            <Link key={concept.id} href={`/vocabulary/${concept.id}`} className="flex items-start gap-4 p-4 bg-surface-container rounded-xl border border-outline-variant hover:bg-surface-container-high transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-on-surface">{concept.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${concept.difficulty === 'beginner' ? 'bg-primary-container text-on-primary-container' : concept.difficulty === 'intermediate' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
                    {concept.difficulty}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-2">{concept.definition}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 mt-0.5">chevron_right</span>
            </Link>
          ))}
        </div>
      </section>

      {challenges.length > 0 && (
        <section>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
            Challenges <span className="text-on-surface-variant font-normal text-base ml-1">({challenges.length})</span>
          </h2>
          <div className="space-y-3">
            {challenges.map(challenge => (
              <Link key={challenge.id} href={`/challenges/${challenge.id}`} className="flex items-start gap-4 p-4 bg-surface-container rounded-xl border border-outline-variant hover:bg-surface-container-high transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-on-surface">{challenge.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">{challenge.difficulty}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">~{challenge.estimated_minutes} min</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 mt-0.5">chevron_right</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
