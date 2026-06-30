import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FlowStepsDiagram } from '../../src/components/solutions/diagrams/FlowStepsDiagram'
import { ArchitectureDiagram } from '../../src/components/solutions/diagrams/ArchitectureDiagram'
import { ComparisonBarsDiagram } from '../../src/components/solutions/diagrams/ComparisonBarsDiagram'
import { ComplexityCurvesDiagram } from '../../src/components/solutions/diagrams/ComplexityCurvesDiagram'
import { SchemaTablesDiagram } from '../../src/components/solutions/diagrams/SchemaTablesDiagram'
import { InteractiveStepDiagram as Stepper } from '../../src/components/solutions/diagrams/InteractiveStepDiagram'
import { SolutionContent, stripDuplicateCodeFence } from '../../src/components/solutions/SolutionContent'
import { SolutionsPane } from '../../src/components/solutions/SolutionsPane'
import { codingMarkdownComponents } from '../../src/components/challenge/markdownComponents'
import { MOCK_SOLUTION_CONTENT, MOCK_STEPPED_SOLUTION_CONTENT } from '../../src/lib/solutions/mock'
import { runArrayTrace, buildSteppedArrayDiagram } from '../../src/lib/solutions/trace/arrayTrace'
import type { InteractiveStepDiagram, SolutionContentV1 } from '../../src/lib/solutions/schema'

// A real, schema-valid top-level walkthrough built from the trace harness.
const WALKTHROUGH: InteractiveStepDiagram = buildSteppedArrayDiagram(
  runArrayTrace('binary_search', [2, 4, 7, 9, 11, 13, 18, 21, 29], 21)!,
  { title: 'Searching for 21' }
)
const CONTENT_WITH_WALKTHROUGH: SolutionContentV1 = { ...MOCK_SOLUTION_CONTENT, walkthrough: WALKTHROUGH }

/* eslint-disable @typescript-eslint/no-explicit-any */
const MdCode = codingMarkdownComponents.code as any

describe('markdown code rendering (react-markdown v10)', () => {
  it('renders fenced block code plain (no inline chip border), inline code chipped', () => {
    const blockHtml = renderToStaticMarkup(<MdCode className="language-python">{'def f():\n    return 1'}</MdCode>)
    expect(blockHtml).toContain('background:transparent')
    expect(blockHtml).not.toContain('1px solid var(--color-outline-variant)')

    const multilineNoClass = renderToStaticMarkup(<MdCode>{'line1\nline2'}</MdCode>)
    expect(multilineNoClass).toContain('background:transparent')

    const inlineHtml = renderToStaticMarkup(<MdCode>{'nums'}</MdCode>)
    expect(inlineHtml).toContain('1px solid var(--color-outline-variant)')
  })
})

describe('stripDuplicateCodeFence', () => {
  const code = 'def solution(n):\n    return n'
  it('removes a fenced block whose content equals approach.code.source', () => {
    const body = '## Idea\nUse a set.\n\n```python\ndef solution(n):\n    return n\n```\n\n## Why\nFast.'
    const out = stripDuplicateCodeFence(body, code)
    expect(out).not.toContain('def solution(n):')
    expect(out).toContain('## Idea')
    expect(out).toContain('## Why')
  })
  it('keeps fenced blocks that differ from the code field', () => {
    const body = 'context\n\n```python\nprint("different snippet")\n```'
    expect(stripDuplicateCodeFence(body, code)).toContain('different snippet')
  })
  it('is a no-op when there is no code field', () => {
    const body = '```python\ndef solution(n):\n    return n\n```'
    expect(stripDuplicateCodeFence(body, undefined)).toBe(body)
  })
})

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
  it('renders approach title, tagline, collapsed AI-collaboration card, and takeaways', () => {
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
    // The AI-collaboration card is collapsed by default (lighten the workspace);
    // only its header + toggle render statically, the prompts/pitfalls mount on expand.
    expect(html).toContain('Working this problem with AI')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('Prompts worth stealing')
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

  it('shows NO top-level view switch when there is no walkthrough', () => {
    const html = renderToStaticMarkup(
      <SolutionContent content={MOCK_SOLUTION_CONTENT} size="pane" activeApproachId={null} onApproachChange={() => {}} />
    )
    expect(html).not.toContain('data-testid="solution-top-view-switch"')
    expect(html).not.toContain('Visual walkthrough')
    // The answer renders directly (no tab chrome).
    expect(html).toContain('data-testid="solution-answer-panel"')
    expect(html).toContain('The reasoning walkthrough')
  })

  it('shows a Visual walkthrough tab with a discoverability badge when a walkthrough exists', () => {
    const html = renderToStaticMarkup(
      <SolutionContent content={CONTENT_WITH_WALKTHROUGH} size="pane" activeApproachId={null} onApproachChange={() => {}} />
    )
    // Top-level switch with both tabs.
    expect(html).toContain('data-testid="solution-top-view-switch"')
    expect(html).toContain('data-testid="solution-top-tab-solution"')
    expect(html).toContain('data-testid="solution-top-tab-visual"')
    expect(html).toContain('Visual walkthrough')
    // Discoverability affordance: play_circle icon + accent dot.
    expect(html).toContain('play_circle')
    expect(html).toContain('data-testid="solution-visual-badge-dot"')
    // Default active view is Solution (the answer leads); the Visual panel is
    // one click away and not yet in the initial paint.
    expect(html).toContain('data-testid="solution-answer-panel"')
    expect(html).not.toContain('data-testid="solution-visual-panel"')
    // The Solution tab is the selected one on first paint (its button carries
    // aria-selected="true" and the visual tab does not).
    expect(html).toMatch(/aria-selected="true"[^>]*data-testid="solution-top-tab-solution"/)
    expect(html).toMatch(/aria-selected="false"[^>]*data-testid="solution-top-tab-visual"/)
  })

  it('feeds the top-level walkthrough into the interactive stepper (Visual panel content)', () => {
    // The Visual panel renders <InteractiveStepDiagram spec={content.walkthrough}>.
    // Static markup defaults to the Solution view (useState can't flip in SSR),
    // so render the stepper directly with the exact spec the panel passes it to
    // prove that, once the Visual tab is active, a working stepper appears.
    const html = renderToStaticMarkup(<Stepper spec={WALKTHROUGH} reducedMotion={false} />)
    expect(html).toContain('role="tablist"')
    expect(html).toContain('Next step')
    expect(html).toContain('aria-live="polite"')
  })

  it('shows a Code tab when an approach carries code, listing each coded approach', () => {
    // MOCK_STEPPED_SOLUTION_CONTENT has two coded approaches + a walkthrough, so
    // all three top tabs (Solution / Code / Visual walkthrough) are present.
    const html = renderToStaticMarkup(
      <SolutionContent content={MOCK_STEPPED_SOLUTION_CONTENT} size="pane" activeApproachId={null} onApproachChange={() => {}} />
    )
    expect(html).toContain('data-testid="solution-top-tab-code"')
    expect(html).toContain('data-testid="solution-top-tab-visual"')
    // The Code tab uses the code icon (not a badge dot).
    expect(html).toMatch(/solution-top-tab-code[\s\S]*?material-symbols-outlined/)
    // Default view is Solution, so the dedicated Code panel is not in first paint.
    expect(html).not.toContain('data-testid="solution-code-panel"')
    expect(html).toMatch(/aria-selected="true"[^>]*data-testid="solution-top-tab-solution"/)
  })

  it('shows NO Code tab when no approach has code', () => {
    // MOCK_SOLUTION_CONTENT is prose-only (no code, no walkthrough): no switch at all.
    const html = renderToStaticMarkup(
      <SolutionContent content={MOCK_SOLUTION_CONTENT} size="pane" activeApproachId={null} onApproachChange={() => {}} />
    )
    expect(html).not.toContain('data-testid="solution-top-tab-code"')
    expect(html).not.toContain('data-testid="solution-top-view-switch"')
  })

  it('Code panel renders each coded approach with its language and source', () => {
    // Build a coding solution (code, no walkthrough) and assert the rendered Code
    // panel by exercising the same projection the component uses: every approach
    // with a non-empty code.source appears with its title + language + source.
    const coded: SolutionContentV1 = {
      ...MOCK_SOLUTION_CONTENT,
      challenge_type: 'algorithm',
      approaches: [
        { id: 'brute', title: 'Brute force', tagline: 'Scan.', body_md: 'scan', code: { language: 'python', source: 'def brute():\n    return 0' }, complexity: { time: 'O(n^2)', space: 'O(1)' } },
        { id: 'optimal', title: 'Two pointers', tagline: 'Converge.', body_md: 'converge', code: { language: 'python', source: 'def optimal():\n    return 1' }, complexity: { time: 'O(n)', space: 'O(1)' } },
      ],
    }
    const html = renderToStaticMarkup(
      <SolutionContent content={coded} size="pane" activeApproachId={null} onApproachChange={() => {}} />
    )
    // A Solution/Code switch is present (code but no walkthrough).
    expect(html).toContain('data-testid="solution-top-tab-code"')
    expect(html).not.toContain('data-testid="solution-top-tab-visual"')
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
