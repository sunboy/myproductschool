'use client'

import { useState, useEffect } from 'react'
import type { ChallengeStep } from '@/lib/types'

export function useSteps(challengeId: string | null) {
  const [steps, setSteps] = useState<ChallengeStep[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!challengeId) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/challenges/${challengeId}/steps`)
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled) setSteps(json.steps ?? [])
      } catch {
        // Non-fatal — scaffold options simply won't appear
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [challengeId])

  return { steps, isLoading }
}
