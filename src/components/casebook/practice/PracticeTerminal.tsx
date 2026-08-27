'use client'

import { useState } from 'react'
import { ClaudeCodeTerminal } from '@/components/v2/mediums/ClaudeCodeTerminal'
import type { UpstreamDeadReason } from '@/components/v2/mediums/ClaudeCodeTerminal'
import type { PracticeEndReason, PracticeSessionStatus } from './types'

interface PracticeTerminalProps {
  status: PracticeSessionStatus
  endReason: PracticeEndReason | null
  /** Calm, in-vocabulary message for the ended state, when the caller has
   *  a specific one (session error, limit reached, upstream dead). Falls
   *  back to a default per-reason message when absent. */
  endMessage?: string | null
  /** Live session endpoint once the API has provisioned a sandbox. Absent
   *  while starting, or if provisioning never succeeded. */
  wssUrl?: string | null
  /** Set when the start call itself failed (network error, non-402
   *  non-2xx). Rendered on the idle screen with a retry affordance. */
  startError?: string | null
  onStart?: () => Promise<void>
  onContinue?: () => void
  /** Forwarded to ClaudeCodeTerminal. Fires once the live session's
   *  upstream has stopped making progress — the terminal itself can't
   *  recover, so this ends the session with a calm message instead of
   *  leaving the learner staring at a stalled screen. */
  onUpstreamDead?: (reason: UpstreamDeadReason) => void
}

const END_MESSAGES: Record<PracticeEndReason, { title: string; body: string }> = {
  completed: {
    title: 'Practice session complete.',
    body: 'Nice work. Continue when you are ready.',
  },
  time_exhausted: {
    title: 'Practice session ended.',
    body: 'The soft timer ran out. You can pick up where you left off.',
  },
  left: {
    title: 'Practice session ended.',
    body: 'Continue when you are ready.',
  },
  session_error: {
    title: 'The session could not start.',
    body: 'Give it another try.',
  },
  limit_reached: {
    title: 'You are out of practice sessions for now.',
    body: 'They reset on a rolling basis, or you can upgrade for more.',
  },
  upstream_dead: {
    title: 'Your session ended.',
    body: 'Start again when you are ready.',
  },
}

/**
 * Live terminal region. Renders a start screen while idle, a real
 * ClaudeCodeTerminal (the production xterm-over-WSS component from the
 * analytics lab) once a session is provisioned, and a calm end state for
 * every way a session can stop. Never surfaces a raw API error string or
 * gets stuck in a hung state.
 */
export function PracticeTerminal({
  status,
  endReason,
  endMessage,
  wssUrl,
  startError,
  onStart,
  onContinue,
  onUpstreamDead,
}: PracticeTerminalProps) {
  const [localStartError, setLocalStartError] = useState<string | null>(null)

  async function handleStart() {
    setLocalStartError(null)
    try {
      await onStart?.()
    } catch {
      setLocalStartError('The session could not start. Give it another try.')
    }
  }

  const displayedStartError = startError ?? localStartError

  // Mount the real terminal as soon as a wssUrl exists, even while the
  // session is still 'provisioning' on the server side — the terminal's own
  // reconnect logic handles a PTY that isn't up yet. Keep it mounted
  // through 'ended' so a still-running sandbox is never yanked mid-keystroke;
  // only unmount on Continue (status back to 'idle').
  const showLiveTerminal = Boolean(wssUrl) && (status === 'active' || status === 'ended')

  return (
    <section className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-inverse-surface">
      <div className="flex items-center gap-2 border-b border-outline-variant/20 bg-inverse-surface px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="ml-2 font-mono text-xs text-inverse-on-surface/70">practice session</span>
      </div>

      {showLiveTerminal && wssUrl && (
        <div className="relative flex-1" style={{ minHeight: 320 }}>
          <ClaudeCodeTerminal wssUrl={wssUrl} onUpstreamDead={onUpstreamDead} />

          {status === 'ended' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-inverse-surface/95 px-6 py-10 text-center">
              <p className="font-body text-sm font-semibold text-inverse-on-surface">
                {endReason ? END_MESSAGES[endReason].title : 'Practice session ended.'}
              </p>
              <p className="font-body text-sm text-inverse-on-surface/70">
                {endMessage ?? (endReason ? END_MESSAGES[endReason].body : 'Continue when you are ready.')}
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
            </div>
          )}
        </div>
      )}

      {!showLiveTerminal && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          {status === 'idle' && !displayedStartError && (
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

          {status === 'idle' && displayedStartError && (
            <>
              <p className="font-body text-sm text-inverse-on-surface/80">{displayedStartError}</p>
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

          {status === 'ended' && (
            <>
              <p className="font-body text-sm font-semibold text-inverse-on-surface">
                {endReason ? END_MESSAGES[endReason].title : 'Practice session ended.'}
              </p>
              <p className="font-body text-sm text-inverse-on-surface/70">
                {endMessage ?? (endReason ? END_MESSAGES[endReason].body : 'Continue when you are ready.')}
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
      )}
    </section>
  )
}
