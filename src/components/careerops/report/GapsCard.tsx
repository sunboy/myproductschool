'use client'

import { motion } from 'framer-motion'

import { motionVariants } from '@/components/motion/tokens'
import { cardHover } from './revealSequence'

interface GapsCardProps {
  gaps: string[]
  levelStrategy?: string | null
  active: boolean
}

// "Gaps to close" — the amber-tinted card. Each gap staggers in with an arrow.
export function GapsCard({ gaps, levelStrategy, active }: GapsCardProps) {
  if (gaps.length === 0 && !levelStrategy) return null

  return (
    <motion.div
      variants={motionVariants.listItem}
      whileHover={cardHover}
      className="rounded-2xl bg-tertiary-container/40 p-5"
    >
      {gaps.length > 0 && (
        <>
          <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Gaps to close
          </p>
          <motion.ul
            variants={motionVariants.list}
            initial="hidden"
            animate={active ? 'show' : 'hidden'}
            className="mt-3 space-y-2.5"
          >
            {gaps.map((gap) => (
              <motion.li
                key={gap}
                variants={motionVariants.listItem}
                className="flex items-start gap-2.5 font-body text-sm leading-relaxed text-on-surface"
              >
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-tertiary" aria-hidden>
                  arrow_forward
                </span>
                {gap}
              </motion.li>
            ))}
          </motion.ul>
        </>
      )}
      {levelStrategy && (
        <div className={gaps.length > 0 ? 'mt-4 border-t border-outline-variant/50 pt-4' : ''}>
          <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Level strategy
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-on-surface">{levelStrategy}</p>
        </div>
      )}
    </motion.div>
  )
}
