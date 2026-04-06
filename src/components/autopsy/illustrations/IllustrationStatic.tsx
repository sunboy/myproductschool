'use client'

import type { IllustrationConfig } from '@/lib/types'
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

export function IllustrationStatic({ config, isVisible, className = '' }: Props) {
  const base = `w-full h-full flex items-center justify-center ${className}`

  switch (config.type) {
    case 'comparison_bars': {
      const data = config.data as unknown as ComparisonBarsData
      const colorMap: Record<string, string> = {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        tertiary: 'bg-tertiary',
      }
      return (
        <div className={base}>
          <div className="w-full space-y-3 px-2">
            {data.bars.map((bar, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label text-xs text-on-surface-variant">{bar.label}</span>
                  <span className="font-label text-xs font-bold text-on-surface">{bar.value}%</span>
                </div>
                <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorMap[bar.color ?? 'primary'] ?? 'bg-primary'}`}
                    style={{
                      width: isVisible ? `${bar.value}%` : '0%',
                      transition: 'width 0.7s ease-out',
                    }}
                  />
                </div>
              </div>
            ))}
            {data.insightText && (
              <p
                className="font-label text-xs text-on-surface-variant mt-2 text-center"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transition: 'opacity 0.5s ease-out 0.6s',
                }}
              >
                {data.insightText}
              </p>
            )}
          </div>
        </div>
      )
    }

    case 'flywheel': {
      const data = config.data as unknown as FlywheelData
      const count = data.steps.length
      const radius = 72
      const center = 96
      const isLoop = config.animationTrigger === 'loop'

      return (
        <div className={base}>
          <div
            className="relative w-48 h-48 mx-auto"
            style={isLoop ? { animation: 'spin 60s linear infinite' } : undefined}
          >
            {/* Dashed ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-outline-variant" />

            {/* Center label */}
            {data.centerLabel && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-label font-bold text-primary text-center px-4">
                  {data.centerLabel}
                </span>
              </div>
            )}

            {/* Nodes */}
            {data.steps.map((step, i) => {
              const angleDeg = (i / count) * 360 - 90
              const angleRad = (angleDeg * Math.PI) / 180
              const x = center + radius * Math.cos(angleRad)
              const y = center + radius * Math.sin(angleRad)

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.4s ease-out',
                    transitionDelay: `${i * 0.15}s`,
                  }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="font-label font-bold text-on-primary" style={{ fontSize: '10px' }}>
                      {i + 1}
                    </span>
                  </div>
                  <span
                    className="font-label text-on-surface-variant text-center leading-tight"
                    style={{ fontSize: '9px', maxWidth: '56px' }}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    case 'tool_stack': {
      const data = config.data as unknown as ToolStackData
      return (
        <div className={base}>
          <div className="w-full space-y-2 px-2">
            {/* Replaced tools */}
            {data.replaced.map((tool, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-highest"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transition: 'opacity 0.4s ease-out',
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <span
                  className="material-symbols-outlined text-error"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20", fontSize: '18px' }}
                >
                  close
                </span>
                <span className="text-sm font-body text-on-surface-variant line-through">{tool.name}</span>
              </div>
            ))}

            {/* Replacement */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-fixed ring-2 ring-primary mt-3"
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.4s ease-out',
                transitionDelay: `${data.replaced.length * 0.1}s`,
              }}
            >
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20", fontSize: '18px' }}
              >
                check_circle
              </span>
              <span className="text-sm font-body font-bold text-on-primary-container">{data.replacement}</span>
            </div>
          </div>
        </div>
      )
    }

    case 'block_anatomy': {
      const data = config.data as unknown as BlockAnatomyData
      const badgeColorMap: Record<string, string> = {
        primary: 'bg-primary text-on-primary',
        secondary: 'bg-secondary text-on-primary',
        tertiary: 'bg-tertiary text-on-primary',
      }
      return (
        <div className={base}>
          <div className="w-full rounded-xl overflow-hidden border border-outline-variant">
            {/* Title bar */}
            <div className="bg-surface-container-high px-3 py-2 flex items-center gap-1.5 border-b border-outline-variant">
              <div className="w-2.5 h-2.5 rounded-full bg-error/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              <span className="ml-2 font-label text-on-surface-variant" style={{ fontSize: '10px' }}>
                notion.so/my-page
              </span>
            </div>

            {/* Block rows */}
            <div className="bg-surface p-3 space-y-1.5">
              {data.blocks.map((block, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
                    transitionDelay: `${i * 0.1}s`,
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-label font-bold shrink-0 ${badgeColorMap[block.color ?? 'primary'] ?? 'bg-primary text-on-primary'}`}
                    style={{ fontSize: '10px' }}
                  >
                    {block.type}
                  </div>
                  <div className="h-3 rounded bg-surface-container-highest flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    case 'pricing_tiers': {
      const data = config.data as unknown as PricingTiersData
      return (
        <div className={base}>
          <div className="flex flex-row gap-2 p-4 w-full">
            {data.tiers.map((tier, i) => (
              <div
                key={i}
                className={`flex-1 rounded-xl p-3 border ${
                  tier.highlighted
                    ? 'bg-primary-fixed border-primary ring-2 ring-primary scale-[1.02]'
                    : 'bg-surface-container border-outline-variant'
                }`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transition: 'opacity 0.4s ease-out',
                  transitionDelay: `${i * 0.12}s`,
                }}
              >
                <p className="text-xs font-label font-bold text-on-surface">{tier.name}</p>
                <p className="text-lg font-label font-bold text-primary mt-0.5">{tier.price}</p>
                <ul className="mt-2 space-y-0.5">
                  {tier.features.slice(0, 3).map((feature, j) => (
                    <li key={j} className="flex items-center gap-1">
                      <span
                        className="material-symbols-outlined text-primary"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20", fontSize: '12px' }}
                      >
                        check
                      </span>
                      <span className="text-on-surface-variant" style={{ fontSize: '10px' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )
    }

    default: {
      return (
        <div className={`${base} bg-surface-container rounded-xl flex flex-col items-center justify-center min-h-[200px] w-full gap-2`}>
          <span
            className="material-symbols-outlined text-on-surface-variant/40 text-4xl"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            image
          </span>
          <span className="text-xs font-label text-on-surface-variant/40 uppercase tracking-widest">
            {config.type}
          </span>
        </div>
      )
    }
  }
}
