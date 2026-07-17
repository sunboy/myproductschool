'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { HatchImage } from '@/components/redesign/HatchImage'
import { AnimatedProgress, MotionCard, PresencePanel } from '@/components/motion'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 30 // 60s timeout
type GradingStage = 'queued' | 'reviewing' | 'saving' | 'complete'

const GRADING_STAGES: Record<GradingStage, { title: string; body: string; progress: number }> = {
  queued: {
    title: 'Reading your reasoning the way a hiring panel would',
    body: 'The part they care about is not whether you got it. It is how you got there.',
    progress: 18,
  },
  reviewing: {
    title: 'Reading your reasoning the way a hiring panel would',
    body: 'Following the moves you made, in the order you made them.',
    progress: 58,
  },
  saving: {
    title: 'Finding the move you made well',
    body: 'And the one rep that would sharpen it.',
    progress: 82,
  },
  complete: {
    title: 'Ready',
    body: 'Opening your feedback now.',
    progress: 100,
  },
}

export default function GradingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const challengeId = params?.id as string
  const attemptId = searchParams.get('attempt')
  const pollCount = useRef(0)
  const [stage, setStage] = useState<GradingStage>('queued')

  // Carry the origin (plan / domain / returnTo) onto the feedback URL so its
  // breadcrumb trail and "back to practice" stay in the same context instead of
  // resetting to a generic Practice root.
  const originSuffix = (() => {
    const qs = new URLSearchParams()
    const fromPlan = searchParams.get('from_plan')
    const fromDomain = searchParams.get('from_domain')
    const returnTo = searchParams.get('returnTo')
    if (fromPlan) qs.set('from_plan', fromPlan)
    if (fromDomain) qs.set('from_domain', fromDomain)
    if (returnTo) qs.set('returnTo', returnTo)
    const s = qs.toString()
    return s ? `&${s}` : ''
  })()

  useEffect(() => {
    // Mock mode: redirect immediately
    if (!attemptId || attemptId === 'mock') {
      router.replace(`/challenges/${challengeId}/feedback?attempt=mock${originSuffix}`)
      return
    }

    let cancelled = false

    async function poll() {
      if (cancelled) return
      pollCount.current += 1
      setStage(pollCount.current < 2 ? 'queued' : pollCount.current < 6 ? 'reviewing' : 'saving')

      try {
        const res = await fetch(`/api/attempts/${attemptId}`)
        if (!res.ok) {
          // Attempt not ready yet - retry
          scheduleNext()
          return
        }
        const json = await res.json()
        if (json?.attempt?.feedback_json) {
          // Grading complete
          if (!cancelled) {
            setStage('complete')
            setTimeout(() => {
              if (!cancelled) router.replace(`/challenges/${challengeId}/feedback?attempt=${attemptId}${originSuffix}`)
            }, 420)
          }
          return
        }
      } catch {
        // Network error - retry
      }

      scheduleNext()
    }

    function scheduleNext() {
      if (cancelled || pollCount.current >= MAX_POLLS) {
        // Timed out - redirect anyway to show partial/mock feedback
        if (!cancelled) router.replace(`/challenges/${challengeId}/feedback?attempt=${attemptId}${originSuffix}`)
        return
      }
      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => { cancelled = true }
  }, [attemptId, challengeId, router, originSuffix])

  const stageCopy = GRADING_STAGES[stage]

  return (
    <div className="relative min-h-screen bg-page-field flex items-center justify-center overflow-hidden">
      <MotionCard className="relative mx-auto w-full max-w-sm px-6">
        <div className="rounded-2xl border border-hairline bg-card-bright px-6 py-7 text-center">
          <HatchImage
            state={stage === 'complete' ? 'celebrating' : 'reviewing'}
            size={96}
            className="mx-auto"
            priority
          />
          <PresencePanel isOpen className="mt-5 space-y-2" key={stage}>
            <h1 className="font-headline text-[22px] leading-snug font-semibold text-forest-950">{stageCopy.title}</h1>
            <p className="text-sm leading-relaxed text-ink-secondary">{stageCopy.body}</p>
          </PresencePanel>
          <AnimatedProgress
            value={stageCopy.progress}
            state={stage === 'complete' ? 'complete' : 'active'}
            className="mt-6 text-ink-secondary"
            trackClassName="bg-hairline"
            barClassName="bg-forest-600"
            showValue
          />
        </div>
      </MotionCard>
    </div>
  )
}
