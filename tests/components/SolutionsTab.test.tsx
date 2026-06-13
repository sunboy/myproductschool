import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FlowStepsDiagram } from '../../src/components/solutions/diagrams/FlowStepsDiagram'
import { ArchitectureDiagram } from '../../src/components/solutions/diagrams/ArchitectureDiagram'
import { ComparisonBarsDiagram } from '../../src/components/solutions/diagrams/ComparisonBarsDiagram'
import { ComplexityCurvesDiagram } from '../../src/components/solutions/diagrams/ComplexityCurvesDiagram'
import { SchemaTablesDiagram } from '../../src/components/solutions/diagrams/SchemaTablesDiagram'
import { SolutionContent } from '../../src/components/solutions/SolutionContent'
import { SolutionsPane } from '../../src/components/solutions/SolutionsPane'
import { MOCK_SOLUTION_CONTENT } from '../../src/lib/solutions/mock'
import type { SolutionContentV1 } from '../../src/lib/solutions/schema'

describe('solution diagrams', () => {
  it('FlowStepsDiagram renders every step with its number, label, and detail', () => {
    const html = renderToStaticMarkup(
      <FlowStepsDiagram
        spec={{
          kind: 'flow_steps',
          steps: [
            { label: 'Symptom', detail: 'Low follow rate' },
            { label: 'Friction', emphasis: true },
            { label: 'Bet' },
          ],
        }}
        animate={false}
        reducedMotion
      />
    )
    expect(html).toContain('Symptom')
    expect(html).toContain('Low follow rate')
    expect(html).toContain('Friction')
    expect(html).toContain('Bet')
    expect(html).toContain('>1<')
    expect(html).toContain('>3<')
  })

  it('ArchitectureDiagram lays out lanes, nodes, and edges deterministically', () => {
    const html = renderToStaticMarkup(
      <ArchitectureDiagram
        spec={{
          kind: 'architecture',
          lanes: ['Client', 'Services', 'Data'],
          nodes: [
            { id: 'web', label: 'Web app', lane: 0, role: 'client' },
            { id: 'api', label: 'API Gateway', sublabel: 'rate limited', lane: 1, role: 'service' },
            { id: 'db', label: 'Postgres', lane: 2, role: 'store' },
          ],
          edges: [
            { from: 'web', to: 'api', label: 'HTTPS' },
            { from: 'api', to: 'db', animated: true },
          ],
        }}
        animate
        reducedMotion={false}
      />
    )
    expect(html).toContain('CLIENT')
    expect(html).toContain('SERVICES')
    expect(html).toContain('Web app')
    expect(html).toContain('API Gateway')
    expect(html).toContain('rate limited')
    expect(html).toContain('HTTPS')
    expect(html).toContain('marker-end')
    // two edge paths + lane separators present
    expect((html.match(/<path/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('ComparisonBarsDiagram renders labels, tracks, and annotations', () => {
    const html = renderToStaticMarkup(
      <ComparisonBarsDiagram
        spec={{
          kind: 'comparison_bars',
          unit: 'ms',
          bars: [
            { label: 'Approach A', value: 80, annotation: 'p99 latency' },
            { label: 'Approach B', value: 30, color: 'tertiary' },
          ],
        }}
        animate={false}
        reducedMotion
      />
    )
    expect(html).toContain('Approach A')
    expect(html).toContain('Approach B')
    expect(html).toContain('p99 latency')
    expect((html.match(/<rect/g) ?? []).length).toBe(4) // 2 tracks + 2 fills
  })

  it('ComplexityCurvesDiagram renders axes, one path per curve, and a legend', () => {
    const html = renderToStaticMarkup(
      <ComplexityCurvesDiagram
        spec={{
          kind: 'complexity_curves',
          curves: [
            { label: 'Brute force O(n²)', shape: 'quadratic' },
            { label: 'Hash map O(n)', shape: 'linear' },
          ],
        }}
        animate={false}
        reducedMotion
      />
    )
    expect(html).toContain('Brute force O(n²)')
    expect(html).toContain('Hash map O(n)')
    expect(html).toContain('input size n')
    expect((html.match(/<path/g) ?? []).length).toBe(2)
  })

  it('SchemaTablesDiagram renders table cards, column badges, and cardinality', () => {
    const html = renderToStaticMarkup(
      <SchemaTablesDiagram
        spec={{
          kind: 'schema_tables',
          tables: [
            { name: 'users', columns: [{ name: 'id', badges: ['PK'] }, { name: 'email', badges: ['UQ'] }] },
            { name: 'orders', columns: [{ name: 'id', badges: ['PK'] }, { name: 'user_id', badges: ['FK'] }] },
          ],
          relations: [{ from: 'orders', to: 'users', cardinality: '1:N' }],
        }}
        animate={false}
        reducedMotion
      />
    )
    expect(html).toContain('users')
    expect(html).toContain('orders')
    expect(html).toContain('PK')
    expect(html).toContain('FK')
    expect(html).toContain('1:N')
  })
})

describe('SolutionContent', () => {
  it('renders approach title, tagline, AI-collaboration card, prompts, pitfalls, and takeaways', () => {
    const html = renderToStaticMarkup(
      <SolutionContent
        content={MOCK_SOLUTION_CONTENT}
        size="pane"
        activeApproachId={null}
        onApproachChange={() => {}}
      />
    )
    expect(html).toContain('The reasoning walkthrough')
    expect(html).toContain('Frame the friction')
    expect(html).toContain('Working this problem with AI')
    expect(html).toContain('Prompts worth stealing')
    expect(html).toContain('Stress-test your frame')
    expect(html).toContain('Where AI work goes wrong here')
    expect(html).toContain('Key takeaways')
    expect(html).toContain('Name the friction before designing the fix.')
  })

  it('renders a selector pill per approach and complexity chips when present', () => {
    const content: SolutionContentV1 = {
      ...MOCK_SOLUTION_CONTENT,
      challenge_type: 'algorithm',
      approaches: [
        {
          id: 'brute-force',
          title: 'Brute force',
          tagline: 'Quadratic but honest.',
          body_md: 'Scan all pairs.',
          complexity: { time: 'O(n^2)', space: 'O(1)' },
        },
        {
          id: 'hash-map',
          title: 'Hash map',
          tagline: 'One pass.',
          body_md: 'Store complements.',
          complexity: { time: 'O(n)', space: 'O(n)' },
          code: { language: 'python', source: 'def solution(): pass' },
        },
      ],
    }
    const html = renderToStaticMarkup(
      <SolutionContent content={content} size="pane" activeApproachId="hash-map" onApproachChange={() => {}} />
    )
    expect(html).toContain('data-testid="solution-approach-brute-force"')
    expect(html).toContain('data-testid="solution-approach-hash-map"')
    expect(html).toContain('O(n)')
    expect(html).toContain('def solution(): pass')
    expect(html).toContain('aria-selected="true"')
  })
})

describe('SolutionsPane states', () => {
  it('locked state names both unlock paths with their CTAs', () => {
    const html = renderToStaticMarkup(
      <SolutionsPane
        solution={{ locked: true, unlock: { needs_attempt: true, pro_available: true } }}
        loading={false}
        challengeTitle="Test"
        onRetry={() => {}}
        onGoToDescription={() => {}}
        activeApproachId={null}
        onApproachChange={() => {}}
      />
    )
    expect(html).toContain('Earn the solution first')
    expect(html).toContain('Submit one attempt')
    expect(html).toContain('data-testid="solution-locked-attempt-cta"')
    expect(html).toContain('data-testid="solution-locked-pro-cta"')
    expect(html).toContain('href="/pricing"')
  })

  it('locked state hides the Pro CTA for users who already have Pro-equivalent access', () => {
    const html = renderToStaticMarkup(
      <SolutionsPane
        solution={{ locked: true, unlock: { needs_attempt: true, pro_available: false } }}
        loading={false}
        challengeTitle="Test"
        onRetry={() => {}}
        onGoToDescription={() => {}}
        activeApproachId={null}
        onApproachChange={() => {}}
      />
    )
    expect(html).not.toContain('solution-locked-pro-cta')
  })

  it('generating state shows the Hatch writing message', () => {
    const html = renderToStaticMarkup(
      <SolutionsPane
        solution={{ locked: false, status: 'generating' }}
        loading={false}
        challengeTitle="Test"
        onRetry={() => {}}
        onGoToDescription={() => {}}
        activeApproachId={null}
        onApproachChange={() => {}}
      />
    )
    expect(html).toContain('Hatch is writing the solution')
  })

  it('ready state renders the pane header with the maximize control', () => {
    const html = renderToStaticMarkup(
      <SolutionsPane
        solution={{ locked: false, status: 'ready', content: MOCK_SOLUTION_CONTENT }}
        loading={false}
        challengeTitle="Test challenge"
        onRetry={() => {}}
        onGoToDescription={() => {}}
        activeApproachId={null}
        onApproachChange={() => {}}
      />
    )
    expect(html).toContain('Official solution')
    expect(html).toContain('data-testid="solution-maximize"')
    expect(html).toContain('data-testid="solution-pane-body"')
  })

  it('failed state offers a retry', () => {
    const html = renderToStaticMarkup(
      <SolutionsPane
        solution={{ locked: false, status: 'failed' }}
        loading={false}
        challengeTitle="Test"
        onRetry={() => {}}
        onGoToDescription={() => {}}
        activeApproachId={null}
        onApproachChange={() => {}}
      />
    )
    expect(html).toContain('Try again')
  })
})
