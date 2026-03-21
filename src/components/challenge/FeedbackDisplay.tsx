'use client'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import type { LumaFeedbackItem } from '@/lib/types'

interface FeedbackDisplayProps {
  feedback: LumaFeedbackItem[]
  challengeTitle: string
  attemptId: string
  mode: string
  isLoading?: boolean
}

const dimensionConfig = {
  clarity: { label: 'Clarity', icon: 'visibility', color: 'text-primary' },
  structure: { label: 'Structure', icon: 'account_tree', color: 'text-secondary' },
  insight: { label: 'Insight', icon: 'lightbulb', color: 'text-tertiary' },
  feasibility: { label: 'Feasibility', icon: 'engineering', color: 'text-primary' },
  tradeoffs: { label: 'Trade-offs', icon: 'balance', color: 'text-secondary' },
}

function ScoreBar({ score }: { score: number }) {
  const percentage = (score / 10) * 100
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            score >= 8 ? 'bg-primary' : score >= 5 ? 'bg-tertiary' : 'bg-error'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-bold text-sm w-8 text-right ${
        score >= 8 ? 'text-primary' : score >= 5 ? 'text-tertiary' : 'text-error'
      }`}>{score}/10</span>
    </div>
  )
}

export function FeedbackDisplay({ feedback, challengeTitle, attemptId, mode, isLoading }: FeedbackDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-primary-container rounded-2xl">
          <LumaGlyph size={32} className="text-primary animate-luma-glow" animated />
          <div>
            <p className="font-medium text-on-primary-container">Luma is reviewing your response...</p>
            <p className="text-sm text-primary">This usually takes 10–15 seconds.</p>
          </div>
        </div>
        {/* Skeleton cards */}
        {[1,2,3,4,5].map(i => (
          <div key={i} className="p-5 bg-surface-container rounded-2xl border border-outline-variant animate-pulse">
            <div className="h-4 w-24 bg-surface-container-high rounded mb-3" />
            <div className="h-2 w-full bg-surface-container-high rounded mb-4" />
            <div className="h-3 w-full bg-surface-container-high rounded mb-2" />
            <div className="h-3 w-4/5 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>
    )
  }

  const overallScore = feedback.length > 0
    ? Math.round(feedback.reduce((sum, f) => sum + f.score, 0) / feedback.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Overall score header */}
      <div className="flex items-center gap-4 p-5 bg-primary-container rounded-2xl">
        <LumaGlyph size={40} className="text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-primary font-medium">Luma&apos;s assessment</p>
          <p className="font-headline text-2xl font-bold text-on-primary-container">{challengeTitle}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-4xl font-bold text-primary">{overallScore}</div>
          <div className="text-xs text-on-primary-container">out of 10</div>
        </div>
      </div>

      {/* Dimension summary */}
      <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant space-y-3">
        <h3 className="font-medium text-on-surface">Score breakdown</h3>
        {feedback.map(item => {
          const config = dimensionConfig[item.dimension]
          return (
            <div key={item.dimension}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`material-symbols-outlined text-base ${config.color}`}>{config.icon}</span>
                <span className="text-sm font-medium text-on-surface">{config.label}</span>
              </div>
              <ScoreBar score={item.score} />
            </div>
          )
        })}
      </div>

      {/* Detailed dimension feedback */}
      {feedback.map(item => {
        const config = dimensionConfig[item.dimension]
        return (
          <div key={item.dimension} className="p-5 bg-surface-container rounded-2xl border border-outline-variant space-y-3">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${config.color}`}>{config.icon}</span>
              <h3 className="font-headline font-bold text-on-surface">{config.label}</h3>
              <span className={`ml-auto text-sm font-bold ${
                item.score >= 8 ? 'text-primary' : item.score >= 5 ? 'text-tertiary' : 'text-error'
              }`}>{item.score}/10</span>
            </div>
            <p className="text-on-surface text-sm leading-relaxed">{item.commentary}</p>
            {item.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Suggestions</p>
                {item.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="material-symbols-outlined text-base text-primary flex-shrink-0 mt-0.5">arrow_forward</span>
                    <span className="text-on-surface-variant">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
