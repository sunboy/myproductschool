'use client'

import { useState, useEffect } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const STORAGE_KEY = 'cc-analytics-onboarded'

type Screen = 'intro' | 'step1' | 'step2' | 'step3'

const SCREENS: Screen[] = ['intro', 'step1', 'step2', 'step3']

const SCREEN_CONTENT: Record<Screen, {
  title: string
  body: string
  icon: string
  hatchState: 'idle' | 'listening' | 'reviewing' | 'speaking' | 'celebrating'
}> = {
  intro: {
    title: 'Drive a real analytics session',
    body: 'This is a live Claude Code terminal connected to BigQuery. No scripts, no mock data. You type, Claude runs the queries and finds the answer.',
    icon: 'terminal',
    hatchState: 'idle',
  },
  step1: {
    title: 'Work through four steps',
    body: 'The stepper at the top shows where you are. Each step has a clear goal: connect the data, explore the drop, break it by segment, then write a skill that captures what you learned.',
    icon: 'view_timeline',
    hatchState: 'speaking',
  },
  step2: {
    title: 'Use the prompts as a starting point',
    body: 'The chips below the terminal suggest what to type next. Click one to load it into the terminal. Edit it before you run it — they are a starting point, not a script.',
    icon: 'tips_and_updates',
    hatchState: 'listening',
  },
  step3: {
    title: 'Mark each step when you have an answer',
    body: "When you find the answer for a step, paste it into the Objective card and mark it done. Hatch checks whether the finding is strong enough before you move on.",
    icon: 'task_alt',
    hatchState: 'reviewing',
  },
}

interface AnalyticsOnboardingOverlayProps {
  onDone: () => void
}

export function AnalyticsOnboardingOverlay({ onDone }: AnalyticsOnboardingOverlayProps) {
  const [screenIdx, setScreenIdx] = useState(0)
  const screen = SCREENS[screenIdx]
  const content = SCREEN_CONTENT[screen]
  const isLast = screenIdx === SCREENS.length - 1

  function advance() {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, '1')
      onDone()
    } else {
      setScreenIdx(i => i + 1)
    }
  }

  function skip() {
    localStorage.setItem(STORAGE_KEY, '1')
    onDone()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(30,27,20,0.65)',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-outline-variant)',
        borderRadius: 20,
        padding: '32px 28px',
        maxWidth: 460, width: '90%',
        display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '0 24px 60px -12px rgba(30,27,20,0.25)',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {SCREENS.map((_, i) => (
            <div key={i} style={{
              width: i === screenIdx ? 20 : 6,
              height: 6, borderRadius: 99,
              background: i === screenIdx ? 'var(--color-primary)' : 'var(--color-outline-variant)',
              transition: 'width 250ms, background 250ms',
            }} />
          ))}
        </div>

        {/* Hatch + icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <HatchGlyph size={56} state={content.hatchState} className="text-primary" />
          <div style={{
            width: 44, height: 44,
            background: 'var(--color-primary-fixed)',
            borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 22, color: 'var(--color-primary)',
              fontVariationSettings: "'FILL' 0, 'wght' 400",
            }}>
              {content.icon}
            </span>
          </div>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 19, fontWeight: 700,
            color: 'var(--color-on-surface)',
            margin: '0 0 8px',
            lineHeight: 1.3,
          }}>
            {content.title}
          </h2>
          <p style={{
            fontSize: 14, lineHeight: 1.65,
            color: 'var(--color-on-surface-variant)',
            margin: 0,
          }}>
            {content.body}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {!isLast && (
            <button
              onClick={skip}
              style={{
                padding: '9px 18px', borderRadius: 99,
                background: 'transparent',
                color: 'var(--color-on-surface-variant)',
                border: '1px solid var(--color-outline-variant)',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              Skip
            </button>
          )}
          <button
            onClick={advance}
            style={{
              padding: '9px 22px', borderRadius: 99,
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {isLast ? 'Start session' : 'Next'}
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              {isLast ? 'play_arrow' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

/** Returns true if the user has not seen the onboarding yet. Server-safe (SSR returns false). */
export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem(STORAGE_KEY)
}
