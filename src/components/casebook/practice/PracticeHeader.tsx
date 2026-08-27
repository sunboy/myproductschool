'use client'

import { useEffect, useRef, useState } from 'react'
import { skillLaneLabel } from './skillLaneLabels'
import type { PracticeSessionStatus, SkillLane } from './types'

interface PracticeHeaderProps {
  moduleTitle: string
  sceneIndex: number
  sceneCount: number
  skillLane: SkillLane
  timeBudgetS: number
  status: PracticeSessionStatus
}

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(clamped / 60)
  const s = clamped % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Soft timer: counts down for display only, driven by time_budget_s. It
 * never enforces a hard cutoff in the UI. Once it reaches zero it just
 * holds at "0:00" and shows a calm label change; PracticeClient decides
 * separately whether/how to end the session.
 */
function usePracticeClock(timeBudgetS: number, status: PracticeSessionStatus) {
  const [remaining, setRemaining] = useState(timeBudgetS)
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (status !== 'active') {
      if (status === 'idle' || status === 'starting') {
        setRemaining(timeBudgetS)
        startedAtRef.current = null
      }
      return
    }

    startedAtRef.current = Date.now()
    const interval = setInterval(() => {
      const startedAt = startedAtRef.current
      if (startedAt == null) return
      const elapsed = (Date.now() - startedAt) / 1000
      setRemaining(Math.max(0, timeBudgetS - elapsed))
    }, 1000)

    return () => clearInterval(interval)
  }, [status, timeBudgetS])

  return remaining
}

export function PracticeHeader({
  moduleTitle,
  sceneIndex,
  sceneCount,
  skillLane,
  timeBudgetS,
  status,
}: PracticeHeaderProps) {
  const remaining = usePracticeClock(timeBudgetS, status)
  const isLow = status === 'active' && remaining <= 30

  return (
    <div className="flex flex-col gap-2 border-b border-outline-variant pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-label text-xs uppercase tracking-wide text-on-surface-variant">
            {moduleTitle}
          </p>
          <h1 className="font-headline text-xl font-semibold text-on-surface">
            Practice {sceneIndex} of {sceneCount}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary-container px-3 py-1 font-label text-xs font-semibold text-on-secondary-container">
            {skillLaneLabel(skillLane)}
          </span>
          {status !== 'idle' && (
            <span
              className={
                'rounded-full px-3 py-1 font-label text-xs font-semibold tabular-nums ' +
                (isLow
                  ? 'bg-error/10 text-error'
                  : 'bg-primary-container text-on-primary-container')
              }
              aria-live="polite"
            >
              {formatClock(remaining)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
