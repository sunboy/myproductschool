'use client'

/**
 * Client island that fetches the public teaser payload for a Walkthrough
 * module and renders it in watch-only mode. Used from the marketing page
 * (a server component) so the page keeps its `metadata` export and JSON-LD.
 *
 * Degrades to nothing on any failure: a logged-out marketing page must never
 * show a broken player or an error state.
 */

import { useEffect, useState } from 'react'
import { WalkthroughPlayer } from './WalkthroughPlayer'
import type { WalkthroughPayload } from './types'
import { adaptReplayResponse } from './adaptReplay'

interface TeaserEmbedProps {
  caseId: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; payload: WalkthroughPayload }
  | { status: 'error' }

export function TeaserEmbed({ caseId }: TeaserEmbedProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetch(`/api/casebook/replay/${caseId}?teaser=1`)
      .then((res) => {
        if (!res.ok) throw new Error('teaser_fetch_failed')
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

  if (state.status === 'error') return null

  if (state.status === 'loading') {
    return (
      <div
        className="flex min-h-[320px] w-full animate-pulse items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low"
        aria-hidden="true"
      />
    )
  }

  return <WalkthroughPlayer payload={state.payload} watchOnly />
}
