interface VocabCardProps {
  term: string
  definition: string
  formula?: string
  insight?: string
  isMastered?: boolean
  onToggleMastered?: () => void
}

export function VocabCard({ term, definition, formula, insight, isMastered, onToggleMastered }: VocabCardProps) {
  return (
    <div className="bg-surface-container rounded-2xl p-5 flex flex-col gap-3 break-inside-avoid">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline text-base font-semibold text-on-surface">{term}</h3>
        <button
          onClick={onToggleMastered}
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isMastered ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant hover:bg-primary-fixed'}`}
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
