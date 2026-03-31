'use client'

import type { Challenge, DifficultyV2, ParadigmV2 } from '@/lib/types'
import { DIFFICULTY_V2_LABELS, PARADIGM_V2_LABELS } from '@/lib/types'

interface ChallengeCardV2Props {
  challenge: Challenge & {
    attempt_count?: number
    best_score?: number
    is_completed?: boolean
  }
  onStart: (id: string) => void
}

export function ChallengeCardV2({ challenge, onStart }: ChallengeCardV2Props) {
  const paradigmLabel = challenge.paradigm ? PARADIGM_V2_LABELS[challenge.paradigm] : null
  const difficultyLabel = DIFFICULTY_V2_LABELS[challenge.difficulty]

  return (
    <div
      className="bg-surface-container rounded-xl p-5 hover:bg-surface-container-high transition-colors cursor-pointer"
      onClick={() => onStart(challenge.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {paradigmLabel && (
              <span className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-3 py-0.5 font-label">
                {paradigmLabel}
              </span>
            )}
            <span className="bg-tertiary-container text-on-surface rounded-full text-xs px-3 py-0.5 font-label">
              {difficultyLabel}
            </span>
            {challenge.is_completed && (
              <span className="bg-primary-fixed text-primary rounded-full text-xs px-3 py-0.5 font-label flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-[12px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 16" }}
                >
                  check_circle
                </span>
                Done
              </span>
            )}
            {challenge.best_score != null && challenge.best_score > 0 && (
              <span className="bg-surface-container-highest text-on-surface-variant rounded-full text-xs px-3 py-0.5 font-label">
                Best: {challenge.best_score.toFixed(1)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-headline text-base text-on-surface leading-snug">{challenge.title}</h3>

          {/* Meta */}
          <div className="flex items-center gap-1 text-on-surface-variant text-sm font-label">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 16" }}>
              schedule
            </span>
            <span>{challenge.estimated_minutes} min</span>
            {challenge.attempt_count != null && challenge.attempt_count > 0 && (
              <>
                <span className="text-outline-variant mx-1">·</span>
                <span>{challenge.attempt_count} attempt{challenge.attempt_count !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onStart(challenge.id) }}
          className={[
            'shrink-0 rounded-full px-4 py-2 font-label text-sm font-semibold transition-colors',
            challenge.is_completed
              ? 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              : 'bg-primary text-on-primary hover:opacity-90',
          ].join(' ')}
        >
          {challenge.is_completed ? 'Retry' : 'Start'}
        </button>
      </div>
    </div>
  )
}
