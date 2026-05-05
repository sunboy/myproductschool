'use client'

import type { ChallengeMode } from '@/lib/types'

interface HatchCoachingStripProps {
  mode: ChallengeMode
  onHintRequest: () => void
  onShowFramework: () => void
}

const STATUS_TEXT: Record<ChallengeMode, string> = {
  solo: 'Hatch is watching... it will review once you submit.',
  live: 'Live mode: real-time coaching with Hatch',
  guided: 'Hatch is tracking your progress across all 4 FLOW steps.',
  freeform: 'Hatch will review all 4 FLOW moves after you submit.',
  'quick-take': 'Quick take — Hatch will grade in 15 seconds.',
}

export function HatchCoachingStrip({
  mode,
  onHintRequest,
  onShowFramework,
}: HatchCoachingStripProps) {
  const isLive = mode === 'live'

  return (
    <footer className="fixed bottom-0 w-full h-12 bg-white/80 backdrop-blur-xl border-t border-outline-variant/15 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-amber-500"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          diamond
        </span>
        <span className="text-[11px] font-medium text-on-surface-variant font-label">
          {STATUS_TEXT[mode]}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!isLive && (
          <button
            onClick={onHintRequest}
            className="px-4 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-full transition-colors font-label"
          >
            Need a hint?
          </button>
        )}
        <button
          onClick={onShowFramework}
          className="px-4 py-1 text-[11px] font-bold bg-secondary-container text-on-secondary-container rounded-full hover:bg-secondary-container/80 transition-colors font-label"
        >
          Show framework
        </button>
      </div>
    </footer>
  )
}
