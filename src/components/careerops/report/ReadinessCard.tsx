'use client'

import { motion } from 'framer-motion'

import { ReadinessRowItem } from '@/components/careerops/ReadinessMap'
import { motionVariants } from '@/components/motion/tokens'
import type { ReadinessRow } from '@/lib/careerops/types'
import { cardHover } from './revealSequence'

interface ReadinessCardProps {
  rows: ReadinessRow[]
  active: boolean
  // Practice/Mock deep links are auth-gated — only the member surface shows them.
  showActions?: boolean
  compact?: boolean
}

// The "what this loop tests" bento card: every demanded discipline as a row
// with a readiness chip, staggered in once the cascade opens.
export function ReadinessCard({ rows, active, showActions = false, compact = false }: ReadinessCardProps) {
  const demanded = rows.filter((row) => row.demanded)
  if (demanded.length === 0) return null

  return (
    <motion.div
      variants={motionVariants.listItem}
      whileHover={cardHover}
      className="rounded-2xl bg-surface-container-low p-5"
    >
      <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        What this loop tests
      </p>
      <motion.div
        variants={motionVariants.list}
        initial="hidden"
        animate={active ? 'show' : 'hidden'}
        className="mt-3 space-y-3"
      >
        {demanded.map((row) => (
          <motion.div key={row.discipline} variants={motionVariants.listItem}>
            <ReadinessRowItem row={row} compact={compact} showActions={showActions} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
