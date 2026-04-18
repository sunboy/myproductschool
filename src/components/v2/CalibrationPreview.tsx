'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'

export interface StepCalibration {
  stepKey: 'frame' | 'list' | 'optimize' | 'win'
  stepLabel: string
  status: 'pending' | 'correct' | 'incorrect'
  confidenceLabel: string | null
  score?: number
}

export interface CalibrationPreviewProps {
  steps: StepCalibration[]
}

type MarkStatus = 'pending' | 'correct' | 'incorrect'

function StatusMark({ status }: { status: MarkStatus }) {
  if (status === 'pending') {
    return (
      <span
        className="material-symbols-outlined text-base text-on-surface-variant leading-none"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
      >
        radio_button_unchecked
      </span>
    )
  }
  if (status === 'correct') {
    return (
      <span
        className="material-symbols-outlined text-base text-primary leading-none"
        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
      >
        check_circle
      </span>
    )
  }
  return (
    <span
      className="material-symbols-outlined text-base text-tertiary leading-none"
      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
    >
      cancel
    </span>
  )
}

export function CalibrationPreview({ steps }: CalibrationPreviewProps) {
  const markRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevStatuses = useRef<MarkStatus[]>(steps.map((s) => s.status))
  // displayStatuses drives what icon renders — only swapped at the flip midpoint
  // so the old icon remains visible during the rotate-out phase
  const [displayStatuses, setDisplayStatuses] = useState<MarkStatus[]>(
    steps.map((s) => s.status)
  )
  // Fix B: store timeline references so we kill only the specific in-flight
  // timeline, not every tween on the element, on re-run or unmount
  const tlRefs = useRef<(gsap.core.Timeline | null)[]>([])

  useEffect(() => {
    steps.forEach((step, idx) => {
      const prev = prevStatuses.current[idx]
      const curr = step.status

      if (prev === 'pending' && curr !== 'pending') {
        const el = markRefs.current[idx]
        if (!el) return

        // Kill any in-flight timeline for this slot by reference
        if (tlRefs.current[idx]) tlRefs.current[idx]!.kill()

        const tl = gsap.timeline()
        tlRefs.current[idx] = tl

        // Rotate out (old icon visible) → swap icon at midpoint → rotate in
        tl.to(el, {
          rotateX: 90,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            // Element is edge-on (invisible) — safe to swap icon now
            setDisplayStatuses((prev) => {
              const next = [...prev]
              next[idx] = curr
              return next
            })
            gsap.set(el, { rotateX: -90 })
          },
        }).to(el, {
          rotateX: 0,
          duration: 0.3,
          ease: 'back.out(2)',
          onComplete: () => { tlRefs.current[idx] = null },
        })
      }

      prevStatuses.current[idx] = curr
    })

    // Fix B: kill all in-flight timelines by reference on unmount
    return () => {
      tlRefs.current.forEach((tl) => tl?.kill())
    }
  }, [steps])

  return (
    <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <span className="font-label text-xs text-on-surface-variant uppercase tracking-wide">
        Your calibration
      </span>

      {/* Step rows */}
      <div className="flex flex-col gap-2">
        {steps.map((step, idx) => (
          <div key={step.stepKey} className="flex items-center gap-2">
            {/* Perspective wrapper sits outside the ref target so 3D depth is
                applied to the mark container without fighting GSAP's transforms */}
            <div className="w-5 h-5 shrink-0" style={{ perspective: '200px' }}>
              <div
                ref={(el) => { markRefs.current[idx] = el }}
                className="w-full h-full flex items-center justify-center"
              >
                <StatusMark status={displayStatuses[idx]} />
              </div>
            </div>

            {/* Step name */}
            <span className="font-label text-sm font-semibold text-on-surface flex-1">
              {step.stepLabel}
            </span>

            {/* Score + confidence label */}
            <div className="flex items-center gap-1.5 shrink-0">
              {step.score !== undefined && step.status !== 'pending' && (
                <span
                  className={`font-label text-xs font-semibold ${
                    step.status === 'correct' ? 'text-primary' : 'text-tertiary'
                  }`}
                >
                  {Math.round(step.score)}
                </span>
              )}
              {step.confidenceLabel && (
                <span className="font-label text-xs text-on-surface-variant">
                  {step.confidenceLabel}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
