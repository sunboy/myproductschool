'use client'

import type { Checkpoint } from './types'

interface AnnotationRailProps {
  checkpoints: Checkpoint[]
  currentTIdx: number
  elapsedT: number
  passedCheckpointIds: string[]
}

/**
 * "Live annotations" side rail — a running list of checkpoint markers
 * showing which decision points have passed, which is active, and which
 * are still ahead. Purely presentational, driven by the parent's playback
 * clock.
 */
export function AnnotationRail({ checkpoints, elapsedT, passedCheckpointIds }: AnnotationRailProps) {
  return (
    <aside
      aria-label="Live annotations"
      className="flex h-full flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4"
    >
      <h3 className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Live annotations
      </h3>
      <ol className="flex flex-col gap-2">
        {checkpoints.map((cp, idx) => {
          const isPassed = passedCheckpointIds.includes(cp.id)
          const isActive = elapsedT >= cp.t && !isPassed
          return (
            <li
              key={cp.id}
              className={[
                'flex items-start gap-2 rounded-lg border p-2.5 text-sm transition-colors',
                isActive
                  ? 'border-primary bg-primary-container/40 text-on-surface'
                  : isPassed
                    ? 'border-outline-variant bg-surface-container text-on-surface-variant'
                    : 'border-transparent text-on-surface-variant',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={[
                  'material-symbols-outlined mt-0.5 shrink-0 text-base',
                  isPassed ? 'text-primary' : isActive ? 'text-primary' : 'text-outline',
                ].join(' ')}
              >
                {isPassed ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <div className="flex flex-col">
                <span className="font-label text-xs font-semibold text-on-surface-variant">
                  Checkpoint {idx + 1}
                </span>
                <span className="font-body line-clamp-2">{cp.question}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
