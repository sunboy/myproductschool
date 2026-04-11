'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface AccordionItem {
  id: string
  slug?: string
  title: string
  difficulty: string
  best_score: number | null
  is_completed: boolean
  is_in_progress?: boolean
}

export interface AccordionChapter {
  key: string
  title: string
  icon: string
  items: AccordionItem[]
}

interface ChallengeAccordionProps {
  chapters: AccordionChapter[]
  defaultOpenIndex?: number
}

export function ChallengeAccordion({ chapters, defaultOpenIndex = 0 }: ChallengeAccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(defaultOpenIndex)

  return (
    <div className="space-y-3">
      {chapters.map((chapter, idx) => {
        const isExpanded = expandedIndex === idx
        const completedCount = chapter.items.filter(i => i.is_completed).length
        const isChapterComplete = chapter.items.length > 0 && completedCount === chapter.items.length
        return (
          <div key={chapter.key} className="border border-outline-variant rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              className="w-full flex items-center justify-between px-5 py-4 bg-surface-container-high/30 hover:bg-surface-container-high/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isChapterComplete ? 'bg-primary/20' : 'bg-primary/10'}`}>
                  <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{chapter.icon}</span>
                </div>
                <div className="text-left">
                  <div className="font-label font-bold text-sm text-on-surface">{chapter.title}</div>
                  {isChapterComplete ? (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-primary mt-0.5">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                      All complete
                    </div>
                  ) : (
                    <div className="text-[11px] text-on-surface-variant font-label mt-0.5 tabular-nums">{completedCount}/{chapter.items.length} completed</div>
                  )}
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">{isExpanded ? 'expand_less' : 'expand_more'}</span>
            </button>
            {isExpanded && (
              <div className="bg-surface divide-y divide-outline-variant/10">
                {chapter.items.map(item => {
                  const inProgress = !item.is_completed && item.is_in_progress
                  return (
                    <Link
                      key={item.id}
                      href={`/workspace/challenges/${item.slug ?? item.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-surface-container group transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`material-symbols-outlined text-[20px] shrink-0 ${item.is_completed ? 'text-primary' : inProgress ? 'text-tertiary' : 'text-outline'}`}
                          style={(item.is_completed || inProgress) ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                          {item.is_completed ? 'check_circle' : inProgress ? 'timelapse' : 'radio_button_unchecked'}
                        </span>
                        <span className={`text-sm font-semibold truncate ${item.is_completed ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {item.best_score != null ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums ${item.best_score >= 70 ? 'text-primary bg-primary-fixed' : 'text-amber-700 bg-tertiary-container'}`}>
                            {item.best_score}/100
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-tight font-label">
                            {inProgress ? 'Resume' : 'Start'}
                          </span>
                        )}
                        <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {chapters.length === 0 && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-outline-variant rounded-xl p-4 h-14 bg-surface-container/50" />
          ))}
        </div>
      )}
    </div>
  )
}
