'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_ORIENTATION_CHALLENGE } from '@/lib/mock-data'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const MAX_CHARS = 1200

export default function OrientationPage() {
  const router = useRouter()
  const [response, setResponse] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const challenge = MOCK_ORIENTATION_CHALLENGE
  const canSubmit = response.trim().length > 0

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.value.length <= MAX_CHARS) {
      setResponse(e.target.value)
    }
  }

  function handleContinue() {
    setSubmitted(true)
    router.push('/challenges')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Welcome banner */}
      <div className="flex items-start gap-3 p-5 bg-primary-fixed rounded-xl border border-primary/20">
        <span className="material-symbols-outlined text-primary text-2xl mt-0.5">waving_hand</span>
        <div>
          <h2 className="font-headline font-bold text-on-surface text-lg">Welcome to HackProduct</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            This is your orientation challenge — a quick 5-minute exercise to establish your baseline.
            Don&apos;t worry about being perfect. The point is to see how Luma&apos;s feedback works.
          </p>
        </div>
      </div>

      {/* Challenge card */}
      <div className="bg-surface-container rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
          <span className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wide">Product Strategy</span>
          <span className="ml-auto bg-secondary-container text-on-secondary-container rounded-full text-xs px-3 py-0.5 font-label">
            Beginner · ~{challenge.estimated_minutes} min
          </span>
        </div>

        <h1 className="font-headline font-bold text-on-surface text-xl">{challenge.title}</h1>

        <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
          {challenge.prompt_text}
        </p>
      </div>

      {/* Luma coaching tip */}
      <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
        <LumaGlyph size={32} state="speaking" className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-label font-semibold text-primary mb-1">Luma&apos;s tip</p>
          <p className="text-sm text-on-surface-variant">
            Don&apos;t restate the symptom — dig into what changed and why. Name at least 3 hypotheses before picking your priority order.
          </p>
        </div>
      </div>

      {/* Response area */}
      <div className="space-y-2">
        <label className="text-sm font-label font-semibold text-on-surface-variant">Your answer</label>
        <textarea
          value={response}
          onChange={handleChange}
          placeholder="Write your answer here…"
          rows={10}
          className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="flex justify-end">
          <span className={`text-xs font-label ${response.length > MAX_CHARS * 0.9 ? 'text-error' : 'text-on-surface-variant'}`}>
            {response.length} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.push('/challenges')}
          className="text-sm font-label text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Skip for now
        </button>

        <button
          onClick={handleContinue}
          disabled={!canSubmit || submitted}
          className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {submitted ? 'Continuing…' : 'Continue to challenges'}
        </button>
      </div>

    </div>
  )
}
