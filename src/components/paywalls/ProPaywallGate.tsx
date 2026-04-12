import { LumaGlyph } from '@/components/shell/LumaGlyph'

const FEATURES = [
  { icon: 'all_inclusive',  text: 'Unlimited challenge attempts' },
  { icon: 'psychology',     text: 'Full Luma coaching on every step' },
  { icon: 'analytics',      text: 'Learner DNA — competency radar' },
  { icon: 'school',         text: 'All study plans, unlocked' },
  { icon: 'mic',            text: 'Live AI interview sessions' },
]

interface ProPaywallGateProps {
  challengeTitle?: string
  completedCount?: number
  onUpgrade?: () => void
}

export function ProPaywallGate({
  challengeTitle = "Prioritize Stripe's Next Feature",
  completedCount = 3,
  onUpgrade,
}: ProPaywallGateProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">

      {/* Blurred workspace background */}
      <div className="fixed inset-0 z-0 flex select-none grayscale-[20%] opacity-40 pointer-events-none">
        <aside className="fixed left-0 top-0 h-screen w-[220px] bg-primary flex flex-col pb-4">
          <div className="p-4 flex items-center gap-2 pt-5">
            <LumaGlyph size={24} className="text-white" state="none" />
            <span className="font-headline text-base font-bold text-white">HackProduct</span>
          </div>
          <nav className="flex-1 px-2 space-y-px pt-2">
            <div className="flex items-center gap-3 px-3 py-2.5 text-white/60 rounded-xl text-sm">
              <span className="material-symbols-outlined text-[20px]">home</span>Home
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 text-white/60 rounded-xl text-sm">
              <span className="material-symbols-outlined text-[20px]">explore</span>Explore
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 bg-white/20 text-white rounded-xl text-sm font-semibold">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>fitness_center</span>Practice
            </div>
          </nav>
        </aside>
        <main className="ml-[220px] flex-1 flex flex-col bg-background">
          <header className="h-14 border-b border-outline-variant/30 flex items-center px-6 bg-surface-container-low">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span>Practice</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-on-surface font-medium">{challengeTitle}</span>
            </div>
          </header>
          <div className="p-8">
            <h1 className="font-headline text-2xl font-bold mb-4">{challengeTitle}</h1>
            <div className="flex gap-4 mb-6">
              {['Frame', 'List', 'Optimize', 'Win'].map((step, i) => (
                <div
                  key={step}
                  className="px-4 py-2 rounded-full text-sm font-label font-semibold"
                  style={{
                    background: i === 0 ? 'rgba(74,124,89,0.15)' : 'transparent',
                    color: i === 0 ? '#4a7c59' : '#74796e',
                    border: i === 0 ? '1px solid rgba(74,124,89,0.3)' : '1px solid transparent',
                  }}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-surface-container h-48 border border-outline-variant/30" />
          </div>
        </main>
      </div>

      {/* Frosted glass overlay */}
      <div className="fixed inset-0 z-10" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(250,246,240,0.65)' }} />

      {/* Foreground paywall card */}
      <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[440px] rounded-2xl overflow-hidden animate-step-enter"
          style={{
            background: '#ffffff',
            boxShadow: '0 32px 80px rgba(46,50,48,0.20), 0 0 0 1px rgba(196,200,188,0.3)',
          }}
        >
          {/* Green header */}
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
                  You&apos;ve used {completedCount} free challenges.
                </p>
              </div>
            </div>
            <p className="font-body text-sm text-white/70 leading-relaxed">
              Keep going — unlock unlimited access, full coaching, and your Learner DNA fingerprint.
            </p>
          </div>

          <div className="px-7 pt-5 pb-7 space-y-5">
            {/* Feature list */}
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

            {/* Price summary */}
            <div
              className="rounded-xl px-4 py-3.5 flex items-center justify-between"
              style={{ background: '#f0ece4', border: '1px solid rgba(196,200,188,0.4)' }}
            >
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-0.5">
                  Annual plan
                </p>
                <p className="font-headline font-bold text-on-surface text-lg" style={{ letterSpacing: '-0.02em' }}>
                  $199 <span className="text-sm font-body font-normal text-on-surface-variant">/ year</span>
                </p>
                <p className="font-label text-[10px] text-primary font-semibold">~$16.58/mo — save 43%</p>
              </div>
              <div className="text-right">
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-0.5">
                  Monthly
                </p>
                <p className="font-body text-sm text-on-surface-variant">$29 / mo</p>
              </div>
            </div>

            {/* CTA */}
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
