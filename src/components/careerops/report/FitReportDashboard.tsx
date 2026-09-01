'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { motionVariants } from '@/components/motion/tokens'
import { reveal } from './revealSequence'
import { BreakdownGrid } from './BreakdownGrid'
import { GapsCard } from './GapsCard'
import { ReadinessCard } from './ReadinessCard'
import { RoastCard } from './RoastCard'
import { ScoreHeroCard } from './ScoreHeroCard'
import type { FitReportData } from './types'

export type FitReportVariant = 'tool' | 'member' | 'share'

interface FitReportDashboardProps {
  data: FitReportData
  variant: FitReportVariant
  // Conversion CTA (signup, save-to-pipeline) rendered inside the cascade.
  ctaSlot?: ReactNode
  // Share band (or actions) rendered at the end of the cascade.
  shareSlot?: ReactNode
}

// The bento report. Hero ink card first; the card cascade below holds until
// the gauge sweep passes its threshold, then staggers in.
export function FitReportDashboard({ data, variant, ctaSlot, shareSlot }: FitReportDashboardProps) {
  // With no gauge (null score) there is nothing to wait for.
  const [cascadeOpen, setCascadeOpen] = useState(data.score === null)

  const isRoast = data.mode === 'resume_roast' && data.roast !== null
  const showReadinessActions = variant === 'member'

  return (
    <div className="space-y-4">
      <ScoreHeroCard
        data={data}
        hatchSize={variant === 'share' ? 96 : 120}
        onRevealProgress={(progress) => {
          if (progress >= reveal.cascadeStartProgress) setCascadeOpen(true)
        }}
      />

      <motion.div
        variants={motionVariants.list}
        initial="hidden"
        animate={cascadeOpen ? 'show' : 'hidden'}
        transition={{ staggerChildren: reveal.cascadeStaggerSec }}
        className="space-y-4"
      >
        {isRoast && data.roast ? (
          <RoastCard roast={data.roast} active={cascadeOpen} />
        ) : (
          <>
            <motion.div variants={motionVariants.listItem}>
              <BreakdownGrid breakdown={data.breakdown} active={cascadeOpen} />
            </motion.div>
            <GapsCard gaps={data.gaps} levelStrategy={data.levelStrategy} active={cascadeOpen} />
            <ReadinessCard
              rows={data.readiness}
              active={cascadeOpen}
              showActions={showReadinessActions}
              compact={variant === 'share'}
            />
          </>
        )}

        {ctaSlot && <motion.div variants={motionVariants.listItem}>{ctaSlot}</motion.div>}
        {shareSlot && <motion.div variants={motionVariants.listItem}>{shareSlot}</motion.div>}
      </motion.div>
    </div>
  )
}
