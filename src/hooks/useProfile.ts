'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Profile } from '@/lib/types'

interface ProfileData extends Profile {
  subscription?: { plan: string; status: string; current_period_end: string } | null
  daily_attempts_today: number
  daily_limit: number | null
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const mutate = useCallback(() => fetchProfile(), [fetchProfile])

  return { profile, isLoading, error, mutate }
}
