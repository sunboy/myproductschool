'use client'

import { useState } from 'react'
import type { Checkpoint } from './types'

interface CheckpointOverlayProps {
  checkpoint: Checkpoint
  checkpointIndex: number
  totalCheckpoints: number
  moduleTitle: string
  watchOnly: boolean
  onCommit: (optionId: string) => void
  onContinue: () => void
  submitting: boolean
}

/**
 * Pause-point overlay. In full mode it renders selectable options and calls
 * onCommit; the caller (WalkthroughPlayer) owns talking to onPredict and
 * decides when to advance. In watchOnly (teaser) mode it shows the question
 * and the teaser nudge only, with a Continue control, no answering surface.
 */
export function CheckpointOverlay({
  checkpoint,
  checkpointIndex,
  totalCheckpoints,
  moduleTitle,
  watchOnly,
  onCommit,
  onContinue,
  submitting,
}: CheckpointOverlayProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="checkpoint-heading"
      className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-label text-xs font-semibold uppercase tracking-wide text-tertiary">
          paused · your call
        </span>
        <span className="font-label text-xs text-on-surface-variant">
          {moduleTitle} · checkpoint {checkpointIndex + 1} of {totalCheckpoints}
        </span>
      </div>

      <h3 id="checkpoint-heading" className="font-headline text-xl text-on-surface">
        What would you ask next?
      </h3>

      <p className="font-body text-sm text-on-surface-variant">{checkpoint.question}</p>

      {watchOnly ? (
        <>
          <p className="font-body text-sm italic text-on-surface-variant">
            The tape is about to pause and ask what you&apos;d do. Right or wrong, you&apos;ll see how they thought.
          </p>
          <div>
            <button
              type="button"
              onClick={onContinue}
              className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary"
            >
              Continue
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="font-label text-xs text-on-surface-variant">
            Your call. Pick one before the tape rolls on.
          </p>

          <fieldset className="flex flex-col gap-2" disabled={submitting}>
            <legend className="sr-only">Checkpoint options</legend>
            {checkpoint.options?.map((opt) => {
              const checked = selectedId === opt.id
              return (
                <label
                  key={opt.id}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
                    checked
                      ? 'border-primary bg-primary-container/30'
                      : 'border-outline-variant hover:bg-surface-container-high',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`checkpoint-${checkpoint.id}`}
                    value={opt.id}
                    checked={checked}
                    onChange={() => setSelectedId(opt.id)}
                    className="mt-0.5"
                  />
                  <span className="font-body text-on-surface">{opt.text}</span>
                </label>
              )
            })}
          </fieldset>

          <div>
            <button
              type="button"
              disabled={!selectedId || submitting}
              onClick={() => selectedId && onCommit(selectedId)}
              className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Lock it in'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
