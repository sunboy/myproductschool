import { useState, useEffect } from 'react'

interface ProgressSummary {
  streak_days: number
  streak_shield_count: number
  xp_total: number
}

export function useProgressSummary() {
  const [data, setData] = useState<ProgressSummary | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setData({
        streak_days: d.streak_days ?? 0,
        streak_shield_count: d.streak_shield_count ?? 0,
        xp_total: d.xp_total ?? 0,
      }))
      .catch(() => {})
  }, [])

  return data
}
