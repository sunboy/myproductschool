import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

const FLOW_STEPS = [
  {
    icon: 'pentagon',
    letter: 'F',
    title: 'Frame',
    tagline: 'Define the problem',
    description: 'Break down unclear requests into measurable customer outcomes and business results.',
  },
  {
    icon: 'join_inner',
    letter: 'L',
    title: 'Lens',
    tagline: 'Find the right angle',
    description: 'Deploy strategic frameworks to identify overlooked opportunities.',
  },
  {
    icon: 'balance',
    letter: 'O',
    title: 'Optimize',
    tagline: 'Weigh your options',
    description: 'Make decisive trade-offs balancing velocity, excellence, and scalability.',
  },
  {
    icon: 'emoji_events',
    letter: 'W',
    title: 'Win',
    tagline: 'Sell your solution',
    description: 'Communicate compelling narrative to secure organizational alignment.',
  },
]

const METHOD_STEPS = [
  {
    num: '01',
    text: 'Receive real-world PM questions from Google, Meta, Stripe, Airbnb',
  },
  {
    num: '02',
    text: 'Write unguided text responses — no multiple-choice shortcuts',
  },
  {
    num: '03',
    text: 'Get instant AI feedback referencing the FLOW framework',
  },
]

export default function WelcomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-6">
          <LumaGlyph size={48} className="text-primary" state="idle" />
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface mb-4">
          Think like a great PM
        </h1>
        <p className="text-lg text-on-surface-variant max-w-xl mx-auto font-body">
          Daily AI-graded prompts. Modeled after top engineering cultures. No fluffy advice — just substance.
        </p>
      </section>

      {/* FLOW Framework */}
      <section className="px-6 pb-16 max-w-5xl mx-auto w-full">
        <h2 className="font-headline text-2xl font-bold text-center text-on-surface mb-2">
          The <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">FLOW</span> Framework
        </h2>
        <p className="text-center text-on-surface-variant mb-8 font-body">
          A structured method for product thinking
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLOW_STEPS.map((step) => (
            <div
              key={step.letter}
              className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{step.icon}</span>
                </div>
                <div>
                  <span className="text-xs font-label font-bold text-primary tracking-wide uppercase">{step.letter}</span>
                  <h3 className="font-headline font-bold text-on-surface text-sm">{step.title}</h3>
                </div>
              </div>
              <p className="text-sm font-label font-semibold text-on-surface mb-1">{step.tagline}</p>
              <p className="text-sm text-on-surface-variant font-body">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The FLOW Method — 3 steps */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <h2 className="font-headline text-2xl font-bold text-center text-on-surface mb-8">
          The FLOW Method
        </h2>
        <div className="space-y-4">
          {METHOD_STEPS.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-4 bg-surface-container-low rounded-xl p-5"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-on-primary font-label font-bold text-sm">{step.num}</span>
              </div>
              <p className="text-on-surface font-body pt-2">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 text-center max-w-3xl mx-auto">
        <Link
          href="/onboarding/role"
          className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-8 py-3 font-label font-semibold hover:bg-primary/90 transition-colors"
        >
          Start your calibration
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
        <p className="text-sm text-on-surface-variant mt-3 font-body">~5 minutes · No credit card required</p>
        <p className="mt-4">
          <Link href="/dashboard" className="text-sm text-primary font-label font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-on-surface-variant font-label">
          <Link href="#" className="hover:text-on-surface transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-on-surface transition-colors">Terms</Link>
          <Link href="#" className="hover:text-on-surface transition-colors">Contact</Link>
          <Link href="#" className="hover:text-on-surface transition-colors">Manifesto</Link>
        </div>
      </footer>
    </div>
  )
}
