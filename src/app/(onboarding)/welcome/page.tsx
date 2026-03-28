import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const THINKING_MOVES = [
  {
    icon: 'diamond',
    title: 'Frame',
    tagline: '"What\'s the real problem?"',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-100',
    hoverBorder: 'hover:border-blue-200',
  },
  {
    icon: 'grid_view',
    title: 'Split',
    tagline: '"Who exactly is affected?"',
    iconColor: 'text-emerald-400',
    bgColor: 'bg-green-100',
    hoverBorder: 'hover:border-green-200',
  },
  {
    icon: 'balance',
    title: 'Weigh',
    tagline: '"What are the tradeoffs?"',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-100',
    hoverBorder: 'hover:border-amber-200',
  },
  {
    icon: 'campaign',
    title: 'Sell',
    tagline: '"How do you make others see it?"',
    iconColor: 'text-violet-400',
    bgColor: 'bg-purple-100',
    hoverBorder: 'hover:border-purple-200',
  },
]

const ROLE_TAGS = ['SWE', 'Data Eng', 'ML Eng', 'DevOps', 'EM', 'Founding Eng']

export default function WelcomePage() {
  return (
    <div className="flex flex-col animate-fade-in-up">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-outline-variant h-12 flex items-center shadow-sm">
        <div className="flex items-center justify-between px-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <LumaGlyph size={24} className="text-primary" />
            <span className="font-headline font-bold text-xl text-primary tracking-tight">HackProduct</span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <span className="text-xs font-medium text-secondary uppercase tracking-widest">
              By engineers, for engineers
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center pt-8 pb-4 px-4">
        <div className="max-w-3xl w-full text-center space-y-3">
          {/* Luma Mascot */}
          <div className="flex justify-center">
            <div className="relative">
              <LumaGlyph size={64} className="text-primary" state="idle" />
              <div className="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Coach
              </div>
            </div>
          </div>

          {/* Headlines */}
          <div className="space-y-1">
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface">
              Coding isn&apos;t the moat.
            </h1>
            <h2 className="font-headline text-2xl md:text-3xl text-primary font-bold">
              Thinking in products is.
            </h2>
            <p className="text-on-surface-variant text-sm max-w-xl mx-auto mt-2 leading-relaxed font-body">
              Write your thinking. Get AI-graded feedback. Build the 4 moves that separate Staff from Senior engineers.
            </p>
          </div>

          {/* Four Thinking Moves */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
            {THINKING_MOVES.map((move) => (
              <div
                key={move.title}
                className={`card-elevated card-interactive rounded-xl p-3 text-left border border-transparent ${move.hoverBorder} transition-all`}
              >
                <div className={`w-7 h-7 rounded-lg ${move.bgColor} flex items-center justify-center mb-2`}>
                  <span
                    className={`material-symbols-outlined ${move.iconColor} text-lg`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {move.icon}
                  </span>
                </div>
                <div className="font-bold text-sm mb-0.5 text-on-surface">{move.title}</div>
                <div className="text-xs text-on-surface-variant italic">{move.tagline}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <Link
              href="/role"
              className="glow-primary bg-primary text-on-primary rounded-full px-8 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Take the Assessment →
            </Link>
            <div className="text-xs text-on-surface-variant opacity-75">
              (5 min · No signup required · Get your skill radar)
            </div>
            <Link
              href="/dashboard"
              className="mt-1 text-primary font-bold text-sm hover:underline flex items-center gap-1 group"
            >
              Skip assessment, explore the platform
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Built For Tags */}
          <div className="pt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-2">
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
          <div className="pt-3 flex items-center justify-center gap-2 opacity-60">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-high" />
              <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container" />
              <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-highest" />
            </div>
            <p className="text-xs font-medium text-on-surface">
              Join 1,200 engineers sharpening their product thinking
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant">
        <div className="w-full pt-2 pb-2 px-4 flex flex-col md:flex-row justify-between items-center gap-2 max-w-7xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary">
            &copy; 2024 HackProduct. Built for engineers.
          </p>
          <div className="flex gap-6 items-center">
            <Link href="#" className="text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary transition-opacity opacity-80 hover:opacity-100">
              Privacy
            </Link>
            <Link href="#" className="text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary transition-opacity opacity-80 hover:opacity-100">
              Terms
            </Link>
            <Link href="#" className="text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary transition-opacity opacity-80 hover:opacity-100">
              Support
            </Link>
            <Link href="#" className="text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary transition-opacity opacity-80 hover:opacity-100">
              Luma Coach
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
