import Link from 'next/link'
import { StudyPlanWithItems } from '@/lib/types'

interface StudyPlanCardProps {
  plan: StudyPlanWithItems
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-primary-fixed text-on-surface',
  intermediate: 'bg-tertiary-container text-on-surface',
  advanced: 'bg-secondary-container text-on-secondary-container',
}

export function StudyPlanCard({ plan }: StudyPlanCardProps) {
  const diff = plan.difficulty ?? 'intermediate'
  const difficultyLabel = diff.charAt(0).toUpperCase() + diff.slice(1)
  const difficultyColor =
    DIFFICULTY_COLORS[diff] ?? 'bg-secondary-container text-on-secondary-container'
  const hasProgress = plan.progress_percentage > 0
  const ctaLabel = hasProgress ? 'Continue →' : 'Start →'

  return (
    <div className="bg-surface-container rounded-xl overflow-hidden flex flex-col">
      {/* Accent bar */}
      <div className="h-[3px] bg-primary w-full" />

      <div className="p-4 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-base">
              {plan.icon ?? 'school'}
            </span>
          </div>
          <span
            className={`rounded-full text-xs px-2 py-0.5 font-label font-semibold ${difficultyColor}`}
          >
            {difficultyLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-headline font-semibold text-on-surface text-base mt-2 mb-1 leading-snug">
          {plan.title}
        </h3>

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-on-surface-variant line-clamp-2 mb-3 flex-1">
            {plan.description}
          </p>
        )}

        {/* Stats row */}
        <p className="text-xs text-on-surface-variant mb-3">
          {plan.chapter_count} chapters &middot; {plan.item_count} items
          {plan.estimated_hours != null && ` · ~${plan.estimated_hours} hours`}
        </p>

        {/* Progress bar (only if in progress) */}
        {hasProgress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-on-surface-variant mb-1">
              <span>{plan.completed_count} of {plan.item_count} done</span>
              <span>{plan.progress_percentage}%</span>
            </div>
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${plan.progress_percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/explore/plans/${plan.slug}`}
          className="mt-auto bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-label font-semibold text-center hover:opacity-90 transition-opacity"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
