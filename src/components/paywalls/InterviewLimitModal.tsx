'use client'

import { LumaGlyph } from '@/components/shell/LumaGlyph'


interface InterviewLimitModalProps {
  used: number
  limit: number
  onUpgrade: () => void
  onEndSession: () => void
}

export function InterviewLimitModal({
  used,
  limit,
  onUpgrade,
  onEndSession,
}: InterviewLimitModalProps) {

  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progressOffset = circumference - (used / limit) * circumference

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 animate-in fade-in duration-300"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(46,50,48,0.50)',
        }}
      />
      <div
        className="relative w-full max-w-[380px] rounded-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        style={{
          background: '#ffffff',
          boxShadow: '0 32px 80px rgba(46,50,48,0.30), 0 0 0 1px rgba(196,200,188,0.3)',
        }}
      >
        <div className="px-7 pt-7 pb-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
              <circle cx="44" cy="44" r={radius} fill="none" stroke="#e4e0d8" strokeWidth="6" />
              <circle
                cx="44" cy="44" r={radius}
                fill="none" stroke="#4a7c59" strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <LumaGlyph size={32} state="idle" className="text-primary" />
            </div>
          </div>
          <p className="font-label text-[11px] uppercase tracking-[0.18em] font-bold text-on-surface-variant mb-1">
            Session limit reached
          </p>
          <h2 className="font-headline font-bold text-on-surface text-xl leading-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            You&apos;ve used {used} of {limit} free sessions
          </h2>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
            Your transcript is saved. Upgrade to Pro for unlimited sessions, or end here and review your debrief.
          </p>
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 font-label font-bold text-sm text-on-primary mb-3 transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4a7c59 0%, #3a6b4a 100%)',
              boxShadow: '0 4px 16px rgba(74,124,89,0.30)',
            }}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
              workspace_premium
            </span>
            Upgrade to Pro
          </button>
          <button
            onClick={onEndSession}
            className="w-full text-center font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors py-1"
          >
            End session &amp; view debrief
          </button>
        </div>
      </div>
    </div>
  )
}
