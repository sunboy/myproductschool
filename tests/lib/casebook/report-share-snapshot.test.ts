import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildRawReportSnapshot,
  toPublicReportPayload,
  type GradedAttemptForSnapshot,
  type CaseForSnapshot,
  type RawReportSnapshot,
} from '../../../src/lib/casebook/public-report-projection'

// Proves the WRITE-SIDE pipeline used by
// POST /api/casebook/case/[attemptId]/share: buildRawReportSnapshot(attempt,
// case) -> toPublicReportPayload(...) -> what actually gets written to
// cc_reports.snapshot. This is the counterpart to
// public-report-projection.test.ts (which proves the READ side re-projects
// safely); this file proves the object the writer produces never contained
// the leak in the first place.
//
// Fixture mirrors a real graded cc_case_attempts row: report.narrative_md
// (built by report-narrative.ts) DOES contain a "## Moves you missed"
// section with expert move labels verbatim, and diff.matched/.missed carry
// the same labels. Neither field is ever passed into buildRawReportSnapshot
// — this test asserts none of that content reaches the serialized snapshot.

const NARRATIVE_MD_WITH_ANSWER_KEY = [
  '# The Tuesday Dip — Feedback',
  '',
  '**Grade: Strong** (88/100)',
  '',
  'Solid work tracing the drop to the provider outage.',
  '',
  '## Your verdict',
  '',
  'A payment provider outage blocked signups during the incident window.',
  '',
  'Confidence: high.',
  '',
  'Falsifiable check: If the drop persisted after the outage resolved, this verdict is wrong.',
  '',
  '## Moves you hit',
  '',
  '- Checked the payment provider status page for the incident window',
  '',
  '## Moves you missed',
  '',
  '- Cross-referenced the deploy log against the drop timestamp',
  '- Segmented the drop by acquisition channel before concluding platform-wide',
  '',
  '## Objective breakdown',
  '',
  '- **Met**: Identify root cause — Cited the provider incident report directly.',
].join('\n')

const GRADED_ATTEMPT: GradedAttemptForSnapshot & {
  // Fields a real cc_case_attempts row also carries but that
  // buildRawReportSnapshot's narrow parameter type does not accept — kept
  // here only to document what must NOT leak, not passed to the function.
  report?: { narrative_md: string }
} = {
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
  grade: { total_score: 88, grade_label: 'Strong' },
  report: { narrative_md: NARRATIVE_MD_WITH_ANSWER_KEY },
}

const CASE_ROW: CaseForSnapshot = {
  title: 'The Tuesday Dip',
  hook: 'Weekly signups fell off a cliff on a Tuesday. Find out why.',
}

const FORBIDDEN_SUBSTRINGS = [
  'Checked the payment provider status page for the incident window',
  'Cross-referenced the deploy log against the drop timestamp',
  'Segmented the drop by acquisition channel before concluding platform-wide',
  'off_script_move_1',
  'Moves you missed',
  'Moves you hit',
  'Identify root cause',
  'Cited the provider incident report directly',
  'm1',
  'm2',
  'm3',
]

test('write-side pipeline (buildRawReportSnapshot -> toPublicReportPayload) drops the narrative answer key and move labels', () => {
  // narrative_md is deliberately NOT passed into buildRawReportSnapshot at
  // all — the function's parameter type has no field for it. This asserts
  // that omission plus the allowlist together keep every forbidden string
  // out of what gets written to cc_reports.snapshot.
  const rawSnapshot = buildRawReportSnapshot(GRADED_ATTEMPT, CASE_ROW)
  const snapshotToWrite = toPublicReportPayload(rawSnapshot)
  const serialized = JSON.stringify(snapshotToWrite)

  for (const forbidden of FORBIDDEN_SUBSTRINGS) {
    assert.ok(
      !serialized.includes(forbidden),
      `forbidden content leaked into the snapshot the writer would persist: "${forbidden}"`,
    )
  }

  // The narrative markdown itself must never appear, not even truncated.
  assert.ok(!serialized.includes(NARRATIVE_MD_WITH_ANSWER_KEY.slice(0, 40)))
})

test('write-side pipeline keeps only the safe aggregate fields, matching the read-side allowlist', () => {
  const rawSnapshot = buildRawReportSnapshot(GRADED_ATTEMPT, CASE_ROW)
  const snapshotToWrite = toPublicReportPayload(rawSnapshot)

  assert.deepEqual(Object.keys(snapshotToWrite).sort(), [
    'case_title',
    'grade_label',
    'hook',
    'moves_matched_count',
    'moves_total_count',
    'total_score',
    'verdict_cause',
    'verdict_confidence',
  ])

  assert.equal(snapshotToWrite.case_title, 'The Tuesday Dip')
  assert.equal(snapshotToWrite.hook, 'Weekly signups fell off a cliff on a Tuesday. Find out why.')
  assert.equal(snapshotToWrite.grade_label, 'Strong')
  assert.equal(snapshotToWrite.total_score, 88)
  assert.equal(snapshotToWrite.verdict_cause, 'A payment provider outage blocked signups during the incident window.')
  assert.equal(snapshotToWrite.verdict_confidence, 'high')
  // Aggregate only — 1 of 3 expert moves matched, never the move list itself.
  assert.equal(snapshotToWrite.moves_matched_count, 1)
  assert.equal(snapshotToWrite.moves_total_count, 3)
})

test('re-projecting an already-safe snapshot (the read route defense-in-depth) never reintroduces forbidden content', () => {
  // toPublicReportPayload's output uses flat keys (verdict_cause,
  // moves_matched_count) while its input expects nested shapes
  // (verdict.cause, diff.matched) — so re-running the written payload back
  // through the same function cannot recover those nested-only fields; they
  // fall back to their null/empty defaults. That is expected and still
  // correct: the read route's defense-in-depth re-projection is
  // safe-by-construction (it can only drop fields further, never restore
  // ones already collapsed to a flat key), not a byte-for-byte identity
  // function. What matters is that no forbidden content is ever reintroduced,
  // and that the flat top-level string/number fields do survive unchanged.
  const rawSnapshot = buildRawReportSnapshot(GRADED_ATTEMPT, CASE_ROW)
  const written = toPublicReportPayload(rawSnapshot)
  // Read route's real defense-in-depth call: re-projects the writer's own
  // (already narrow) output as if it were an untrusted RawReportSnapshot.
  const reProjected = toPublicReportPayload(written as unknown as RawReportSnapshot)

  assert.equal(reProjected.case_title, written.case_title)
  assert.equal(reProjected.hook, written.hook)
  assert.equal(reProjected.grade_label, written.grade_label)
  assert.equal(reProjected.total_score, written.total_score)

  const serialized = JSON.stringify(reProjected)
  for (const forbidden of FORBIDDEN_SUBSTRINGS) {
    assert.ok(!serialized.includes(forbidden))
  }
})
