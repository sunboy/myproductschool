'use client'

export type CodingSubDiscipline = 'sql' | 'algorithm'

interface Props {
  active: CodingSubDiscipline
  onChange: (sub: CodingSubDiscipline) => void
}

const TABS: { key: CodingSubDiscipline; label: string }[] = [
  { key: 'sql', label: 'SQL' },
  { key: 'algorithm', label: 'Algorithms' },
]

export function CodingSubTabStrip({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 px-4 py-2 bg-surface border-b border-outline-variant">
      {TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            type="button"
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={[
              'px-3 py-1 rounded-full font-label text-xs font-semibold transition-colors',
              isActive
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
