import { getDomainBySlug } from '@/lib/data/domains'
import { getConcepts } from '@/lib/data/concepts'
import { getChallenges } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const MOVE_DATA = [
  { label: 'Frame', symbol: '◇' },
  { label: 'Lens', symbol: '◈' },
  { label: 'Optimize', symbol: '◆' },
  { label: 'Win', symbol: '◎' },
] as const

const PARADIGM_LABELS = ['Traditional', 'AI-Assisted', 'Agentic', 'AI-Native'] as const

export default async function DomainDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const domain = await getDomainBySlug(slug)
  if (!domain) notFound()

  const [concepts, challenges] = await Promise.all([
    getConcepts(domain.id),
    getChallenges({ domainId: domain.id }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link href="/explore" className="hover:text-primary transition-colors">Explore</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <Link href="/explore" className="hover:text-primary transition-colors">Paradigms</Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="font-bold text-on-surface">{domain.title}</span>
      </nav>

      {/* Header with Luma tip */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-8">
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">{domain.title}</h1>
          <p className="text-on-surface-variant text-xs leading-relaxed mb-2">{domain.description}</p>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">assignment</span>
              {challenges.length} Challenges
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">menu_book</span>
              {concepts.length} Concepts
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">group</span>
              SWE, Data, EM
            </span>
          </div>
        </div>

        {/* Luma tip card */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-primary-fixed rounded-xl p-3 border border-primary/10">
            <div className="flex items-start gap-2">
              <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface leading-relaxed">
                {domain.title} is where PM thinking becomes tangible. The strongest engineers in product roles don&apos;t just understand the concepts &mdash; they apply them instinctively when making tradeoffs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Challenges grid */}
      <section>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">Active Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {challenges.slice(0, 6).map((challenge, idx) => {
            const moveBadge = MOVE_DATA[idx % MOVE_DATA.length]
            const paradigm = PARADIGM_LABELS[idx % PARADIGM_LABELS.length]
            return (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    paradigm === 'Traditional' ? 'text-primary' :
                    paradigm === 'AI-Assisted' ? 'text-tertiary' :
                    paradigm === 'Agentic' ? 'text-primary-container' :
                    'text-error'
                  }`}>{paradigm}</span>
                  {challenge.is_completed && (
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>check_circle</span>
                  )}
                </div>
                <h3 className="font-label font-bold text-on-surface text-sm mb-1">{challenge.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-2 line-clamp-2">
                  Analyze real product scenarios and articulate your decision framework for {domain.title.toLowerCase()}.
                </p>
                <div className="flex items-center gap-2 flex-wrap text-xs text-on-surface-variant mb-2">
                  <span className={`px-2 py-0.5 rounded-full font-label font-bold uppercase text-[10px] ${
                    challenge.difficulty === 'beginner'
                      ? 'bg-primary-fixed text-primary'
                      : challenge.difficulty === 'intermediate'
                      ? 'bg-tertiary-container text-on-tertiary-container'
                      : 'bg-error-container text-on-error-container'
                  }`}>{challenge.difficulty === 'beginner' ? 'Easy' : challenge.difficulty === 'intermediate' ? 'Medium' : 'Hard'}</span>
                  <span className="flex items-center gap-0.5 text-[11px]">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    ~{challenge.estimated_minutes} min
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label font-semibold text-[10px]">
                    {moveBadge.symbol} {moveBadge.label}
                  </span>
                </div>
                <button className="w-full bg-primary text-on-primary rounded-full py-2 text-xs font-label font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                  Start <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Luma CTA footer */}
      <div className="bg-surface-container rounded-2xl p-4 flex items-center gap-3">
        <LumaGlyph size={40} className="text-primary flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-label font-bold text-on-surface text-sm">Want a personalized path through {domain.title}?</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Luma can recommend the best order based on your current skill level and goals.</p>
        </div>
        <button className="bg-primary text-on-primary rounded-full px-4 py-2 text-xs font-label font-bold whitespace-nowrap hover:opacity-90 transition-opacity flex-shrink-0">
          Ask Luma
        </button>
      </div>
    </div>
  )
}
