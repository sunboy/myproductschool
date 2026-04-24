'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const TABS = [
  { id: 'frame', label: 'Frame', icon: 'pentagon', done: true },
  { id: 'list', label: 'List', icon: 'join_inner', active: true },
  { id: 'optimize', label: 'Optimize', icon: 'balance' },
  { id: 'win', label: 'Win', icon: 'emoji_events' },
]

const METRICS = [
  { label: 'New User Retention', value: '14%', delta: '-5%' },
  { label: 'Viral K-Factor', value: '0.82', delta: '+0.3' },
]

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export default function CalibrationSplitPage() {
  const [response, setResponse] = useState('')

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      {/* Step tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-label font-semibold whitespace-nowrap ${
              tab.active
                ? 'bg-primary text-on-primary'
                : tab.done
                  ? 'bg-primary-fixed text-primary'
                  : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {tab.done && <span className="material-symbols-outlined text-base">check</span>}
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </div>
        ))}
      </div>

      {/* Challenge header */}
      <div className="mb-6">
        <span className="text-xs font-label font-semibold text-tertiary uppercase tracking-wider">
          Calibration Challenge
        </span>
        <h1 className="font-headline text-2xl font-bold text-on-surface mt-1">
          The Feature That Backfired
        </h1>
        <Link href="/onboarding/results" className="text-xs text-primary font-label font-semibold hover:underline mt-1 inline-block">
          Skip
        </Link>
      </div>

      {/* Problem statement */}
      <div className="bg-surface-container-low rounded-xl p-5 mb-4">
        <p className="text-sm text-on-surface font-body">
          The team deployed a sharing feature last quarter. Downloads increased 12%, but sessions declined 18% and purchases dropped 9%.
        </p>
      </div>

      {/* Metrics chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {METRICS.map((m) => (
          <div key={m.label} className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-1.5">
            <span className="text-xs font-label text-on-surface-variant">{m.label}:</span>
            <span className="text-xs font-label font-bold text-on-surface">{m.value}</span>
            <span className={`text-xs font-label font-bold ${m.delta.startsWith('+') ? 'text-primary' : 'text-error'}`}>
              {m.delta}
            </span>
          </div>
        ))}
      </div>

      {/* Hatch */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2">
          <HatchGlyph size={28} className="text-primary" state="listening" />
        </div>
      </div>

      {/* Section heading */}
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary text-lg">diamond</span>
        <h2 className="font-headline text-lg font-bold text-on-surface">
          List — Who exactly is affected, and how?
        </h2>
      </div>
      <p className="text-sm text-on-surface-variant font-body mb-4">
        Identify three distinct user segments to investigate root causes. 80–150 words.
      </p>

      {/* Textarea */}
      <div className="relative mb-8">
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={8}
          className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface font-body placeholder:text-on-surface-variant/60 outline-none focus:border-primary transition-colors resize-none"
          placeholder="Identify three user segments and explain how each is affected differently..."
        />
        <span className={`absolute bottom-2 right-3 text-xs font-label ${
          wordCount(response) >= 80 && wordCount(response) <= 150 ? 'text-primary' : 'text-on-surface-variant'
        }`}>
          {wordCount(response)} words
        </span>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-outline-variant pt-6">
        <Link
          href="/onboarding/calibration/frame"
          className="text-sm text-on-surface-variant font-label font-semibold hover:text-on-surface transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Previous
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-sm text-on-surface-variant font-label font-semibold hover:text-on-surface transition-colors px-4 py-2.5">
            Submit
          </button>
          <Link
            href="/onboarding/results"
            className="inline-flex items-center gap-1 bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Next
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
