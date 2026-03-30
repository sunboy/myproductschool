import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface ProPaywallGateProps {
  challengeTitle?: string
  challengeCategory?: string
  challengeDuration?: string
  completedCount?: number
}

export function ProPaywallGate({
  challengeTitle = "Prioritize Stripe's Next Feature",
  challengeCategory = 'Strategy',
  challengeDuration = '15 mins',
  completedCount = 3,
}: ProPaywallGateProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Background: Blurred Challenge Workspace */}
      <div className="fixed inset-0 z-0 flex select-none grayscale-[20%] opacity-50">
        {/* Nav Rail Mockup */}
        <aside className="fixed left-0 top-0 h-screen w-[220px] bg-surface-container-low border-r border-outline-variant flex flex-col pb-4">
          <div className="p-4 flex items-center gap-2">
            <LumaGlyph size={32} className="text-primary" />
            <span className="font-headline text-lg text-primary font-bold">HackProduct</span>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            <div className="flex items-center gap-3 px-4 py-2 text-on-surface-variant"><span className="material-symbols-outlined">home</span>Home</div>
            <div className="flex items-center gap-3 px-4 py-2 text-on-surface-variant"><span className="material-symbols-outlined">explore</span>Explore</div>
            <div className="bg-primary-container text-on-primary-container rounded-full px-4 py-2 flex items-center gap-3 font-semibold"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fitness_center</span>Practice</div>
            <div className="flex items-center gap-3 px-4 py-2 text-on-surface-variant"><span className="material-symbols-outlined">workspace_premium</span>Prep</div>
            <div className="flex items-center gap-3 px-4 py-2 text-on-surface-variant"><span className="material-symbols-outlined">bar_chart</span>Progress</div>
          </nav>
        </aside>
        {/* Workspace Mockup */}
        <main className="ml-[220px] flex-1 flex flex-col">
          <header className="h-12 border-b border-outline-variant flex items-center justify-between px-6 bg-surface-container-low">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-on-surface-variant">Practice</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-on-surface">{challengeTitle}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined">bolt</span>
              <span className="material-symbols-outlined">notifications</span>
              <div className="w-8 h-8 rounded-full bg-secondary-container"></div>
            </div>
          </header>
          <div className="p-8 max-w-5xl mx-auto w-full">
            <div className="mb-6">
              <h1 className="font-headline text-2xl font-bold mb-2">{challengeTitle}</h1>
              <div className="flex gap-2">
                <span className="bg-tertiary-container/30 text-tertiary px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">{challengeCategory}</span>
                <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-xs">{challengeDuration}</span>
              </div>
            </div>
            {/* Thinking Tabs */}
            <div className="flex border-b border-outline-variant mb-6">
              <button className="px-6 py-2 border-b-2 border-primary font-bold text-primary">FRAME</button>
              <button className="px-6 py-2 text-on-surface-variant">LIST</button>
              <button className="px-6 py-2 text-on-surface-variant">ORGANIZE</button>
              <button className="px-6 py-2 text-on-surface-variant">WRITE</button>
            </div>
            {/* Disabled Content Area */}
            <div className="space-y-6">
              <div className="p-6 bg-surface-container rounded-xl border border-outline-variant/50">
                <p className="text-on-surface-variant leading-relaxed mb-4">You are the Lead PM for Stripe Treasury. Leadership is debating three major initiatives for Q3: Cross-border payouts for marketplaces, low-code tax automation for SMBs, or a crypto-native settlement layer. How do you evaluate these using the RICE framework or similar mental models?</p>
                <div className="w-full h-48 bg-surface-container-low border border-outline-variant rounded-lg" />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Frosted Glass Overlay */}
      <div className="fixed inset-0 z-10 backdrop-blur-[8px] bg-surface/70" />

      {/* Foreground Modal */}
      <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-[440px] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
          {/* Pro Badge */}
          <div className="absolute top-4 right-4 bg-tertiary-container/20 text-tertiary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-tertiary-container/30">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              stars
            </span>
            Pro Challenge
          </div>

          <div className="p-8 pt-10 flex flex-col items-center">
            {/* Luma Mascot */}
            <div className="mb-6 relative">
              <LumaGlyph size={64} className="text-primary" />
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full flex items-center justify-center border-2 border-white">
                <span
                  className="material-symbols-outlined text-[10px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                >
                  lock
                </span>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-2">You&apos;ve unlocked {completedCount} of 3 free challenges.</p>
            <h2 className="font-headline text-[22px] font-bold text-on-surface mb-6">Keep going — you&apos;re just getting started.</h2>

            {/* Preview Card */}
            <div className="w-full bg-surface-container rounded-xl p-4 mb-8 border border-outline-variant/30">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-on-surface">{challengeTitle}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="bg-tertiary-container/30 text-tertiary px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                  Optimize <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                </span>
                <span className="bg-secondary-container/50 text-on-surface-variant px-2 py-0.5 rounded-full text-[10px]">Staff PM</span>
                <span className="bg-red-100 text-error px-2 py-0.5 rounded-full text-[10px] font-medium border border-red-200">Hard</span>
              </div>
              <p className="text-[11px] text-on-surface-variant italic">Best for: Systems-level tradeoff analysis</p>
            </div>

            <p className="w-full text-sm text-on-surface-variant mb-4">
              Pro members get unlimited challenges, full Luma coaching, and a shareable skill credential for LinkedIn.
            </p>

            {/* Feature List */}
            <ul className="w-full space-y-3 mb-8">
              {[
                { text: 'Unlimited access to <strong>200+ challenges</strong>' },
                { text: 'Full AI coaching with <strong>skill fingerprint</strong> after every challenge' },
                { text: '<strong>Skill Ladder</strong> with shareable LinkedIn credentials' },
                { text: '<strong>Weekly cohort challenges</strong> with leaderboard' },
                { text: 'Personalized <strong>study plans</strong>' },
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    style={{ fontVariationSettings: "'wght' 700" }}
                  >
                    check
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: benefit.text }} />
                </li>
              ))}
            </ul>

            {/* Pricing Section */}
            <div className="w-full bg-surface-container-low rounded-xl p-5 border border-outline-variant/20 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-headline font-semibold text-lg">HackProduct Pro</span>
                <div className="flex items-center gap-2 bg-white p-1 rounded-full shadow-sm border border-outline-variant/30">
                  <span className="px-3 py-1 text-[10px] text-on-surface-variant">Monthly</span>
                  <span className="px-3 py-1 text-[10px] bg-primary text-white rounded-full font-bold">Annual</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-tertiary">$19</span>
                <span className="text-on-surface-variant text-sm">/month</span>
              </div>
              <p className="text-[11px] text-primary font-semibold">or $149/year (save 35%)</p>
            </div>

            {/* CTAs */}
            <div className="w-full space-y-4 text-center">
              <Link
                href="/pricing"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-full transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                Unlock Pro <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <p className="text-xs text-on-surface-variant">
                Free plan: 3 challenges · No coaching detail · No credential
              </p>
              <Link
                href="/pricing"
                className="block text-sm font-semibold text-on-surface-variant hover:text-on-surface underline underline-offset-4"
              >
                Start 7-day free trial
              </Link>
              <Link
                href="/challenges"
                className="block text-xs text-on-surface-variant/70 hover:text-primary flex items-center justify-center gap-1 transition-colors"
              >
                Or practice with free challenges <span className="material-symbols-outlined text-sm">arrow_outward</span>
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-outline-variant/20 w-full text-center">
              <p className="text-[10px] text-on-surface-variant/60">
                No credit card required for trial &middot; Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
