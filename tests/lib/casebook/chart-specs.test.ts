import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildChartSpecs } from '../../../src/lib/casebook/chart-specs'
import type { ExtractedQuery } from '../../../src/lib/casebook/query-extraction'

function q(overrides: Partial<ExtractedQuery> = {}): ExtractedQuery {
  return {
    timestamp: null,
    sql: 'SELECT step_name, COUNT(*) AS sessions FROM funnel_events GROUP BY step_name;',
    resultText: 'step_name | sessions\ncart_view | 41200\ncheckout_start | 18900',
    nondeterministicOrder: true,
    ...overrides,
  }
}

describe('buildChartSpecs', () => {
  it('parses a pipe-delimited result into rows with numeric coercion', () => {
    const specs = buildChartSpecs([q()])
    assert.equal(specs.length, 1)
    assert.deepEqual(specs[0].rows, [
      { step_name: 'cart_view', sessions: 41200 },
      { step_name: 'checkout_start', sessions: 18900 },
    ])
    assert.equal(specs[0].x_key, 'step_name')
    assert.equal(specs[0].y_key, 'sessions')
  })

  it('skips a query with no paired result text rather than fabricating rows', () => {
    const specs = buildChartSpecs([q({ resultText: null })])
    assert.equal(specs.length, 0)
  })

  it('skips a query whose result text is not tabular', () => {
    const specs = buildChartSpecs([q({ resultText: 'no pipes here, just prose' })])
    assert.equal(specs.length, 0)
  })

  it('picks table kind for wide results (more than 4 columns)', () => {
    const specs = buildChartSpecs([
      q({
        sql: 'SELECT a, b, c, d, e FROM t;',
        resultText: 'a | b | c | d | e\n1 | 2 | 3 | 4 | 5',
      }),
    ])
    assert.equal(specs[0].kind, 'table')
  })

  it('picks line kind for a temporal x column with multiple rows', () => {
    const specs = buildChartSpecs([
      q({
        sql: 'SELECT event_date, signups FROM t;',
        resultText: 'event_date | signups\n2026-06-29 | 100\n2026-06-30 | 90\n2026-07-01 | 95',
      }),
    ])
    assert.equal(specs[0].kind, 'line')
  })

  it('picks bar kind for a non-temporal categorical x column', () => {
    const specs = buildChartSpecs([q()])
    assert.equal(specs[0].kind, 'bar')
  })

  it('caps the number of charts emitted', () => {
    const many = Array.from({ length: 20 }, () => q())
    const specs = buildChartSpecs(many)
    assert.ok(specs.length <= 8)
  })

  it('uses a leading SQL comment as the chart title when present', () => {
    const specs = buildChartSpecs([q({ sql: '-- Funnel step volume\nSELECT step_name, COUNT(*) AS sessions FROM funnel_events GROUP BY step_name;' })])
    assert.equal(specs[0].title, 'Funnel step volume')
  })
})
