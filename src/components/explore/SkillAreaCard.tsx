import Link from 'next/link'
import { DomainWithProgress } from '@/lib/types'

interface SkillAreaCardProps {
  domain: DomainWithProgress
}

export function SkillAreaCard({ domain }: SkillAreaCardProps) {
  return (
    <Link
      href={`/explore/${domain.slug}`}
      className="group bg-surface-container rounded-xl p-4 flex items-center gap-3 hover:bg-surface-container-high transition-colors"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-lg">
          {domain.icon ?? 'grid_view'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-on-surface text-sm truncate">{domain.title}</h3>
          <span className="material-symbols-outlined text-on-surface-variant text-base flex-shrink-0 group-hover:text-primary transition-colors">
            chevron_right
          </span>
        </div>

        {/* Description — single line */}
        {domain.description && (
          <p className="text-sm text-on-surface-variant truncate mt-0.5">{domain.description}</p>
        )}

        {/* Counts */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">lightbulb</span>
            {domain.concept_count} topics
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">fitness_center</span>
            {domain.challenge_count} challenges
          </span>
        </div>

        {/* Progress bar */}
        {domain.progress_percentage > 0 && (
          <div className="mt-2 h-1 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${domain.progress_percentage}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  )
}
