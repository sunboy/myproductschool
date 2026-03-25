import { getDomainBySlug } from '@/lib/data/domains'
import { getConcepts } from '@/lib/data/concepts'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import { LumaInsightBlock } from '@/components/learning/LumaInsightBlock'
import { PMComparisonTable } from '@/components/learning/PMComparisonTable'

export default async function DomainDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const domain = await getDomainBySlug(slug)
  if (!domain) notFound()

  const [concepts, challenges] = await Promise.all([
    getConcepts(domain.id),
    getChallenges({ domainId: domain.id }),
  ])

  return (
    <>
      <main className="max-w-3xl mx-auto px-6 py-10 pb-24">
        {/* Page header */}
        <div className="mb-8">
          <span className="material-symbols-outlined text-primary text-4xl">{domain.icon ?? 'grid_view'}</span>
          <h1 className="font-headline text-4xl text-on-surface mt-2">{domain.title}</h1>
          <p className="text-on-surface-variant mt-3 text-base leading-relaxed">{domain.description}</p>
        </div>

        {/* Luma Insight Block */}
        <LumaInsightBlock
          insight={`${domain.title} is where PM thinking becomes tangible. The strongest engineers in product roles don't just understand the concepts — they apply them instinctively when making tradeoffs.`}
        />

        {/* Key Concepts section */}
        <section className="mb-10">
          <h2 className="font-headline text-xl text-on-surface mb-4">Core Terminology</h2>
          <div className="divide-y divide-outline-variant">
            {concepts.slice(0, 6).map(concept => (
              <div key={concept.id} className="py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-on-surface font-label">{concept.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    concept.difficulty === 'advanced'
                      ? 'bg-error-container text-on-error-container'
                      : concept.difficulty === 'intermediate'
                      ? 'bg-tertiary-container text-on-tertiary-container'
                      : 'bg-primary-fixed text-on-primary-fixed'
                  }`}>{concept.difficulty}</span>
                </div>
                <p className="text-on-surface-variant text-sm">{concept.definition}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PM Mindset Comparison */}
        <section className="mb-10">
          <h2 className="font-headline text-xl text-on-surface mb-2">The PM Mindset Shift</h2>
          <p className="text-on-surface-variant text-sm mb-4">How strong PMs think differently about {domain.title.toLowerCase()}.</p>
          <PMComparisonTable rows={[
            { dimension: 'Problem framing', weak: 'Jumps to solutions immediately', strong: 'Deeply understands the problem space first' },
            { dimension: 'Metrics', weak: 'Tracks vanity metrics', strong: 'Focuses on leading indicators tied to business goals' },
            { dimension: 'Prioritization', weak: 'Builds what stakeholders ask for', strong: 'Prioritizes by impact and strategic fit' },
            { dimension: 'Tradeoffs', weak: 'Avoids hard decisions', strong: 'Makes explicit tradeoffs with clear reasoning' },
          ]} />
        </section>

        {/* Challenges callout */}
        <section className="bg-surface-container rounded-2xl p-6">
          <h2 className="font-headline text-lg text-on-surface mb-2">Practice with challenges</h2>
          <p className="text-on-surface-variant text-sm mb-4">
            {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} available in this domain
          </p>
          <a href={`/challenges?domain=${domain.slug}`} className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-semibold font-label">
            View challenges
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </a>
        </section>
      </main>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur border-t border-outline-variant p-4 flex justify-end md:left-60">
        <button className="flex items-center gap-2 bg-primary text-on-primary rounded-full px-6 py-2.5 font-semibold font-label text-sm">
          Mark complete + Continue
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </>
  )
}
