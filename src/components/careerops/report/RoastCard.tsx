'use client'

import { motion } from 'framer-motion'

import { motionSprings, motionVariants } from '@/components/motion/tokens'
import type { RoastEvaluation, RoastSeverity } from '@/lib/careerops/public/types'
import { cardHover } from './revealSequence'

const SEVERITY_CARD: Record<RoastSeverity, string> = {
  minor: 'bg-secondary-container',
  major: 'bg-tertiary-container',
  fatal: 'bg-error-container',
}

const SEVERITY_CHIP: Record<RoastSeverity, string> = {
  minor: 'bg-surface text-on-secondary-container',
  major: 'bg-surface text-on-surface',
  fatal: 'bg-error text-on-error',
}

const SEVERITY_TEXT: Record<RoastSeverity, string> = {
  minor: 'text-on-secondary-container',
  major: 'text-on-surface',
  fatal: 'text-on-error-container',
}

interface RoastCardProps {
  roast: Pick<RoastEvaluation, 'verdict_line' | 'sections' | 'strengths'>
  active: boolean
}

// The roast: verdict as a big pull-quote, severity-tinted finding cards,
// strengths checklist at the bottom so it ends on something to keep.
export function RoastCard({ roast, active }: RoastCardProps) {
  return (
    <motion.div variants={motionVariants.listItem} className="space-y-4">
      <motion.blockquote
        whileHover={cardHover}
        className="rounded-2xl bg-secondary-container p-6"
      >
        <span className="material-symbols-outlined text-3xl text-tertiary" aria-hidden>
          format_quote
        </span>
        <p className="mt-1 font-headline text-xl font-bold leading-snug text-on-secondary-container">
          {roast.verdict_line}
        </p>
      </motion.blockquote>

      <motion.div
        variants={motionVariants.list}
        initial="hidden"
        animate={active ? 'show' : 'hidden'}
        className="space-y-3"
      >
        {roast.sections.map((section) => (
          <motion.div
            key={section.title}
            variants={motionVariants.listItem}
            whileHover={cardHover}
            className={`rounded-2xl p-5 ${SEVERITY_CARD[section.severity]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className={`font-headline text-base font-bold ${SEVERITY_TEXT[section.severity]}`}>
                {section.title}
              </h4>
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={active ? { scale: 1, opacity: 1 } : {}}
                transition={motionSprings.pop}
                className={`rounded-full px-2.5 py-0.5 font-label text-xs font-bold uppercase tracking-wide ${SEVERITY_CHIP[section.severity]}`}
              >
                {section.severity}
              </motion.span>
            </div>
            <p className={`mt-2 font-body text-sm leading-relaxed ${SEVERITY_TEXT[section.severity]}`}>
              {section.finding}
            </p>
            <p className={`mt-2 font-body text-sm font-semibold leading-relaxed ${SEVERITY_TEXT[section.severity]}`}>
              Fix: <span className="font-normal">{section.fix}</span>
            </p>
          </motion.div>
        ))}
      </motion.div>

      {roast.strengths.length > 0 && (
        <motion.div
          variants={motionVariants.listItem}
          whileHover={cardHover}
          className="rounded-2xl bg-primary-fixed p-5"
        >
          <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Worth keeping
          </p>
          <ul className="mt-2 space-y-2">
            {roast.strengths.map((strength) => (
              <li key={strength} className="flex items-start gap-2.5 font-body text-sm leading-relaxed text-on-surface">
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary" aria-hidden>
                  check_circle
                </span>
                {strength}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  )
}
