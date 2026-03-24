const CONTRIBUTORS = [
  { name: 'Kevin Heart', xp: '4.2k', initials: 'KH' },
  { name: 'Lila Thorne', xp: '3.8k', initials: 'LT' },
  { name: 'Elena Ruiz', xp: '2.9k', initials: 'ER' },
]

export function TopContributorsPanel() {
  return (
    <div className="bg-surface-container-high rounded-3xl p-6">
      <h3 className="font-headline font-bold text-lg mb-4">Top Contributors</h3>
      <div className="space-y-4">
        {CONTRIBUTORS.map((c) => (
          <div key={c.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                <span className="text-on-primary-container text-xs font-bold">{c.initials}</span>
              </div>
              <span className="text-sm font-bold">{c.name}</span>
            </div>
            <span className="text-xs font-bold text-primary">{c.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  )
}
