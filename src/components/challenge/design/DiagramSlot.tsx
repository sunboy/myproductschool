'use client'

import type { MouseEvent } from 'react'
import { PenLine, Workflow } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GuidanceLabels } from '@/lib/hatch/canvasGuidance'

export interface CanvasOpenOrigin {
  /** Viewport coords of the trigger's center, so the overlay can scale from the slot. */
  x: number
  y: number
}

export interface DiagramSlotProps {
  /** Object URL of the latest diagram snapshot, or null while none exists. */
  thumbUrl: string | null
  entityCount: number
  connectionCount: number
  /** Discipline nouns (node/flow vs table/link) for the meta line. */
  labels: GuidanceLabels
  /** Opens the full-screen canvas overlay, scaling from the trigger when an origin is given. */
  onOpen: (origin?: CanvasOpenOrigin) => void
  className?: string
}

function originOf(event: MouseEvent<HTMLButtonElement>): CanvasOpenOrigin {
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/**
 * The diagram sub-section body inside a design step form. Empty = dashed
 * drop-zone with the "Open canvas" action. Non-empty = snapshot thumbnail
 * embedded in the write-up (per the approved overlay's inset preview in
 * docs/redesign/previews/round4/canvas-workspace.html) with an "Edit diagram"
 * action; the drawing stays editable in the overlay.
 */
export function DiagramSlot({
  thumbUrl,
  entityCount,
  connectionCount,
  labels,
  onOpen,
  className,
}: DiagramSlotProps) {
  const hasDiagram = entityCount > 0 || connectionCount > 0

  if (!hasDiagram) {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-lg border-[1.5px] border-dashed border-hairline-strong bg-page-field px-5 py-7',
          className
        )}
      >
        <p className="text-center text-[12.5px] leading-relaxed text-ink-secondary">
          The canvas is empty. Sketch the {labels.entityPlural} first; the write-up gets sharper
          once the picture exists.
        </p>
        <button
          type="button"
          onClick={(e) => onOpen(originOf(e))}
          className="inline-flex items-center gap-2 rounded-lg bg-forest-950 px-4 py-2 text-[13px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-150 active:scale-[0.98]"
        >
          <Workflow size={16} strokeWidth={1.8} />
          Open canvas
        </button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <button
        type="button"
        onClick={(e) => onOpen(originOf(e))}
        aria-label="Edit diagram on the canvas"
        className="group overflow-hidden rounded-lg border border-hairline bg-page-field text-left"
      >
        {thumbUrl ? (
          // Snapshot thumbnails are short-lived object URLs; next/image cannot
          // optimize blob: sources, so a plain img is correct here.
          // Keyed on the URL so each fresh snapshot settles into the slot
          // (the return leg of the canvas overlay round trip).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={thumbUrl}
            src={thumbUrl}
            alt={`Diagram snapshot: ${plural(entityCount, labels.entity, labels.entityPlural)}, ${plural(connectionCount, labels.relation, labels.relationPlural)}`}
            className="animate-thumb-settle max-h-56 w-full object-contain"
          />
        ) : (
          <div className="flex h-24 items-center justify-center">
            <span className="text-[12.5px] font-semibold tabular-nums text-ink-secondary">
              {plural(entityCount, labels.entity, labels.entityPlural)} ·{' '}
              {plural(connectionCount, labels.relation, labels.relationPlural)} on the canvas
            </span>
          </div>
        )}
      </button>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tabular-nums text-ink-muted">
          {plural(entityCount, labels.entity, labels.entityPlural)} ·{' '}
          {plural(connectionCount, labels.relation, labels.relationPlural)}
        </span>
        <button
          type="button"
          onClick={(e) => onOpen(originOf(e))}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-forest-700 transition-colors duration-150 hover:text-forest-800"
        >
          Edit diagram
          <PenLine size={13} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
