'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CohortChallenge, CohortSubmission } from '@/lib/types'

interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string | null
  avatar_url: string | null
  score: number
  submitted_at: string
}

export function useCohort() {
  const [challenge, setChallenge] = useState<CohortChallenge | null>(null)
  const [submission, setSubmission] = useState<CohortSubmission | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [challengeRes, leaderboardRes] = await Promise.all([
        fetch('/api/cohort/current'),
        fetch('/api/cohort/leaderboard'),
      ])
      if (!challengeRes.ok) throw new Error('Failed to fetch cohort challenge')
      const challengeData = await challengeRes.json()
      setChallenge(challengeData.challenge ?? null)
      setSubmission(challengeData.submission ?? null)

      if (leaderboardRes.ok) {
        const lbData = await leaderboardRes.json()
        setLeaderboard(lbData?.rankings ?? lbData ?? [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const submitResponse = useCallback(async (responseText: string) => {
    const res = await fetch('/api/cohort/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_text: responseText }),
    })
    if (!res.ok) throw new Error('Failed to submit response')
    const data = await res.json()
    setSubmission(data)
    return data as CohortSubmission
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return { challenge, submission, leaderboard, isLoading, error, submitResponse }
}
