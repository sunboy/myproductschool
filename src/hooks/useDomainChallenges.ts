'use client'

import { useState, useEffect, useCallback } from 'react'

export interface DomainPanelChallenge {
  id: string
  slug?: string
  title: string
  difficulty?: string | null
  topic_tags?: string[]
  is_completed?: boolean
  is_in_progress?: boolean
}

interface DomainPanelData {
  domain: { id: string; slug: string; title: string; icon?: string | null } | null
  challenges: DomainPanelChallenge[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Client hook for the in-workspace DomainIndexPanel. Mirrors useStudyPlan:
 * fetches a domain's challenges from GET /api/domains/{slug} with per-challenge
 * completion state.
 */
export function useDomainChallenges(slug: string): DomainPanelData {
  const [domain, setDomain] = useState<DomainPanelData['domain']>(null)
  const [challenges, setChallenges] = useState<DomainPanelChallenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDomain = useCallback(async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/domains/${slug}`)
      if (!res.ok) throw new Error('Failed to fetch domain')
      const data = await res.json()
      setDomain(data.domain ?? null)
      setChallenges(data.challenges ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchDomain() }, [fetchDomain])

  return { domain, challenges, isLoading, error, refetch: fetchDomain }
}
