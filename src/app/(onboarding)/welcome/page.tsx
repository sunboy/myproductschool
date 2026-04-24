import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

const THINKING_MOVES = [
  {
    icon: 'diamond',
    title: 'Frame',
    tagline: '"What\'s the real problem?"',
    example: 'DAU up 20% but revenue flat — what do you ask first?',
    iconColor: 'text-[#5eaeff]',
    bgColor: 'bg-blue-100',
    hoverBorder: 'hover:border-blue-200',
  },
  {
    icon: 'grid_view',
    title: 'List',
    tagline: '"Who exactly is affected?"',
    example: 'Power users vs. new users react differently to the same change.',
    iconColor: 'text-[#2dd4a0]',
    bgColor: 'bg-green-100',
    hoverBorder: 'hover:border-green-200',
  },
  {
    icon: 'balance',
    title: 'Optimize',
    tagline: '"What are the tradeoffs?"',
    example: 'Cut free tier from 10K to 1K API calls — or find a smarter lever?',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-100',
    hoverBorder: 'hover:border-amber-200',
  },
  {
    icon: 'campaign',
    title: 'Win',
    tagline: '"How do you make others see it?"',
    example: 'Convince your CEO to invest in auth refactor over 3 features.',
    iconColor: 'text-violet-400',
    bgColor: 'bg-purple-100',
    hoverBorder: 'hover:border-purple-200',
  },
]

const ROLE_TAGS = ['SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng']

const SAMPLE_SCENARIO = {
  title: 'Spotify\'s 15% Session Drop',
  snippet: 'You shipped a "Share to Story" button. Sessions dropped 15%. The PM just pinged you on Slack.',
  move: 'Frame',
  moveColor: '#5eaeff',
}

export default function WelcomePage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-surface border-b border-outline-variant h-12 flex items-center shadow-sm">
        <div className="flex items-center justify-between px-6 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <HatchGlyph size={24} state="idle" className="text-primary" />
            <span className="font-headline font-black text-xl text-primary">HackProduct</span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <span className="text-xs font-medium text-secondary uppercase tracking-widest">
              By engineers, for engineers
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6">
        <div className="max-w-4xl w-full text-center space-y-10">

          {/* Hatch Mascot (80px) */}
          <div className="flex justify-center">
            <div className="relative">
              <HatchGlyph size={80} className="text-primary" state="idle" />
              <div className="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Coach
              </div>
            </div>
          </div>

          {/* Headlines — visceral, specific to engineers */}
          <div className="space-y-3">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
              Your code ships.
            </h1>
            <h2 className="font-headline text-3xl md:text-4xl text-primary font-bold">
              Your product thinking doesn&apos;t.
            </h2>
            <p className="text-on-surface-variant text-base md:text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
              Staff engineers don&apos;t just build features — they frame problems, weigh tradeoffs, and win buy-in.
              Practice these 4 moves with AI-graded scenarios. See exactly where you stand in 5 minutes.
            </p>
          </div>

          {/* Live scenario preview — show what you GET */}
          <div className="max-w-2xl mx-auto bg-surface-container rounded-xl border border-outline-variant/50 overflow-hidden text-left">
            <div className="px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SAMPLE_SCENARIO.moveColor }} />
                <span className="text-xs font-bold text-on-surface">{SAMPLE_SCENARIO.title}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: SAMPLE_SCENARIO.moveColor }}>
                {SAMPLE_SCENARIO.move}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed italic">
                &ldquo;{SAMPLE_SCENARIO.snippet}&rdquo;
              </p>
              <div className="flex items-center gap-3 bg-primary-fixed/30 rounded-lg px-4 py-3 border border-primary/10">
                <HatchGlyph size={28} state="speaking" className="text-primary shrink-0" />
                <p className="text-xs text-on-surface leading-snug">
                  <span className="font-bold text-primary">Hatch says: </span>
                  Write your diagnosis, and I&apos;ll score you on 4 dimensions — problem reframing, diagnostic accuracy, data reasoning, and recommendation strength.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['Reframing', 'Diagnosis', 'Data Reasoning', 'Recommendation'].map((d, i) => (
                  <div key={d} className="text-center">
                    <div className="h-1.5 rounded-full bg-outline-variant/40 overflow-hidden mb-1">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${[75, 60, 85, 45][i]}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-on-surface-variant">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Four Thinking Moves (Horizontal Row of Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
            {THINKING_MOVES.map((move) => (
              <div
                key={move.title}
                className={`bg-surface-container rounded-xl p-4 text-left border border-transparent ${move.hoverBorder} transition-all hover:bg-surface-container-high group`}
              >
                <div className={`w-8 h-8 rounded-lg ${move.bgColor} flex items-center justify-center mb-3`}>
                  <span
                    className={`material-symbols-outlined ${move.iconColor} text-xl`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {move.icon}
                  </span>
                </div>
                <div className="font-bold text-sm mb-1 text-on-surface">{move.title}</div>
                <div className="text-xs text-on-surface-variant italic mb-2">{move.tagline}</div>
                <div className="text-[10px] text-on-surface-variant/70 leading-snug opacity-0 group-hover:opacity-100 transition-opacity">
                  e.g. {move.example}
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 pt-2">
            <Link
              href="/onboarding/role"
              className="bg-primary text-on-primary rounded-full px-10 py-4 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              Find out where you stand
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
            <div className="text-xs text-on-surface-variant opacity-75">
              5-min assessment — no signup required — get your skill radar
            </div>
            <Link
              href="/dashboard"
              className="mt-2 text-primary font-bold text-sm hover:underline flex items-center gap-1 group"
            >
              Skip assessment, jump into a challenge
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Built for */}
          <div className="pt-8">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-4">
              Built for engineers who want Staff-level product sense
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {ROLE_TAGS.map((role) => (
                <span
                  key={role}
                  className="bg-secondary-container text-secondary text-xs font-semibold px-3 py-1 rounded-full border border-outline-variant"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Social Proof — more specific, more credible */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full border-2 border-surface bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>engineering</span>
                </div>
                <div className="w-7 h-7 rounded-full border-2 border-surface bg-tertiary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '14px' }}>engineering</span>
                </div>
                <div className="w-7 h-7 rounded-full border-2 border-surface bg-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '14px' }}>engineering</span>
                </div>
              </div>
              <p className="text-xs font-medium text-on-surface">
                Practiced by engineers at Google, Meta, Stripe &amp; more
              </p>
            </div>
            {/* Specific proof point */}
            <div className="max-w-md mx-auto bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 text-left">
              <p className="text-xs text-on-surface-variant italic leading-relaxed">
                &ldquo;I got promoted to Staff 3 months after starting HackProduct. The thinking traps feedback alone was worth it — I didn&apos;t know I had a &apos;premature solution&apos; habit until Hatch called it out.&rdquo;
              </p>
              <p className="text-[10px] font-bold text-on-surface-variant mt-2">
                — SWE at a Series C startup
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant">
        <div className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary">
            &copy; 2026 HackProduct. Built for engineers.
          </p>
          <div className="flex gap-6 items-center">
            <Link href="/privacy" className="text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary transition-opacity opacity-80 hover:opacity-100">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary transition-opacity opacity-80 hover:opacity-100">
              Terms
            </Link>
            <Link href="mailto:hello@hackproduct.io" className="text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary transition-opacity opacity-80 hover:opacity-100">
              Support
            </Link>
            <Link href="/dashboard" className="text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary transition-opacity opacity-80 hover:opacity-100">
              Hatch Coach
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
