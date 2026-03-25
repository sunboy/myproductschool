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
    ? { className: 'relative flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-outline-variant opacity-75 cursor-default' }
    : {
        href: `/challenges/${challenge.id}`,
        className: 'relative flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-outline-variant hover:bg-surface-container-high hover:border-primary/30 transition-all',
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
        <div className="absolute inset-0 rounded-lg flex items-center justify-end pr-4 pointer-events-none">
          <span
            className="material-symbols-outlined text-on-surface-variant text-xl"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            lock
          </span>
        </div>
      )}
      <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-primary text-[18px]">
          {challenge.domain.icon ?? 'fitness_center'}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <h3 className="font-label font-medium text-on-surface min-w-0 truncate max-w-[240px]">{challenge.title}</h3>
        <span className="flex-shrink-0">
          <span
            className={`material-symbols-outlined text-base ${statusIcon.colorClass}`}
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            {statusIcon.icon}
          </span>
        </span>
        <span className="text-on-surface-variant/30 text-xs">|</span>
        <span className="text-xs text-on-surface-variant">{challenge.domain.title}</span>
        <span className="text-on-surface-variant/30">·</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            challenge.difficulty === 'beginner'
              ? 'bg-primary-container text-on-primary-container'
              : challenge.difficulty === 'intermediate'
                ? 'bg-tertiary-container text-on-tertiary-container'
                : 'bg-error-container text-on-error-container'
          }`}
        >
          {challenge.difficulty}
        </span>
        <span className="text-on-surface-variant/30">·</span>
        <span className="text-xs text-on-surface-variant flex items-center gap-0.5 flex-shrink-0">
          <span className="material-symbols-outlined text-sm">schedule</span>
          ~{challenge.estimated_minutes}m
        </span>
        <span className="text-on-surface-variant/30">·</span>
        <span className="text-xs text-on-surface-variant flex items-center gap-0.5 flex-shrink-0">
          <span className="material-symbols-outlined text-sm">group</span>
          {count}
        </span>
        {tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container flex-shrink-0"
          >
            {tag}
          </span>
        ))}
      </div>
      {!locked && (
        <span className="material-symbols-outlined text-on-surface-variant flex-shrink-0 text-base">
          chevron_right
        </span>
      )}
    </CardWrapper>
  )
}
