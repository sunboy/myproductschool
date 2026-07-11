import { cn } from '@/lib/utils'

export type InkMarkVariant = 'underline' | 'circle' | 'arrow'

export interface InkMarkProps {
  variant: InkMarkVariant
  width?: number
  height?: number
  /** Ink color. Defaults to forest ink at the spec's 28% opacity. */
  color?: string
  opacity?: number
  className?: string
}

const DEFAULT_SIZE: Record<InkMarkVariant, { width: number; height: number }> = {
  underline: { width: 90, height: 14 },
  circle: { width: 60, height: 34 },
  arrow: { width: 34, height: 22 },
}

/**
 * Hand-drawn SVG ink accents: underline squiggle, circle, arrow. Forest ink
 * at ~28% opacity, 1.8px stroke, imperfect path — per spec §5.4 / §7 "Ink is
 * alive". Zero or one per page (two variants max at 25-30% opacity if truly
 * needed), pointed at meaning (a number, a CTA), never scattered as texture.
 * Paths sourced from previews/round4/dashboard.html .ink-arrow and
 * canvas-workspace.html's hand-drawn annotation.
 */
export function InkMark({ variant, width, height, color = '#123b20', opacity = 0.28, className }: InkMarkProps) {
  const size = { width: width ?? DEFAULT_SIZE[variant].width, height: height ?? DEFAULT_SIZE[variant].height }

  if (variant === 'arrow') {
    return (
      <svg
        width={size.width}
        height={size.height}
        viewBox="0 0 34 22"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        className={cn('shrink-0', className)}
        aria-hidden="true"
      >
        <path d="M2 4c8 1 17 2 24 8" />
        <path d="M20.5 10.5 26.5 12.5 25 6" />
      </svg>
    )
  }

  if (variant === 'circle') {
    return (
      <svg
        width={size.width}
        height={size.height}
        viewBox="0 0 60 34"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        className={cn('shrink-0', className)}
        aria-hidden="true"
      >
        <path d="M30.5 3.5C15 2 3 9 3.5 17.5S17 32 31 31.5s26-8 24-16.5S43 1 30.5 3.5Z" />
      </svg>
    )
  }

  // underline squiggle
  return (
    <svg
      width={size.width}
      height={size.height}
      viewBox="0 0 90 14"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M2 8c10-4 20-6 30-5s19 4 28 3 18-4 28-2" />
    </svg>
  )
}
