import type { ReactNode } from 'react'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

interface AppTooltipProps {
  label: string
  children: ReactNode
  side?: TooltipSide
  className?: string
}

const SIDE_CLASS: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

export function AppTooltip({
  label,
  children,
  side = 'top',
  className = '',
}: AppTooltipProps) {
  return (
    <span
      className={[
        'group/tooltip relative inline-flex min-w-0',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
      <span
        role="tooltip"
        className={[
          'pointer-events-none absolute z-50 hidden w-max max-w-[220px] rounded-lg px-2.5 py-1.5 text-left text-[11px] font-label font-bold leading-snug shadow-lg transition-opacity duration-100 delay-0 md:block md:opacity-0',
          'bg-[#1f2b24] text-[#f7efe2] ring-1 ring-white/10',
          'md:group-hover/tooltip:opacity-100 md:group-hover/tooltip:delay-300 md:group-focus-within/tooltip:opacity-100 md:group-focus-within/tooltip:delay-150',
          SIDE_CLASS[side],
        ].join(' ')}
      >
        {label}
      </span>
    </span>
  )
}
