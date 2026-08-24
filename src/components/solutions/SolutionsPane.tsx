'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { HatchImage } from '@/components/redesign/HatchImage'
import { AnimatedProgress } from '@/components/motion'
import { SolutionContent } from './SolutionContent'
import type { SolutionTabResponse } from '@/lib/solutions/schema'

interface Props {
  solution: SolutionTabResponse | null
  loading: boolean
  challengeTitle: string | null
  /** Re-trigger generation after a failure. */
  onRetry: () => void
  /** Locked-state CTA: jump back to the Description tab to start an attempt. */
  onGoToDescription: () => void
  activeApproachId: string | null
  onApproachChange: (id: string) => void
  /** Surfaces the active step of an interactive walkthrough (Hatch awareness). */
  onSteppedStepChange?: (step: { index: number; title: string; decision?: string }) => void
}

function CenteredState({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      {icon}
      {children}
    </div>
  )
}

// Staged copy so the wait reads as real progress rather than one static
// sentence. Timings are illustrative, not driven by actual generation phase
// signals (the API doesn't expose sub-stages) — they just keep the copy
// moving across the ~20-60s a generation typically takes.
type WritingStage = 'queued' | 'writing' | 'formatting'
const WRITING_STAGES: Record<WritingStage, { title: string; progress: number }> = {
  queued: { title: 'Hatch is reading the challenge', progress: 12 },
  writing: { title: 'Hatch is writing the solution', progress: 55 },
  formatting: { title: 'Formatting approaches and diagrams', progress: 85 },
}

// Mirrors the server's stale-lock window (route.ts: generation_started_at
// older than 3 minutes is treated as dead) so the client never sits on a
// skeleton past the point the server itself would give up on that attempt.
const SLOW_AFTER_MS = 3 * 60 * 1000

function Skeletons({ onRetry }: { onRetry: () => void }) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setElapsedMs(0)
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startRef.current)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const isSlow = elapsedMs >= SLOW_AFTER_MS
  const stage: WritingStage = elapsedMs < 8000 ? 'queued' : elapsedMs < 30000 ? 'writing' : 'formatting'
  const elapsedLabel = `${Math.floor(elapsedMs / 1000)}s`

  if (isSlow) {
    return (
      <CenteredState icon={<HatchImage size={40} state="reviewing" />}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center', margin: 0, maxWidth: 300 }}>
          This is taking longer than usual.
        </p>
        <button
          onClick={onRetry}
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            border: 'none',
            borderRadius: 999,
            padding: '8px 20px',
            fontFamily: 'var(--font-label)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </CenteredState>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <HatchImage size={32} state="writing" className="animate-hatch-glow" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, color: 'var(--color-on-surface)', margin: 0, lineHeight: 1.4 }}>
            {WRITING_STAGES[stage].title}
          </p>
          <p style={{ fontFamily: 'var(--font-label)', fontSize: 11.5, color: 'var(--color-on-surface-variant)', margin: '2px 0 0' }}>
            {elapsedLabel} elapsed
          </p>
        </div>
      </div>
      <AnimatedProgress
        value={WRITING_STAGES[stage].progress}
        state="active"
        trackClassName="bg-[var(--color-outline-variant)]"
        barClassName="bg-[var(--color-primary)]"
      />
      {[64, 180, 120, 220].map((height, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height,
            borderRadius: 12,
            background: 'var(--color-surface-container-highest)',
            border: '1px solid var(--color-outline-variant)',
          }}
        />
      ))}
    </div>
  )
}

export function SolutionsPane({
  solution,
  loading,
  challengeTitle,
  onRetry,
  onGoToDescription,
  activeApproachId,
  onApproachChange,
  onSteppedStepChange,
}: Props) {
  const [maximized, setMaximized] = useState(false)
  // Remounts Skeletons on retry so its elapsed-timer effect restarts from 0 —
  // otherwise clicking "Try again" from the 3-minute "taking longer than
  // usual" state re-renders that exact same state immediately (elapsedMs was
  // still >180s from the prior attempt).
  const [retryKey, setRetryKey] = useState(0)
  const handleRetry = () => {
    setRetryKey((k) => k + 1)
    onRetry()
  }

  if (loading && !solution) return <Skeletons key={retryKey} onRetry={handleRetry} />

  if (!solution) {
    return (
      <CenteredState icon={<span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>menu_book</span>}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center', margin: 0 }}>
          Solutions are loading.
        </p>
      </CenteredState>
    )
  }

  if (solution.locked) {
    return (
      <CenteredState icon={<span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>lock</span>}>
        <div data-testid="solution-locked" style={{ maxWidth: 340, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)', margin: '0 0 6px' }}>
            Earn the solution first
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--color-on-surface-variant)', margin: '0 0 16px' }}>
            Submit one attempt at this challenge and the full solution opens: every approach, the diagrams, and how to work this problem with AI.
            {solution.unlock.pro_available && ' Pro members can open solutions anytime, attempt or not.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <button
              onClick={onGoToDescription}
              data-testid="solution-locked-attempt-cta"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                border: 'none',
                borderRadius: 999,
                padding: '9px 22px',
                fontFamily: 'var(--font-label)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Work the challenge
            </button>
            {solution.unlock.pro_available && (
              <a
                href="/pricing"
                data-testid="solution-locked-pro-cta"
                style={{
                  background: 'var(--color-secondary-container)',
                  color: 'var(--color-on-secondary-container)',
                  borderRadius: 999,
                  padding: '9px 22px',
                  fontFamily: 'var(--font-label)',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Go Pro for instant access
              </a>
            )}
          </div>
        </div>
      </CenteredState>
    )
  }

  if (solution.status === 'failed') {
    return (
      <CenteredState icon={<span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline)' }}>error</span>}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-on-surface-variant)', textAlign: 'center', margin: 0, maxWidth: 300 }}>
          Solution generation hit a snag.
        </p>
        <button
          onClick={onRetry}
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
            border: 'none',
            borderRadius: 999,
            padding: '8px 20px',
            fontFamily: 'var(--font-label)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </CenteredState>
    )
  }

  if (solution.status !== 'ready') {
    // 'generating' and 'none' both render the writing state; 'none' flips to a
    // generation request immediately via the workspace effect.
    return <Skeletons key={retryKey} onRetry={handleRetry} />
  }

  const { content } = solution

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Pane header: label + maximize */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px 8px',
        borderBottom: '1px solid var(--color-outline-variant)',
      }}>
        <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
          Official solution
        </span>
        <button
          onClick={() => setMaximized(true)}
          aria-label="Maximize solution"
          title="Maximize"
          data-testid="solution-maximize"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            border: '1px solid var(--color-outline-variant)',
            background: 'var(--color-surface-container-low)',
            color: 'var(--color-on-surface-variant)',
            borderRadius: 999,
            padding: '4px 11px',
            fontFamily: 'var(--font-label)',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_full</span>
          Expand
        </button>
      </div>

      <div data-testid="solution-pane-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 28px' }}>
        <SolutionContent
          // Remount when the modal closes so the pane re-reports its current
          // step to Hatch (otherwise Hatch could stay on the modal's last step).
          key={maximized ? 'pane-bg' : 'pane-active'}
          content={content}
          size="pane"
          activeApproachId={activeApproachId}
          onApproachChange={onApproachChange}
          // Only the visible surface reports its step to Hatch. When the modal
          // is open it owns reporting; this prevents the pane and modal (each
          // with its own step cursor) from leaving Hatch on a stale step.
          onSteppedStepChange={maximized ? undefined : onSteppedStepChange}
        />
      </div>

      {/* Maximized reading view */}
      <Dialog open={maximized} onOpenChange={setMaximized}>
        <DialogContent
          className="!max-w-5xl w-[92vw] h-[88vh] overflow-y-auto !p-0 !gap-0 !rounded-2xl"
          style={{ background: 'var(--color-background)' }}
        >
          <div style={{ padding: '22px 30px 32px' }}>
            <DialogTitle asChild>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 21, fontWeight: 700, color: 'var(--color-on-surface)', margin: '0 0 18px', lineHeight: 1.25, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
                {challengeTitle ? `Solution: ${challengeTitle}` : 'Solution'}
              </h2>
            </DialogTitle>
            <SolutionContent
              content={content}
              size="modal"
              activeApproachId={activeApproachId}
              onApproachChange={onApproachChange}
              onSteppedStepChange={maximized ? onSteppedStepChange : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
