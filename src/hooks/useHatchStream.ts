'use client'
import { useState, useCallback } from 'react'
import type { HatchFeedbackItem } from '@/lib/types'

interface UseHatchFeedbackOptions {
  challengeId: string
  challengeTitle: string
  challengePrompt: string
}

export function useHatchFeedback({ challengeId, challengeTitle, challengePrompt }: UseHatchFeedbackOptions) {
  const [feedback, setFeedback] = useState<HatchFeedbackItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getFeedback = useCallback(async (userResponse: string) => {
    setLoading(true)
    setError(null)
    setFeedback(null)

    try {
      const res = await fetch('/api/hatch/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          challengeTitle,
          challengePrompt,
          response: userResponse,
        }),
      })

      if (!res.ok) throw new Error('Failed to get feedback')

      const data = await res.json()
      setFeedback(Array.isArray(data) ? data : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get feedback')
    } finally {
      setLoading(false)
    }
  }, [challengeId, challengeTitle, challengePrompt])

  return { feedback, loading, error, getFeedback }
}
