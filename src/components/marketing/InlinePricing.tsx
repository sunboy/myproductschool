import Link from 'next/link'

const FREE_FEATURES = [
  '3 challenge starts per month',
  'All 5 domains',
  'Vocabulary + flashcards',
  'Starter Hatch AI budget',
  'Progress tracking',
]

const PRO_FEATURES = [
  'Everything in Free',
  '80 challenge starts per month',
  '12 AI interview starts per month',
  'Fair-use Hatch AI budget',
  'Full model answers',
  'Failure pattern tracking',
]

export function InlinePricing() {
  return (
    <section className="py-20">
      <div className="text-center mb-10">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface">
          Simple, transparent pricing
        </h2>
        <p className="text-on-surface-variant mt-4">
          Start free. Upgrade when you&apos;re ready to go all in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free tier */}
        <div className="bg-surface-container rounded-xl p-6 space-y-5">
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface">
              Free
            </h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Build the habit
            </p>
          </div>
          <p className="font-headline text-3xl font-bold text-on-surface">
            $0
            <span className="text-base font-body font-normal text-on-surface-variant">
              /mo
            </span>
          </p>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-base">
                  check
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="block text-center bg-secondary-container text-on-secondary-container rounded-full px-6 py-2.5 font-label font-semibold hover:opacity-90 transition-opacity"
          >
            Start Free
          </Link>
        </div>

        {/* Pro tier */}
        <div className="bg-primary/5 border border-primary rounded-xl p-6 space-y-5 relative">
          <div className="absolute -top-3 right-4">
            <span className="bg-primary text-on-primary text-xs font-label font-semibold rounded-full px-3 py-1">
              Popular
            </span>
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface">
              Pro
            </h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Accelerate your prep
            </p>
          </div>
          <p className="font-headline text-3xl font-bold text-on-surface">
            $30
            <span className="text-base font-body font-normal text-on-surface-variant">
              /mo
            </span>
          </p>
          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-base">
                  check
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="block text-center bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold hover:opacity-90 transition-opacity"
          >
            Start Pro Trial
          </Link>
        </div>
      </div>
    </section>
  )
}
