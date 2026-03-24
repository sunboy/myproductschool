'use client'

import { useState, useEffect } from 'react'

interface AttemptData {
  attempt: Record<string, unknown>
  feedback: unknown
  patterns: unknown[]
}

export function useAttempt(attemptId: string | null) {
  const [data, setData] = useState<AttemptData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!attemptId) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/attempts/${attemptId}`)
        if (!res.ok) throw new Error('Not found')
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [attemptId])

  return { attempt: data?.attempt, feedback: data?.feedback, patterns: data?.patterns ?? [], isLoading, error }
}
