import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { FailurePattern } from '@/lib/types'

interface DiagnosisCardProps {
  pattern: FailurePattern
  occurrenceCount: number
  isNew?: boolean
  interviewRisk?: string
}

export function DiagnosisCard({ pattern, occurrenceCount, isNew = false, interviewRisk }: DiagnosisCardProps) {
  const badgeClass = occurrenceCount >= 3
    ? 'bg-error-container text-on-error-container'
    : occurrenceCount === 2
    ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
    : 'bg-surface-container-highest text-on-surface-variant'

  return (
    <div className="bg-surface-container rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-headline text-xl text-on-surface">{pattern.pattern_name}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-label font-semibold ${badgeClass}`}>
          {isNew ? 'New pattern' : `${occurrenceCount}× seen`}
        </span>
      </div>

      {pattern.evidence && (
        <blockquote className="border-l-2 border-primary pl-4 italic text-sm text-on-surface-variant">
          &ldquo;{pattern.evidence}&rdquo;
        </blockquote>
      )}

      {interviewRisk && (
        <div className="flex gap-2 text-sm">
          <span className="material-symbols-outlined text-base text-error shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>warning</span>
          <p className="text-on-surface-variant italic">{interviewRisk}</p>
        </div>
      )}
    </div>
  )
}
