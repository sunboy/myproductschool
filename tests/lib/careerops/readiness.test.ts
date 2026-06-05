import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildReadinessMap, aggregateReadiness, practiceHref, interviewHref } from '../../../src/lib/careerops/readiness'

test('each discipline maps to the correct practice/interview href', () => {
  assert.equal(practiceHref('coding'), '/challenges?discipline=coding')
  assert.equal(practiceHref('sql'), '/challenges?discipline=sql')
  assert.equal(practiceHref('data_modeling'), '/challenges?discipline=data_modeling')
  assert.equal(practiceHref('system_design'), '/challenges?discipline=system_design')
  // product_sense practice lives in the unfiltered FLOW list.
  assert.equal(practiceHref('product_sense'), '/challenges')
  assert.equal(interviewHref('coding'), '/live-interviews?discipline=coding')
  assert.equal(interviewHref('product_sense'), '/live-interviews?discipline=product_sense')
})

test('buildReadinessMap returns all five disciplines and fills hrefs when routing on', () => {
  const rows = buildReadinessMap(
    [{ discipline: 'coding', demanded: true, bar: 'high', user_readiness: 'gaps' }],
    true,
  )
  assert.equal(rows.length, 5)
  const coding = rows.find((r) => r.discipline === 'coding')!
  assert.equal(coding.demanded, true)
  assert.equal(coding.practice_href, '/challenges?discipline=coding')
  assert.equal(coding.interview_href, '/live-interviews?discipline=coding')
})

test('buildReadinessMap blanks hrefs when routing is off (score-only mode)', () => {
  const rows = buildReadinessMap(
    [{ discipline: 'sql', demanded: true, bar: 'medium', user_readiness: 'unknown' }],
    false,
  )
  const sql = rows.find((r) => r.discipline === 'sql')!
  assert.equal(sql.demanded, true)
  assert.equal(sql.practice_href, '')
  assert.equal(sql.interview_href, '')
})

test('buildReadinessMap normalizes algorithm to coding and bad readiness to unknown', () => {
  const rows = buildReadinessMap(
    [{ discipline: 'algorithm', demanded: true, user_readiness: 'bogus' as never }],
    true,
  )
  const coding = rows.find((r) => r.discipline === 'coding')!
  assert.equal(coding.demanded, true)
  assert.equal(coding.user_readiness, 'unknown')
})

test('aggregateReadiness keeps the riskier state across evaluations', () => {
  const a = buildReadinessMap([{ discipline: 'coding', demanded: true, user_readiness: 'ready' }], true)
  const b = buildReadinessMap([{ discipline: 'coding', demanded: true, user_readiness: 'gaps' }], true)
  const merged = aggregateReadiness([a, b])
  const coding = merged.find((r) => r.discipline === 'coding')!
  assert.equal(coding.user_readiness, 'gaps')
})
