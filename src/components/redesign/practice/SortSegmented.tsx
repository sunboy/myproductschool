'use client'

export type PracticeSort = 'recommended' | 'newest' | 'hardest'

export const PRACTICE_SORTS: { value: PracticeSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'hardest', label: 'Hardest' },
]

export function isPracticeSort(v: string | null): v is PracticeSort {
  return PRACTICE_SORTS.some(s => s.value === v)
}

/** Three-way sort control for the Practice challenge list. */
export function SortSegmented({ value, onChange }: { value: PracticeSort; onChange: (s: PracticeSort) => void }) {
  return (
    <div className="flex shrink-0 items-center overflow-hidden rounded-full border border-hairline bg-card-bright p-0.5">
      {PRACTICE_SORTS.map(s => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          aria-pressed={value === s.value}
          className={[
            'rounded-full px-3 py-1 font-label text-[11px] font-semibold whitespace-nowrap transition-colors',
            value === s.value ? 'bg-forest-800 text-white' : 'text-ink-secondary hover:text-ink-strong',
          ].join(' ')}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
