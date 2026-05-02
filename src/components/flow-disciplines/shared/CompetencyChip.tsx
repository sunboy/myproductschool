'use client'

interface CompetencyChipProps {
  name: string
  active?: boolean
  onClick?: () => void
}

export function CompetencyChip({ name, active = false, onClick }: CompetencyChipProps) {
  const display = name.replace(/_/g, ' ')
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-label font-medium tracking-wide
        transition-all duration-200 cursor-default
        ${active
          ? 'bg-primary text-on-primary shadow-sm'
          : 'bg-secondary-container text-on-secondary-container'
        }
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
      `}
    >
      {display}
    </button>
  )
}
