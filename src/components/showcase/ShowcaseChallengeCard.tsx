'use client'
import type { AutopsyDecision, AutopsyChallenge, ShowcaseAttempt } from '@/lib/types'

interface ShowcaseChallengeCardProps {
  decision: AutopsyDecision
  challenge: AutopsyChallenge
  index: number
  isActive: boolean
  isExpanded: boolean
  attempt: ShowcaseAttempt | null
  onSelect: () => void
  onToggleExpand: () => void
}

const GRADE_BADGE_STYLES: Record<string, string> = {
  Sharp: 'bg-primary/10 text-primary',
  Solid: 'bg-tertiary/10 text-tertiary',
  Surface: 'bg-secondary-container text-on-secondary-container',
  Missed: 'bg-error/10 text-error',
}

export function ShowcaseChallengeCard({
  decision,
  challenge,
  isActive,
  isExpanded,
  attempt,
  onSelect,
  onToggleExpand,
}: ShowcaseChallengeCardProps) {
  const gradeBadgeStyle = attempt ? (GRADE_BADGE_STYLES[attempt.grade_label] ?? GRADE_BADGE_STYLES.Surface) : ''

  return (
    <div
      onClick={onSelect}
      className={`border-2 rounded-xl p-3 cursor-pointer transition-all border-l-4 ${
        isActive
          ? 'border-primary bg-white shadow-sm'
          : 'border-transparent bg-surface-container hover:bg-surface-container-high'
      }`}
      style={{ borderLeftColor: isActive ? undefined : 'transparent' }}
    >
      {/* Top row: badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-[10px] font-label font-bold">
            {decision.area}
          </span>
          <span className="bg-surface-container-high text-on-surface-variant rounded-full px-2 py-0.5 text-[10px] font-label">
            {decision.difficulty}
          </span>
        </div>
        <div>
          {attempt ? (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-label font-bold ${gradeBadgeStyle}`}>
              {attempt.grade_label}
            </span>
          ) : isActive ? (
            <span className="text-[10px] font-bold text-primary">● In progress</span>
          ) : null}
        </div>
      </div>

      {/* Decision title */}
      <p className="text-sm font-bold text-on-surface mt-2">{decision.title}</p>

      {/* Challenge question */}
      {isExpanded ? (
        <>
          <p className="text-xs text-on-surface-variant mt-1">{challenge.insight || decision.challenge_question}</p>
          {challenge.context && (
            <p className="text-xs text-on-surface-variant italic mt-2">{challenge.context}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{decision.challenge_question}</p>
      )}

      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          {attempt ? (
            <span className="text-xs font-bold text-on-surface-variant">View results</span>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onSelect() }}
              className="text-xs font-bold text-primary flex items-center gap-1"
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                play_arrow
              </span>
              Start challenge
            </button>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleExpand() }}
          className="text-[10px] text-on-surface-variant flex items-center gap-0.5"
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>
    </div>
  )
}
