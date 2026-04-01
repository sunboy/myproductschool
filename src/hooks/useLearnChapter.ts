'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LearnChapter } from '@/lib/types'

export function useLearnChapter(slug: string, chapter: string) {
  const [data, setData] = useState<LearnChapter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)

  const fetchChapter = useCallback(async () => {
    if (!slug || !chapter) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/learn/${slug}/${chapter}`)
      if (!res.ok) throw new Error('Chapter not found')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [slug, chapter])

  useEffect(() => { fetchChapter() }, [fetchChapter])

  const markComplete = useCallback(async () => {
    setIsMarkingComplete(true)
    try {
      await fetch(`/api/learn/${slug}/${chapter}/complete`, { method: 'POST' })
    } finally {
      setIsMarkingComplete(false)
    }
  }, [slug, chapter])

  return { data, isLoading, error, markComplete, isMarkingComplete }
}
