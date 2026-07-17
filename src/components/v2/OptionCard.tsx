'use client'

import { Check, Lightbulb } from 'lucide-react'

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
  multiSelect?: boolean
  onSelect: (id: string) => void
}

// Tier chips render as "sticker" chips per spec §7: tint fill + 1.5px border
// in the fg color, never a shadow.
const TIER_STYLES: Record<number, { label: string; fg: string; bg: string; border: string }> = {
  3: { label: 'Best', fg: 'var(--color-forest-600)', bg: 'var(--color-note-mint)', border: 'var(--color-forest-600)' },
  2: { label: 'Good, but incomplete', fg: '#1c6e6a', bg: 'var(--color-note-teal)', border: '#1c6e6a' },
  1: { label: 'Surface', fg: '#8a5c00', bg: 'var(--color-note-amber)', border: '#b3861e' },
  0: { label: 'Plausible but wrong', fg: '#8f2f4b', bg: 'var(--color-note-blush)', border: '#b06183' },
}

export function OptionCard({ option, selected, revealed, revealData, disabled, multiSelect, onSelect }: OptionCardProps) {
  const tier = revealData ? TIER_STYLES[revealData.points] ?? TIER_STYLES[0] : null

  const cardClasses = [
    'w-full text-left rounded-xl p-4 border font-body text-sm transition-all duration-150',
    revealed && selected
      ? 'border-forest-600 ring-1 ring-forest-600/25'
      : revealed
      ? 'border-hairline opacity-55'
      : selected
      ? 'border-forest-600 ring-1 ring-forest-600/20'
      : 'border-hairline hover:border-forest-600/40 hover:-translate-y-0.5',
    disabled && !revealed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
  ].join(' ')

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect(option.id)}
      className={cardClasses}
      style={{ background: selected ? 'rgba(38,98,53,0.05)' : 'var(--color-card-bright)' }}
    >
      <div className="flex items-start gap-3">
        <span
          className="shrink-0 w-6 h-6 rounded-full font-label text-xs font-bold flex items-center justify-center mt-0.5 transition-colors duration-150"
          style={selected
            ? { border: '1.5px solid var(--color-forest-800)', color: 'var(--color-forest-800)', background: 'transparent' }
            : { border: '1.4px solid #c8c2b6', color: 'var(--color-ink-muted)', background: 'transparent' }}
        >
          {option.option_label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-ink-strong leading-[1.55]">{option.option_text}</p>
          {revealed && revealData && tier && (
            <div className="mt-2 space-y-1.5">
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-label font-bold"
                style={{ color: tier.fg, background: tier.bg, border: `1.5px solid ${tier.border}` }}
              >
                {tier.label}
              </span>
              <p className="text-ink-secondary text-xs leading-[1.55]">{revealData.explanation}</p>
              {revealData.framework_hint && (
                <div className="note-teal mt-2 flex items-start gap-2 rounded-lg p-3">
                  <Lightbulb size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-forest-600" />
                  <p className="text-xs text-ink-strong leading-relaxed">{revealData.framework_hint}</p>
                </div>
              )}
            </div>
          )}
        </div>
        {!revealed && (
          <span
            className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center transition-colors duration-150"
            style={{
              borderRadius: multiSelect ? 5 : 999,
              border: selected ? 'none' : '1.5px solid #c8c2b6',
              background: selected ? 'var(--color-forest-800)' : 'transparent',
              color: '#fff',
            }}
          >
            {selected && <Check size={12} strokeWidth={2.6} />}
          </span>
        )}
      </div>
    </button>
  )
}
