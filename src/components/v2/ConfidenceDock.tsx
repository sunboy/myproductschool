'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'

export interface ConfidenceDockProps {
  optionSelected: boolean
  confidence: number | null
  onConfidenceChange: (v: number) => void
  reasoning: string
  onReasoningChange: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  submitted: boolean
}

const CONFIDENCE_LABELS = ['Guessing', 'Not sure', 'Fairly sure', 'Rock solid']

export function ConfidenceDock({
  optionSelected,
  confidence,
  onConfidenceChange,
  reasoning,
  onReasoningChange,
  onSubmit,
  submitting,
  submitted,
}: ConfidenceDockProps) {
  const dockRef = useRef<HTMLDivElement>(null)
  const confidenceRowRef = useRef<HTMLDivElement>(null)
  const reasoningRowRef = useRef<HTMLDivElement>(null)
  const submitStripRef = useRef<HTMLDivElement>(null)
  const submitBtnRef = useRef<HTMLButtonElement>(null)
  const fillRefs = useRef<(HTMLDivElement | null)[]>([])
  const [hidden, setHidden] = useState(false)
  const prevOptionSelected = useRef(false)
  const prevConfidence = useRef<number | null>(null)
  const prevSubmitted = useRef(false)

  // Fix C: set initial opacity via GSAP at mount so GSAP owns opacity entirely —
  // no competing Tailwind opacity classes or inline style opacity on these rows.
  useEffect(() => {
    if (confidenceRowRef.current) {
      gsap.set(confidenceRowRef.current, { opacity: 0.3 })
    }
    if (reasoningRowRef.current) {
      gsap.set(reasoningRowRef.current, { opacity: 0 })
    }
  }, [])

  // Animate confidence row in when optionSelected becomes true
  useEffect(() => {
    if (!confidenceRowRef.current) return
    if (optionSelected && !prevOptionSelected.current) {
      gsap.fromTo(
        confidenceRowRef.current,
        { y: 4, opacity: 0.3 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
      )
    }
    prevOptionSelected.current = optionSelected
  }, [optionSelected])

  // Animate reasoning row in when confidence first becomes non-null
  useEffect(() => {
    if (!reasoningRowRef.current) return
    if (confidence !== null && prevConfidence.current === null) {
      gsap.fromTo(
        reasoningRowRef.current,
        { y: 4, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
      )
    }
    prevConfidence.current = confidence
  }, [confidence])

  // Animate fill sweep on confidence buttons
  const handleConfidenceClick = (idx: number) => {
    onConfidenceChange(idx)
    fillRefs.current.forEach((el, i) => {
      if (!el) return
      gsap.killTweensOf(el)
      if (i === idx) {
        gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.32, ease: 'power2.out', transformOrigin: 'left center' })
      } else {
        gsap.to(el, { scaleX: 0, duration: 0.2, ease: 'power2.in', transformOrigin: 'left center' })
      }
    })
  }

  // Submit button ready-pulse animation
  useEffect(() => {
    const btn = submitBtnRef.current
    if (!btn) return
    let tl: gsap.core.Timeline | null = null
    if (confidence !== null && !submitting && !submitted) {
      tl = gsap.timeline({ repeat: -1, yoyo: true })
      tl.to(btn, {
        // primary = #4a7c59
        boxShadow: '0 0 0 6px rgba(74,124,89,0.25)',
        duration: 0.9,
        ease: 'sine.inOut',
      }).to(btn, {
        // primary = #4a7c59
        boxShadow: '0 0 0 0px rgba(74,124,89,0)',
        duration: 0.9,
        ease: 'sine.inOut',
      })
    } else {
      gsap.set(btn, { boxShadow: 'none' })
    }
    return () => {
      if (tl) tl.kill()
      if (btn) gsap.killTweensOf(btn)
    }
  }, [confidence, submitting, submitted])

  // Fade dock out on submit, then unmount via hidden state
  useEffect(() => {
    const dock = dockRef.current
    if (!dock) return
    if (submitted && !prevSubmitted.current) {
      gsap.to(dock, {
        opacity: 0,
        y: -4,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => { setHidden(true) },
      })
    }
    prevSubmitted.current = submitted
  }, [submitted])

  if (hidden) return null

  return (
    <div ref={dockRef} className="flex flex-col gap-3 w-full">
      {/* Confidence row — initial opacity set by GSAP at mount (Fix C), no Tailwind opacity class */}
      <div
        ref={confidenceRowRef}
        className={`flex gap-2 transition-none ${optionSelected ? '' : 'pointer-events-none'}`}
      >
        {CONFIDENCE_LABELS.map((label, idx) => {
          const isSelected = confidence === idx
          return (
            <button
              key={idx}
              onClick={() => handleConfidenceClick(idx)}
              className={`relative flex-1 overflow-hidden rounded-full px-3 py-2 font-label text-xs font-semibold transition-colors focus:outline-none ${
                isSelected
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface'
              }`}
            >
              {/* Fill layer sweeps left→right on select */}
              <div
                ref={(el) => { fillRefs.current[idx] = el }}
                className="absolute inset-0 bg-primary rounded-full"
                style={{ transform: 'scaleX(0)', transformOrigin: 'left center', zIndex: 0 }}
              />
              <span className="relative z-10">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Reasoning row — initial opacity set by GSAP at mount (Fix C), no Tailwind/inline opacity */}
      <div
        ref={reasoningRowRef}
        className={`transition-none ${confidence === null ? 'pointer-events-none' : ''}`}
      >
        <textarea
          value={reasoning}
          onChange={(e) => onReasoningChange(e.target.value)}
          placeholder="What's your reasoning? (optional)"
          rows={2}
          className="w-full resize-none rounded-xl bg-surface-container-low border border-outline-variant text-on-surface font-body text-sm px-3 py-2 placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          style={{ minHeight: '36px' }}
          onFocus={(e) => { e.currentTarget.style.minHeight = '54px' }}
          onBlur={(e) => { e.currentTarget.style.minHeight = '36px' }}
        />
      </div>

      {/* Submit strip */}
      <div
        ref={submitStripRef}
        className={`flex items-center justify-between gap-4 transition-opacity duration-300 ${
          confidence !== null ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="font-label text-xs text-on-surface-variant">
          Press submit when ready
        </span>
        <button
          ref={submitBtnRef}
          onClick={onSubmit}
          disabled={confidence === null || submitting}
          className={`bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm transition-opacity ${
            confidence === null ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          }`}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Submitting…
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </div>
  )
}
