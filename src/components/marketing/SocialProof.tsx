const TESTIMONIALS = [
  {
    quote:
      'I went from PM interview anxiety to 3 offers in 6 weeks.',
    name: 'Alex R.',
    role: 'SWE\u2192PM at Stripe',
  },
  {
    quote:
      'The failure pattern detection is unlike anything I\u2019ve seen. It caught my blind spots.',
    name: 'Priya S.',
    role: 'Senior PM',
  },
  {
    quote:
      'Finally, a practice tool that gives real feedback, not just \u201Cgood job.\u201D',
    name: 'Jordan K.',
    role: 'Career Changer',
  },
] as const

export function SocialProof() {
  return (
    <section className="py-20">
      <p className="font-headline text-2xl font-bold text-on-surface text-center mb-10">
        500+ product thinkers sharpening their instincts
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="bg-surface-container rounded-xl p-5 space-y-3"
          >
            <p className="italic text-on-surface leading-relaxed">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="text-xs text-on-surface-variant font-label">
              <span className="font-semibold text-on-surface">{t.name}</span>
              {' '}&middot;{' '}
              {t.role}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
