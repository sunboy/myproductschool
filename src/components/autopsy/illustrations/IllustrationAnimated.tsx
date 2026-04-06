'use client'

import * as React from 'react'
import type { IllustrationConfig } from '@/lib/types'
import { cn } from '@/lib/utils'
import type {
  ComparisonBarsData,
  FlywheelData,
  ToolStackData,
  BlockAnatomyData,
  PricingTiersData,
} from './illustrations.types'

interface Props {
  config: IllustrationConfig
  isVisible: boolean
  className?: string
}

// ── Color helpers ─────────────────────────────────────────────────────────────

const COLOR_VAR: Record<'primary' | 'secondary' | 'tertiary', string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  tertiary: 'var(--color-tertiary)',
}

// ── 1. Comparison Bars ────────────────────────────────────────────────────────

function ComparisonBars({ data, isVisible }: { data: ComparisonBarsData; isVisible: boolean }) {
  const bars = data.bars ?? []
  const maxBarWidth = 160
  const labelWidth = 80
  const barHeight = 20
  const rowHeight = 36
  const svgHeight = bars.length * rowHeight + 16
  const svgWidth = 280

  const [displayedValues, setDisplayedValues] = React.useState<number[]>(() => data.bars.map(() => 0))

  React.useEffect(() => {
    if (!isVisible) return
    const duration = 700
    const start = performance.now()
    const targets = bars.map(b => b.value)
    let rafId: number
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setDisplayedValues(targets.map(t => Math.round(t * progress)))
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [isVisible, bars])

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      height="100%"
      style={{ maxHeight: svgHeight, overflow: 'visible' }}
      aria-hidden="true"
    >
      {bars.map((bar, i) => {
        const y = i * rowHeight + 8
        const barColor = COLOR_VAR[bar.color ?? 'primary']
        // value is 0–100; map to maxBarWidth pixels
        const targetWidth = (bar.value / 100) * maxBarWidth
        const trackX = labelWidth + 4
        const centerY = y + barHeight / 2 + 5

        return (
          <g key={i}>
            {/* Label */}
            <text
              x={0}
              y={centerY}
              fontSize={11}
              fill="var(--color-on-surface-variant)"
              dominantBaseline="middle"
              fontFamily="inherit"
            >
              {bar.label}
            </text>

            {/* Track background */}
            <rect
              x={trackX}
              y={y + 3}
              width={maxBarWidth}
              height={barHeight - 6}
              rx={4}
              fill="var(--color-surface-container-highest)"
            />

            {/* Animated fill */}
            <rect
              x={trackX}
              y={y + 3}
              width={0}
              height={barHeight - 6}
              rx={4}
              fill={barColor}
              style={{
                width: isVisible ? targetWidth : 0,
                transition: `width ${0.7 + i * 0.1}s cubic-bezier(0.16,1,0.3,1)`,
                transitionDelay: `${i * 0.12}s`,
              }}
            />

            {/* Value label */}
            <text
              x={trackX + maxBarWidth + 6}
              y={centerY}
              fontSize={10}
              fill="var(--color-on-surface-variant)"
              dominantBaseline="middle"
              fontFamily="inherit"
            >
              {displayedValues[i]}%
            </text>
          </g>
        )
      })}

      {/* Optional insight text */}
      {data.insightText && (
        <text
          x={svgWidth / 2}
          y={svgHeight - 2}
          fontSize={9}
          fill="var(--color-on-surface-variant)"
          textAnchor="middle"
          fontFamily="inherit"
          opacity={0.7}
        >
          {data.insightText}
        </text>
      )}
    </svg>
  )
}

// ── 2. Flywheel ───────────────────────────────────────────────────────────────

function Flywheel({
  data,
  isVisible,
  animationTrigger,
}: {
  data: FlywheelData
  isVisible: boolean
  animationTrigger: IllustrationConfig['animationTrigger']
}) {
  const steps = data.steps ?? []
  const count = steps.length || 1
  const cx = 120
  const cy = 120
  const radius = 80
  const nodeRadius = 18
  const circumference = 2 * Math.PI * radius

  return (
    <svg
      viewBox="0 0 240 240"
      width="100%"
      height="100%"
      style={{ maxHeight: 240, overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Dashed background ring — optionally spinning */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--color-outline-variant)"
        strokeWidth={2}
        strokeDasharray="6 4"
        opacity={0.6}
        style={
          animationTrigger === 'loop'
            ? { animation: 'spin 40s linear infinite', transformOrigin: `${cx}px ${cy}px` }
            : undefined
        }
      />

      {/* Draw-in arc */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={3}
        strokeDasharray={circumference}
        strokeDashoffset={isVisible ? 0 : circumference}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          transition: 'stroke-dashoffset 1.5s ease',
        }}
      />

      {/* Nodes and labels */}
      {steps.map((step, i) => {
        const angleDeg = (i / count) * 360 - 90
        const angleRad = (angleDeg * Math.PI) / 180
        const nx = cx + radius * Math.cos(angleRad)
        const ny = cy + radius * Math.sin(angleRad)

        // Label offset — push outward from center
        const labelRadius = radius + 28
        const lx = cx + labelRadius * Math.cos(angleRad)
        const ly = cy + labelRadius * Math.sin(angleRad)

        return (
          <g key={i}>
            {/* Node circle */}
            <circle
              cx={nx}
              cy={ny}
              r={nodeRadius}
              fill="var(--color-primary-fixed)"
              stroke="var(--color-primary)"
              strokeWidth={2}
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.5s ease',
                transitionDelay: `${0.3 + i * 0.15}s`,
              }}
            />

            {/* Node icon or index */}
            <text
              x={nx}
              y={ny}
              fontSize={10}
              fill="var(--color-primary)"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="inherit"
              fontWeight="600"
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.5s ease',
                transitionDelay: `${0.35 + i * 0.15}s`,
              }}
            >
              {step.icon ?? i + 1}
            </text>

            {/* Step label */}
            <text
              x={lx}
              y={ly}
              fontSize={9}
              fill="var(--color-on-surface)"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="inherit"
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.5s ease',
                transitionDelay: `${0.5 + i * 0.15}s`,
              }}
            >
              {step.label}
            </text>
          </g>
        )
      })}

      {/* Center label */}
      {data.centerLabel && (
        <text
          x={cx}
          y={cy}
          fontSize={11}
          fill="var(--color-on-surface)"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="inherit"
          fontWeight="600"
          opacity={isVisible ? 1 : 0}
          style={{ transition: 'opacity 0.6s ease', transitionDelay: '0.2s' }}
        >
          {data.centerLabel}
        </text>
      )}
    </svg>
  )
}

// ── 3. Tool Stack ─────────────────────────────────────────────────────────────

function ToolStack({ data, isVisible }: { data: ToolStackData; isVisible: boolean }) {
  const replaced = data.replaced ?? []
  const rowHeight = 36
  const svgHeight = (replaced.length + 1) * rowHeight + 16
  const svgWidth = 240
  const rectWidth = 200
  const rectX = 20

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      height="100%"
      style={{ maxHeight: svgHeight, overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Replaced tools */}
      {replaced.map((tool, i) => {
        const y = i * rowHeight + 8
        const rectY = y
        const rectH = rowHeight - 8
        const centerY = rectY + rectH / 2

        // Strikethrough line goes across the tool name text area
        const strikeX1 = rectX + 32
        const strikeX2 = rectX + rectWidth - 10
        const strikeLength = strikeX2 - strikeX1

        return (
          <g key={i}>
            {/* Background rect */}
            <rect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectH}
              rx={6}
              fill="var(--color-surface-container-highest)"
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.1}s`,
              }}
            />

            {/* ✕ icon */}
            <text
              x={rectX + 12}
              y={centerY}
              fontSize={11}
              fill="var(--color-error)"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="inherit"
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.1 + 0.05}s`,
              }}
            >
              ✕
            </text>

            {/* Tool name */}
            <text
              x={rectX + 30}
              y={centerY}
              fontSize={11}
              fill="var(--color-on-surface-variant)"
              dominantBaseline="middle"
              fontFamily="inherit"
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.1 + 0.05}s`,
              }}
            >
              {tool.name}
            </text>

            {/* Animated strikethrough */}
            <line
              x1={strikeX1}
              y1={centerY}
              x2={strikeX2}
              y2={centerY}
              stroke="var(--color-error)"
              strokeWidth={1.5}
              strokeDasharray={strikeLength}
              strokeDashoffset={isVisible ? 0 : strikeLength}
              opacity={0.7}
              style={{
                transition: `stroke-dashoffset 0.5s ease`,
                transitionDelay: `${i * 0.1 + 0.25}s`,
              }}
            />
          </g>
        )
      })}

      {/* Replacement tool */}
      {(() => {
        const i = replaced.length
        const y = i * rowHeight + 8
        const rectH = rowHeight - 8
        const centerY = y + rectH / 2

        return (
          <g>
            <rect
              x={rectX}
              y={y}
              width={rectWidth}
              height={rectH}
              rx={6}
              fill="var(--color-primary-fixed)"
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.1}s`,
              }}
            />
            <text
              x={rectX + rectWidth / 2}
              y={centerY}
              fontSize={12}
              fill="var(--color-primary)"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="inherit"
              fontWeight="700"
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.1 + 0.05}s`,
              }}
            >
              {data.replacement}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

// ── 4. Block Anatomy ──────────────────────────────────────────────────────────

function BlockAnatomy({ data, isVisible }: { data: BlockAnatomyData; isVisible: boolean }) {
  const blocks = data.blocks ?? []
  const blockHeight = 44
  const svgHeight = blocks.length * blockHeight + 48
  const svgWidth = 260
  const chromeH = 28
  const contentX = 12
  const contentW = svgWidth - 24
  const badgeW = 64
  const badgeH = 20

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      height="100%"
      style={{ maxHeight: svgHeight, overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Editor chrome — title bar */}
      <rect
        x={0}
        y={0}
        width={svgWidth}
        height={chromeH}
        rx={8}
        fill="var(--color-surface-container-highest)"
      />
      <rect x={0} y={14} width={svgWidth} height={14} fill="var(--color-surface-container-highest)" />

      {/* Three dots */}
      {[12, 24, 36].map((dotX, di) => {
        const dotColors = ['var(--color-error)', 'var(--color-tertiary)', 'var(--color-primary)']
        return (
          <circle
            key={di}
            cx={dotX}
            cy={chromeH / 2}
            r={4}
            style={{ fill: dotColors[di] }}
          />
        )
      })}

      {/* Separator */}
      <line
        x1={0}
        y1={chromeH}
        x2={svgWidth}
        y2={chromeH}
        stroke="var(--color-outline-variant)"
        strokeWidth={1}
      />

      {/* Blocks */}
      {blocks.map((block, i) => {
        const y = chromeH + 4 + i * blockHeight
        const blockColor = COLOR_VAR[block.color ?? 'primary']
        const centerY = y + blockHeight / 2

        // Connecting line from previous block (draw-in)
        const lineY1 = y
        const lineY2 = y + 8
        const lineLength = 8

        return (
          <g key={i}>
            {/* Connecting vertical line */}
            {i > 0 && (
              <line
                x1={contentX + badgeW / 2}
                y1={lineY1}
                x2={contentX + badgeW / 2}
                y2={lineY2}
                stroke="var(--color-outline-variant)"
                strokeWidth={1.5}
                strokeDasharray={lineLength}
                strokeDashoffset={isVisible ? 0 : lineLength}
                style={{
                  transition: 'stroke-dashoffset 0.4s ease',
                  transitionDelay: `${i * 0.15}s`,
                }}
              />
            )}

            {/* Badge */}
            <rect
              x={contentX}
              y={centerY - badgeH / 2}
              width={badgeW}
              height={badgeH}
              rx={10}
              fill={blockColor}
              opacity={isVisible ? 0.15 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.15 + 0.05}s`,
              }}
            />
            <text
              x={contentX + badgeW / 2}
              y={centerY}
              fontSize={9}
              fill={blockColor}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="inherit"
              fontWeight="600"
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.15 + 0.08}s`,
              }}
            >
              {block.type}
            </text>

            {/* Label */}
            <text
              x={contentX + badgeW + 10}
              y={centerY - 6}
              fontSize={10}
              fill="var(--color-on-surface)"
              dominantBaseline="middle"
              fontFamily="inherit"
              fontWeight="600"
              opacity={isVisible ? 1 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.15 + 0.1}s`,
              }}
            >
              {block.label}
            </text>

            {/* Content placeholder rects */}
            <rect
              x={contentX + badgeW + 10}
              y={centerY + 4}
              width={contentW - badgeW - 20}
              height={6}
              rx={3}
              fill="var(--color-surface-container-highest)"
              opacity={isVisible ? 0.8 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.15 + 0.15}s`,
              }}
            />
            <rect
              x={contentX + badgeW + 10}
              y={centerY + 14}
              width={(contentW - badgeW - 20) * 0.65}
              height={6}
              rx={3}
              fill="var(--color-surface-container-highest)"
              opacity={isVisible ? 0.5 : 0}
              style={{
                transition: 'opacity 0.4s ease',
                transitionDelay: `${i * 0.15 + 0.18}s`,
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function IllustrationAnimated({ config, isVisible, className = '' }: Props) {
  const base = `w-full h-full flex items-center justify-center ${className}`

  switch (config.type) {
    case 'comparison_bars': {
      const data = config.data as unknown as ComparisonBarsData
      return (
        <div className={base}>
          <ComparisonBars data={data} isVisible={isVisible} />
        </div>
      )
    }

    case 'flywheel': {
      const data = config.data as unknown as FlywheelData
      return (
        <div className={base}>
          <Flywheel data={data} isVisible={isVisible} animationTrigger={config.animationTrigger} />
        </div>
      )
    }

    case 'tool_stack': {
      const data = config.data as unknown as ToolStackData
      return (
        <div className={base}>
          <ToolStack data={data} isVisible={isVisible} />
        </div>
      )
    }

    case 'block_anatomy': {
      const data = config.data as unknown as BlockAnatomyData
      return (
        <div className={base}>
          <BlockAnatomy data={data} isVisible={isVisible} />
        </div>
      )
    }

    case 'pricing_tiers': {
      const d = config.data as unknown as PricingTiersData
      const tiers = d?.tiers ?? []
      return (
        <div className={cn('w-full flex items-center justify-center gap-3 p-4', className)}>
          {tiers.map((tier, i) => (
            <div
              key={tier.name}
              style={{
                transition: `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
              }}
              className={cn(
                'flex-1 rounded-xl p-3 border bg-surface-container',
                tier.highlighted ? 'ring-2 ring-primary scale-[1.02] bg-primary-container/20' : 'border-outline-variant/40'
              )}
            >
              <div className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wide mb-1">{tier.name}</div>
              <div className="text-lg font-bold text-primary font-headline">{tier.price}</div>
              <ul className="mt-2 space-y-1">
                {tier.features.slice(0, 3).map(f => (
                  <li key={f} className="text-[9px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 10 }}>check_small</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }

    default: {
      return (
        <div className="bg-surface-container rounded-xl flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl">image</span>
            <span className="font-label text-sm">{config.type}</span>
          </div>
        </div>
      )
    }
  }
}
