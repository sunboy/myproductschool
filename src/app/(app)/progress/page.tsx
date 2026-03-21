import Link from 'next/link'

export default function ProgressPage() {
  // Mock data for the heatmap
  const today = new Date()
  const days = Array.from({ length: 91 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (90 - i))
    return {
      date: d.toISOString().split('T')[0],
      count: ((i * 7 + 3) % 10) > 6 ? ((i * 3 + 1) % 4) + 1 : 0,
    }
  })

  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold text-on-surface">Progress</h1>
        <p className="text-on-surface-variant mt-1">Your product thinking journey.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Challenges', value: '0', icon: 'fitness_center' },
          { label: 'Streak days', value: '0', icon: 'local_fire_department' },
          { label: 'Avg score', value: '—', icon: 'star' },
          { label: 'Concepts mastered', value: '0', icon: 'check_circle' },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-surface-container rounded-2xl border border-outline-variant text-center">
            <span className="material-symbols-outlined text-primary text-2xl mb-1 block">{stat.icon}</span>
            <div className="font-headline text-2xl font-bold text-on-surface">{stat.value}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Activity heatmap */}
      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">Activity</h2>
        <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(day => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} ${day.count === 1 ? 'challenge' : 'challenges'}`}
                    className={`w-3.5 h-3.5 rounded-sm transition-colors ${
                      day.count === 0 ? 'bg-surface-container-high' :
                      day.count === 1 ? 'bg-primary/30' :
                      day.count === 2 ? 'bg-primary/60' :
                      'bg-primary'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant mt-3">Last 13 weeks of challenge activity</p>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 bg-primary-container rounded-2xl flex items-center gap-4">
        <span className="material-symbols-outlined text-3xl text-primary flex-shrink-0">fitness_center</span>
        <div className="flex-1">
          <p className="font-medium text-on-primary-container">Start your first challenge</p>
          <p className="text-sm text-primary">Complete challenges to build your progress history.</p>
        </div>
        <Link href="/challenges" className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex-shrink-0">
          Practice
        </Link>
      </div>
    </div>
  )
}
