'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { AnimatedProgress } from '@/components/motion/primitives'
import type { PublicFitMode } from '@/lib/careerops/public/types'
import { HatchScene } from './HatchScene'
import { LottieFx } from './LottieFx'

// The scoring call takes up to a minute. The theater keeps the wait honest:
// the thinking sprite, a rotating line of what Hatch is doing, a shimmer bar.
// The final two lines alternate forever so a slow run never goes silent.
const LINES: Record<PublicFitMode, string[]> = {
  job_fit: [
    'Reading the listing…',
    'Naming the bar behind it…',
    'Mapping the demanded disciplines…',
    'Scoring you against the bar…',
    'Writing the gaps worth closing…',
    'Double-checking the readiness map…',
  ],
  resume_roast: [
    'Reading every line…',
    'Counting the buzzwords…',
    'Looking for one real number…',
    'Weighing evidence against adjectives…',
    'Writing the verdict…',
    'Sharpening the fix list…',
  ],
}

const ROTATE_MS = 4500

function lineAt(lines: string[], index: number): string {
  if (index < lines.length) return lines[index]
  // Alternate the last two lines once the script runs out.
  const overflow = index - lines.length
  return lines[lines.length - 2 + (overflow % 2)]
}

export function LoadingTheater({ mode }: { mode: PublicFitMode }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
    const id = setInterval(() => setIndex((current) => current + 1), ROTATE_MS)
    return () => clearInterval(id)
  }, [mode])

  const line = lineAt(LINES[mode], index)

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-2xl bg-ink p-8 text-center">
      <HatchScene scene="loading" size={120} />
      <div className="flex h-7 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="font-label text-base font-semibold text-on-ink"
          >
            {line}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="w-full max-w-sm">
        <AnimatedProgress
          value={100}
          state="active"
          trackClassName="bg-ink-container"
          barClassName="bg-accent-lime/30"
        />
        <div className="mt-2 h-6">
          <LottieFx name="scan-sweep" loop className="mx-auto w-full max-w-sm" />
        </div>
      </div>
      <p className="text-xs text-on-ink-muted">
        Hatch reads the whole thing. This usually takes under a minute.
      </p>
    </div>
  )
}
