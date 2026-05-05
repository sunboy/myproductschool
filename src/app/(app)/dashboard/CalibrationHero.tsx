'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const CAL_STORAGE_KEY = 'hp_cal_progress'

export function CalibrationHero() {
  const [inProgress, setInProgress] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CAL_STORAGE_KEY)
      if (saved) {
        const { screen } = JSON.parse(saved)
        setInProgress(screen >= 1 && screen <= 8)
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="bg-surface-container rounded-2xl overflow-hidden">
      {/* Top accent strip */}
      <div className="h-1 bg-gradient-to-r from-primary via-tertiary to-primary opacity-60" />
      <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <HatchGlyph size={72} state="celebrating" className="text-primary flex-shrink-0 self-center sm:self-auto" />
        <div className="flex-1 min-w-0">
          {inProgress ? (
            <>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-1">Finish your calibration</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-3">
                You started but didn&apos;t finish. Pick up where you left off — Hatch saved your progress.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-headline text-xl font-bold text-on-surface mb-1">Unlock your skill radar</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-3">
                8 questions. ~5 minutes. No typing — just choices. Hatch will set your baseline and route you to the right challenges.
              </p>
            </>
          )}
          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { icon: 'quiz', label: '8 questions' },
              { icon: 'timer', label: '~5 minutes' },
              { icon: 'radar', label: 'Your FLOW baseline' },
            ].map(s => (
              <span key={s.label} className="inline-flex items-center gap-1.5 bg-primary-fixed rounded-full px-3 py-1 text-xs font-label font-bold text-on-surface">
                <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                {s.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={inProgress ? '/calibration?resume=1' : '/calibration'}
              className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-5 py-2.5 font-label font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                {inProgress ? 'play_circle' : 'play_arrow'}
              </span>
              {inProgress ? 'Resume calibration' : 'Start calibration'}
            </Link>
            <Link href="/explore/flow" className="text-primary text-xs font-label font-bold hover:underline underline-offset-2">
              What is FLOW? →
            </Link>
            <Link href="/challenges" className="text-on-surface-variant text-xs hover:text-on-surface transition-colors">
              Browse challenges first →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
