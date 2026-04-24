'use client'

import { useState } from 'react'

interface DimensionPanel {
  index: number
  dimension: string
  label: string
  icon: string
  score: number
  maxScore: number
  commentary: string
  suggestions: string[]
  needsWork: boolean
}

interface DetectedPattern {
  pattern_name: string
  confidence: number
  evidence: string
  suggestion?: string
}

interface FeedbackAccordionProps {
  dimensions: DimensionPanel[]
  detectedPatterns?: DetectedPattern[]
}

export function FeedbackAccordion({ dimensions, detectedPatterns }: FeedbackAccordionProps) {
  // Start with the first "needs work" panel open, or the first panel
  const firstNeedsWork = dimensions.findIndex(d => d.needsWork)
  const [openPanels, setOpenPanels] = useState<Set<number>>(() => {
    const initial = new Set<number>()
    if (firstNeedsWork >= 0) initial.add(firstNeedsWork)
    return initial
  })

  const togglePanel = (idx: number) => {
    setOpenPanels(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      {dimensions.map((dim, idx) => {
        const isOpen = openPanels.has(idx)
        const isAttention = dim.needsWork
        const statusLabel = isAttention ? 'REQUIRES REVIEW' : 'PASSED'
        const circleClass = isAttention
          ? 'bg-tertiary-container text-on-tertiary-container'
          : 'bg-primary-container text-on-primary-container'
        const borderClass = isAttention
          ? 'border border-error/20 shadow-sm'
          : 'border border-outline-variant/15 shadow-sm'
        const headerBg = isAttention
          ? (isOpen ? 'bg-tertiary/5 hover:bg-tertiary/10' : 'hover:bg-tertiary/5')
          : 'hover:bg-surface-container'

        return (
          <div
            key={dim.dimension}
            className={`bg-white rounded-lg ${borderClass} overflow-hidden`}
          >
            {/* Accordion Header */}
            <button
              onClick={() => togglePanel(idx)}
              className={`w-full flex items-center justify-between p-4 cursor-pointer transition-colors group ${headerBg}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full ${circleClass} flex items-center justify-center text-xs font-bold`}
                >
                  {String(dim.index).padStart(2, '0')}
                </div>
                <span className="font-bold text-on-surface text-left">{dim.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold ${isAttention ? 'text-tertiary' : 'text-primary'}`}
                >
                  {statusLabel}
                </span>
                <span
                  className={`material-symbols-outlined transition-transform duration-200 ${
                    isAttention ? 'text-tertiary' : 'text-stone-400'
                  } ${isOpen ? 'rotate-180' : ''}`}
                >
                  expand_more
                </span>
              </div>
            </button>

            {/* Accordion Content */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-16 pb-4 pt-0 space-y-4">
                  {/* Commentary */}
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {dim.commentary}
                  </p>

                  {/* Suggestions */}
                  {dim.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Suggestions
                      </p>
                      <ul className="space-y-1.5">
                        {dim.suggestions.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm text-on-surface-variant">
                            <span className="material-symbols-outlined text-base text-primary flex-shrink-0 mt-0.5">
                              arrow_forward
                            </span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Attention callout for needs-work items */}
                  {isAttention && (
                    <div className="bg-tertiary-fixed/30 p-3 rounded-md border border-tertiary/10 flex items-start gap-3">
                      <span className="material-symbols-outlined text-tertiary text-lg">
                        lightbulb
                      </span>
                      <p className="text-xs font-semibold text-on-tertiary-fixed-variant">
                        Hatch suggests: &quot;Focus on strengthening this area in your next attempt. Prioritize {dim.label.toLowerCase()} to lift your overall score.&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Detected Patterns / Attention Panel */}
      {detectedPatterns && detectedPatterns.length > 0 && (
        <div className="border-2 border-tertiary/20 bg-tertiary/5 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-lg mt-0.5">
              lightbulb
            </span>
            <div className="space-y-2">
              <p className="font-bold text-on-surface text-sm">Patterns Detected</p>
              {detectedPatterns.map((pattern, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-sm font-semibold text-tertiary">{pattern.pattern_name}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {pattern.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {detectedPatterns[0] && (
            <div className="bg-tertiary-fixed/30 p-3 rounded-md border border-tertiary/10 flex items-start gap-3 ml-8">
              <span className="material-symbols-outlined text-tertiary text-lg">psychology</span>
              <p className="text-xs font-semibold text-on-tertiary-fixed-variant">
                Hatch suggests: &quot;See your Diagnosis for a personalized drill to address these patterns.&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
