'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

export interface HatchSidePanelProps {
  message: string
  // Fix D: added 'speaking' — appropriate for coaching panels
  hatchState: 'idle' | 'listening' | 'reviewing' | 'speaking'
  stepName?: string
}

export function HatchSidePanel({ message, hatchState, stepName }: HatchSidePanelProps) {
  const messageRef = useRef<HTMLParagraphElement>(null)
  const glyphRef = useRef<HTMLDivElement>(null)
  const prevMessage = useRef(message)
  const [displayMessage, setDisplayMessage] = useState(message)

  // Fix A: store tween references so we kill only the specific in-flight tween,
  // not everything on the element, and only on actual re-run or unmount.
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const glyphTweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    if (message === prevMessage.current) return

    const msgEl = messageRef.current
    const glyphEl = glyphRef.current

    // Kill previous in-flight tweens by reference, not by element
    if (glyphTweenRef.current) glyphTweenRef.current.kill()
    if (tweenRef.current) tweenRef.current.kill()

    // Glyph scale pulse: 1 → 1.08 → 1
    if (glyphEl) {
      gsap.set(glyphEl, { scale: 1 })
      glyphTweenRef.current = gsap.fromTo(
        glyphEl,
        { scale: 1 },
        {
          scale: 1.08,
          duration: 0.12,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            gsap.set(glyphEl, { scale: 1 })
            glyphTweenRef.current = null
          },
        }
      )
    }

    // Fade out old message → swap content → fade in new message
    if (msgEl) {
      tweenRef.current = gsap.to(msgEl, {
        opacity: 0,
        y: -3,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          setDisplayMessage(message)
          prevMessage.current = message
          tweenRef.current = gsap.fromTo(
            msgEl,
            { opacity: 0, y: 3 },
            {
              opacity: 1,
              y: 0,
              duration: 0.25,
              ease: 'power2.out',
              onComplete: () => { tweenRef.current = null },
            }
          )
        },
      })
    } else {
      setDisplayMessage(message)
      prevMessage.current = message
    }

    // Cleanup on unmount (or before next run if message hasn't settled)
    return () => {
      tweenRef.current?.kill()
      glyphTweenRef.current?.kill()
    }
  }, [message])

  return (
    <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
      {/* Header: Hatch glyph + label */}
      <div className="flex items-center gap-2">
        <div ref={glyphRef} className="shrink-0">
          <HatchGlyph size={48} state={hatchState} className="text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-label text-xs text-on-surface-variant leading-none">Hatch</span>
          {stepName && (
            <span className="font-label text-xs text-on-surface-variant opacity-60 mt-0.5">
              {stepName}
            </span>
          )}
        </div>
      </div>

      {/* Message */}
      <p
        ref={messageRef}
        className="font-body text-sm text-on-surface leading-relaxed font-medium"
      >
        {displayMessage}
      </p>
    </div>
  )
}
