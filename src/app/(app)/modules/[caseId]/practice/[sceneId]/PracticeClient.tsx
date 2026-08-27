'use client'

/**
 * Authenticated Practice workspace. Built against a typed fixture
 * (src/components/casebook/fixtures/practice-fixture.ts) — the API owner
 * has not shipped the real endpoint yet. Swap the fetch below for the real
 * route (something like GET /api/casebook/practice/[caseId]/[sceneId])
 * once it exists; the payload shape is already the contract both sides
 * agreed on (src/components/casebook/practice/types.ts).
 *
 * Does NOT build a PTY/WebSocket client. The terminal region is a
 * placeholder (PracticeTerminal) with an injected onStart callback that the
 * API dev wires to the real session later.
 */

import { useCallback, useEffect, useState } from 'react'
import { BackButton } from '@/components/navigation/BackButton'
import { PracticeHeader } from '@/components/casebook/practice/PracticeHeader'
import { PracticeGoal } from '@/components/casebook/practice/PracticeGoal'
import { PracticePreload } from '@/components/casebook/practice/PracticePreload'
import { PracticeTerminal } from '@/components/casebook/practice/PracticeTerminal'
import { practiceFixture } from '@/components/casebook/fixtures/practice-fixture'
import type {
  PracticeEndReason,
  PracticePayload,
  PracticeSessionStatus,
} from '@/components/casebook/practice/types'

interface PracticeClientProps {
  caseId: string
  sceneId: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; payload: PracticePayload }
  | { status: 'error' }

export function PracticeClient({ caseId, sceneId }: PracticeClientProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [sessionStatus, setSessionStatus] = useState<PracticeSessionStatus>('idle')
  const [endReason, setEndReason] = useState<PracticeEndReason | null>(null)

  useEffect(() => {
    let cancelled = false

    // FIXTURE: replace with a real fetch once the API dev ships the route.
    // Kept as a resolved microtask so the loading state is exercised the
    // same way it will be against a real network call.
    Promise.resolve(practiceFixture)
      .then((payload) => {
        if (cancelled) return
        if (payload.scene.id !== sceneId || payload.module.id !== caseId) {
          setLoadState({ status: 'error' })
          return
        }
        setLoadState({ status: 'ready', payload })
      })
      .catch(() => {
        if (!cancelled) setLoadState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [caseId, sceneId])

  const handleStart = useCallback(async () => {
    setSessionStatus('starting')
    setEndReason(null)
    // Placeholder wiring only. The real implementation calls the sandbox
    // session-start endpoint here and flips to 'active' once the terminal
    // is ready to mount.
    await new Promise((resolve) => setTimeout(resolve, 400))
    setSessionStatus('active')
  }, [])

  // Soft budget end: when time_budget_s elapses while the session is
  // active, end the session with a calm, in-vocabulary message rather than
  // a hard cutoff mid-action. This is UI-only pacing — the real session
  // owner (API dev) decides the authoritative end condition later.
  useEffect(() => {
    if (sessionStatus !== 'active' || loadState.status !== 'ready') return
    const timeout = setTimeout(() => {
      setSessionStatus('ended')
      setEndReason('time_exhausted')
    }, loadState.payload.scene.time_budget_s * 1000)
    return () => clearTimeout(timeout)
  }, [sessionStatus, loadState])

  const handleContinue = useCallback(() => {
    setSessionStatus('idle')
    setEndReason(null)
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
      <BackButton href="/dashboard" label="Back to dashboard" />

      {loadState.status === 'error' && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-center">
          <p className="font-body text-sm text-on-surface-variant">
            This practice session is not available right now.
          </p>
        </div>
      )}

      {loadState.status === 'loading' && (
        <div
          className="flex min-h-[320px] w-full animate-pulse items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low"
          aria-hidden="true"
        />
      )}

      {loadState.status === 'ready' && (
        <div className="flex flex-col gap-4">
          <PracticeHeader
            moduleTitle={loadState.payload.module.title}
            sceneIndex={loadState.payload.sceneIndex}
            sceneCount={loadState.payload.sceneCount}
            skillLane={loadState.payload.scene.skill_lane}
            timeBudgetS={loadState.payload.scene.time_budget_s}
            status={sessionStatus}
          />

          <PracticeGoal goalMd={loadState.payload.scene.goal_md} />

          <PracticePreload preload={loadState.payload.scene.preload} />

          <PracticeTerminal
            status={sessionStatus}
            endReason={endReason}
            onStart={handleStart}
            onContinue={handleContinue}
          />
        </div>
      )}
    </div>
  )
}
