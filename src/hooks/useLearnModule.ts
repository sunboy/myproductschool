'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LearnModule, LearnChapterWithProgress } from '@/lib/types'

interface LearnModuleData {
  module: LearnModule
  chapters: LearnChapterWithProgress[]
}

export function useLearnModule(slug: string) {
  const [data, setData] = useState<LearnModuleData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModule = useCallback(async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/learn/${slug}`)
      if (!res.ok) throw new Error('Module not found')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchModule() }, [fetchModule])

  return { data, isLoading, error, refetch: fetchModule }
}
