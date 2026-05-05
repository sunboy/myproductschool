const EXPERT_PICKS = [
  {
    title: 'Mastering Tonal Layers',
    author: 'Sarah Chen',
    role: 'Staff Designer',
  },
  {
    title: 'Accessibility in Earth Tones',
    author: 'David Miller',
    role: 'A11y Lead',
  },
]

export function ExpertPicksPanel() {
  return (
    <div className="bg-[#fdf8ed] border-l-[3px] border-tertiary-container text-on-surface rounded-lg p-6 editorial-shadow ghost-border relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
          <h3 className="text-tertiary-container font-bold text-lg tracking-wide uppercase font-label">Hatch&apos;s Expert Picks</h3>
        </div>
        <p className="text-sm font-medium mb-6 text-on-surface-variant">
          Curated insights from the community to help you navigate complex design challenges.
        </p>
        <ul className="space-y-4">
          {EXPERT_PICKS.map((pick, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-xl font-bold opacity-30">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h4 className="text-sm font-bold leading-tight">{pick.title}</h4>
                <p className="text-xs opacity-70">
                  By {pick.author} &bull; {pick.role}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
