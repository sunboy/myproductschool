'use client'

import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'
import { motionSprings } from './tokens'

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={motionSprings.soft}>
      {children}
    </MotionConfig>
  )
}
