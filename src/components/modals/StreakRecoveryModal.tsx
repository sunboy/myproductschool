'use client'

import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface StreakRecoveryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StreakRecoveryModal({ isOpen, onClose }: StreakRecoveryModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Dark Overlay Background */}
      <div className="fixed inset-0 bg-inverse-surface/60 z-40 flex items-center justify-center p-4">
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 flex items-center gap-1 text-white text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-base">close</span>
          &times; Dismiss
        </button>

        {/* Main Modal */}
        <div className="bg-surface w-full max-w-[360px] rounded-2xl shadow-lg p-6 relative flex flex-col items-center">
          {/* Luma Mascot Section */}
          <div className="mb-4 relative">
            <LumaGlyph size={80} className="text-primary" />
          </div>

          {/* Speech Bubble */}
          <div className="bg-white border border-outline-variant rounded-xl p-3 mb-6 relative">
            <p className="text-xs text-on-surface-variant text-center leading-relaxed">
              &ldquo;Your skills didn&apos;t reset &mdash; just the counter. Let&apos;s get your streak back.&rdquo;
            </p>
            {/* Tooltip arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-outline-variant rotate-45" />
          </div>

          {/* Typography Header */}
          <div className="text-center mb-6">
            <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">Welcome back.</h1>
            <p className="text-base text-on-surface-variant leading-tight">Your 7-day streak ended.</p>
            <p className="text-[13px] text-outline mt-1">Streaks reset at midnight. You can start a new one right now.</p>
          </div>

          {/* Last Session Card */}
          <div className="w-full bg-surface-container rounded-xl p-3 mb-6">
            <span className="text-[10px] uppercase tracking-wider text-outline font-bold block mb-1">Last time you practiced:</span>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-on-surface leading-snug">
                The Feature That Backfired &middot; Optimize &#9670; &middot; 79/100
              </p>
              <div className="flex items-center">
                <span className="bg-outline-variant/30 text-outline text-[11px] px-2 py-0.5 rounded-full font-medium">3 days ago</span>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <div className="w-full text-center mb-6">
            <button className="w-full h-[52px] bg-primary hover:bg-primary-container text-white rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              Start today&apos;s Quick Take
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
            <p className="text-[11px] text-outline mt-2 font-medium">
              90 seconds &middot; Restarts your streak immediately
            </p>
          </div>

          {/* Secondary Links */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <a className="text-primary text-sm font-semibold hover:underline flex items-center gap-1" href="#">
              Browse challenges instead
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
            <a className="text-outline text-sm font-medium hover:text-on-surface-variant" href="#">
              Remind me tonight
            </a>
          </div>

          {/* Bottom Information Chip */}
          <div className="bg-tertiary-container/20 border border-tertiary-container/30 px-4 py-2 rounded-full flex items-center gap-2">
            <span className="text-tertiary text-[11px] font-semibold flex items-center gap-1">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                shield
              </span>
              Earn a Streak Shield after 7 days &mdash; it&apos;ll protect you next time.
            </span>
          </div>
        </div>
      </div>

      {/* Hidden Background Content (App UI Simulation) */}
      <div aria-hidden="true" className="min-h-screen bg-surface p-6 blur-sm pointer-events-none">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg" />
            <span className="font-headline font-bold text-xl text-primary">HackProduct</span>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-4 bg-outline-variant rounded-full" />
            <div className="w-6 h-6 bg-outline-variant rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-surface-container rounded-xl" />
          <div className="h-32 bg-surface-container rounded-xl" />
          <div className="h-48 col-span-2 bg-surface-container rounded-xl" />
          <div className="h-32 bg-surface-container rounded-xl" />
          <div className="h-32 bg-surface-container rounded-xl" />
        </div>
      </div>
    </>
  )
}
