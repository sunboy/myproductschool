'use client'

import { useEffect, useMemo, useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

interface HatchIntroTourProps {
  show: boolean
}

interface TourStep {
  target: string
  eyebrow: string
  title: string
  body: string
}

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-hatch-target="dashboard-hero"]',
    eyebrow: 'Hatch',
    title: 'Your coach keeps the loop focused.',
    body: 'Start with the suggested session when you want the highest-signal rep.',
  },
  {
    target: '[data-hatch-target="dashboard-quick-take"]',
    eyebrow: 'Daily warm-up',
    title: 'Quick Takes are the fastest way to build streaks.',
    body: 'One minute, one judgment call, instant feedback from Hatch.',
  },
  {
    target: '[data-hatch-target="dashboard-session"]',
    eyebrow: 'Practice loop',
    title: 'The main session ties everything together.',
    body: 'Hatch routes you from warm-up to challenge to reflection.',
  },
]

function targetRect(selector: string): TargetRect | null {
  const element = document.querySelector(selector)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

export function HatchIntroTour({ show }: HatchIntroTourProps) {
  const [open, setOpen] = useState(show)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<TargetRect | null>(null)

  const step = TOUR_STEPS[stepIndex]
  const isLastStep = stepIndex === TOUR_STEPS.length - 1

  useEffect(() => {
    setOpen(show)
  }, [show])

  useEffect(() => {
    if (!open) return

    function syncRect() {
      setRect(targetRect(step.target))
    }

    syncRect()
    window.addEventListener('resize', syncRect)
    window.addEventListener('scroll', syncRect, true)

    return () => {
      window.removeEventListener('resize', syncRect)
      window.removeEventListener('scroll', syncRect, true)
    }
  }, [open, step.target])

  const cardPosition = useMemo(() => {
    if (!rect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
    const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight
    const cardWidth = 340
    const gap = 18
    const placeRight = rect.left + rect.width + cardWidth + gap < viewportWidth
    const placeBelow = rect.top + rect.height + 220 + gap < viewportHeight

    const left = placeRight
      ? rect.left + rect.width + gap
      : Math.max(16, Math.min(rect.left, viewportWidth - cardWidth - 16))
    const top = placeRight
      ? Math.max(16, Math.min(rect.top, viewportHeight - 240))
      : placeBelow
        ? rect.top + rect.height + gap
        : Math.max(16, rect.top - 240 - gap)

    return {
      top,
      left,
      transform: 'none',
    }
  }, [rect])

  async function markSeen() {
    setOpen(false)
    await fetch('/api/onboarding/hatch-intro', { method: 'POST' }).catch(() => {})
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Hatch intro tour">
      <div className="absolute inset-0 bg-black/35" />

      {rect && (
        <div
          className="absolute rounded-[28px] border-2 border-primary bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.38),0_18px_48px_rgba(0,0,0,0.18)] transition-all"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className="absolute w-[min(340px,calc(100vw-32px))] rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl"
        style={cardPosition}
      >
        <div className="mb-4 flex items-start gap-3">
          <HatchGlyph size={42} state="speaking" className="shrink-0 text-primary" />
          <div>
            <div className="text-[10px] font-label font-black uppercase tracking-[0.14em] text-primary">
              {step.eyebrow}
            </div>
            <h2 className="mt-1 font-headline text-xl font-bold leading-tight text-on-surface">
              {step.title}
            </h2>
          </div>
        </div>

        <p className="text-sm font-body leading-relaxed text-on-surface-variant">
          {step.body}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {TOUR_STEPS.map((item, index) => (
              <span
                key={item.target}
                className={[
                  'h-1.5 rounded-full transition-all',
                  index === stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-outline-variant',
                ].join(' ')}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markSeen}
              className="rounded-full px-3 py-2 text-xs font-label font-bold text-on-surface-variant hover:bg-surface-container"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  markSeen().catch(() => {})
                } else {
                  setStepIndex(index => index + 1)
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-label font-black text-on-primary"
            >
              {isLastStep ? 'Done' : 'Next'}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
