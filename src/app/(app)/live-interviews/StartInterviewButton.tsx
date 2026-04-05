'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface StartInterviewButtonProps {
  companyId: string
  roleId: string
}

export default function StartInterviewButton({ companyId, roleId }: StartInterviewButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/live-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, roleId }),
      })
      if (!res.ok) throw new Error('Failed to start interview')
      const { sessionId } = await res.json()
      router.push(`/live-interviews/${sessionId}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className={cn(
        'bg-primary text-on-primary rounded-full px-3 py-1 text-xs font-label font-semibold transition-opacity',
        loading && 'opacity-60 cursor-not-allowed'
      )}
    >
      {loading ? 'Starting…' : 'Start Interview →'}
    </button>
  )
}
