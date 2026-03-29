'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StudyPlan } from '@/lib/types'

export function useStudyPlans() {
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/study-plans')
      if (!res.ok) throw new Error('Failed to fetch study plans')
      const data = await res.json()
      setPlans(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  return { plans, isLoading, error }
}
