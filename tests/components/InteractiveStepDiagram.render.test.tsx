import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { InteractiveStepDiagram } from '../../src/components/solutions/diagrams/InteractiveStepDiagram'
import { runArrayTrace, buildSteppedArrayDiagram } from '../../src/lib/solutions/trace/arrayTrace'

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
