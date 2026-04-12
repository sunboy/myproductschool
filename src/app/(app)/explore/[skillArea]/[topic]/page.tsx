import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTopicBySlug } from '@/lib/data/topics'
import { getConcepts } from '@/lib/data/concepts'
import { getChallenges } from '@/lib/data/challenges'
import { getDomainBySlug } from '@/lib/data/domains'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface TopicPageProps {
  params: Promise<{ skillArea: string; topic: string }>
}

const DIFFICULTY_ICON: Record<string, string> = {
  beginner: 'signal_cellular_1_bar',
  intermediate: 'signal_cellular_2_bar',
  advanced: 'signal_cellular_4_bar',
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { skillArea, topic: topicSlug } = await params

  const topicData = await getTopicBySlug(topicSlug)
  if (!topicData) notFound()

  // Fetch domain-level concepts and challenges as the topic's content
  const [domain, concepts, challenges] = await Promise.all([
    getDomainBySlug(skillArea),
    getConcepts(topicData.domain_id),
    getChallenges({ domainId: topicData.domain_id }),
  ])

  if (!domain) notFound()

  // Use a subset relevant to this topic (first N, by order_index)
  const topicConcepts = concepts.slice(0, 5)
  const topicChallenges = challenges.slice(0, 3)

  const lumaInsight = `Focus on understanding the core concepts in ${topicData.title} before jumping to challenges. Start with beginner-level items and work up — pattern recognition compounds quickly here.`

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-5 flex-wrap">
        <Link href="/explore" className="hover:text-primary transition-colors">
          Explore
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <Link
          href={`/explore/${skillArea}`}
          className="hover:text-primary transition-colors"
        >
          {domain.title}
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-on-surface font-semibold">{topicData.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary">
            {topicData.icon ?? 'article'}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-headline font-bold text-on-surface">{topicData.title}</h1>
            <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 font-label">
              {topicData.difficulty_range}
            </span>
          </div>
          {topicData.description && (
            <p className="text-sm text-on-surface-variant mt-1">{topicData.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
            <span>{topicConcepts.length} concepts</span>
            <span>&middot;</span>
            <span>{topicChallenges.length} challenges</span>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Left: Concepts list */}
        <div className="lg:col-span-8">
          <h2 className="font-headline font-semibold text-on-surface mb-3">
            Concepts
          </h2>
          <div className="space-y-2">
            {topicConcepts.map((concept, idx) => {
              const isMastered = idx < 1 // placeholder: first item shown as mastered
              const icon = DIFFICULTY_ICON[concept.difficulty] ?? 'signal_cellular_1_bar'
              return (
                <div
                  key={concept.id}
                  className="bg-surface-container rounded-xl p-4 flex items-start gap-3"
                >
                  {/* Mastery icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isMastered ? (
                      <span
                        className="material-symbols-outlined text-primary text-xl"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                      >
                        check_circle
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-outline-variant text-xl">
                        radio_button_unchecked
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-on-surface text-sm">{concept.title}</h3>
                      <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 flex-shrink-0">
                        {concept.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                      {concept.definition}
                    </p>
                  </div>

                  {/* Difficulty signal */}
                  <span className="material-symbols-outlined text-on-surface-variant/50 text-base flex-shrink-0">
                    {icon}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Sidebar cards */}
        <div className="lg:col-span-4 space-y-4">
          {/* Luma's Take */}
          <div className="bg-primary-fixed p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <LumaGlyph size={28} state="reviewing" />
              <h3 className="font-headline font-semibold text-on-surface text-sm">
                Luma&apos;s Take
              </h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{lumaInsight}</p>
          </div>

          {/* Practice Challenges */}
          <div className="bg-surface-container rounded-xl p-4">
            <h3 className="font-headline font-semibold text-on-surface text-sm mb-3">
              Practice Challenges
            </h3>
            {topicChallenges.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No challenges yet.</p>
            ) : (
              <div className="space-y-2">
                {topicChallenges.map(challenge => (
                  <Link
                    key={challenge.id}
                    href={`/workspace/challenges/${challenge.slug ?? challenge.id}`}
                    className="group flex items-center gap-2 py-1.5 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-base group-hover:text-primary">
                      fitness_center
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface truncate">{challenge.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-1.5 py-0.5">
                          {challenge.difficulty}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          ~{challenge.estimated_minutes} min
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant text-sm group-hover:text-primary">
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href={`/challenges?domain=${skillArea}`}
              className="mt-3 block text-xs text-primary font-semibold hover:underline"
            >
              View all challenges →
            </Link>
          </div>

          {/* Flashcard Deck */}
          <div className="bg-surface-container rounded-xl p-4">
            <h3 className="font-headline font-semibold text-on-surface text-sm mb-2">
              Flashcard Deck
            </h3>
            <p className="text-xs text-on-surface-variant mb-3">
              {topicConcepts.length} cards covering all concepts in this topic.
            </p>
            <Link
              href={`/flashcards?domain=${topicData.domain_id}`}
              className="bg-primary text-on-primary rounded-full px-4 py-1.5 text-xs font-label font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">style</span>
              Practice Flashcards
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
