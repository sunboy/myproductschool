'use client'

import React from 'react'

interface FlowCoveragePanelProps {
  flowCoverage: { frame: number; list: number; optimize: number; win: number }
  totalTurns: number
  className?: string
}

interface FlowStep {
  key: 'frame' | 'list' | 'optimize' | 'win'
  label: string
  colorClass?: string
  colorStyle?: React.CSSProperties
}

const STEPS: FlowStep[] = [
  { key: 'frame', label: 'Frame', colorClass: 'bg-primary' },
  { key: 'list', label: 'List', colorClass: 'bg-tertiary' },
  { key: 'optimize', label: 'Optimize', colorStyle: { backgroundColor: '#4a6fa5' } },
  { key: 'win', label: 'Win', colorStyle: { backgroundColor: '#6b4a7c' } },
]

export default function FlowCoveragePanel({
  flowCoverage,
  totalTurns,
  className,
}: FlowCoveragePanelProps) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-label text-sm font-semibold text-on-surface">FLOW Coverage</span>
        <span className="font-label text-xs text-on-surface-variant">
          Turn {totalTurns} / 10
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {STEPS.map(({ key, label, colorClass, colorStyle }) => {
          const value = flowCoverage[key]
          const pct = Math.round(value * 100)
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-label text-xs text-on-surface-variant">{label}</span>
                <span className="rounded-full bg-surface-container px-2 py-0.5 font-label text-xs text-on-surface-variant">
                  {pct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorClass ?? ''}`}
                  style={{
                    width: `${pct}%`,
                    ...(colorStyle ?? {}),
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
