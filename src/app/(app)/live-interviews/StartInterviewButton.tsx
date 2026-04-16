'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { InterviewPaywallGate } from '@/components/paywalls/InterviewPaywallGate'
import { useIsAtLimit, useUsage } from '@/context/UsageContext'

interface StartInterviewButtonProps {
  companyId: string
  roleId: string
  challengeId?: string
}

export default function StartInterviewButton({ companyId, roleId, challengeId }: StartInterviewButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallData, setPaywallData] = useState<{ used: number; limit: number } | null>(null)
  const isAtLimit = useIsAtLimit('interviews')
  const usage = useUsage()

  async function handleStart() {
    if (isAtLimit) {
      setPaywallData({ used: usage.interviews.used, limit: usage.interviews.limit })
      setShowPaywall(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/live-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, roleId, challengeId }),
      })

      if (res.status === 402) {
        const data = await res.json()
        setPaywallData({ used: data.used, limit: data.limit })
        setShowPaywall(true)
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error('Failed to start interview')
      const { sessionId } = await res.json()
      router.push(`/live-interviews/${sessionId}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleStart}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1 bg-primary text-on-primary rounded-full px-3 py-1 text-xs font-label font-semibold transition-opacity',
          loading && 'opacity-60 cursor-not-allowed',
          isAtLimit && 'bg-surface-container-high text-on-surface-variant'
        )}
      >
        {isAtLimit ? (
          <>
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Upgrade
          </>
        ) : loading ? 'Starting…' : 'Start Interview →'}
      </button>

      {showPaywall && paywallData && (
        <InterviewPaywallGate
          used={paywallData.used}
          limit={paywallData.limit}
          onUpgrade={() => router.push('/settings/billing')}
          onDismiss={() => setShowPaywall(false)}
        />
      )}
    </>
  )
}
