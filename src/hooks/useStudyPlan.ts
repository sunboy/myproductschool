'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StudyPlan, StudyPlanChapter, UserStudyPlan } from '@/lib/types'

interface StudyPlanDetail {
  plan: StudyPlan | null
  chapters: StudyPlanChapter[]
  userProgress: UserStudyPlan | null
  isLoading: boolean
  error: string | null
  activate: () => Promise<void>
}

export function useStudyPlan(slug: string): StudyPlanDetail {
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [chapters, setChapters] = useState<StudyPlanChapter[]>([])
  const [userProgress, setUserProgress] = useState<UserStudyPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlan = useCallback(async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/study-plans/${slug}`)
      if (!res.ok) throw new Error('Failed to fetch study plan')
      const data = await res.json()
      setPlan(data.plan ?? null)
      setChapters(data.chapters ?? [])
      setUserProgress(data.userProgress ?? data.user_progress ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  const activate = useCallback(async () => {
    const res = await fetch(`/api/study-plans/${slug}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error('Failed to activate study plan')
    const data = await res.json()
    setUserProgress(data.user_plan ?? data)
  }, [slug])

  useEffect(() => { fetchPlan() }, [fetchPlan])

  return { plan, chapters, userProgress, isLoading, error, activate }
}
