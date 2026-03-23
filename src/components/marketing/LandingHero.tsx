import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

export function LandingHero() {
  return (
    <section className="relative py-24 md:py-32 text-center overflow-hidden">
      {/* Large subtle LumaGlyph watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <LumaGlyph size={400} className="text-primary opacity-5" />
      </div>

      <div className="relative z-10 space-y-8">
        <h1 className="font-headline text-5xl md:text-6xl font-bold text-on-surface leading-tight">
          The practice gym for{' '}
          <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
            product thinking
          </span>
        </h1>

        <p className="text-on-surface-variant text-xl max-w-2xl mx-auto leading-relaxed">
          For engineers, career changers, and PMs — build the instincts that
          interviews test and jobs demand.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-primary text-on-primary rounded-full px-8 py-3 font-label font-semibold hover:opacity-90 transition-opacity"
          >
            Try a Free Challenge
          </Link>
          <a
            href="#demo"
            className="border border-outline-variant text-on-surface rounded-full px-8 py-3 font-label font-semibold hover:bg-surface-container transition-colors"
          >
            See How It Works
          </a>
        </div>
      </div>
    </section>
  )
}
