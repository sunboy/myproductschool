interface MasteryInfo {
  level: number
  label: string
}

function MasteryRing({ mastery }: { mastery: MasteryInfo }) {
  if (mastery.level === 4) {
    return (
      <div className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center" title="Mastered">
        <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 12" }}>check</span>
      </div>
    )
  }

  const circumference = 2 * Math.PI * 8
  const progressFraction = mastery.level / 4
  const dashLength = circumference * progressFraction
  const gapLength = circumference - dashLength

  return (
    <svg width={20} height={20} viewBox="0 0 20 20" className="shrink-0" aria-label={mastery.label}>
      <title>{mastery.label}</title>
      <circle cx={10} cy={10} r={8} fill="none" stroke="#e4e0d8" strokeWidth={2} />
      {mastery.level > 0 && (
        <circle
          cx={10}
          cy={10}
          r={8}
          fill="none"
          stroke="#4a7c59"
          strokeWidth={2}
          strokeDasharray={`${dashLength} ${gapLength}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          transform="rotate(-90 10 10)"
        />
      )}
    </svg>
  )
}

interface VocabCardProps {
  term: string
  definition: string
  formula?: string
  insight?: string
  isMastered?: boolean
  onToggleMastered?: () => void
  mastery?: MasteryInfo
}

export function VocabCard({ term, definition, formula, insight, isMastered, onToggleMastered, mastery }: VocabCardProps) {
  return (
    <div className="bg-surface-container rounded-2xl p-5 flex flex-col gap-3 break-inside-avoid relative">
      {mastery && (
        <div className="absolute top-3 right-3">
          <MasteryRing mastery={mastery} />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline text-base font-semibold text-on-surface">{term}</h3>
        <button
          onClick={onToggleMastered}
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${mastery ? 'mr-6' : ''} ${isMastered ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant hover:bg-primary-fixed'}`}
          title={isMastered ? 'Mastered' : 'Mark mastered'}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: isMastered ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >check</span>
        </button>
      </div>
      <p className="text-on-surface-variant text-sm leading-relaxed">{definition}</p>
      {formula && (
        <code className="bg-surface-container-highest rounded-lg px-3 py-2 text-xs font-mono text-on-surface block">{formula}</code>
      )}
      {insight && (
        <p className="text-on-surface-variant text-xs italic border-l-2 border-primary pl-3">{insight}</p>
      )}
    </div>
  )
}
