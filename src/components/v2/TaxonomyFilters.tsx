'use client'

interface TaxonomyFiltersProps {
  paradigms: string[]
  selectedParadigm: string | null
  difficulties: string[]
  selectedDifficulty: string | null
  onParadigmChange: (p: string | null) => void
  onDifficultyChange: (d: string | null) => void
}

function ChipRow({
  label,
  items,
  selected,
  onChange,
}: {
  label: string
  items: string[]
  selected: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-label text-xs text-on-surface-variant shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onChange(null)}
          className={[
            'rounded-full px-4 py-1.5 text-sm font-label cursor-pointer transition-colors shrink-0',
            selected === null
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
          ].join(' ')}
        >
          All
        </button>
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item === selected ? null : item)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-label cursor-pointer transition-colors shrink-0',
              item === selected
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
            ].join(' ')}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TaxonomyFilters({
  paradigms,
  selectedParadigm,
  difficulties,
  selectedDifficulty,
  onParadigmChange,
  onDifficultyChange,
}: TaxonomyFiltersProps) {
  return (
    <div className="space-y-2">
      <ChipRow label="Topic:" items={paradigms} selected={selectedParadigm} onChange={onParadigmChange} />
      <ChipRow label="Level:" items={difficulties} selected={selectedDifficulty} onChange={onDifficultyChange} />
    </div>
  )
}
