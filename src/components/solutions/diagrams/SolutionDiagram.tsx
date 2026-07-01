'use client'

import type { SolutionDiagram as SolutionDiagramSpec } from '@/lib/solutions/schema'
import { useInView, usePrefersReducedMotion } from './hooks'
import { FlowStepsDiagram } from './FlowStepsDiagram'
import { ArchitectureDiagram } from './ArchitectureDiagram'
import { ComparisonBarsDiagram } from './ComparisonBarsDiagram'
import { ComplexityCurvesDiagram } from './ComplexityCurvesDiagram'
import { SchemaTablesDiagram } from './SchemaTablesDiagram'
import { InteractiveStepDiagram } from './InteractiveStepDiagram'

interface Props {
  spec: SolutionDiagramSpec
  /** For stepped diagrams: surfaces the active step to the parent (Hatch awareness). */
  onSteppedStepChange?: (step: { index: number; title: string; decision?: string }) => void
}

/**
 * Dispatcher for solution diagram specs. Wraps the renderer in a figure card,
 * animates on scroll-into-view, and renders the final state immediately when
 * the user prefers reduced motion.
 */
export function SolutionDiagram({ spec, onSteppedStepChange }: Props) {
  const { ref, inView } = useInView<HTMLElement>()
  const reducedMotion = usePrefersReducedMotion()
  const animate = inView && !reducedMotion

  let body: React.ReactNode = null
  switch (spec.kind) {
    case 'flow_steps':
      body = <FlowStepsDiagram spec={spec} animate={animate} reducedMotion={reducedMotion} />
      break
    case 'architecture':
      body = <ArchitectureDiagram spec={spec} animate={animate} reducedMotion={reducedMotion} />
      break
    case 'comparison_bars':
      body = <ComparisonBarsDiagram spec={spec} animate={animate} reducedMotion={reducedMotion} />
      break
    case 'complexity_curves':
      body = <ComplexityCurvesDiagram spec={spec} animate={animate} reducedMotion={reducedMotion} />
      break
    case 'schema_tables':
      body = <SchemaTablesDiagram spec={spec} animate={animate} reducedMotion={reducedMotion} />
      break
    case 'stepped':
      body = <InteractiveStepDiagram spec={spec} reducedMotion={reducedMotion} onStepChange={onSteppedStepChange} />
      break
  }

  return (
    <figure
      ref={ref}
      style={{
        margin: '16px 0',
        padding: '16px 16px 12px',
        background: 'var(--color-surface-container)',
        border: '1px solid var(--color-outline-variant)',
        borderRadius: 14,
      }}
    >
      {body}
      {spec.title && (
        <figcaption style={{
          marginTop: 10,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-on-surface-variant)',
          fontFamily: 'var(--font-label)',
          textAlign: 'center',
        }}>
          {spec.title}
        </figcaption>
      )}
    </figure>
  )
}
