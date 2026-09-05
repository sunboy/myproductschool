'use client'

import type { ComponentType } from 'react'
import { Braces, Database, Network, LineChart, Workflow, Lightbulb, LayoutGrid } from 'lucide-react'
import type { Discipline } from '@/components/challenges/DisciplineTabStrip'
import { AppTooltip } from '@/components/ui/AppTooltip'

/**
 * Compact discipline selector — one wrapping row of count-badged pills, replacing
 * the old 88px tile grid so the challenge list starts a full band higher.
 */
interface ChipDef {
  key: Discipline
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
  /** Idle icon tint (discipline accent pair from globals.css §9). */
  iconClass: string
}

const CHIPS: ChipDef[] = [
  { key: 'algorithm', label: 'Coding / DSA', description: 'DSA practice for implementation speed and correctness.', icon: Braces, iconClass: 'text-sql-fg' },
  { key: 'sql', label: 'SQL', description: 'Live query execution with real interview-style datasets.', icon: Database, iconClass: 'text-dm-fg' },
  { key: 'system_design', label: 'System design', description: 'Architecture prompts, tradeoffs, scale, and context.', icon: Network, iconClass: 'text-sd-fg' },
  { key: 'analytics', label: 'AI Analytics', description: 'Drive a live Claude Code agent against a real dataset.', icon: LineChart, iconClass: 'text-aiml-fg' },
  { key: 'data_modeling', label: 'Data modeling', description: 'Schema, entities, analytics thinking, and durable models.', icon: Workflow, iconClass: 'text-dm-fg' },
  { key: 'product_sense', label: 'Product sense', description: 'MCQs and judgment drills for product-quality thinking.', icon: Lightbulb, iconClass: 'text-ps-fg' },
  { key: 'all', label: 'All practice', description: 'Every challenge across product, data, systems, SQL, and coding.', icon: LayoutGrid, iconClass: 'text-forest-700' },
]

interface Props {
  active: Discipline
  counts: (key: Discipline) => number
  onChange: (d: Discipline) => void
  /** Chip keys to render (lets the parent hide flagged-off disciplines). */
  visible: Discipline[]
}

export function DisciplineChipRow({ active, counts, onChange, visible }: Props) {
  const chips = CHIPS.filter(c => visible.includes(c.key))

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(chip => {
        const isActive = active === chip.key
        const count = counts(chip.key)
        const Icon = chip.icon
        return (
          <AppTooltip key={chip.key} label={chip.description} side="bottom">
            <button
              type="button"
              onClick={() => onChange(chip.key)}
              aria-pressed={isActive}
              className={[
                'flex h-8 items-center gap-1.5 rounded-full border px-3 font-label text-xs font-semibold whitespace-nowrap transition-colors',
                isActive
                  ? 'border-forest-800 bg-forest-800 text-white'
                  : 'border-hairline bg-card-bright text-ink-strong hover:border-hairline-strong hover:bg-page-field',
              ].join(' ')}
            >
              <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-mint-glow' : chip.iconClass}`} />
              {chip.label}
              <span
                className={[
                  'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                  isActive ? 'bg-white/15 text-white' : 'bg-page-field text-ink-secondary',
                ].join(' ')}
              >
                {count}
              </span>
            </button>
          </AppTooltip>
        )
      })}
    </div>
  )
}
