'use client'

export type Discipline = 'all' | 'product_sense' | 'system_design' | 'data_modeling' | 'coding'

const TABS: { key: Discipline; label: string; mobileLabel: string; disabled?: boolean }[] = [
  { key: 'all', label: 'All', mobileLabel: 'All' },
  { key: 'product_sense', label: 'Product Sense', mobileLabel: 'Product' },
  { key: 'system_design', label: 'System Design', mobileLabel: 'Sys Design' },
  { key: 'data_modeling', label: 'Data Modeling', mobileLabel: 'Data' },
  { key: 'coding', label: 'Coding', mobileLabel: 'Coding' },
]

interface Props {
  active: Discipline
  onChange: (d: Discipline) => void
}

export function DisciplineTabStrip({ active, onChange }: Props) {
  return (
    <div className="flex border-b-2 border-outline-variant bg-surface overflow-x-auto scrollbar-none px-4">
      {TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.key)}
            className={[
              'flex-shrink-0 py-2.5 px-4 font-label text-sm whitespace-nowrap transition-colors',
              'border-b-2 -mb-0.5',
              isActive
                ? 'border-primary text-primary font-semibold'
                : tab.disabled
                  ? 'border-transparent text-on-surface-variant/40 cursor-not-allowed'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface cursor-pointer',
            ].join(' ')}
          >
            {/* Mobile: abbreviated label */}
            <span className="sm:hidden">{tab.mobileLabel}</span>
            {/* Desktop: full label */}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
