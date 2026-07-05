'use client'

import type { GuidanceState } from '@/lib/hatch/canvasGuidance'

interface CanvasReadinessMeterProps {
  guidance: GuidanceState
}

const VERDICT: Record<GuidanceState['phase'], string> = {
  empty: 'Thin. Hatch can barely see a design yet.',
  sketching: 'Thin. Hatch can barely see a design yet.',
  has_canvas_no_notes: 'Shape only. Add notes so the reasoning is visible.',
  notes_no_tradeoffs: 'Almost. Name a tradeoff to make it defensible.',
  ready: 'Ready. Hatch can grade the design and your reasoning.',
}

function Chip({ icon, label, on }: { icon: string; label: string; on?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label text-[11px] font-bold"
      style={{
        background: on ? 'var(--color-primary-container)' : 'var(--color-surface-container-high)',
        color: on ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
      }}
    >
      <span className="material-symbols-outlined text-[13px]">{icon}</span>
      {label}
    </span>
  )
}

export function CanvasReadinessMeter({ guidance }: CanvasReadinessMeterProps) {
  const ready = guidance.phase === 'ready'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-1.5 shrink-0">
        <Chip
          icon={guidance.labels.entityPlural === 'tables' ? 'table' : 'hub'}
          label={`${guidance.entityCount} ${guidance.labels.entityPlural}`}
          on={guidance.entityCount > 0}
        />
        <Chip
          icon="edit_note"
          label={`${guidance.notesCount}/${guidance.totalFields} notes`}
          on={guidance.notesCount > 0}
        />
        <Chip
          icon={guidance.hasTradeoffs ? 'check_circle' : 'balance'}
          label={guidance.hasTradeoffs ? 'tradeoff' : 'no tradeoff'}
          on={guidance.hasTradeoffs}
        />
      </div>
      <span
        className="font-label text-[11.5px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ color: ready ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}
      >
        {guidance.strictHold
          ? 'A tradeoff alone is not enough at this level. Write the reasoning behind a second field.'
          : VERDICT[guidance.phase]}
      </span>
    </div>
  )
}
