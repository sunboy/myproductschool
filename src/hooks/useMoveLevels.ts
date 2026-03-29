'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MoveLevel } from '@/lib/types'

export function useMoveLevels() {
  const [moves, setMoves] = useState<MoveLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/move-levels')
      if (!res.ok) throw new Error('Failed to fetch move levels')
      const data = await res.json()
      setMoves(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { moves, isLoading, error, refresh }
}
