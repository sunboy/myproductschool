import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ProgressRingProps {
  /** 0-100. */
  percent: number
  size?: number
  strokeWidth?: number
  /** Track (unfilled) stroke color. Defaults to a translucent white for dark hero use. */
  trackColor?: string
  /** Filled stroke color(s). A single color, or [from, to] for a gradient sweep like the gold->mint ring in previews/round4/progress.html. */
  color?: string | [string, string]
  /** Rendered in the center of the ring, e.g. "3/5" + "Weekly Goal". Overrides the default percent label. */
  children?: ReactNode
  className?: string
}

/**
 * Conic progress ring (gold or green), per spec "Signature components" #3
 * and previews/round4/progress.html .ring / dashboard.html .ring-wrap.
 * Implemented as an SVG stroke-dasharray ring (not CSS conic-gradient) so it
 * composes with an arbitrary center slot and works identically on dark and
 * light surfaces.
 */
export function ProgressRing({
  percent,
  size = 72,
  strokeWidth = 10,
  trackColor = 'rgba(255,255,255,.14)',
  color = '#fdb41f',
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped / 100)
  const gradientId = `progress-ring-gradient-${Math.round(radius)}-${Array.isArray(color) ? color.join('-') : color}`
    .replace(/[^a-zA-Z0-9-]/g, '')

  return (
    <div className={cn('relative inline-flex shrink-0 items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Fills once on load from empty to its value (spec §5.7); the global
            reduced-motion guard makes it instant for motion-sensitive users. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={Array.isArray(color) ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="animate-ring-fill"
          style={{ '--ring-circ': `${circumference}` } as CSSProperties}
        />
        {Array.isArray(color) && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color[0]} />
              <stop offset="100%" stopColor={color[1]} />
            </linearGradient>
          </defs>
        )}
      </svg>
      <div className="relative flex flex-col items-center justify-center">
        {children ?? (
          <span className="font-body text-sm font-extrabold tabular-nums text-white">{clamped}%</span>
        )}
      </div>
    </div>
  )
}
