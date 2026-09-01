'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { FitShareActions } from '@/components/careerops/public/FitShareActions'
import { motionVariants } from '@/components/motion/tokens'
import type { PublicFitMode } from '@/lib/careerops/public/types'

interface ShareBandProps {
  shareUrl: string
  shareText: string
  mode: PublicFitMode
  children?: ReactNode
}

// The ink share strip that closes the report: lime headline, the existing
// share actions (tracking events untouched), a one-shot glow on entrance.
export function ShareBand({ shareUrl, shareText, mode, children }: ShareBandProps) {
  return (
    <motion.div
      variants={motionVariants.listItem}
      className="relative overflow-hidden rounded-2xl bg-ink p-5 sm:p-6"
    >
      <motion.div
        aria-hidden
        initial={{ opacity: 0.45 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="pointer-events-none absolute inset-0 bg-accent-lime/20"
      />
      <p className="font-label text-xs font-bold uppercase tracking-widest text-accent-lime">
        Share it
      </p>
      <p className="mt-1 max-w-xl font-body text-sm leading-relaxed text-on-ink-muted">
        {mode === 'resume_roast'
          ? 'The roast is funnier when your friends can see the grade.'
          : 'Send the bar to whoever is prepping for the same loop.'}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FitShareActions shareUrl={shareUrl} shareText={shareText} mode={mode} />
        {children}
      </div>
    </motion.div>
  )
}
