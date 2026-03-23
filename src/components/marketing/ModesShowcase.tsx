const MODES = [
  {
    icon: 'timer',
    title: 'Spotlight',
    subtitle: 'Focused sprint',
    description:
      '10 minutes, no hints. Pure pressure. Closest to the real interview.',
  },
  {
    icon: 'school',
    title: 'Workshop',
    subtitle: 'Guided practice',
    description:
      'Luma nudges you every 3 minutes. Learn while you write.',
  },
  {
    icon: 'chat',
    title: 'Live',
    subtitle: 'Mock interview',
    description:
      'Back-and-forth dialogue with Luma. Practice thinking on your feet.',
  },
  {
    icon: 'self_improvement',
    title: 'Solo',
    subtitle: 'Free exploration',
    description: 'No timer, no pressure. Write at your own pace.',
  },
] as const

export function ModesShowcase() {
  return (
    <section className="py-20">
      <div className="text-center mb-10">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface">
          Four ways to practice
        </h2>
        <p className="text-on-surface-variant mt-4 max-w-xl mx-auto">
          Different modes for different goals. Start with Spotlight for interview
          prep, or ease in with Solo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MODES.map((mode) => (
          <div
            key={mode.title}
            className="bg-surface-container rounded-xl p-6 text-center space-y-3"
          >
            <div className="bg-primary/10 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">
                {mode.icon}
              </span>
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {mode.title}
            </h3>
            <p className="text-sm font-label font-medium text-primary">
              {mode.subtitle}
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {mode.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
