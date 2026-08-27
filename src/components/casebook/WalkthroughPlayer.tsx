'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnnotationRail } from './AnnotationRail'
import { CheckpointOverlay } from './CheckpointOverlay'
import type { Checkpoint, WalkthroughPayload, WalkthroughTurn } from './types'

export type { WalkthroughPayload, WalkthroughTurn, Checkpoint } from './types'

interface WalkthroughPlayerProps {
  payload: WalkthroughPayload
  /**
   * Teaser mode: plays through, shows checkpoint questions as teasers, no
   * answering, no prediction submission. Used for logged-out / pre-unlock
   * previews.
   */
  watchOnly?: boolean
  /**
   * Called when the learner commits an answer at a checkpoint (full mode
   * only). The caller owns wiring this to the predictions API and deciding
   * whether to await a reveal before resolving. Playback resumes once the
   * returned promise resolves.
   */
  onPredict?: (checkpointId: string, optionId: string) => Promise<unknown>
}

/** Real-time seconds allotted to play through the whole transcript. Keeps a
 * 569s (9m29s) source session watchable in well under a minute regardless of
 * length. */
const TARGET_PLAYBACK_S = 45
/** Per-character typing speed, ms. Kept fast; still perceptible. */
const MS_PER_CHAR = 8
const MAX_TYPING_MS = 900
/** Tick interval driving the elapsed-time clock and checkpoint checks. */
const CLOCK_TICK_MS = 100

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

function roleLabel(role: WalkthroughTurn['role']): string {
  if (role === 'user') return 'Analyst'
  if (role === 'assistant') return 'Agent'
  return 'Tool'
}

/** A single transcript row. Handles its own typed-text animation. */
function TranscriptTurn({
  turn,
  reducedMotion,
  active,
  onTypingDone,
}: {
  turn: WalkthroughTurn
  reducedMotion: boolean
  active: boolean
  onTypingDone: () => void
}) {
  const isTool = turn.role === 'tool'
  const isSql = isTool && /SELECT|FROM|WHERE|GROUP BY|\[tool_use\]/i.test(turn.text)
  const fullText = turn.text
  const [shown, setShown] = useState(reducedMotion || !active ? fullText : '')

  useEffect(() => {
    if (reducedMotion) {
      setShown(fullText)
      onTypingDone()
      return
    }
    if (!active) {
      setShown(fullText)
      return
    }
    setShown('')
    let cancelled = false
    const totalMs = Math.min(MAX_TYPING_MS, fullText.length * MS_PER_CHAR)
    const steps = Math.max(1, Math.round(totalMs / 30))
    const charsPerStep = Math.max(1, Math.ceil(fullText.length / steps))
    let i = 0
    const interval = setInterval(() => {
      if (cancelled) return
      i += charsPerStep
      setShown(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(interval)
        onTypingDone()
      }
    }, 30)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullText, active, reducedMotion])

  return (
    <div
      className={[
        'flex flex-col gap-1 rounded-lg border px-3 py-2.5',
        turn.role === 'user'
          ? 'border-outline-variant bg-surface-container-low'
          : turn.role === 'assistant'
            ? 'border-primary/30 bg-primary-container/20'
            : 'border-outline-variant bg-inverse-surface',
      ].join(' ')}
    >
      <span
        className={[
          'font-label text-[11px] font-semibold uppercase tracking-wide',
          turn.role === 'tool' ? 'text-inverse-on-surface/70' : 'text-on-surface-variant',
        ].join(' ')}
      >
        {roleLabel(turn.role)}
      </span>
      {isSql ? (
        <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded bg-inverse-surface p-2 font-mono text-xs text-inverse-on-surface">
          {shown}
        </pre>
      ) : (
        <p
          className={[
            'font-body whitespace-pre-wrap text-sm',
            turn.role === 'tool' ? 'font-mono text-inverse-on-surface' : 'text-on-surface',
          ].join(' ')}
        >
          {shown}
        </p>
      )}
    </div>
  )
}

export function WalkthroughPlayer({ payload, watchOnly = false, onPredict }: WalkthroughPlayerProps) {
  const reducedMotion = usePrefersReducedMotion()
  const { module: mod, duration_s, transcript, checkpoints } = payload

  const sortedTranscript = useMemo(() => [...transcript].sort((a, b) => a.t - b.t), [transcript])
  const sortedCheckpoints = useMemo(() => [...checkpoints].sort((a, b) => a.t - b.t), [checkpoints])

  // Scale factor from source seconds -> playback ms, so the whole thing
  // plays in roughly TARGET_PLAYBACK_S regardless of the real duration.
  const scale = duration_s > 0 ? (TARGET_PLAYBACK_S * 1000) / (duration_s * 1000) : 1

  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)
  const [elapsedT, setElapsedT] = useState(0)
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null)
  const [passedCheckpointIds, setPassedCheckpointIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [typingIdx, setTypingIdx] = useState<number | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Core playback clock. Advances elapsedT, reveals turns whose t has been
  // reached, and pauses at the next unreached checkpoint.
  useEffect(() => {
    if (!isPlaying) return

    timerRef.current = setInterval(() => {
      setElapsedT((prev) => {
        const next = prev + CLOCK_TICK_MS / 1000 / scale

        // Check for a checkpoint we've now reached that hasn't fired yet.
        const nextCp = sortedCheckpoints.find(
          (cp) => cp.t <= next && !passedCheckpointIds.includes(cp.id)
        )
        if (nextCp) {
          setIsPlaying(false)
          setActiveCheckpoint(nextCp)
          return nextCp.t
        }

        if (next >= duration_s) {
          setIsPlaying(false)
          return duration_s
        }
        return next
      })
    }, CLOCK_TICK_MS)

    return clearTimer
  }, [isPlaying, scale, sortedCheckpoints, passedCheckpointIds, duration_s, clearTimer])

  // Reveal transcript turns as elapsed time passes them.
  useEffect(() => {
    let count = 0
    for (const turn of sortedTranscript) {
      if (turn.t <= elapsedT) count += 1
      else break
    }
    if (count !== visibleCount) {
      setVisibleCount(count)
      if (!reducedMotion && count > 0) setTypingIdx(count - 1)
    }
  }, [elapsedT, sortedTranscript, visibleCount, reducedMotion])

  // Announce checkpoints to assistive tech.
  useEffect(() => {
    if (activeCheckpoint && liveRegionRef.current) {
      liveRegionRef.current.textContent = `Playback paused. ${activeCheckpoint.question}`
    }
  }, [activeCheckpoint])

  const handlePlayPause = useCallback(() => {
    if (activeCheckpoint) return
    setHasStarted(true)
    setIsPlaying((p) => !p)
  }, [activeCheckpoint])

  const handleSkipForward = useCallback(() => {
    if (activeCheckpoint) return
    setHasStarted(true)
    setElapsedT((prev) => {
      const next = Math.min(duration_s, prev + 15)
      const nextCp = sortedCheckpoints.find((cp) => cp.t <= next && !passedCheckpointIds.includes(cp.id))
      if (nextCp) {
        setIsPlaying(false)
        setActiveCheckpoint(nextCp)
        return nextCp.t
      }
      return next
    })
  }, [activeCheckpoint, duration_s, sortedCheckpoints, passedCheckpointIds])

  const resumeAfterCheckpoint = useCallback(() => {
    if (!activeCheckpoint) return
    setPassedCheckpointIds((prev) => [...prev, activeCheckpoint.id])
    setActiveCheckpoint(null)
    setIsPlaying(true)
  }, [activeCheckpoint])

  const handleCommit = useCallback(
    async (optionId: string) => {
      if (!activeCheckpoint) return
      if (onPredict) {
        setSubmitting(true)
        try {
          await onPredict(activeCheckpoint.id, optionId)
        } finally {
          setSubmitting(false)
        }
      }
      resumeAfterCheckpoint()
    },
    [activeCheckpoint, onPredict, resumeAfterCheckpoint]
  )

  const checkpointIndex = activeCheckpoint
    ? sortedCheckpoints.findIndex((cp) => cp.id === activeCheckpoint.id)
    : -1

  const isDone = !isPlaying && !activeCheckpoint && hasStarted && elapsedT >= duration_s

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-4">
      {/* Header strip */}
      <div className="flex flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
          {`MODULE · ${mod.title.toUpperCase()} · replaying an expert session`}
        </span>
        <span className="font-body text-sm text-on-surface-variant">{mod.hook}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Transcript column */}
        <div className="flex min-w-0 flex-col gap-3">
          <div
            className="flex max-h-[60vh] min-h-[240px] flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-xl border border-outline-variant bg-surface p-3"
            aria-label="Session transcript"
          >
            {sortedTranscript.slice(0, visibleCount).map((turn, idx) => (
              <TranscriptTurn
                key={`${turn.t}-${idx}`}
                turn={turn}
                reducedMotion={reducedMotion}
                active={idx === typingIdx}
                onTypingDone={() => setTypingIdx(null)}
              />
            ))}
            {visibleCount === 0 && (
              <p className="font-body text-sm text-on-surface-variant">
                Press play to start the walkthrough.
              </p>
            )}
          </div>

          {activeCheckpoint && (
            <CheckpointOverlay
              checkpoint={activeCheckpoint}
              checkpointIndex={checkpointIndex}
              totalCheckpoints={sortedCheckpoints.length}
              moduleTitle={mod.title}
              watchOnly={watchOnly}
              onCommit={handleCommit}
              onContinue={resumeAfterCheckpoint}
              submitting={submitting}
            />
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayPause}
                disabled={!!activeCheckpoint || isDone}
                aria-label={isPlaying ? 'Pause walkthrough' : 'Play walkthrough'}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleSkipForward}
                disabled={!!activeCheckpoint || isDone}
                aria-label="Skip forward 15 seconds"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  forward_10
                </span>
              </button>
              <span className="font-label text-xs text-on-surface-variant">
                sound off, silently watchable
              </span>
            </div>
            <span className="font-mono text-xs text-on-surface-variant" aria-live="off">
              {`${formatClock(elapsedT)} / ${formatClock(duration_s)} · ${sortedCheckpoints.length} checkpoints`}
            </span>
          </div>
        </div>

        {/* Annotation rail */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <AnnotationRail
            checkpoints={sortedCheckpoints}
            currentTIdx={checkpointIndex}
            elapsedT={elapsedT}
            passedCheckpointIds={passedCheckpointIds}
          />
        </div>
      </div>

      {/* Visually hidden live region for checkpoint announcements */}
      <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />
    </div>
  )
}
