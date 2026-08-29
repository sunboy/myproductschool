'use client'

/**
 * Authenticated Practice workspace. Scene/module content (title, goal_md,
 * preload) is fetched server-side in page.tsx and passed in as
 * `initialPayload` — that is a read-only query, never the provisioning
 * call. "Start practice" calls the real POST /api/casebook/practice/start
 * (via startPracticeSession.ts), which mints an attempt and provisions a
 * live sandbox session, then mounts the real ClaudeCodeTerminal against the
 * returned wss_url. No fixture on this path anymore.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { BackButton } from '@/components/navigation/BackButton'
import { PracticeHeader } from '@/components/casebook/practice/PracticeHeader'
import { PracticeGoal } from '@/components/casebook/practice/PracticeGoal'
import { PracticePreload } from '@/components/casebook/practice/PracticePreload'
import { PracticeTerminal } from '@/components/casebook/practice/PracticeTerminal'
import { startPracticeSession } from '@/components/casebook/practice/startPracticeSession'
import type { PracticeEndReason, PracticePayload, PracticeSessionStatus } from '@/components/casebook/practice/types'
import { PaywallModal } from '@/components/paywalls/PaywallModal'

interface PracticeClientProps {
  caseId: string
  sceneId: string
  initialPayload: PracticePayload
}

export function PracticeClient({ caseId, sceneId, initialPayload }: PracticeClientProps) {
  const [sessionStatus, setSessionStatus] = useState<PracticeSessionStatus>('idle')
  const [endReason, setEndReason] = useState<PracticeEndReason | null>(null)
  const [endMessage, setEndMessage] = useState<string | null>(null)
  const [wssUrl, setWssUrl] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  // Paywall data for the 'limit_reached' branch. Kept separate from the
  // inline ended-state message PracticeTerminal already renders — the
  // modal is additive; dismissing it still leaves that calm message visible.
  const [limitInfo, setLimitInfo] = useState<{ used?: number; limit?: number } | null>(null)
  // Reported in the task summary for teardown; never rendered to the user.
  const lastAttemptIdRef = useRef<string | null>(null)

  const handleStart = useCallback(async () => {
    setSessionStatus('starting')
    setEndReason(null)
    setEndMessage(null)
    setStartError(null)

    const result = await startPracticeSession(caseId, sceneId)

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
    setSessionStatus('active')
  }, [caseId, sceneId])

  // Soft budget end: when time_budget_s elapses while the session is
  // active, show the calm ended state. The live terminal element stays
  // mounted underneath until the user clicks Continue, so a still-running
  // sandbox is never yanked mid-keystroke.
  useEffect(() => {
    if (sessionStatus !== 'active') return
    const timeout = setTimeout(() => {
      setSessionStatus('ended')
      setEndReason('time_exhausted')
      setEndMessage(null)
    }, initialPayload.scene.time_budget_s * 1000)
    return () => clearTimeout(timeout)
  }, [sessionStatus, initialPayload.scene.time_budget_s])

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
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
      <BackButton href="/dashboard" label="Back to dashboard" />

      <div className="flex flex-col gap-4">
        <PracticeHeader
          moduleTitle={initialPayload.module.title}
          sceneIndex={initialPayload.sceneIndex}
          sceneCount={initialPayload.sceneCount}
          skillLane={initialPayload.scene.skill_lane}
          timeBudgetS={initialPayload.scene.time_budget_s}
          status={sessionStatus}
        />

        <PracticeGoal goalMd={initialPayload.scene.goal_md} />

        <PracticePreload preload={initialPayload.scene.preload} />

        <PracticeTerminal
          status={sessionStatus}
          endReason={endReason}
          endMessage={endMessage}
          wssUrl={wssUrl}
          startError={startError}
          onStart={handleStart}
          onContinue={handleContinue}
          onUpstreamDead={handleUpstreamDead}
        />
      </div>

      <PaywallModal
        open={limitInfo !== null}
        feature="cc_drill_sessions_weekly"
        used={limitInfo?.used}
        limit={limitInfo?.limit}
        onClose={() => setLimitInfo(null)}
      />
    </div>
  )
}
