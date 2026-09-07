'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LearnChapter } from '@/lib/types'

export async function completeLearnChapter(slug: string, chapter: string) {
  const response = await fetch(`/api/learn/${encodeURIComponent(slug)}/${encodeURIComponent(chapter)}/complete`, { method: 'POST' })
  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Your session expired. Sign in again to save your progress.' : 'Your progress could not be saved. Please try again.')
  }
}

export function useLearnChapter(slug: string, chapter: string) {
  const [data, setData] = useState<LearnChapter | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)

  const fetchChapter = useCallback(async (signal?: AbortSignal) => {
    if (!slug || !chapter) return
    setIsLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/learn/${encodeURIComponent(slug)}/${encodeURIComponent(chapter)}`, { signal })
      if (!res.ok) throw new Error(res.status === 401 ? 'Your session expired. Sign in again to read this chapter.' : 'This chapter could not be loaded. Please try again.')
      const json = await res.json()
      if (!signal?.aborted) setData(json)
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : 'This chapter could not be loaded.')
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [slug, chapter])

  useEffect(() => {
    const controller = new AbortController()
    void fetchChapter(controller.signal)
    return () => controller.abort()
  }, [fetchChapter])

  const markComplete = useCallback(async () => {
    setIsMarkingComplete(true)
    try {
      await completeLearnChapter(slug, chapter)
    } finally {
      setIsMarkingComplete(false)
    }
  }, [slug, chapter])

  return { data, isLoading, error, refetch: fetchChapter, markComplete, isMarkingComplete }
}
