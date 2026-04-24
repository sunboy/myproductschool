'use client'
import { useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { WhatWorkedSection } from '@/components/challenge/WhatWorkedSection'
import { PercentileContext } from '@/components/challenge/PercentileContext'
import { MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import type { HatchFeedbackItem } from '@/lib/types'

type FeedbackFull = typeof MOCK_FEEDBACK_FULL

interface FeedbackDisplayProps {
  feedback: HatchFeedbackItem[] | null
  loading: boolean
  feedbackFull?: FeedbackFull
}

const dimensionConfig: Record<string, { label: string; icon: string }> = {
  diagnostic_accuracy: { label: 'Diagnostic Accuracy', icon: 'manage_search' },
  metric_fluency: { label: 'Metric Fluency', icon: 'analytics' },
  framing_precision: { label: 'Framing Precision', icon: 'frame_inspect' },
  recommendation_strength: { label: 'Recommendation Strength', icon: 'recommend' },
}

function prettifyDimension(key: string): string {
  return dimensionConfig[key]?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function ScoreBar({ score }: { score: number }) {
  const percentage = (score / 10) * 100
  const barColor = score >= 8 ? 'bg-primary' : score >= 5 ? 'bg-tertiary-container' : 'bg-error-container'
  const textColor = score >= 8 ? 'text-primary' : score >= 5 ? 'text-tertiary' : 'text-error'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-label font-bold text-sm w-10 text-right ${textColor}`}>{score}/10</span>
    </div>
  )
}

const TABS = [
  { id: 'coach', label: 'Coach' },
  { id: 'analytics', label: 'Insights' },
  { id: 'history', label: 'History' },
]

export function FeedbackDisplay({ feedback, loading, feedbackFull }: FeedbackDisplayProps) {
  const [activeTab, setActiveTab] = useState<string>('coach')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-primary-container rounded-2xl">
          <HatchGlyph size={32} className="text-primary" state="celebrating" />
          <div>
            <p className="font-label font-medium text-on-primary-container">Hatch is reviewing your response...</p>
            <p className="text-sm text-primary">This usually takes 10–15 seconds.</p>
          </div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-5 bg-surface-container rounded-2xl animate-pulse">
            <div className="h-4 w-32 bg-surface-container-high rounded mb-3" />
            <div className="h-2 w-full bg-surface-container-high rounded mb-4" />
            <div className="h-3 w-full bg-surface-container-high rounded mb-2" />
            <div className="h-3 w-4/5 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>
    )
  }

  const full = feedbackFull ?? MOCK_FEEDBACK_FULL
  const items = feedback ?? full.dimensions as HatchFeedbackItem[]

  const overallScore = items.length > 0
    ? items.reduce((sum, f) => sum + f.score, 0) / items.length
    : 0

  return (
    <div className="space-y-4">
      {/* Tab pills */}
      <div className="flex gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-label font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'coach' && (
        <>
          {/* Overall Assessment */}
          <div className="flex items-start gap-3 p-4 bg-primary-container rounded-2xl">
            <HatchGlyph size={32} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-label font-medium text-on-primary-container mb-1">Hatch&apos;s Assessment</p>
              <p className="text-sm text-on-primary-container leading-relaxed">{full.overall}</p>
            </div>
          </div>

          {/* What Worked / What to Fix */}
          <WhatWorkedSection whatWorked={full.what_worked} whatToFix={full.what_to_fix} />

          {/* Dimension score bars */}
          <div className="bg-surface-container rounded-2xl p-5 space-y-4">
            <h3 className="font-label font-semibold text-on-surface">Score Breakdown</h3>
            {items.map(item => (
              <div key={item.dimension}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-base text-on-surface-variant">
                    {dimensionConfig[item.dimension]?.icon ?? 'bar_chart'}
                  </span>
                  <span className="text-sm font-label font-medium text-on-surface">
                    {prettifyDimension(item.dimension)}
                  </span>
                </div>
                <ScoreBar score={item.score} />
              </div>
            ))}
          </div>

          {/* Key Insight */}
          <div className="bg-tertiary-fixed rounded-2xl p-5 flex gap-3 my-4">
            <span className="material-symbols-outlined text-tertiary flex-shrink-0">lightbulb</span>
            <div>
              <p className="font-label font-semibold text-on-tertiary-fixed-variant mb-1">Key Insight</p>
              <p className="text-sm text-on-tertiary-fixed-variant">{full.key_insight}</p>
            </div>
          </div>

          {/* Percentile context */}
          <PercentileContext score={overallScore} maxScore={10} percentile={full.percentile} />
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.dimension} className="p-5 bg-surface-container rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">
                  {dimensionConfig[item.dimension]?.icon ?? 'bar_chart'}
                </span>
                <h3 className="font-headline font-bold text-on-surface flex-1">
                  {prettifyDimension(item.dimension)}
                </h3>
                <span className={`text-sm font-label font-bold ${
                  item.score >= 8 ? 'text-primary' : item.score >= 5 ? 'text-tertiary' : 'text-error'
                }`}>{item.score}/10</span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed">{item.commentary}</p>
              {item.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wide">Suggestions</p>
                  {item.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="material-symbols-outlined text-base text-primary flex-shrink-0 mt-0.5">arrow_forward</span>
                      <span className="text-on-surface-variant">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="py-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 block">history</span>
          <p className="font-label">Your attempt history will appear here.</p>
        </div>
      )}
    </div>
  )
}
