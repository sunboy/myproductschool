'use client'

import React, { useEffect, useRef, useState } from 'react'

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
  const prevCoverage = useRef(flowCoverage)
  const [glowing, setGlowing] = useState<Record<string, boolean>>({ frame: false, list: false, optimize: false, win: false })

  useEffect(() => {
    const newGlowing: Record<string, boolean> = {}
    let hasChange = false
    for (const step of STEPS) {
      const prev = prevCoverage.current[step.key]
      const curr = flowCoverage[step.key]
      if (curr > prev) {
        newGlowing[step.key] = true
        hasChange = true
      }
    }
    if (hasChange) {
      setGlowing((g) => ({ ...g, ...newGlowing }))
      const timer = setTimeout(() => {
        setGlowing({ frame: false, list: false, optimize: false, win: false })
      }, 1000)
      prevCoverage.current = flowCoverage
      return () => clearTimeout(timer)
    }
    prevCoverage.current = flowCoverage
  }, [flowCoverage])

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
          const isGlowing = glowing[key]
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-label text-xs text-on-surface-variant">{label}</span>
                <span className="rounded-full bg-surface-container px-2 py-0.5 font-label text-xs text-on-surface-variant">
                  {pct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-container-high relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass ?? ''}`}
                  style={{
                    width: `${pct}%`,
                    ...(colorStyle ?? {}),
                    ...(isGlowing ? { boxShadow: '0 0 0 3px rgba(74, 124, 89, 0.3)' } : {}),
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
