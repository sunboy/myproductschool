import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDomainBySlug } from '@/lib/data/domains'
import { getTopics } from '@/lib/data/topics'

interface SkillAreaPageProps {
  params: Promise<{ skillArea: string }>
}

export default async function SkillAreaPage({ params }: SkillAreaPageProps) {
  const { skillArea } = await params
  const [domain, topics] = await Promise.all([
    getDomainBySlug(skillArea),
    getDomainBySlug(skillArea).then(d => d ? getTopics(d.id) : []),
  ])

  if (!domain) notFound()

  const progressPct = (domain as { progress_percentage?: number }).progress_percentage ?? 0

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-5">
        <Link href="/explore" className="hover:text-primary transition-colors">
          Explore
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-on-surface font-semibold">{domain.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl">
            {domain.icon ?? 'grid_view'}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-headline font-bold text-on-surface">{domain.title}</h1>
          {domain.description && (
            <p className="text-sm text-on-surface-variant mt-1">{domain.description}</p>
          )}
          {progressPct > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-on-surface-variant">{progressPct}% complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Topics list */}
      <div className="mb-6">
        <h2 className="font-headline font-semibold text-on-surface mb-3">
          Topics <span className="text-on-surface-variant font-normal text-sm">({topics.length})</span>
        </h2>

        <div className="space-y-2">
          {topics.map(topic => (
            <Link
              key={topic.id}
              href={`/explore/${skillArea}/${topic.slug}`}
              className="group bg-surface-container rounded-xl p-4 mb-2 flex items-center gap-3 hover:bg-surface-container-high transition-colors"
            >
              {/* Icon */}
              <div className="w-9 h-9 bg-surface-container-highest rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-base">
                  {topic.icon ?? 'article'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-on-surface text-sm">{topic.title}</h3>
                  <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 flex-shrink-0">
                    {topic.difficulty_range}
                  </span>
                </div>
                {topic.description && (
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">
                    {topic.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                  <span>{topic.concept_count} concepts</span>
                  <span>&middot;</span>
                  <span>{topic.challenge_count} challenges</span>
                </div>
                {topic.progress_percentage > 0 && (
                  <div className="mt-2 h-1 bg-surface-container-highest rounded-full overflow-hidden max-w-[160px]">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${topic.progress_percentage}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Chevron */}
              <span className="material-symbols-outlined text-on-surface-variant text-base flex-shrink-0 group-hover:text-primary transition-colors">
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Start Learning Path banner */}
      <div className="bg-primary-fixed rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-headline font-semibold text-on-surface">
            Start the {domain.title} learning path
          </h3>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Work through all {topics.length} topics with guided challenges and flashcard reviews.
          </p>
        </div>
        <Link
          href={`/explore/${skillArea}/${topics[0]?.slug ?? ''}`}
          className="bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Start Path
        </Link>
      </div>
    </div>
  )
}
