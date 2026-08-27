'use client'

import { useState } from 'react'
import type { PracticeEndReason, PracticeSessionStatus } from './types'

interface PracticeTerminalProps {
  status: PracticeSessionStatus
  endReason: PracticeEndReason | null
  onStart?: () => Promise<void>
  onContinue?: () => void
}

/**
 * PLACEHOLDER terminal region. This is NOT a PTY/WebSocket client — the API
 * dev wires the live session in a later phase. This component only renders
 * a styled placeholder per session state and calls the injected onStart /
 * onContinue callbacks. It never surfaces a raw API error or gets stuck in
 * a hung state: a rejected onStart() always resolves back to a calm,
 * in-vocabulary message with a retry affordance.
 */
export function PracticeTerminal({ status, endReason, onStart, onContinue }: PracticeTerminalProps) {
  const [startFailed, setStartFailed] = useState(false)

  async function handleStart() {
    setStartFailed(false)
    try {
      await onStart?.()
    } catch {
      setStartFailed(true)
    }
  }

  return (
    <section className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-inverse-surface">
      <div className="flex items-center gap-2 border-b border-outline-variant/20 bg-inverse-surface px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="ml-2 font-mono text-xs text-inverse-on-surface/70">practice session</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        {status === 'idle' && !startFailed && (
          <>
            <p className="font-body text-sm text-inverse-on-surface/80">
              This is where your live session will run. Nothing you do here counts until you
              start.
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              Start practice
            </button>
          </>
        )}

        {startFailed && (
          <>
            <p className="font-body text-sm text-inverse-on-surface/80">
              The session could not start. Give it another try.
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              Try again
            </button>
          </>
        )}

        {status === 'starting' && (
          <>
            <span
              className="h-8 w-8 animate-spin rounded-full border-2 border-inverse-on-surface/30 border-t-inverse-on-surface"
              aria-hidden="true"
            />
            <p className="font-body text-sm text-inverse-on-surface/80">Setting up your session.</p>
          </>
        )}

        {status === 'active' && (
          <p className="font-mono text-sm text-inverse-on-surface/80">
            Session running. The live terminal mounts here.
          </p>
        )}

        {status === 'ended' && (
          <>
            <p className="font-body text-sm font-semibold text-inverse-on-surface">
              {endReason === 'time_exhausted' ? 'Practice session ended.' : 'Practice session complete.'}
            </p>
            <p className="font-body text-sm text-inverse-on-surface/70">
              {endReason === 'time_exhausted'
                ? 'The soft timer ran out. You can pick up where you left off.'
                : 'Nice work. Continue when you are ready.'}
            </p>
            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
              >
                Continue
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
