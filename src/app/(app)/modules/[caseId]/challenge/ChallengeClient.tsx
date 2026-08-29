'use client'

/**
 * Authenticated Challenge workspace (full case session). Case content
 * (title, hook, brief_md) is fetched server-side in page.tsx and passed in
 * as `initialPayload` — that is a read-only query, never the provisioning
 * call. "Start challenge" calls the real POST /api/casebook/case/start (via
 * startChallengeSession.ts), which mints an attempt and provisions a live
 * sandbox session, then mounts the real ClaudeCodeTerminal against the
 * returned wss_url. No fixture on this path.
 *
 * Once the session ends, "File report" calls POST /api/casebook/case/
 * [attemptId]/file (owned by another dev on this team, built in parallel).
 * That route files the attempt and grades it in the same call, but there is
 * no public share slug produced by it (publishing a shareable report is a
 * separate, not-yet-built step) — see fileChallengeReport.ts's doc comment.
 * This workspace shows only a minimal grade summary after filing, never the
 * move-diff or narrative detail. A 404 from that route is treated as "not
 * available yet," never a broken button.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { BackButton } from '@/components/navigation/BackButton'
import { ChallengeHeader } from '@/components/casebook/challenge/ChallengeHeader'
import { ChallengeBrief } from '@/components/casebook/challenge/ChallengeBrief'
import { ChallengeTerminal } from '@/components/casebook/challenge/ChallengeTerminal'
import { startChallengeSession } from '@/components/casebook/challenge/startChallengeSession'
import { fileChallengeReport } from '@/components/casebook/challenge/fileChallengeReport'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import type {
  ChallengeEndReason,
  ChallengeFileStatus,
  ChallengePayload,
  ChallengeSessionStatus,
} from '@/components/casebook/challenge/types'

interface ChallengeClientProps {
  caseId: string
  initialPayload: ChallengePayload
}

export function ChallengeClient({ caseId, initialPayload }: ChallengeClientProps) {
  const [sessionStatus, setSessionStatus] = useState<ChallengeSessionStatus>('idle')
  const [endReason, setEndReason] = useState<ChallengeEndReason | null>(null)
  const [endMessage, setEndMessage] = useState<string | null>(null)
  const [wssUrl, setWssUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  // Paywall data for the 'limit_reached' branch. Kept separate from the
  // inline ended-state message ChallengeTerminal already renders — the
  // modal is additive; dismissing it still leaves that calm message visible.
  const [limitInfo, setLimitInfo] = useState<{ used?: number; limit?: number } | null>(null)

  const [fileStatus, setFileStatus] = useState<ChallengeFileStatus>('idle')
  const [fileMessage, setFileMessage] = useState<string | null>(null)
  const [gradeLabel, setGradeLabel] = useState<string | null>(null)
  const [totalScore, setTotalScore] = useState<number | null>(null)

  // Reported in the task summary for teardown; never rendered to the user.
  const lastAttemptIdRef = useRef<string | null>(null)

  const handleStart = useCallback(async () => {
    setSessionStatus('starting')
    setEndReason(null)
    setEndMessage(null)
    setStartError(null)
    setFileStatus('idle')
    setFileMessage(null)
    setGradeLabel(null)
    setTotalScore(null)

    const result = await startChallengeSession(caseId)

    if (!result.ok) {
      if (result.kind === 'limit_reached') {
        setSessionStatus('ended')
        setEndReason('limit_reached')
        setEndMessage(result.message)
        setLimitInfo({ used: result.used, limit: result.limit })
      } else {
        setStartError(result.message)
        setSessionStatus('idle')
      }
      return
    }

    lastAttemptIdRef.current = result.attempt.id

    if (!result.session) {
      // Provisioning did not succeed. Attempt bookkeeping still stands
      // server-side; degrade gracefully rather than hang.
      setSessionStatus('ended')
      setEndReason('session_error')
      setEndMessage(result.session_error ?? 'The session could not start. Give it another try.')
      return
    }

    setWssUrl(result.session.wss_url)
    setExpiresAt(result.session.expires_at)
    setSessionStatus('active')
  }, [caseId])

  // Soft budget end: when the session's server-issued expires_at passes
  // while the session is active, show the calm ended state. The live
  // terminal element stays mounted underneath until the user clicks
  // Continue, so a still-running sandbox is never yanked mid-keystroke.
  useEffect(() => {
    if (sessionStatus !== 'active' || !expiresAt) return
    const remainingMs = new Date(expiresAt).getTime() - Date.now()
    if (remainingMs <= 0) {
      setSessionStatus('ended')
      setEndReason('time_exhausted')
      setEndMessage(null)
      return
    }
    const timeout = setTimeout(() => {
      setSessionStatus('ended')
      setEndReason('time_exhausted')
      setEndMessage(null)
    }, remainingMs)
    return () => clearTimeout(timeout)
  }, [sessionStatus, expiresAt])

  const handleUpstreamDead = useCallback((reason: 'retry_loop' | 'reconnect_failed') => {
    setSessionStatus('ended')
    setEndReason('upstream_dead')
    setEndMessage(
      reason === 'retry_loop'
        ? 'Your session ran into trouble and had to stop. Start again when you are ready.'
        : 'Your session ended. Start again when you are ready.',
    )
  }, [])

  const handleContinue = useCallback(() => {
    setSessionStatus('idle')
    setEndReason(null)
    setEndMessage(null)
    setWssUrl(null)
    setExpiresAt(null)
    setFileStatus('idle')
    setFileMessage(null)
    setGradeLabel(null)
    setTotalScore(null)
  }, [])

  const handleFileReport = useCallback(async () => {
    const attemptId = lastAttemptIdRef.current
    if (!attemptId) return

    setFileStatus('filing')
    setFileMessage(null)

    const result = await fileChallengeReport(attemptId)

    if (!result.ok) {
      setFileStatus(result.kind === 'unavailable' ? 'unavailable' : 'error')
      setFileMessage(result.message)
      return
    }

    setFileStatus('filed')
    setGradeLabel(result.gradeLabel)
    setTotalScore(result.totalScore)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
      <BackButton href="/dashboard" label="Back to dashboard" />

      <div className="flex flex-col gap-4">
        <ChallengeHeader
          caseTitle={initialPayload.case.title}
          difficulty={initialPayload.case.difficulty}
          status={sessionStatus}
          expiresAt={expiresAt}
        />

        <ChallengeBrief
          hook={initialPayload.case.hook}
          briefMd={initialPayload.case.brief_md}
          estMinutes={initialPayload.case.est_minutes}
        />

        <ChallengeTerminal
          status={sessionStatus}
          endReason={endReason}
          endMessage={endMessage}
          wssUrl={wssUrl}
          startError={startError}
          onStart={handleStart}
          onContinue={handleContinue}
          onUpstreamDead={handleUpstreamDead}
          onFileReport={handleFileReport}
          fileStatus={fileStatus}
          fileMessage={fileMessage}
          gradeLabel={gradeLabel}
          totalScore={totalScore}
        />
      </div>

      <PaywallModal
        open={limitInfo !== null}
        feature="cc_case_attempts_total"
        used={limitInfo?.used}
        limit={limitInfo?.limit}
        onClose={() => setLimitInfo(null)}
      />
    </div>
  )
}
