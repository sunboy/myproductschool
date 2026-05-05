'use client'

import { type RefObject } from 'react'
import type { ResponseType } from '@/lib/types'
import { OptionCard } from './OptionCard'

interface QuestionOption {
  id: string
  option_label: string
  option_text: string
}

interface RevealedOption {
  id: string
  points: number
  explanation: string
  framework_hint?: string
}

interface StepQuestionProps {
  question: {
    id: string
    question_text: string
    options: QuestionOption[]
  }
  responseType: ResponseType
  selectedOptionId: string | null
  elaboration: string
  revealed: boolean
  revealedOptions?: RevealedOption[]
  onOptionSelect: (id: string) => void
  onElaborationChange: (text: string) => void
  disabled: boolean
  elaborationRef?: RefObject<HTMLTextAreaElement | null>
}

const ELABORATION_LABELS: Partial<Record<ResponseType, string>> = {
  mcq_plus_elaboration: 'Explain your reasoning (optional)',
  modified_option: 'Modify or extend this answer',
  freeform: 'Your answer',
}

const ELABORATION_PLACEHOLDERS: Partial<Record<ResponseType, string>> = {
  mcq_plus_elaboration: 'Add your reasoning (Optional)',
  modified_option: 'Describe how you\'d change or extend this option…',
  freeform: 'Write your full answer here…',
}

export function StepQuestion({
  question,
  responseType,
  selectedOptionId,
  elaboration,
  revealed,
  revealedOptions,
  onOptionSelect,
  onElaborationChange,
  disabled,
  elaborationRef,
}: StepQuestionProps) {
  const showOptions = responseType !== 'freeform'
  const showElaboration = responseType !== 'pure_mcq'
  const elaborationLabel = ELABORATION_LABELS[responseType] ?? 'Your answer'
  const elaborationPlaceholder = ELABORATION_PLACEHOLDERS[responseType] ?? 'Write your answer…'

  return (
    <div className="space-y-4">
      <p className="font-label text-2xl text-on-surface leading-snug" style={{ letterSpacing: '-0.02em', fontWeight: 800 }}>{question.question_text}</p>

      {showOptions && (
        <div className="space-y-2">
          {[...question.options].sort((a, b) => a.option_label.localeCompare(b.option_label)).map((opt) => {
            const revealData = revealedOptions?.find((r) => r.id === opt.id)
            return (
              <OptionCard
                key={opt.id}
                option={opt}
                selected={selectedOptionId === opt.id}
                revealed={revealed}
                revealData={revealData}
                disabled={disabled}
                onSelect={onOptionSelect}
              />
            )
          })}
        </div>
      )}

      {showElaboration && (
        <div className="space-y-1.5">
          <textarea
            ref={elaborationRef}
            value={elaboration}
            onChange={(e) => onElaborationChange(e.target.value)}
            disabled={disabled}
            placeholder={elaborationPlaceholder}
            className="w-full rounded-xl border border-outline-variant/60 bg-white p-3 text-on-surface font-body text-sm resize-none min-h-[100px] shadow-inner focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      )}
    </div>
  )
}
