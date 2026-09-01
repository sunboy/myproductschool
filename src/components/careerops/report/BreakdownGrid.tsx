'use client'

import { motion } from 'framer-motion'

import { AnimatedProgress } from '@/components/motion/primitives'
import { motionVariants } from '@/components/motion/tokens'
import type { FitBreakdownDimension } from '@/lib/careerops/types'
import { cardHover } from './revealSequence'
import { CountUp } from './CountUp'

interface BreakdownGridProps {
  breakdown: FitBreakdownDimension[]
  // The cascade gate: bars and counters hold at zero until the hero gauge
  // passes its threshold.
  active: boolean
}

// Cream stat cards, one per scored dimension: big animated %, filling bar,
// the note underneath.
export function BreakdownGrid({ breakdown, active }: BreakdownGridProps) {
  if (breakdown.length === 0) return null

  return (
    <motion.div
      variants={motionVariants.list}
      initial="hidden"
      animate={active ? 'show' : 'hidden'}
      className="grid gap-4 sm:grid-cols-2"
    >
      {breakdown.map((dimension) => {
        const percent = Math.round(dimension.score * 100)
        return (
          <motion.div
            key={dimension.dimension}
            variants={motionVariants.listItem}
            whileHover={cardHover}
            className="rounded-2xl bg-surface-container-low p-5"
          >
            <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              {dimension.dimension}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-on-surface tabular-nums">
                {active ? <CountUp value={percent} durationMs={700} format={(n) => `${Math.round(n)}%`} /> : '0%'}
              </span>
              <span className="text-xs font-semibold text-on-surface-variant">
                weight {Math.round(dimension.weight * 100)}%
              </span>
            </div>
            <AnimatedProgress
              value={active ? percent : 0}
              className="mt-3"
              trackClassName="bg-surface-container-highest"
              barClassName="bg-primary"
            />
            <p className="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">
              {dimension.note}
            </p>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
