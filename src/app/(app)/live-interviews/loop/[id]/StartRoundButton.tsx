'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function StartRoundButton({ loopId, label }: { loopId: string; label: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch(`/api/interview-loops/${loopId}/start-round`, { method: 'POST' })
      if (res.ok) {
        const { sessionId, roundIndex, discipline } = await res.json()
        const params = new URLSearchParams({ autostart: '1', loop_id: loopId, round_index: String(roundIndex ?? 0) })
        if (discipline) params.set('discipline', discipline)
        router.push(`/live-interviews/${sessionId}?${params.toString()}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="w-full bg-primary text-on-primary rounded-xl py-3 font-label font-bold text-sm disabled:opacity-60"
    >
      {loading ? 'Starting…' : label}
    </button>
  )
}
