'use client'

import { useEffect, useState } from 'react'

/** Shape of /api/challenges/next — the fields the Practice surfaces read. */
export interface NextChallengeData {
  challenge: { id: string; slug?: string | null; title: string }
  reason?: string
  tip?: string
  targets_move?: string | null
  is_calibrated?: boolean
}

let cached: Promise<NextChallengeData | null> | null = null

/**
 * Module-cached fetch of the Hatch recommendation, so HatchPick and the right
 * rail (Next best rep fallback, Focus queue) share one request per page load.
 */
export function fetchNextChallenge(): Promise<NextChallengeData | null> {
  if (!cached) {
    cached = fetch('/api/challenges/next')
      .then(r => (r.ok ? r.json() : null))
      .then(json => (json?.challenge ? (json as NextChallengeData) : null))
      .catch(() => null)
  }
  return cached
}

export function useNextChallenge(): { data: NextChallengeData | null; loading: boolean } {
  const [data, setData] = useState<NextChallengeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchNextChallenge().then(d => {
      if (cancelled) return
      setData(d)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
