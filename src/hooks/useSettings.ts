'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserSettings } from '@/lib/types'

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Failed to update settings')
    const data = await res.json()
    setSettings(data)
    return data as UserSettings
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  return { settings, isLoading, error, updateSettings }
}
