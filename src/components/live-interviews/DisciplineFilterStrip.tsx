// src/components/live-interviews/DisciplineFilterStrip.tsx
'use client'

export type InterviewDiscipline = 'all' | 'product_sense' | 'system_design' | 'data_modeling' | 'coding'

const CHIPS: { key: InterviewDiscipline; label: string; disabled?: boolean }[] = [
  { key: 'all', label: 'All' },
  { key: 'product_sense', label: '🧠 Product Sense' },
  { key: 'system_design', label: '🏗️ System Design' },
  { key: 'data_modeling', label: '🗄️ Data Modeling' },
  { key: 'coding', label: '💻 Coding', disabled: true },
]

interface Props {
  active: InterviewDiscipline
  onChange: (d: InterviewDiscipline) => void
}

export function DisciplineFilterStrip({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CHIPS.map((chip) => {
        const isActive = active === chip.key
        return (
          <button
            key={chip.key}
            disabled={chip.disabled}
            onClick={() => !chip.disabled && onChange(chip.key)}
            className={[
              'rounded-full px-3 py-1.5 font-label text-xs transition-colors whitespace-nowrap',
              isActive
                ? 'bg-primary text-on-primary font-semibold'
                : chip.disabled
                  ? 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high cursor-pointer border border-outline-variant',
            ].join(' ')}
          >
            {chip.label}
            {chip.disabled && <span className="ml-1 text-[9px] opacity-60">(soon)</span>}
          </button>
        )
      })}
    </div>
  )
}
