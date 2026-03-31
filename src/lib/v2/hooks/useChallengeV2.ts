'use client'

import { useState, useCallback } from 'react'
import type { Challenge, ChallengeAttemptV2, FlowStepRecord, UserRoleV2 } from '@/lib/types'

interface ChallengeDetail {
  challenge: Challenge
  steps: FlowStepRecord[]
  current_attempt: ChallengeAttemptV2 | null
}

interface UseChallengeV2Return {
  detail: ChallengeDetail | null
  loading: boolean
  error: string | null
  startAttempt: (roleId: UserRoleV2) => Promise<ChallengeAttemptV2 | null>
  reload: () => Promise<void>
}

export function useChallengeV2(challengeId: string): UseChallengeV2Return {
  const [detail, setDetail] = useState<ChallengeDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v2/challenges/${challengeId}`)
      if (!res.ok) throw new Error(`Failed to load challenge: ${res.status}`)
      const data = await res.json()
      setDetail(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [challengeId])

  const startAttempt = useCallback(async (roleId: UserRoleV2): Promise<ChallengeAttemptV2 | null> => {
    setError(null)
    try {
      const res = await fetch(`/api/v2/challenges/${challengeId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Start failed: ${res.status}`)
      }
      const { attempt } = await res.json()
      setDetail((prev) => prev ? { ...prev, current_attempt: attempt } : prev)
      return attempt as ChallengeAttemptV2
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    }
  }, [challengeId])

  return { detail, loading, error, startAttempt, reload }
}
