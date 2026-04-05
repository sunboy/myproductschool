'use client'

interface OptionData {
  id: string
  option_label: string
  option_text: string
}

interface RevealData {
  points: number
  explanation: string
  framework_hint?: string
}

interface OptionCardProps {
  option: OptionData
  selected: boolean
  revealed: boolean
  revealData?: RevealData
  disabled: boolean
  onSelect: (id: string) => void
}

const TIER_STYLES: Record<number, { badge: string; label: string }> = {
  3: { badge: 'bg-primary text-on-primary', label: 'Best' },
  2: { badge: 'bg-tertiary-container text-on-surface', label: 'Good, but incomplete' },
  1: { badge: 'bg-secondary-container text-on-secondary-container', label: 'Surface' },
  0: { badge: 'bg-error/10 text-error', label: 'Plausible but wrong' },
}

export function OptionCard({ option, selected, revealed, revealData, disabled, onSelect }: OptionCardProps) {
  const tier = revealData ? TIER_STYLES[revealData.points] ?? TIER_STYLES[0] : null

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect(option.id)}
      className={[
        'w-full text-left rounded-xl p-4 border-2 transition-all font-body text-sm',
        revealed && selected
          ? 'ring-2 ring-primary border-primary bg-surface-container-low'
          : revealed
          ? 'border-outline-variant bg-surface-container opacity-60'
          : selected
          ? 'border-primary bg-surface-container-low'
          : 'border-outline-variant bg-surface-container hover:bg-surface-container-high',
        disabled && !revealed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant font-label text-xs font-semibold flex items-center justify-center mt-0.5">
          {option.option_label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-on-surface">{option.option_text}</p>
          {revealed && revealData && tier && (
            <div className="mt-2 space-y-1">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-label font-semibold ${tier.badge}`}>
                {tier.label}
              </span>
              <p className="text-on-surface-variant text-xs">{revealData.explanation}</p>
              {revealData.framework_hint && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-primary-fixed/50 p-3">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">psychology</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{revealData.framework_hint}</p>
                </div>
              )}
            </div>
          )}
        </div>
        {selected && !revealed && (
          <span
            className="material-symbols-outlined text-primary text-[20px] shrink-0"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
          >
            radio_button_checked
          </span>
        )}
      </div>
    </button>
  )
}
