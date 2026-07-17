'use client'

import { HatchImage } from '@/components/redesign/HatchImage'
import type { CanvasChallengeType, GuidanceState } from '@/lib/hatch/canvasGuidance'

interface CanvasEmptyStateProps {
  challengeType: CanvasChallengeType
  guidance: GuidanceState
  /** Drop a starter template onto the canvas (API+datastore / users ERD). */
  onUseTemplate: () => void
  /** Send a seed prompt to Hatch so it draws the first piece. */
  onAskHatch: (prompt: string, autoSend?: boolean) => void
  /** Open the notes / context pack. */
  onOpenNotes: () => void
}

// Branded empty-state shown ONLY before the user has drawn anything. Replaces
// the blank-Excalidraw "pick a tool" paralysis with a centered Hatch presence
// and three clear first moves. It un-mounts the moment the canvas has an entity,
// handing the surface back to the live coach card + dock.
export function CanvasEmptyState({
  challengeType,
  guidance,
  onUseTemplate,
  onAskHatch,
  onOpenNotes,
}: CanvasEmptyStateProps) {
  const isData = challengeType === 'data_modeling'
  const noun = isData ? 'data model' : 'system'
  const entityWord = guidance.labels.entity // 'table' | 'node'

  const seedPrompt = isData
    ? 'Add a users table with id PK and email, then suggest the next table I should model.'
    : 'Add an API gateway and a database to start, then tell me the next component to place.'

  const templateLabel = isData ? 'Start from an ERD' : 'Start from a system skeleton'
  const templateSub = isData
    ? 'users + orders, keyed and linked'
    : 'client → API → service → datastore'

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center p-6 pointer-events-none"
      // Soft scrim so the blank canvas reads as intentional space, not an error.
      style={{ background: 'radial-gradient(circle at 50% 38%, rgba(74,124,89,0.06), transparent 60%)' }}
    >
      {/* The card itself stays pointer-transparent so drag-starts over the canvas
          center reach Excalidraw; only the buttons re-enable pointer events. */}
      <div className="pointer-events-none w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <HatchImage size={64} state="speaking" />
        </div>

        <h2 className="font-headline text-2xl font-semibold tracking-tight text-on-surface">
          Let&apos;s design this {noun} together
        </h2>
        <p className="mt-2 font-body text-sm text-on-surface-variant leading-relaxed">
          Blank canvas, but you are not alone. Drop a {entityWord} to begin, start from a
          skeleton, or tell Hatch what to draw. It can see every box and connection you
          place and will pressure-test the reasoning as you go.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={onUseTemplate}
            className="pointer-events-auto group inline-flex items-center justify-between gap-3 rounded-xl bg-primary text-on-primary px-4 py-3 font-label text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span className="text-left">
                <span className="block leading-tight">{templateLabel}</span>
                <span className="block text-[11px] font-normal opacity-80 leading-tight">{templateSub}</span>
              </span>
            </span>
            <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => onAskHatch(seedPrompt, true)}
              className="pointer-events-auto flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-low border border-outline-variant px-3 py-2.5 font-label text-[13px] font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
              Ask Hatch to start
            </button>
            <button
              onClick={onOpenNotes}
              className="pointer-events-auto flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-low border border-outline-variant px-3 py-2.5 font-label text-[13px] font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">edit_note</span>
              Open notes
            </button>
          </div>
        </div>

        <p className="mt-4 font-label text-[11px] text-on-surface-variant">
          Hand-draw, type, or speak. There is no single right shape.
        </p>
      </div>
    </div>
  )
}
