'use client'
import { useState, useEffect } from 'react'
import { getWordCount } from '@/lib/utils'

interface CanvasSectionProps {
  questionNumber: number
  questionText: string
  wordTarget?: number
  value: string
  onChange: (value: string) => void
  isCollapsed?: boolean
}

export function CanvasSection({
  questionNumber,
  questionText,
  wordTarget = 80,
  value,
  onChange,
  isCollapsed = false,
}: CanvasSectionProps) {
  const [collapsed, setCollapsed] = useState(isCollapsed)
  useEffect(() => { setCollapsed(isCollapsed ?? false) }, [isCollapsed])
  const wordCount = getWordCount(value)
  const isEmpty = wordCount === 0
  const isComplete = wordCount >= wordTarget
  const isInProgress = !isEmpty && !isComplete

  // Depth indicator color: red (0) → amber (30) → green (60+)
  const depthPercent = Math.min(wordCount / wordTarget, 1)
  const depthColor =
    wordCount === 0
      ? 'bg-outline-variant'
      : wordCount < 30
        ? 'bg-error'
        : wordCount < 60
          ? 'bg-tertiary'
          : 'bg-primary'

  // Badge colors based on state
  const badgeBg = isEmpty
    ? 'bg-surface-container-highest text-on-surface-variant'
    : isInProgress
      ? 'bg-tertiary/20 text-tertiary'
      : 'bg-primary/20 text-primary'

  return (
    <div className="bg-surface-container rounded-xl overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 p-4 hover:bg-surface-container-high transition-colors text-left"
      >
        {/* Number badge */}
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${badgeBg}`}
        >
          {questionNumber}
        </span>

        {/* Question text */}
        <span className="flex-1 text-sm font-medium text-on-surface line-clamp-2">
          {questionText}
        </span>

        {/* Word count badge */}
        <span className="flex-shrink-0 text-xs text-on-surface-variant bg-surface-container-high rounded-full px-2.5 py-0.5 font-mono">
          {wordCount}/{wordTarget}
        </span>

        {/* Chevron */}
        <span
          className={`material-symbols-outlined text-on-surface-variant text-base transition-transform ${
            collapsed ? '' : 'rotate-180'
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Depth indicator bar */}
          <div className="h-1 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${depthColor}`}
              style={{ width: `${depthPercent * 100}%` }}
            />
          </div>

          {/* Textarea */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your answer here..."
            className="w-full min-h-32 px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none text-sm leading-relaxed"
          />

          {/* Word count footer */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            {isComplete && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Target reached
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
