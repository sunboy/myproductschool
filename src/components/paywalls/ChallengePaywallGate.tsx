'use client'

import { LumaGlyph } from '@/components/shell/LumaGlyph'

const FEATURES = [
  { icon: 'all_inclusive',  text: 'Unlimited challenge attempts' },
  { icon: 'psychology',     text: 'Full Luma coaching on every step' },
  { icon: 'analytics',      text: 'Learner DNA — competency radar' },
  { icon: 'school',         text: 'All study plans, unlocked' },
  { icon: 'mic',            text: 'Live AI interview sessions' },
]

interface ChallengePaywallGateProps {
  used: number
  limit: number
  challengeTitle?: string
  onUpgrade?: () => void
}

export function ChallengePaywallGate({
  used,
  limit,
  challengeTitle = 'this challenge',
  onUpgrade,
}: ChallengePaywallGateProps) {

  const progressPct = Math.min((used / limit) * 100, 100)

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 animate-in fade-in duration-300"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(250,246,240,0.65)',
        }}
      />
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[440px] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500"
          style={{
            background: '#ffffff',
            boxShadow: '0 32px 80px rgba(46,50,48,0.20), 0 0 0 1px rgba(196,200,188,0.3)',
          }}
        >
          <div
            className="px-7 pt-7 pb-6"
            style={{ background: 'linear-gradient(145deg, #2d5a3d 0%, #4a7c59 60%, #3a6b4a 100%)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <LumaGlyph size={40} state="idle" className="text-white shrink-0" />
              <div>
                <p className="font-label text-[11px] uppercase tracking-[0.18em] font-bold text-white/60">
                  HackProduct Pro
                </p>
                <p className="font-headline font-bold text-white text-lg leading-tight" style={{ letterSpacing: '-0.02em' }}>
                  You&apos;ve used {used} of {limit} free challenges.
                </p>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="font-body text-xs text-white/60 mt-2">
              {limit - used === 0 ? 'Monthly limit reached' : `${limit - used} remaining this month`}
            </p>
          </div>

          <div className="px-7 pt-5 pb-7 space-y-5">
            <ul className="space-y-2.5">
              {FEATURES.map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-primary text-[17px] shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                  >
                    {icon}
                  </span>
                  <span className="font-body text-sm text-on-surface">{text}</span>
                </li>
              ))}
            </ul>
            <div
              className="rounded-xl px-4 py-3.5 flex items-center justify-between"
              style={{ background: '#f0ece4', border: '1px solid rgba(196,200,188,0.4)' }}
            >
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-0.5">Annual plan</p>
                <p className="font-headline font-bold text-on-surface text-lg" style={{ letterSpacing: '-0.02em' }}>
                  $199 <span className="text-sm font-body font-normal text-on-surface-variant">/ year</span>
                </p>
                <p className="font-label text-[10px] text-primary font-semibold">~$16.58/mo — save 43%</p>
              </div>
              <div className="text-right">
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-0.5">Monthly</p>
                <p className="font-body text-sm text-on-surface-variant">$29 / mo</p>
              </div>
            </div>
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 font-label font-bold text-sm text-on-primary transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #4a7c59 0%, #3a6b4a 100%)',
                boxShadow: '0 4px 16px rgba(74,124,89,0.30)',
              }}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
              >
                workspace_premium
              </span>
              Unlock Pro
            </button>
            <p className="text-center font-body text-[11px] text-on-surface-variant">
              Secure checkout via Stripe. Cancel any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
