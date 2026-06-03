'use client'

import { useEffect, useState } from 'react'

import type { CanvasChallengeType, GuidanceState } from '@/lib/hatch/canvasGuidance'

interface CanvasCoachCardProps {
  challengeType: CanvasChallengeType
  guidance: GuidanceState
  forceOpen?: boolean
  onOpenNotes: () => void
  onAskHatch: (prompt: string, autoSend?: boolean) => void
}

const COLLAPSE_KEY = 'canvas-coach-card:collapsed'

interface PhaseCopy {
  icon: string
  heading: string
  body: string
  actionLabel: string
  /** Returns the prompt to send to Hatch, or null when the action opens notes instead. */
  prompt: ((c: CanvasChallengeType, g: GuidanceState) => string) | null
}

function seedDrawPrompt(challengeType: CanvasChallengeType): string {
  return challengeType === 'data_modeling'
    ? 'Add a users table with id PK and email, then suggest the next table I should model.'
    : 'Add an API gateway and a database to start, then tell me the next component to place.'
}

const PHASE_COPY: Record<GuidanceState['phase'], PhaseCopy> = {
  empty: {
    icon: 'add_box',
    heading: 'Start with one box',
    body: 'Drop your first {entity} on the canvas, or tell Hatch to draw it. You can also jot an assumption in notes first.',
    actionLabel: 'Ask Hatch to start',
    prompt: (c) => seedDrawPrompt(c),
  },
  sketching: {
    icon: 'gesture',
    heading: 'Keep building the shape',
    body: 'Add another {entity} and connect them so the {relationPlural} are clear. Two connected {entityPlural} beats one detailed one.',
    actionLabel: 'What should I add?',
    prompt: (_c, g) =>
      `What should I add next to make this ${g.labels.entityPlural === 'tables' ? 'data model' : 'system design'} stronger? Name the one ${g.labels.entity} or ${g.labels.relation} that is missing.`,
  },
  has_canvas_no_notes: {
    icon: 'edit_note',
    heading: 'Now make your case',
    body: 'The canvas shows the shape. Open notes and write the assumptions and constraints behind it so Hatch can judge the reasoning, not just the picture.',
    actionLabel: 'Open notes',
    prompt: null,
  },
  notes_no_tradeoffs: {
    icon: 'balance',
    heading: 'Name a tradeoff',
    body: 'You have a design and notes. Add the one tradeoff you are betting on: what you gained, what you gave up, and why that is acceptable.',
    actionLabel: 'Pressure-test it',
    prompt: () =>
      'Pretend you are the interviewer. Ask the one follow-up question that most exposes whether this holds up, then tell me how to defend it.',
  },
  ready: {
    icon: 'task_alt',
    heading: 'This is submittable',
    body: 'Hatch can see your {entityPlural}, {relationPlural}, and your reasoning. Run one more gap check, or submit when you can defend it.',
    actionLabel: 'Final gap check',
    prompt: () => 'What is the single highest-risk gap left before I submit?',
  },
}

function fillLabels(template: string, g: GuidanceState): string {
  return template
    .replaceAll('{entityPlural}', g.labels.entityPlural)
    .replaceAll('{entity}', g.labels.entity)
    .replaceAll('{relationPlural}', g.labels.relationPlural)
    .replaceAll('{relation}', g.labels.relation)
}

export function CanvasCoachCard({
  challengeType,
  guidance,
  forceOpen,
  onOpenNotes,
  onAskHatch,
}: CanvasCoachCardProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (window.localStorage.getItem(COLLAPSE_KEY) === '1') setCollapsed(true)
  }, [])

  // forceOpen (replay / help button) always re-expands.
  useEffect(() => {
    if (forceOpen) setCollapsed(false)
  }, [forceOpen])

  const collapse = () => {
    window.localStorage.setItem(COLLAPSE_KEY, '1')
    setCollapsed(true)
  }
  const expand = () => {
    window.localStorage.removeItem(COLLAPSE_KEY)
    setCollapsed(false)
  }

  const copy = PHASE_COPY[guidance.phase]

  if (collapsed) {
    return (
      <button
        onClick={expand}
        className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-surface-container-low border border-outline-variant shadow-sm px-3 py-1.5 font-label text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
        title="Show coaching"
        aria-label="Show canvas coaching"
      >
        <span className="material-symbols-outlined text-[16px] text-primary">{copy.icon}</span>
        {copy.heading}
      </button>
    )
  }

  const handleAction = () => {
    if (copy.prompt === null) {
      onOpenNotes()
      return
    }
    onAskHatch(copy.prompt(challengeType, guidance), true)
  }

  return (
    <div className="absolute top-3 left-3 z-20 max-w-sm bg-surface-container-low border border-outline-variant rounded-xl shadow-sm p-4 font-body text-sm text-on-surface">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-primary">{copy.icon}</span>
          <span className="font-headline font-semibold text-on-surface">{copy.heading}</span>
        </div>
        <button
          onClick={collapse}
          className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          aria-label="Collapse coaching"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <p className="mt-1.5 leading-relaxed text-on-surface-variant">{fillLabels(copy.body, guidance)}</p>

      <button
        onClick={handleAction}
        className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary text-on-primary font-label text-xs font-semibold px-3.5 py-1.5 hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[15px]">
          {copy.prompt === null ? 'edit_note' : 'auto_awesome'}
        </span>
        {copy.actionLabel}
      </button>
    </div>
  )
}
