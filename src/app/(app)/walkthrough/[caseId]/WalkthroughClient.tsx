'use client'

/**
 * Authenticated Walkthrough page, full mode (checkpoints are answerable).
 * Minimal client wrapper: fetches the full-mode payload for the given case
 * and wires checkpoint commits to POST /api/casebook/predictions.
 *
 * This is the small "later phase gets a full module page" placeholder
 * referenced in the Phase 2 task brief. Keep it small.
 */

import { useEffect, useState } from 'react'
import { WalkthroughPlayer } from '@/components/casebook/WalkthroughPlayer'
import type { WalkthroughPayload } from '@/components/casebook/types'
import { adaptReplayResponse } from '@/components/casebook/adaptReplay'
import { BackButton } from '@/components/navigation/BackButton'

interface WalkthroughClientProps {
  caseId: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; payload: WalkthroughPayload }
  | { status: 'error' }

export function WalkthroughClient({ caseId }: WalkthroughClientProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetch(`/api/casebook/replay/${caseId}`)
      .then((res) => {
        if (!res.ok) throw new Error('walkthrough_fetch_failed')
        return res.json()
      })
      .then((raw) => {
        if (!cancelled) setState({ status: 'ready', payload: adaptReplayResponse(raw) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [caseId])

  async function handlePredict(checkpointId: string, optionId: string) {
    const res = await fetch('/api/casebook/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, checkpointId, optionId }),
    })
    if (!res.ok) throw new Error('prediction_failed')
    return res.json()
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
      <BackButton href="/dashboard" label="Back to dashboard" />

      {state.status === 'error' && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-center">
          <p className="font-body text-sm text-on-surface-variant">
            This walkthrough is not available right now.
          </p>
        </div>
      )}

      {state.status === 'loading' && (
        <div
          className="flex min-h-[320px] w-full animate-pulse items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low"
          aria-hidden="true"
        />
      )}

      {state.status === 'ready' && (
        <WalkthroughPlayer payload={state.payload} watchOnly={false} onPredict={handlePredict} />
      )}
    </div>
  )
}
