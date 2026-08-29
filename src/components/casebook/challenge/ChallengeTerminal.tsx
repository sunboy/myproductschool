'use client'

import { useState } from 'react'
import { ClaudeCodeTerminal } from '@/components/v2/mediums/ClaudeCodeTerminal'
import type { UpstreamDeadReason } from '@/components/v2/mediums/ClaudeCodeTerminal'
import type { ChallengeEndReason, ChallengeFileStatus, ChallengeSessionStatus } from './types'

interface ChallengeTerminalProps {
  status: ChallengeSessionStatus
  endReason: ChallengeEndReason | null
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
   *  upstream has stopped making progress. */
  onUpstreamDead?: (reason: UpstreamDeadReason) => void
  /** File-report action, wired up once the session has ended. Optional —
   *  when absent, no file affordance renders. */
  onFileReport?: () => Promise<void>
  fileStatus?: ChallengeFileStatus
  fileMessage?: string | null
  /** Grade summary once filing has graded the attempt. There is no public
   *  share link here by design: POST /api/casebook/case/[attemptId]/file
   *  files and grades the attempt but does not produce a cc_reports row or
   *  slug — publishing a shareable report is a separate step. Only a
   *  minimal grade label + score render; the move-diff and narrative detail
   *  stay off this surface. */
  gradeLabel?: string | null
  totalScore?: number | null
}

const END_MESSAGES: Record<ChallengeEndReason, { title: string; body: string }> = {
  completed: {
    title: 'Challenge session complete.',
    body: 'File your report when you are ready.',
  },
  time_exhausted: {
    title: 'Challenge session ended.',
    body: 'Time ran out. You can still file what you have.',
  },
  left: {
    title: 'Challenge session ended.',
    body: 'Continue when you are ready.',
  },
  session_error: {
    title: 'The session could not start.',
    body: 'Give it another try.',
  },
  limit_reached: {
    title: 'You are out of challenge attempts for now.',
    body: 'Upgrade for more.',
  },
  upstream_dead: {
    title: 'Your session ended.',
    body: 'Start again when you are ready.',
  },
}

/**
 * Live terminal region for the Challenge workspace. Renders a start screen
 * while idle, a real ClaudeCodeTerminal once a session is provisioned, and
 * a calm end state for every way a session can stop. Once ended, offers a
 * "File report" action wired to POST /api/casebook/case/[attemptId]/file —
 * never surfaces a raw API error string, and never shows the graded
 * move-diff or narrative (that belongs on the learner's own feedback page,
 * not this in-workspace overlay).
 */
export function ChallengeTerminal({
  status,
  endReason,
  endMessage,
  wssUrl,
  startError,
  onStart,
  onContinue,
  onUpstreamDead,
  onFileReport,
  fileStatus = 'idle',
  fileMessage,
  gradeLabel,
  totalScore,
}: ChallengeTerminalProps) {
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
  // session is still 'provisioning' on the server side. Keep it mounted
  // through 'ended' so a still-running sandbox is never yanked mid-keystroke;
  // only unmount on Continue (status back to 'idle').
  const showLiveTerminal = Boolean(wssUrl) && (status === 'active' || status === 'ended')

  const canFile = status === 'ended' && endReason !== 'session_error' && endReason !== 'limit_reached'

  return (
    <section className="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-outline-variant bg-inverse-surface">
      <div className="flex items-center gap-2 border-b border-outline-variant/20 bg-inverse-surface px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant/40" />
        <span className="ml-2 font-mono text-xs text-inverse-on-surface/70">challenge session</span>
      </div>

      {showLiveTerminal && wssUrl && (
        <div className="relative flex-1" style={{ minHeight: 320 }}>
          <ClaudeCodeTerminal wssUrl={wssUrl} onUpstreamDead={onUpstreamDead} />

          {status === 'ended' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-inverse-surface/95 px-6 py-10 text-center">
              <p className="font-body text-sm font-semibold text-inverse-on-surface">
                {endReason ? END_MESSAGES[endReason].title : 'Challenge session ended.'}
              </p>
              <p className="font-body text-sm text-inverse-on-surface/70">
                {endMessage ?? (endReason ? END_MESSAGES[endReason].body : 'Continue when you are ready.')}
              </p>

              {canFile && (
                <ChallengeFileAction
                  onFileReport={onFileReport}
                  fileStatus={fileStatus}
                  fileMessage={fileMessage}
                  gradeLabel={gradeLabel}
                  totalScore={totalScore}
                />
              )}

              {onContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  className="rounded-full bg-secondary-container px-6 py-2.5 font-label text-sm font-semibold text-on-secondary-container transition-opacity hover:opacity-90"
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
                Start challenge
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
                {endReason ? END_MESSAGES[endReason].title : 'Challenge session ended.'}
              </p>
              <p className="font-body text-sm text-inverse-on-surface/70">
                {endMessage ?? (endReason ? END_MESSAGES[endReason].body : 'Continue when you are ready.')}
              </p>

              {canFile && (
                <ChallengeFileAction
                  onFileReport={onFileReport}
                  fileStatus={fileStatus}
                  fileMessage={fileMessage}
                  gradeLabel={gradeLabel}
                  totalScore={totalScore}
                />
              )}

              {onContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  className="rounded-full bg-secondary-container px-6 py-2.5 font-label text-sm font-semibold text-on-secondary-container transition-opacity hover:opacity-90"
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

interface ChallengeFileActionProps {
  onFileReport?: () => Promise<void>
  fileStatus: ChallengeFileStatus
  fileMessage?: string | null
  gradeLabel?: string | null
  totalScore?: number | null
}

/**
 * The file-report affordance. Handles every state the file route can put us
 * in, including a route that 404s because it has not shipped yet (surfaces
 * as `unavailable`, a calm message rather than a broken button) and a 402
 * AI-budget cap (surfaces through the generic `error` message, and is safe
 * to retry — the route leaves the attempt at `filed` on that path). On
 * success, shows only a minimal grade summary — never the move-diff or
 * narrative, and never a link to a public report (none exists yet; see
 * fileChallengeReport.ts).
 */
function ChallengeFileAction({ onFileReport, fileStatus, fileMessage, gradeLabel, totalScore }: ChallengeFileActionProps) {
  if (fileStatus === 'filed') {
    return (
      <p className="font-body text-sm text-inverse-on-surface/70">
        {gradeLabel
          ? `Report filed. Graded ${gradeLabel}${totalScore !== null && totalScore !== undefined ? ` (${totalScore}/100)` : ''}.`
          : 'Report filed.'}
      </p>
    )
  }

  if (!onFileReport) return null

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onFileReport}
        disabled={fileStatus === 'filing'}
        className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {fileStatus === 'filing' ? 'Filing report…' : 'File report'}
      </button>
      {(fileStatus === 'error' || fileStatus === 'unavailable') && fileMessage && (
        <p className="font-body text-xs text-inverse-on-surface/70">{fileMessage}</p>
      )}
    </div>
  )
}
