import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStudyPlanBySlug } from '@/lib/data/study-plans'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { StudyPlanItem } from '@/lib/types'

interface StudyPlanDetailPageProps {
  params: Promise<{ slug: string }>
}

const ITEM_TYPE_ICON: Record<string, string> = {
  challenge: 'fitness_center',
  concept: 'lightbulb',
  article: 'article',
}

const ITEM_TYPE_LABEL: Record<string, string> = {
  challenge: 'Challenge',
  concept: 'Concept',
  article: 'Article',
}

function groupByChapter(items: StudyPlanItem[]): Map<string, StudyPlanItem[]> {
  const chapters = new Map<string, StudyPlanItem[]>()
  for (const item of items) {
    const chapter = item.chapter_title ?? 'Uncategorized'
    if (!chapters.has(chapter)) chapters.set(chapter, [])
    chapters.get(chapter)!.push(item)
  }
  return chapters
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-primary-fixed text-on-surface',
  intermediate: 'bg-tertiary-container text-on-surface',
  advanced: 'bg-secondary-container text-on-secondary-container',
}

export default async function StudyPlanDetailPage({ params }: StudyPlanDetailPageProps) {
  const { slug } = await params
  const plan = await getStudyPlanBySlug(slug)

  if (!plan) notFound()

  const chapters = groupByChapter(plan.items)
  const diff = plan.difficulty ?? 'intermediate'
  const difficultyLabel = diff.charAt(0).toUpperCase() + diff.slice(1)
  const difficultyColor =
    DIFFICULTY_COLORS[diff] ?? 'bg-secondary-container text-on-secondary-container'

  const coachingTip = `This plan is designed for engineers who want to build genuine product intuition. Don't rush — depth beats breadth. Complete each challenge before checking the model answer.`

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-5 flex-wrap">
        <Link href="/explore" className="hover:text-primary transition-colors">
          Explore
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <Link href="/explore/plans" className="hover:text-primary transition-colors">
          Study Plans
        </Link>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="text-on-surface font-semibold">{plan.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl">
            {plan.icon ?? 'school'}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-headline font-bold text-on-surface">{plan.title}</h1>
            <span className={`rounded-full text-xs px-2 py-0.5 font-label font-semibold ${difficultyColor}`}>
              {difficultyLabel}
            </span>
          </div>
          {plan.description && (
            <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{plan.description}</p>
          )}
          {plan.progress_percentage > 0 && (
            <div className="mt-3 flex items-center gap-3 max-w-xs">
              <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${plan.progress_percentage}%` }}
                />
              </div>
              <span className="text-xs text-on-surface-variant flex-shrink-0">
                {plan.completed_count}/{plan.item_count} done
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Left: Collapsible chapters */}
        <div className="lg:col-span-8">
          <h2 className="font-headline font-semibold text-on-surface mb-3">
            Curriculum
          </h2>
          <div className="space-y-2">
            {Array.from(chapters.entries()).map(([chapterTitle, items], chapterIdx) => {
              const completedInChapter = 0 // placeholder until user progress is wired
              return (
                <details
                  key={chapterTitle}
                  className="bg-surface-container rounded-xl overflow-hidden"
                  open={chapterIdx === 0}
                >
                  <summary className="px-4 py-3 flex items-center justify-between cursor-pointer list-none hover:bg-surface-container-high transition-colors select-none">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-on-surface-variant text-base">
                        expand_more
                      </span>
                      <span className="font-semibold text-on-surface text-sm">{chapterTitle}</span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-label">
                      {completedInChapter}/{items.length} done
                    </span>
                  </summary>

                  <div className="divide-y divide-outline-variant/30">
                    {items.map(item => {
                      const typeIcon = ITEM_TYPE_ICON[item.item_type] ?? 'article'
                      const typeLabel = ITEM_TYPE_LABEL[item.item_type] ?? item.item_type
                      const title =
                        item.challenge?.title ?? item.concept?.title ?? 'Untitled'
                      const href =
                        item.item_type === 'challenge' && item.challenge_id
                          ? `/workspace/challenges/${item.challenge_id}`
                          : item.item_type === 'concept' && item.concept_id
                          ? `/vocabulary/${item.concept_id}`
                          : '#'

                      return (
                        <Link
                          key={item.id}
                          href={href}
                          className="h-10 px-4 flex items-center gap-3 hover:bg-surface-container-high transition-colors group"
                        >
                          {/* Status placeholder */}
                          <span className="material-symbols-outlined text-outline-variant text-base flex-shrink-0">
                            radio_button_unchecked
                          </span>

                          {/* Type badge */}
                          <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-2 py-0.5 flex-shrink-0 font-label">
                            {typeLabel}
                          </span>

                          {/* Title */}
                          <span className="text-sm text-on-surface flex-1 truncate group-hover:text-primary transition-colors">
                            {title}
                          </span>

                          {/* Score/status placeholder */}
                          <span className="material-symbols-outlined text-outline-variant text-sm flex-shrink-0 group-hover:text-primary">
                            {typeIcon}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </details>
              )
            })}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Plan Overview */}
          <div className="bg-surface-container rounded-xl p-4">
            <h3 className="font-headline font-semibold text-on-surface text-sm mb-3">
              Plan Overview
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Chapters</span>
                <span className="font-semibold text-on-surface">{plan.chapter_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Total items</span>
                <span className="font-semibold text-on-surface">{plan.item_count}</span>
              </div>
              {plan.estimated_hours != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Est. time</span>
                  <span className="font-semibold text-on-surface">~{plan.estimated_hours} hours</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Difficulty</span>
                <span className={`rounded-full text-xs px-2 py-0.5 font-semibold ${difficultyColor}`}>
                  {difficultyLabel}
                </span>
              </div>
            </div>

            <Link
              href={`/prep/study-plans/${slug}`}
              className="mt-4 block bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold text-center hover:opacity-90 transition-opacity"
            >
              {plan.progress_percentage > 0 ? 'Continue Plan' : 'Start Plan'}
            </Link>
          </div>

          {/* Luma's Coaching */}
          <div className="bg-primary-fixed p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <LumaGlyph size={28} state="speaking" />
              <h3 className="font-headline font-semibold text-on-surface text-sm">
                Luma&apos;s Coaching
              </h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{coachingTip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
