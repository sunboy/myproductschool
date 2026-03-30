import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const THINKING_MOVES = [
  {
    icon: 'diamond',
    title: 'Frame',
    tagline: '"What\'s the real problem?"',
    iconColor: 'text-[#5eaeff]',
    bgColor: 'bg-blue-100',
    hoverBorder: 'hover:border-blue-200',
  },
  {
    icon: 'grid_view',
    title: 'List',
    tagline: '"Who exactly is affected?"',
    iconColor: 'text-[#2dd4a0]',
    bgColor: 'bg-green-100',
    hoverBorder: 'hover:border-green-200',
  },
  {
    icon: 'balance',
    title: 'Optimize',
    tagline: '"What are the tradeoffs?"',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-100',
    hoverBorder: 'hover:border-amber-200',
  },
  {
    icon: 'campaign',
    title: 'Win',
    tagline: '"How do you make others see it?"',
    iconColor: 'text-violet-400',
    bgColor: 'bg-purple-100',
    hoverBorder: 'hover:border-purple-200',
  },
]

const ROLE_TAGS = ['SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng']

export default function WelcomePage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-surface border-b border-outline-variant h-12 flex items-center shadow-sm">
        <div className="flex items-center justify-between px-6 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <LumaGlyph size={24} className="text-primary" />
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
        <div className="max-w-3xl w-full text-center space-y-8">

          {/* Luma Mascot (80px) */}
          <div className="flex justify-center">
            <div className="relative">
              <LumaGlyph size={80} className="text-primary" state="idle" />
              <div className="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Coach
              </div>
            </div>
          </div>

          {/* Headlines */}
          <div className="space-y-2">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
              Coding isn&apos;t the moat.
            </h1>
            <h2 className="font-headline text-3xl md:text-4xl text-primary font-bold">
              Thinking in products is.
            </h2>
            <p className="text-on-surface-variant text-base md:text-lg max-w-xl mx-auto mt-4 leading-relaxed">
              Write your thinking. Get AI-graded feedback. Build the 4 moves that separate Staff from Senior engineers.
            </p>
          </div>

          {/* Four Thinking Moves (Horizontal Row of Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
            {THINKING_MOVES.map((move) => (
              <div
                key={move.title}
                className={`bg-surface-container rounded-xl p-4 text-left border border-transparent ${move.hoverBorder} transition-all hover:bg-surface-container-high`}
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
                <div className="text-xs text-on-surface-variant italic">{move.tagline}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <Link
              href="/onboarding/role"
              className="bg-primary text-on-primary rounded-full px-10 py-4 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Take the Assessment →
            </Link>
            <div className="text-xs text-on-surface-variant opacity-75">
              (5 min · No signup required · Get your skill radar)
            </div>
            <Link
              href="/dashboard"
              className="mt-4 text-primary font-bold text-sm hover:underline flex items-center gap-1 group"
            >
              Skip assessment, explore the platform
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Roles Tags */}
          <div className="pt-12">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-4">
              Built for
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

          {/* Social Proof */}
          <div className="pt-8 flex items-center justify-center gap-2 opacity-60">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-high" />
              <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container" />
              <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-highest" />
            </div>
            <p className="text-xs font-medium text-on-surface">
              Join engineers from Google, Meta, Stripe &amp; more
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant">
        <div className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary">
            &copy; 2024 HackProduct. Built for engineers.
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
              Luma Coach
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
