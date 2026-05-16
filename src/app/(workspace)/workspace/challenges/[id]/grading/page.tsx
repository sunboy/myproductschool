'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { AnimatedProgress, MotionCard, PresencePanel, motion } from '@/components/motion'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 30 // 60s timeout
type GradingStage = 'queued' | 'reviewing' | 'saving' | 'complete'

const GRADING_STAGES: Record<GradingStage, { title: string; body: string; progress: number }> = {
  queued: {
    title: 'Preparing your review',
    body: 'Hatch is lining up the rubric and your response.',
    progress: 18,
  },
  reviewing: {
    title: 'Hatch is reviewing your answer',
    body: 'Analysing your thinking across all 4 dimensions.',
    progress: 58,
  },
  saving: {
    title: 'Writing the feedback',
    body: 'Turning the signals into a readable coaching review.',
    progress: 82,
  },
  complete: {
    title: 'Review ready',
    body: 'Opening your feedback now.',
    progress: 100,
  },
}

function GradingSnow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/25"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 19) % 80}%`,
          }}
          animate={{
            y: [0, 24, 0],
            opacity: [0.12, 0.38, 0.12],
            scale: [0.8, 1.15, 0.8],
          }}
          transition={{
            duration: 2.2 + (i % 4) * 0.35,
            repeat: Infinity,
            delay: i * 0.08,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function GradingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const challengeId = params?.id as string
  const attemptId = searchParams.get('attempt')
  const pollCount = useRef(0)
  const [stage, setStage] = useState<GradingStage>('queued')

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
              if (!cancelled) router.replace(`/challenges/${challengeId}/feedback?attempt=${attemptId}`)
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
        if (!cancelled) router.replace(`/challenges/${challengeId}/feedback?attempt=${attemptId}`)
        return
      }
      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => { cancelled = true }
  }, [attemptId, challengeId, router])

  const stageCopy = GRADING_STAGES[stage]

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <GradingSnow />
      <MotionCard className="relative mx-auto w-full max-w-sm px-6">
        <div className="rounded-[24px] border border-outline-variant/50 bg-surface/90 px-6 py-7 text-center shadow-[0_18px_60px_-42px_rgba(30,27,20,0.7)]">
          <motion.div
            animate={{ y: [0, -4, 0], rotate: stage === 'complete' ? [0, -4, 4, 0] : 0 }}
            transition={{ duration: stage === 'complete' ? 0.5 : 2.8, repeat: stage === 'complete' ? 0 : Infinity, ease: 'easeInOut' }}
          >
            <HatchGlyph size={80} state={stage === 'complete' ? 'celebrating' : 'reviewing'} className="text-primary mx-auto" />
          </motion.div>
          <PresencePanel isOpen className="mt-6 space-y-2" key={stage}>
            <h1 className="font-headline text-2xl font-bold text-on-surface">{stageCopy.title}</h1>
            <p className="text-sm text-on-surface-variant">{stageCopy.body}</p>
          </PresencePanel>
          <AnimatedProgress
            value={stageCopy.progress}
            state={stage === 'complete' ? 'complete' : 'active'}
            className="mt-6 text-on-surface-variant"
            trackClassName="bg-surface-container-high"
            barClassName="bg-primary"
            showValue
          />
        </div>
      </MotionCard>
    </div>
  )
}
