import { Box, Lightbulb, Database, Code, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Discipline = 'system-design' | 'product-sense' | 'data-modeling' | 'sql' | 'ai-ml'

const DISCIPLINE_ICON: Record<Discipline, typeof Box> = {
  'system-design': Box,
  'product-sense': Lightbulb,
  'data-modeling': Database,
  sql: Code,
  'ai-ml': BrainCircuit,
}

/** bg/fg pairs per spec palette "Discipline accents" + icons.html tile recipe. */
const DISCIPLINE_CLASSES: Record<Discipline, { bg: string; border: string; fg: string }> = {
  'system-design': { bg: 'bg-sd-bg', border: 'border-sd-fg/40', fg: 'text-sd-fg' },
  'product-sense': { bg: 'bg-ps-bg', border: 'border-ps-fg/40', fg: 'text-ps-fg' },
  'data-modeling': { bg: 'bg-dm-bg', border: 'border-dm-fg/40', fg: 'text-dm-fg' },
  sql: { bg: 'bg-sql-bg', border: 'border-sql-fg/40', fg: 'text-sql-fg' },
  'ai-ml': { bg: 'bg-aiml-bg', border: 'border-aiml-fg/40', fg: 'text-aiml-fg' },
}

export interface DisciplineTileProps {
  discipline: Discipline
  className?: string
}

/**
 * The 44px discipline icon tile: tint background, 1px tint border, 22px
 * lucide glyph. Per spec §9 point 3 — used ONLY on featured/recommendation
 * cards, top-left, exactly one place. Do not use on shelf rows, rails, or
 * stat cells (those stay tile-free per §4/§8).
 */
export function DisciplineTile({ discipline, className }: DisciplineTileProps) {
  const Icon = DISCIPLINE_ICON[discipline]
  const { bg, border, fg } = DISCIPLINE_CLASSES[discipline]

  return (
    <span
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] border',
        bg,
        border,
        fg,
        className
      )}
    >
      <Icon size={22} strokeWidth={1.8} />
    </span>
  )
}
