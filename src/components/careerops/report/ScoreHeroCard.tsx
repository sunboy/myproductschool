'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { gradeOnInkClasses } from '@/components/careerops/grade'
import { motionSprings } from '@/components/motion/tokens'
import { HatchScene, type FitScene } from './HatchScene'
import { LottieFx } from './LottieFx'
import { ScoreGauge } from './ScoreGauge'
import type { FitReportData } from './types'

interface ScoreHeroCardProps {
  data: FitReportData
  onRevealProgress?: (progress: number) => void
  hatchSize?: number
}

function heroScene(data: FitReportData): FitScene {
  if (data.score === null) return 'reveal-low'
  if (data.mode === 'resume_roast' && data.grade === 'F') return 'reveal-fail'
  return data.score >= 70 ? 'reveal-high' : 'reveal-low'
}

// The dark forest-ink hero: radial gauge sweeping up to the score, grade chip
// popping in when the gauge lands, the real Hatch celebrating or commiserating
// on the right, confetti when the run deserves it.
export function ScoreHeroCard({ data, onRevealProgress, hatchSize = 120 }: ScoreHeroCardProps) {
  const [gaugeDone, setGaugeDone] = useState(false)
  const scene = heroScene(data)
  const celebrate = scene === 'reveal-high'

  const roleLine = [data.roleTitle, data.company].filter(Boolean).join(' at ')
  const modeLabel = data.mode === 'resume_roast' ? 'Resume roast' : 'Job fit report'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={motionSprings.soft}
      className="relative overflow-hidden rounded-2xl bg-ink p-6 text-on-ink sm:p-8"
    >
      {celebrate && gaugeDone && (
        <LottieFx name="confetti-burst" className="pointer-events-none absolute inset-0" />
      )}

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
          {data.score !== null ? (
            <ScoreGauge
              score={data.score}
              onProgress={onRevealProgress}
              onComplete={() => setGaugeDone(true)}
            />
          ) : (
            <div className="flex h-[180px] w-[180px] flex-col items-center justify-center rounded-full border-4 border-ink-border text-center">
              <span className="material-symbols-outlined text-4xl text-accent-lime">visibility</span>
              <span className="mt-1 px-4 text-xs font-semibold text-on-ink-muted">
                The role&apos;s bar, read honestly
              </span>
            </div>
          )}

          <div className="text-center sm:text-left">
            <p className="font-label text-xs font-bold uppercase tracking-widest text-accent-lime">
              {modeLabel}
            </p>
            {roleLine && (
              <h2 className="mt-1 max-w-sm font-headline text-2xl font-bold leading-snug">
                {roleLine}
              </h2>
            )}
            <div className="mt-3 flex h-12 items-center justify-center gap-3 sm:justify-start">
              <AnimatePresence>
                {data.grade && gaugeDone && (
                  <motion.span
                    initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={motionSprings.pop}
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl font-headline text-2xl font-bold ${gradeOnInkClasses(data.grade)}`}
                  >
                    {data.grade}
                  </motion.span>
                )}
              </AnimatePresence>
              {data.grade && gaugeDone && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm font-semibold text-on-ink-muted"
                >
                  {data.score !== null ? `Grade ${data.grade}` : null}
                </motion.span>
              )}
            </div>
          </div>
        </div>

        <HatchScene
          scene={scene}
          spriteOverride={celebrate && gaugeDone ? 'clapping' : undefined}
          size={hatchSize}
          className="shrink-0"
        />
      </div>

      {data.score === null && (
        <p className="mt-5 rounded-xl bg-ink-container p-4 text-sm leading-relaxed text-on-ink-muted">
          No background was given, so there is no score to show. What follows is the bar this
          role actually sets. Add your background next run and Hatch scores you against it.
        </p>
      )}
    </motion.div>
  )
}
