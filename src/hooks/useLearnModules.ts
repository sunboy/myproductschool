'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LearnModuleWithProgress } from '@/lib/types'

export function useLearnModules() {
  const [modules, setModules] = useState<LearnModuleWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/learn')
      if (!res.ok) throw new Error('Failed to fetch learn modules')
      const data = await res.json()
      setModules(data.modules ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchModules() }, [fetchModules])

  return { modules, isLoading, error }
}
