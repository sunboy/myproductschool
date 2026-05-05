'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import type { ChallengeMode } from '@/lib/types'
import { getWordCount } from '@/lib/utils'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { CanvasSection } from './CanvasSection'
import { ConfidenceSlider } from './ConfidenceSlider'

interface PMCanvasProps {
  subQuestions: string[]
  onSubmit: (responses: string[], confidence: number) => void
  submitting: boolean
  mode: ChallengeMode
  nudge?: string | null
  timeLeft?: number
  timeExpired?: boolean
  onResponsesChange?: (responses: string[]) => void
}

export function PMCanvas({
  subQuestions,
  onSubmit,
  submitting,
  mode,
  nudge,
  timeLeft,
  timeExpired,
  onResponsesChange,
}: PMCanvasProps) {
  const [responses, setResponses] = useState<string[]>(() =>
    subQuestions.map(() => '')
  )
  const [confidence, setConfidence] = useState(0) // 0 = not set
  const [quickDraft, setQuickDraft] = useState(false)
  const autoSubmittedRef = useRef(false)

  // Notify parent when responses change (used for workshop nudge ref)
  useEffect(() => {
    onResponsesChange?.(responses)
  }, [responses, onResponsesChange])

  // Auto-submit when spotlight timer expires
  useEffect(() => {
    if (timeExpired && !autoSubmittedRef.current && !submitting) {
      autoSubmittedRef.current = true
      // Submit whatever we have, even with no confidence rating
      const hasContent = responses.some(r => r.trim().length > 0)
      if (hasContent) {
        onSubmit(responses, confidence || 1) // default to 1 if no confidence set
      }
    }
  }, [timeExpired, submitting, responses, confidence, onSubmit])

  const totalWordCount = useMemo(
    () => responses.reduce((sum, r) => sum + getWordCount(r), 0),
    [responses]
  )

  const answeredCount = useMemo(() => responses.filter(r => getWordCount(r) > 0).length, [responses])

  const canSubmit =
    !submitting &&
    confidence > 0 &&
    responses.some((r) => r.trim().length > 0) &&
    !(timeLeft !== undefined && timeLeft <= 0)

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

      {/* Total word count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-on-surface-variant">
          Total: {totalWordCount} {totalWordCount === 1 ? 'word' : 'words'}
        </span>
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
            <HatchGlyph size={16} className="animate-hatch-glow" />
            Hatch is thinking...
          </span>
        ) : (
          'Submit for Hatch feedback'
        )}
      </button>
    </div>
  )
}
