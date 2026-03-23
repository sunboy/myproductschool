'use client'

interface ConfidenceSliderProps {
  value: number // 1-5
  onChange: (value: number) => void
}

const levels = [
  { label: 'Guessing', value: 1 },
  { label: 'Unsure', value: 2 },
  { label: 'Decent', value: 3 },
  { label: 'Confident', value: 4 },
  { label: 'Nailed it', value: 5 },
]

function getButtonStyles(level: number, selected: boolean): string {
  if (!selected) {
    return 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
  }
  // Error tones for low confidence (1-2)
  if (level <= 2) {
    return 'bg-error/15 text-error border-error/30'
  }
  // Tertiary tones for medium (3)
  if (level === 3) {
    return 'bg-tertiary/15 text-tertiary border-tertiary/30'
  }
  // Primary tones for high confidence (4-5)
  return 'bg-primary/15 text-primary border-primary/30'
}

export function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
  return (
    <div className="bg-surface-container rounded-xl p-5">
      <label className="block text-sm font-medium text-on-surface mb-3">
        How confident are you in this response?
      </label>
      <div className="flex gap-2">
        {levels.map((level) => {
          const isSelected = value === level.value
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium border transition-all ${getButtonStyles(
                level.value,
                isSelected
              )} ${isSelected ? 'border' : 'border-transparent'}`}
            >
              {level.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
