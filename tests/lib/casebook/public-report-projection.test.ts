import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toPublicReportPayload, type RawReportSnapshot } from '../../../src/lib/casebook/public-report-projection'

// Realistic fixture matching the shapes move-diff.ts (MoveDiffResult) and
// report-narrative.ts (NarrativeInput) actually produce, plus a couple of
// fields a hostile/careless writer might add later. Mirrors the fixture
// style Phase 2 used to prove the teaser-payload leak fix.
const REALISTIC_SNAPSHOT: RawReportSnapshot & Record<string, unknown> = {
  case_title: 'The Tuesday Dip',
  hook: 'Weekly signups fell off a cliff on a Tuesday. Find out why.',
  narrative_md: [
    '# The Tuesday Dip — Feedback',
    '',
    '**Grade: Strong** (88/100)',
    '',
    '## Moves you hit',
    '',
    '- Checked the payment provider status page for the incident window',
    '',
    '## Moves you missed',
    '',
    '- Cross-referenced the deploy log against the drop timestamp',
    '- Segmented the drop by acquisition channel before concluding platform-wide',
  ].join('\n'),
  grade_label: 'Strong',
  total_score: 88,
  verdict: {
    cause: 'A payment provider outage blocked signups during the incident window.',
    confidence: 'high',
    falsifiable_check: 'If the drop persisted after the outage resolved, this verdict is wrong.',
  },
  diff: {
    matched: [{ id: 'm1', label: 'Checked the payment provider status page for the incident window' }],
    missed: [
      { id: 'm2', label: 'Cross-referenced the deploy log against the drop timestamp' },
      { id: 'm3', label: 'Segmented the drop by acquisition channel before concluding platform-wide' },
    ],
    extra: ['off_script_move_1'],
    expert_moves_total: 3,
  },
  objectives: [
    { id: 'o1', label: 'Identify root cause', status: 'met', evidence: 'Cited the provider incident report directly.' },
  ],
  // Fields that should never exist on a real snapshot but are included here
  // to prove a careless future writer's extra column does not silently ride
  // along onto the public payload.
  rubric: { required_moves: ['m1', 'm2', 'm3'], fail_conditions: ['no falsifiable check'] },
  case_attempt_id: '11111111-1111-1111-1111-111111111111',
  user_id: '22222222-2222-2222-2222-222222222222',
}

// Every string that must NEVER appear anywhere in the serialized public
// payload: expert move labels (from both matched and missed), the deploy-log
// / channel-segmentation move descriptions specifically called out in the
// brief, rubric content, and internal ids.
const FORBIDDEN_SUBSTRINGS = [
  'Checked the payment provider status page for the incident window',
  'Cross-referenced the deploy log against the drop timestamp',
  'Segmented the drop by acquisition channel before concluding platform-wide',
  'off_script_move_1',
  'required_moves',
  'fail_conditions',
  'Moves you missed',
  'Moves you hit',
  'Identify root cause',
  'Cited the provider incident report directly',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
]

test('toPublicReportPayload drops all expert-move, rubric, and internal-id content', () => {
  const payload = toPublicReportPayload(REALISTIC_SNAPSHOT)
  const serialized = JSON.stringify(payload)

  for (const forbidden of FORBIDDEN_SUBSTRINGS) {
    assert.ok(
      !serialized.includes(forbidden),
      `forbidden content leaked into public report payload: "${forbidden}"`,
    )
  }
})

test('toPublicReportPayload keeps only the allowlisted, learner-safe fields', () => {
  const payload = toPublicReportPayload(REALISTIC_SNAPSHOT)

  assert.deepEqual(Object.keys(payload).sort(), [
    'case_title',
    'grade_label',
    'hook',
    'moves_matched_count',
    'moves_total_count',
    'total_score',
    'verdict_cause',
    'verdict_confidence',
  ])

  assert.equal(payload.case_title, 'The Tuesday Dip')
  assert.equal(payload.grade_label, 'Strong')
  assert.equal(payload.total_score, 88)
  assert.equal(payload.verdict_cause, 'A payment provider outage blocked signups during the incident window.')
  assert.equal(payload.verdict_confidence, 'high')
  // Aggregate count only — never the move list itself.
  assert.equal(payload.moves_matched_count, 1)
  assert.equal(payload.moves_total_count, 3)
})

test('toPublicReportPayload degrades safely on a missing or malformed snapshot', () => {
  assert.doesNotThrow(() => toPublicReportPayload(null))
  assert.doesNotThrow(() => toPublicReportPayload(undefined))
  assert.doesNotThrow(() => toPublicReportPayload({}))

  const fromEmpty = toPublicReportPayload({})
  assert.equal(fromEmpty.case_title, 'Challenge report')
  assert.equal(fromEmpty.hook, '')
  assert.equal(fromEmpty.total_score, null)
  assert.equal(fromEmpty.verdict_cause, null)
  assert.equal(fromEmpty.verdict_confidence, null)
  assert.equal(fromEmpty.moves_matched_count, null)
  assert.equal(fromEmpty.moves_total_count, null)

  // Malformed types (wrong shape from a future writer bug) must not throw
  // and must not leak through as-is.
  const malformed = toPublicReportPayload({
    case_title: 12345 as unknown as string,
    total_score: 'not a number' as unknown as number,
    verdict: { confidence: 'extremely high' as unknown as 'high' },
  })
  assert.equal(malformed.case_title, 'Challenge report')
  assert.equal(malformed.total_score, null)
  assert.equal(malformed.verdict_confidence, null)
})
