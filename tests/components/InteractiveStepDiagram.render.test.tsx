import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { InteractiveStepDiagram } from '../../src/components/solutions/diagrams/InteractiveStepDiagram'
import { runArrayTrace, buildSteppedArrayDiagram } from '../../src/lib/solutions/trace/arrayTrace'
import { InteractiveStepDiagramSchema, type InteractiveStepDiagram as SteppedSpec } from '../../src/lib/solutions/schema'

// Server-render the first paint (no effects fire). This catches import/runtime
// errors and confirms the initial step renders its stage, tabs, and controls.
test('stepped array diagram server-renders the first step', () => {
  const trace = runArrayTrace('binary_search', [2, 4, 7, 9, 11, 13, 18, 21, 29], 21)
  const spec = buildSteppedArrayDiagram(trace!, { title: 'Binary search' })

  const html = renderToStaticMarkup(
    React.createElement(InteractiveStepDiagram, { spec, reducedMotion: false })
  )

  // The first step's cells are present (values from the array).
  assert.ok(html.includes('>21<'))
  assert.ok(html.includes('>11<'))
  // tablist + tabs render
  assert.ok(html.includes('role="tablist"'))
  assert.ok(html.includes('role="tab"'))
  // explanation card is an aria-live region
  assert.ok(html.includes('aria-live="polite"'))
  // controls render
  assert.ok(html.includes('Previous step'))
  assert.ok(html.includes('Next step'))
  assert.ok(html.includes('Start over'))
  // autoplay control present when motion is allowed
  assert.ok(html.includes('Auto-play steps'))
})

test('stepped array diagram hides autoplay under reduced motion', () => {
  const trace = runArrayTrace('binary_search', [2, 4, 7, 9, 11, 13, 18, 21, 29], 21)
  const spec = buildSteppedArrayDiagram(trace!)
  const html = renderToStaticMarkup(
    React.createElement(InteractiveStepDiagram, { spec, reducedMotion: true })
  )
  assert.equal(html.includes('Auto-play steps'), false)
  // manual stepping controls still present
  assert.ok(html.includes('Next step'))
})

test('pipeline stepped diagram server-renders stages + intermediate table', () => {
  const raw = {
    kind: 'stepped',
    title: 'Retention cohort',
    trace_verified: true,
    base: { kind: 'pipeline', stages: ['raw events', 'group by user', 'filter active'] },
    steps: [
      { title: 'Scan', explanation: 'Read the raw events.', delta: { base: 'pipeline', activeStage: 0, table: { columns: ['user', 'day'], rows: [['u1', '1'], ['u2', '1']] } } },
      { title: 'Group', explanation: 'Aggregate per user.', delta: { base: 'pipeline', activeStage: 1, table: { columns: ['user', 'days'], rows: [['u1', '3']] } } },
      { title: 'Filter', explanation: 'Keep active users.', delta: { base: 'pipeline', activeStage: 2 } },
    ],
  }
  const spec = InteractiveStepDiagramSchema.parse(raw) as SteppedSpec
  const html = renderToStaticMarkup(React.createElement(InteractiveStepDiagram, { spec, reducedMotion: false }))
  assert.ok(html.includes('raw events'))
  assert.ok(html.includes('group by user'))
  // first step's intermediate table is rendered
  assert.ok(html.includes('user'))
  assert.ok(html.includes('role="tablist"'))
})

test('flow stepped diagram server-renders request-flow nodes (authored, no trace marker needed)', () => {
  const raw = {
    kind: 'stepped',
    title: 'Write path',
    base: { kind: 'flow', nodes: [{ id: 'client', label: 'Client' }, { id: 'api', label: 'API' }, { id: 'db', label: 'Database' }] },
    steps: [
      { title: 'Request', explanation: 'Client sends a write.', delta: { base: 'flow', activeNode: 'client' } },
      { title: 'Route', explanation: 'API validates.', delta: { base: 'flow', activeNode: 'api', visited: ['client'] } },
      { title: 'Persist', explanation: 'DB commits.', delta: { base: 'flow', activeNode: 'db', visited: ['client', 'api'] } },
    ],
  }
  const spec = InteractiveStepDiagramSchema.parse(raw) as SteppedSpec
  const html = renderToStaticMarkup(React.createElement(InteractiveStepDiagram, { spec, reducedMotion: false }))
  assert.ok(html.includes('Client'))
  assert.ok(html.includes('Database'))
  assert.ok(html.includes('aria-live="polite"'))
})
