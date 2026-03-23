'use client'
import { useState, useMemo } from 'react'
import type { ChallengeMode } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { CanvasSection } from './CanvasSection'
import { ConfidenceSlider } from './ConfidenceSlider'

interface PMCanvasProps {
  subQuestions: string[]
  onSubmit: (responses: string[], confidence: number) => void
  submitting: boolean
  mode: ChallengeMode
  nudge?: string | null
  timeLeft?: number
}

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function PMCanvas({
  subQuestions,
  onSubmit,
  submitting,
  mode,
  nudge,
  timeLeft,
}: PMCanvasProps) {
  const [responses, setResponses] = useState<string[]>(() =>
    subQuestions.map(() => '')
  )
  const [confidence, setConfidence] = useState(0) // 0 = not set
  const [quickDraft, setQuickDraft] = useState(false)

  const totalWordCount = useMemo(
    () => responses.reduce((sum, r) => sum + getWordCount(r), 0),
    [responses]
  )

  const answeredCount = responses.filter((r) => getWordCount(r) > 0).length

  const canSubmit =
    !submitting &&
    confidence > 0 &&
    responses.some((r) => r.trim().length > 0) &&
    !(mode === 'spotlight' && timeLeft !== undefined && timeLeft <= 0)

  const handleResponseChange = (index: number, value: string) => {
    setResponses((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(responses, confidence)
  }

  return (
    <div className="space-y-4">
      {/* Coverage chip with progress dots */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-full">
          <span className="text-xs font-medium text-on-surface-variant">Coverage</span>
          <div className="flex gap-1 ml-1">
            {subQuestions.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  getWordCount(responses[i] || '') > 0 ? 'bg-primary' : 'bg-outline-variant'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-on-surface-variant ml-1">
            {answeredCount}/{subQuestions.length}
          </span>
        </div>
      </div>

      {/* Quick Draft toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setQuickDraft(!quickDraft)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            quickDraft ? 'bg-primary' : 'bg-outline-variant'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              quickDraft ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="text-xs text-on-surface-variant">
          Quick draft — collapse answered sections
        </span>
      </div>

      {/* Canvas sections */}
      <div className="space-y-3">
        {subQuestions.map((question, i) => (
          <CanvasSection
            key={i}
            questionNumber={i + 1}
            questionText={question}
            wordTarget={80}
            value={responses[i] || ''}
            onChange={(val) => handleResponseChange(i, val)}
            isCollapsed={quickDraft && getWordCount(responses[i] || '') > 0}
          />
        ))}
      </div>

      {/* Workshop nudge */}
      {mode === 'workshop' && nudge && (
        <div className="flex gap-3 p-4 bg-primary-container rounded-xl">
          <LumaGlyph size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-primary mb-1">Luma nudge</div>
            <p className="text-sm text-on-primary-container">{nudge}</p>
          </div>
        </div>
      )}

      {/* Total word count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-on-surface-variant">
          Total: {totalWordCount} {totalWordCount === 1 ? 'word' : 'words'}
        </span>
        {mode === 'workshop' && (
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <LumaGlyph size={12} className="text-primary" />
            Luma coaches every 3 min
          </span>
        )}
      </div>

      {/* Confidence slider */}
      <ConfidenceSlider value={confidence} onChange={setConfidence} />

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 bg-primary text-on-primary font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <LumaGlyph size={16} className="animate-luma-glow" />
            Luma is thinking...
          </span>
        ) : (
          'Submit for Luma feedback'
        )}
      </button>
    </div>
  )
}
