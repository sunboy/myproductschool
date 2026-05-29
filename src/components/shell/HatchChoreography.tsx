'use client'

import type { ReactNode } from 'react'
import type { HatchAnimation } from '@/context/HatchContext'
import { cn } from '@/lib/utils'

interface HatchChoreographyProps {
  animation?: HatchAnimation
  className?: string
  children: ReactNode
}

export function HatchChoreography({
  animation = 'idle-hover',
  className,
  children,
}: HatchChoreographyProps) {
  return (
    <span
      data-hatch-animation={animation}
      className={cn('hatch-choreography', `hatch-motion-${animation}`, className)}
    >
      {children}
    </span>
  )
}
