'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const TABS = [
  { id: 'frame', label: 'Frame', icon: 'pentagon' },
  { id: 'split', label: 'Split', icon: 'join_inner' },
  { id: 'weigh', label: 'Weigh', icon: 'balance' },
  { id: 'win', label: 'Win', icon: 'emoji_events' },
]

export default function CalibrationFramePage() {
  const [assumptions, setAssumptions] = useState('')
  const [reframe, setReframe] = useState('')
  const [seconds, setSeconds] = useState(522) // 08:42

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      {/* Step tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-label font-semibold whitespace-nowrap ${
              tab.id === 'frame'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </div>
        ))}
      </div>

      {/* Progress + timer */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-label text-on-surface-variant">Step 1 of 4</span>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full">
          <span className="material-symbols-outlined text-base text-on-surface-variant">timer</span>
          <span className="text-sm font-label font-semibold text-on-surface">{formatTime(seconds)}</span>
        </div>
      </div>

      {/* Luma coach */}
      <div className="flex items-start gap-3 mb-6 bg-surface-container-low rounded-xl p-4">
        <LumaGlyph size={32} className="text-primary flex-shrink-0" state="listening" />
        <div>
          <span className="text-xs font-label font-bold text-primary uppercase tracking-wide">Coach Luma</span>
          <p className="text-sm text-on-surface font-body mt-1">
            I&apos;ll assess how you <strong>Frame</strong> the problem space. I&apos;m evaluating your thinking process, not your product knowledge.
          </p>
        </div>
      </div>

      {/* Category tag */}
      <div className="mb-4">
        <span className="text-xs font-label font-semibold text-tertiary uppercase tracking-wider">
          AI-Assisted Product Strategy · B2C
        </span>
      </div>

      {/* Challenge */}
      <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">
        Spotify is seeing a 15% drop in podcast listening among 25-34 year olds
      </h1>
      <p className="text-on-surface-variant font-body mb-8">
        What&apos;s the real problem here, and how would you frame it for your team?
      </p>

      {/* Textarea 1 */}
      <div className="mb-6">
        <label className="block text-sm font-label font-semibold text-on-surface mb-2">
          What assumptions are baked into the way this problem was stated?
        </label>
        <div className="relative">
          <textarea
            value={assumptions}
            onChange={(e) => setAssumptions(e.target.value.slice(0, 500))}
            rows={5}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface font-body placeholder:text-on-surface-variant/60 outline-none focus:border-primary transition-colors resize-none"
            placeholder="Start typing your analysis..."
          />
          <span className="absolute bottom-2 right-3 text-xs text-on-surface-variant font-label">
            {assumptions.length}/500
          </span>
        </div>
      </div>

      {/* Textarea 2 */}
      <div className="mb-6">
        <label className="block text-sm font-label font-semibold text-on-surface mb-2">
          How would you reframe this problem to open up more solution space?
        </label>
        <div className="relative">
          <textarea
            value={reframe}
            onChange={(e) => setReframe(e.target.value.slice(0, 500))}
            rows={5}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface font-body placeholder:text-on-surface-variant/60 outline-none focus:border-primary transition-colors resize-none"
            placeholder="Start typing your reframe..."
          />
          <span className="absolute bottom-2 right-3 text-xs text-on-surface-variant font-label">
            {reframe.length}/500
          </span>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="bg-tertiary-container/30 border border-tertiary-container rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-tertiary text-base flex-shrink-0 mt-0.5">lightbulb</span>
          <div>
            <span className="text-xs font-label font-bold text-tertiary uppercase tracking-wide">Pro Tip</span>
            <p className="text-sm text-on-surface font-body mt-0.5">
              Look for the &quot;Problem behind the Problem&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Coaching strip */}
      <p className="text-center text-xs text-on-surface-variant font-label mb-8">
        Take your time. Luma sees your reasoning, not just keywords.
      </p>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-outline-variant pt-6">
        <Link
          href="/onboarding/role"
          className="text-sm text-on-surface-variant font-label font-semibold hover:text-on-surface transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back
        </Link>
        <Link
          href="/onboarding/calibration/split"
          className="inline-flex items-center gap-1 bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Next
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
