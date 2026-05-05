'use client'

import { AppTooltip } from '@/components/ui/AppTooltip'
import type { CanvasScene } from '@/lib/hatch/canvas-scene'

type CanvasChallengeType = 'system_design' | 'data_modeling'

interface CanvasThinkingDockProps {
  challengeType: CanvasChallengeType
  scene: CanvasScene
  contextPackFilledCount: number
  contextPackText: string
  expanded: boolean
  onAskHatch: (prompt: string, autoSend?: boolean) => void
  onOpenContextPack: () => void
  onToggleExpanded: () => void
}

function getDomainCopy(challengeType: CanvasChallengeType) {
  if (challengeType === 'data_modeling') {
    return {
      artifact: 'data model',
      entityLabel: 'tables',
      relationLabel: 'links',
      accent: '#2f7a56',
      soft: '#e8f4ec',
      actions: [
        {
          label: 'Find gap',
          icon: 'travel_explore',
          help: 'Ask Hatch to compare notes, tables, columns, and relationships.',
          prompt: 'Look at my Context Pack and current data model together. What is the single highest-risk modeling gap to fix next? Be specific with table.column references where possible, then tell me the next canvas edit.',
        },
        {
          label: 'Build',
          icon: 'auto_fix_high',
          help: 'Turn the context pack into the next useful schema edits.',
          prompt: 'Use my Context Pack as the source of truth and update the canvas with the next missing tables, columns, and relationships. Keep it to the highest-signal changes and explain what you changed.',
        },
        {
          label: 'Keys',
          icon: 'key',
          help: 'Audit primary keys, foreign keys, cardinality, and junction tables.',
          prompt: 'Audit my data model for primary keys, foreign keys, cardinality, missing junction tables, and indexing gaps. If a small canvas update would make the model clearer, make it.',
        },
        {
          label: 'Stress',
          icon: 'bolt',
          help: 'Stress-test keys, cardinality, query paths, lifecycle, and edge cases.',
          prompt: 'Stress-test this data model for primary keys, foreign keys, cardinality, junction tables, query paths, indexing, lifecycle states, and edge cases. If one small canvas edit would make the model more defensible, make it.',
        },
        {
          label: 'Defend',
          icon: 'forum',
          help: 'Practice the interviewer follow-up this model needs.',
          prompt: 'Pretend you are the interviewer. Ask the one follow-up question that would most expose whether this data model holds up, then give me a crisp way to defend the tradeoff.',
        },
      ],
    }
  }

  return {
    artifact: 'system design',
    entityLabel: 'nodes',
    relationLabel: 'flows',
    accent: '#3f6f88',
    soft: '#e6f1f5',
    actions: [
      {
        label: 'Find gap',
        icon: 'travel_explore',
        help: 'Ask Hatch to compare notes, components, flows, and risks.',
        prompt: 'Look at my Context Pack and current system design together. What is the single highest-risk design gap to fix next? Name the affected component or flow, then tell me the next canvas edit.',
      },
      {
        label: 'Build',
        icon: 'auto_fix_high',
        help: 'Turn assumptions, APIs, events, and constraints into diagram changes.',
        prompt: 'Use my Context Pack as the source of truth and update the canvas with the next missing system components, APIs, events, and data flows. Keep it to the highest-signal changes and explain what you changed.',
      },
      {
        label: 'Stress',
        icon: 'bolt',
        help: 'Probe scale, failure modes, consistency, and operational gaps.',
        prompt: 'Stress-test this system design for scale, failure modes, consistency, observability, and operational gaps. If one small canvas annotation or component would improve it, add it.',
      },
      {
        label: 'Defend',
        icon: 'forum',
        help: 'Practice the interviewer follow-up this design needs.',
        prompt: 'Pretend you are the interviewer. Ask the one follow-up question that would most expose whether this system design holds up, then give me a crisp way to defend the tradeoff.',
      },
    ],
  }
}

export function CanvasThinkingDock({
  challengeType,
  scene,
  contextPackFilledCount,
  contextPackText,
  expanded,
  onAskHatch,
  onOpenContextPack,
  onToggleExpanded,
}: CanvasThinkingDockProps) {
  const copy = getDomainCopy(challengeType)
  const hasContext = contextPackText.trim().length > 0
  const hasCanvas = scene.entities.length > 0 || scene.connections.length > 0
  const readiness = hasContext && hasCanvas
    ? 'Hatch can compare notes and canvas'
    : hasCanvas
      ? 'Add context notes when tradeoffs matter'
      : hasContext
        ? 'Turn notes into your first canvas edit'
        : 'Use notes for assumptions, then sketch the artifact'
  const canvasSummary = `${scene.entities.length} ${copy.entityLabel}, ${scene.connections.length} ${copy.relationLabel}`

  return (
    <div className="relative flex shrink-0 items-center">
      <AppTooltip label={readiness} side="bottom">
        <button
          type="button"
          data-testid="canvas-context-loop-toggle"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} Context loop. ${contextPackFilledCount} of 4 notes. ${canvasSummary}.`}
          className="inline-flex h-8 shrink-0 items-center rounded-lg border px-3 font-label text-[11px] font-black text-on-surface transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{
            background: expanded ? copy.soft : 'var(--color-surface-container-low)',
            borderColor: expanded ? `${copy.accent}66` : 'var(--color-outline-variant)',
          }}
        >
          <span className="whitespace-nowrap">Context loop</span>
        </button>
      </AppTooltip>

      <div
        data-testid="canvas-context-loop-actions"
        aria-hidden={!expanded}
        className="absolute left-full top-1/2 z-30 ml-1 overflow-hidden"
        style={{
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          clipPath: expanded ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          transform: expanded ? 'translate(0, -50%)' : 'translate(-8px, -50%)',
          transition: 'clip-path 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 160ms ease, transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div className="flex min-w-max items-center gap-0.5">
          <AppTooltip
            label={`Open the Context Pack. Hatch currently sees ${contextPackFilledCount} of 4 note fields alongside ${canvasSummary}.`}
            side="bottom"
            className="shrink-0"
          >
            <button
              type="button"
              onClick={onOpenContextPack}
              tabIndex={expanded ? 0 : -1}
              className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-2 font-label text-[10.5px] font-black text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <span className="material-symbols-outlined text-[14px]">data_object</span>
              <span>Notes</span>
            </button>
          </AppTooltip>

          {copy.actions.map((action) => (
            <AppTooltip key={action.label} label={action.help} side="bottom" className="shrink-0">
              <button
                type="button"
                onClick={() => onAskHatch(action.prompt, true)}
                tabIndex={expanded ? 0 : -1}
                className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-2 transition-colors hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <span className="material-symbols-outlined text-[14px]" style={{ color: copy.accent }}>{action.icon}</span>
                <span className="font-label text-[10.5px] font-black leading-tight text-on-surface">{action.label}</span>
              </button>
            </AppTooltip>
          ))}
        </div>
      </div>
    </div>
  )
}
