import Link from 'next/link'
import type { ChallengeWithDomain } from '@/lib/types'

function getParticipantCount(index: number): number {
  const counts = [312, 487, 198, 563, 241, 89, 410, 175]
  return counts[index % counts.length]
}

interface ChallengeCardProps {
  challenge: ChallengeWithDomain
  participantCount?: number
  locked?: boolean
  index?: number
}

export function ChallengeCard({
  challenge,
  participantCount,
  locked = false,
  index = 0,
}: ChallengeCardProps) {
  const count = participantCount ?? getParticipantCount(index)
  const CardWrapper = locked ? 'div' : Link
  const cardProps = locked
    ? { className: 'relative flex items-start gap-4 p-4 bg-surface-container rounded-2xl border border-outline-variant opacity-75 cursor-default' }
    : {
        href: `/challenges/${challenge.id}`,
        className: 'relative flex items-start gap-4 p-4 bg-surface-container rounded-2xl border border-outline-variant hover:bg-surface-container-high hover:border-primary/30 transition-all',
      }

  const statusIcon =
    challenge.is_completed
      ? { icon: 'check_circle', colorClass: 'text-primary' }
      : challenge.attempt_count > 0
        ? { icon: 'incomplete_circle', colorClass: 'text-tertiary' }
        : { icon: 'circle', colorClass: 'text-on-surface-variant/40' }

  const tags: string[] = Array.isArray(challenge.tags) ? (challenge.tags as string[]) : []

  return (
    // @ts-expect-error - polymorphic component
    <CardWrapper {...cardProps}>
      {locked && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-end pr-5 pointer-events-none">
          <span
            className="material-symbols-outlined text-on-surface-variant text-2xl"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            lock
          </span>
        </div>
      )}
      <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary">
          {challenge.domain.icon ?? 'fitness_center'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <h3 className="font-label font-medium text-on-surface flex-1 min-w-0">{challenge.title}</h3>
          <span className="flex-shrink-0">
            <span
              className={`material-symbols-outlined text-base ${statusIcon.colorClass}`}
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              {statusIcon.icon}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-on-surface-variant">{challenge.domain.title}</span>
          <span className="text-on-surface-variant">·</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              challenge.difficulty === 'beginner'
                ? 'bg-primary-container text-on-primary-container'
                : challenge.difficulty === 'intermediate'
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : 'bg-error-container text-on-error-container'
            }`}
          >
            {challenge.difficulty}
          </span>
          <span className="text-on-surface-variant">·</span>
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base">schedule</span>
            ~{challenge.estimated_minutes} min
          </span>
          <span className="text-on-surface-variant">·</span>
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">group</span>
            {count} attempts
          </span>
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1.5">
            {tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {!locked && (
        <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 mt-0.5">
          chevron_right
        </span>
      )}
    </CardWrapper>
  )
}
