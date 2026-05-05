'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 30 // 60s timeout

export default function GradingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const challengeId = params?.id as string
  const attemptId = searchParams.get('attempt')
  const pollCount = useRef(0)

  useEffect(() => {
    // Mock mode: redirect immediately
    if (!attemptId || attemptId === 'mock') {
      router.replace(`/challenges/${challengeId}/feedback?attempt=mock`)
      return
    }

    let cancelled = false

    async function poll() {
      if (cancelled) return
      pollCount.current += 1

      try {
        const res = await fetch(`/api/attempts/${attemptId}`)
        if (!res.ok) {
          // Attempt not ready yet — retry
          scheduleNext()
          return
        }
        const json = await res.json()
        if (json?.attempt?.feedback_json) {
          // Grading complete
          if (!cancelled) router.replace(`/challenges/${challengeId}/feedback?attempt=${attemptId}`)
          return
        }
      } catch {
        // Network error — retry
      }

      scheduleNext()
    }

    function scheduleNext() {
      if (cancelled || pollCount.current >= MAX_POLLS) {
        // Timed out — redirect anyway to show partial/mock feedback
        if (!cancelled) router.replace(`/challenges/${challengeId}/feedback?attempt=${attemptId}`)
        return
      }
      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => { cancelled = true }
  }, [attemptId, challengeId, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm mx-auto px-6">
        <HatchGlyph size={80} state="reviewing" className="text-primary mx-auto" />
        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-bold text-on-surface">Hatch is reviewing your answer</h1>
          <p className="text-sm text-on-surface-variant">Analysing your thinking across all 4 dimensions…</p>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
