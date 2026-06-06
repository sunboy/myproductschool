'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

interface AppTooltipProps {
  label: string
  children: ReactNode
  side?: TooltipSide
  className?: string
  disabled?: boolean
}

const SIDE_CLASS: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

const SHOW_DELAY_MS = 300

export function AppTooltip({
  label,
  children,
  side = 'top',
  className = '',
  disabled = false,
}: AppTooltipProps) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Show after a short delay; hide immediately. Asymmetric on purpose so the
  // tooltip never lingers after the pointer leaves.
  const show = () => {
    if (disabled) return
    clearTimer()
    timerRef.current = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS)
  }
  const hide = () => {
    clearTimer()
    setOpen(false)
  }

  useEffect(() => clearTimer, [])

  return (
    // The handlers are presentational: hover/focus on the wrapper only toggles a
    // tooltip. Keyboard users get parity because focus/blur bubble from the real
    // interactive child (button/link) this wraps.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      className={['group/tooltip relative inline-flex min-w-0', className].filter(Boolean).join(' ')}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open && !disabled && (
        <span
          role="tooltip"
          className={[
            'pointer-events-none absolute z-50 hidden w-max max-w-[220px] rounded-lg px-2.5 py-1.5 text-left text-[11px] font-label font-bold leading-snug shadow-lg md:block',
            'bg-[#1f2b24] text-[#f7efe2] ring-1 ring-white/10',
            SIDE_CLASS[side],
          ].join(' ')}
        >
          {label}
        </span>
      )}
    </span>
  )
}
