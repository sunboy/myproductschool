'use client'

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
}

const ELABORATION_LABELS: Partial<Record<ResponseType, string>> = {
  mcq_plus_elaboration: 'Explain your reasoning',
  modified_option: 'Describe your modification',
  freeform: 'Your answer',
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
}: StepQuestionProps) {
  const showOptions = responseType !== 'freeform'
  const showElaboration = responseType !== 'pure_mcq'
  const elaborationLabel = ELABORATION_LABELS[responseType] ?? 'Your answer'

  return (
    <div className="space-y-4">
      <p className="font-headline text-lg text-on-surface">{question.question_text}</p>

      {showOptions && (
        <div className="space-y-2">
          {question.options.map((opt) => {
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
          <label className="font-label text-sm text-on-surface-variant">{elaborationLabel}</label>
          <textarea
            value={elaboration}
            onChange={(e) => onElaborationChange(e.target.value)}
            disabled={disabled}
            placeholder={responseType === 'freeform' ? 'Write your full answer here…' : 'Add your reasoning…'}
            className="w-full rounded-xl border border-outline-variant bg-surface-container p-3 text-on-surface font-body text-sm resize-none min-h-[100px] focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      )}
    </div>
  )
}
