'use client'

import { useState, useCallback } from 'react'

interface AchievementDefinition {
  id: string
  key: string
  name: string
  description: string
  icon: string
  xp_reward: number
}

interface Achievement extends AchievementDefinition {
  unlocked_at?: string
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])
  const [isLoading] = useState(false)

  const checkAchievements = useCallback(async (userId: string) => {
    const res = await fetch('/api/achievements/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    const data = await res.json()
    if (data.newly_unlocked?.length > 0) {
      setNewlyUnlocked(data.newly_unlocked)
      setAchievements(prev => [...prev, ...data.newly_unlocked])
    }
    return data.newly_unlocked ?? []
  }, [])

  const clearNewlyUnlocked = useCallback(() => setNewlyUnlocked([]), [])

  return { achievements, newlyUnlocked, isLoading, checkAchievements, clearNewlyUnlocked }
}
