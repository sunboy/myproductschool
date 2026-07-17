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
  selectedOptionIds?: string[]
  allowMultiple?: boolean
  elaboration: string
  revealed: boolean
  revealedOptions?: RevealedOption[]
  onOptionSelect: (id: string) => void
  onElaborationChange: (text: string) => void
  disabled: boolean
  elaborationRef?: RefObject<HTMLTextAreaElement | null>
  /** 1-based question number for the round-4 numbered sub-task marker. Chrome only. */
  questionNumber?: number
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
  selectedOptionIds,
  allowMultiple,
  elaboration,
  revealed,
  revealedOptions,
  onOptionSelect,
  onElaborationChange,
  disabled,
  elaborationRef,
  questionNumber,
}: StepQuestionProps) {
  const showOptions = responseType !== 'freeform'
  const showElaboration = responseType !== 'pure_mcq' && responseType !== 'multi_select_mcq'
  const elaborationLabel = ELABORATION_LABELS[responseType] ?? 'Your answer'
  const elaborationPlaceholder = ELABORATION_PLACEHOLDERS[responseType] ?? 'Write your answer…'

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        {questionNumber != null && (
          <span
            className="mt-1 flex size-[22px] shrink-0 items-center justify-center rounded-full font-label text-[11.5px] font-bold"
            style={{ border: '1.5px solid var(--color-forest-800)', color: 'var(--color-forest-800)' }}
          >
            {questionNumber}
          </span>
        )}
        <p className="font-label text-[19px] font-bold text-ink-strong leading-snug" style={{ letterSpacing: '-0.005em' }}>{question.question_text}</p>
      </div>
      {allowMultiple && !revealed && (
        <p className="text-xs text-ink-muted font-label">Select all that apply</p>
      )}

      {showOptions && (
        <div className="space-y-2">
          {[...question.options].sort((a, b) => a.option_label.localeCompare(b.option_label)).map((opt) => {
            const revealData = revealedOptions?.find((r) => r.id === opt.id)
            const isSelected = allowMultiple
              ? (selectedOptionIds ?? []).includes(opt.id)
              : selectedOptionId === opt.id
            return (
              <OptionCard
                key={opt.id}
                option={opt}
                selected={isSelected}
                revealed={revealed}
                revealData={revealData}
                disabled={disabled}
                multiSelect={allowMultiple}
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
            className="w-full rounded-lg border border-hairline bg-card-bright px-4 py-3.5 text-ink-strong font-body text-[13.5px] leading-[1.55] resize-none min-h-[100px] placeholder:text-ink-muted focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      )}
    </div>
  )
}
