import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runPipelineTrace,
  buildSteppedPipelineDiagram,
  buildSteppedPipelineFromMetadata,
} from '../../../src/lib/solutions/trace/pipelineTrace'
import { SolutionDiagramSchema, InteractiveStepDiagramSchema } from '../../../src/lib/solutions/schema'

// A real 3-CTE SQL challenge: messages per (channel, user), keep each channel's
// top-3 message senders, sum them, and report each channel's top-3 share of its
// total. The setup seeds 3 channels with deterministic rows.
const SETUP = `
CREATE TABLE messages (id INTEGER PRIMARY KEY, channel_id INTEGER, user_id INTEGER);
INSERT INTO messages (id, channel_id, user_id) VALUES
  (1, 101, 1), (2, 101, 1), (3, 101, 1), (4, 101, 1),
  (5, 101, 2), (6, 101, 2), (7, 101, 3), (8, 101, 4),
  (9, 102, 5), (10, 102, 5), (11, 102, 5), (12, 102, 6), (13, 102, 6), (14, 102, 7),
  (15, 103, 8), (16, 103, 9), (17, 103, 10);
`

// totals: messages per channel. urk: per (channel,user) count ranked desc.
// top3: sum of the top-3 ranked users per channel. Final: top3 / total %.
const REFERENCE_SQL = `
WITH totals AS (
  SELECT channel_id, COUNT(*) AS total
  FROM messages
  GROUP BY channel_id
),
urk AS (
  SELECT channel_id, user_id, COUNT(*) AS cnt,
         ROW_NUMBER() OVER (PARTITION BY channel_id ORDER BY COUNT(*) DESC, user_id) AS rnk
  FROM messages
  GROUP BY channel_id, user_id
),
top3 AS (
  SELECT u.channel_id, SUM(u.cnt) AS top3_msgs, t.total
  FROM urk u
  JOIN totals t ON t.channel_id = u.channel_id
  WHERE u.rnk <= 3
  GROUP BY u.channel_id, t.total
)
SELECT channel_id, top3_msgs, total,
       CAST(ROUND(100.0 * top3_msgs / total) AS INTEGER) AS top3_pct
FROM top3
ORDER BY channel_id
`

// Hand-computed expected final rows.
// ch101: total=8. counts: u1=4,u2=2,u3=1,u4=1 -> top3 (rnk1..3)=u1+u2+u3=4+2+1=7 -> 88%
// ch102: total=6. counts: u5=3,u6=2,u7=1 -> top3=6 -> 100%
// ch103: total=3. counts: u8=1,u9=1,u10=1 -> top3=3 -> 100%
const EXPECTED_ROWS = [
  { channel_id: 101, top3_msgs: 7, total: 8, top3_pct: 88 },
  { channel_id: 102, top3_msgs: 6, total: 6, top3_pct: 100 },
  { channel_id: 103, top3_msgs: 3, total: 3, top3_pct: 100 },
]

test('a real 3-CTE query traces to 4 stages with correct intermediates', async () => {
  const trace = await runPipelineTrace(REFERENCE_SQL, SETUP)
  assert.ok(trace)
  // 3 CTEs + 1 final outer SELECT = 4 stages.
  assert.deepEqual(trace!.stages, ['totals', 'urk', 'top3', 'result'])
  assert.equal(trace!.deltas.length, 4)
  // activeStage is sequential 0..3.
  assert.deepEqual(trace!.deltas.map((d) => d.activeStage), [0, 1, 2, 3])

  // Stage 0 (totals): channel_id,total — 3 rows. ch101 has 8 messages.
  const totals = trace!.deltas[0].table!
  assert.deepEqual(totals.columns, ['channel_id', 'total'])
  assert.equal(totals.rows.length, 3)
  const ch101Totals = totals.rows.find((r) => r[0] === '101')
  assert.deepEqual(ch101Totals, ['101', '8'])

  // Stage 1 (urk): capped to 5 rows (real result has 9 distinct channel/user pairs).
  const urk = trace!.deltas[1].table!
  assert.deepEqual(urk.columns, ['channel_id', 'user_id', 'cnt', 'rnk'])
  assert.equal(urk.rows.length, 5)

  // Final stage: matches the hand-computed answer exactly, in channel order.
  const final = trace!.deltas[3].table!
  assert.deepEqual(final.columns, ['channel_id', 'top3_msgs', 'total', 'top3_pct'])
  assert.deepEqual(final.rows, [
    ['101', '7', '8', '88'],
    ['102', '6', '6', '100'],
    ['103', '3', '3', '100'],
  ])
  assert.deepEqual(trace!.finalRows.rows, final.rows)
})

test('built pipeline diagram from a verified trace passes the schema', async () => {
  const trace = await runPipelineTrace(REFERENCE_SQL, SETUP)
  assert.ok(trace)
  const diagram = buildSteppedPipelineDiagram(trace!, { title: 'Top-3 share' })
  // Validate via both the union schema and the direct stepped schema.
  assert.equal(SolutionDiagramSchema.safeParse(diagram).success, true)
  const direct = InteractiveStepDiagramSchema.safeParse(diagram)
  assert.equal(direct.success, true)
  assert.equal(diagram.trace_verified, true)
  assert.equal(diagram.base.kind, 'pipeline')
  assert.equal(diagram.steps.length, 4)
  // Every delta is a pipeline delta whose activeStage is in range.
  for (const step of diagram.steps) {
    assert.equal(step.delta.base, 'pipeline')
  }
})

test('a no-CTE query returns null', async () => {
  const noCte = 'SELECT channel_id, COUNT(*) AS total FROM messages GROUP BY channel_id'
  const trace = await runPipelineTrace(noCte, SETUP)
  assert.equal(trace, null)
  // And the metadata path agrees.
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: SETUP, dialect: 'sqlite' },
    reference_solution: { sql: noCte },
    test_cases: [{ id: 't1', expected_rows: EXPECTED_ROWS }],
  })
  assert.equal(candidate, null)
})

test('a recursive CTE returns null', async () => {
  const recursive = `
    WITH RECURSIVE seq(n) AS (
      SELECT 1
      UNION ALL
      SELECT n + 1 FROM seq WHERE n < 5
    )
    SELECT n FROM seq
  `
  const setup = 'CREATE TABLE noop (x INTEGER);'
  const trace = await runPipelineTrace(recursive, setup)
  assert.equal(trace, null)
})

test('a too-long chain (>6 stages) returns null', async () => {
  // 7 CTEs + 1 final = 8 stages, over the MAX_STAGES=6 ceiling.
  const setup = 'CREATE TABLE t (x INTEGER); INSERT INTO t (x) VALUES (1);'
  const sql = `
    WITH a AS (SELECT x FROM t),
         b AS (SELECT x FROM a),
         c AS (SELECT x FROM b),
         d AS (SELECT x FROM c),
         e AS (SELECT x FROM d),
         f AS (SELECT x FROM e),
         g AS (SELECT x FROM f)
    SELECT x FROM g
  `
  const trace = await runPipelineTrace(sql, setup)
  assert.equal(trace, null)
})

test('cross-check mismatch returns null', async () => {
  // The trace is real and well-formed, but the expected_rows claim a wrong
  // top3_pct, so the harness must NOT ship a misleading walkthrough.
  const wrongExpected = [
    { channel_id: 101, top3_msgs: 7, total: 8, top3_pct: 50 }, // wrong pct
    { channel_id: 102, top3_msgs: 6, total: 6, top3_pct: 100 },
    { channel_id: 103, top3_msgs: 3, total: 3, top3_pct: 100 },
  ]
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: SETUP, dialect: 'sqlite' },
    reference_solution: { sql: REFERENCE_SQL },
    test_cases: [{ id: 't1', label: 'main', expected_rows: wrongExpected }],
  })
  assert.equal(candidate, null)
})

test('a matching visible test case certifies and produces a verified diagram', async () => {
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: SETUP, dialect: 'sqlite' },
    reference_solution: { sql: REFERENCE_SQL },
    test_cases: [{ id: 't1', label: 'main', expected_rows: EXPECTED_ROWS }],
  })
  assert.ok(candidate)
  assert.equal(candidate!.diagram.trace_verified, true)
  assert.equal(candidate!.diagram.base.kind, 'pipeline')
  assert.equal(InteractiveStepDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('a 2-CTE chain (minimum) traces to 3 stages', async () => {
  const setup = 'CREATE TABLE nums (v INTEGER); INSERT INTO nums (v) VALUES (1),(2),(3),(4),(5);'
  const sql = `
    WITH evens AS (SELECT v FROM nums WHERE v % 2 = 0),
         doubled AS (SELECT v, v * 2 AS d FROM evens)
    SELECT v, d FROM doubled ORDER BY v
  `
  const trace = await runPipelineTrace(sql, setup)
  assert.ok(trace)
  assert.deepEqual(trace!.stages, ['evens', 'doubled', 'result'])
  assert.deepEqual(trace!.deltas[2].table!.rows, [['2', '4'], ['4', '8']])
})

test('a single-CTE chain is below the floor (2 stages min is met, but 1 CTE + final = 2 is allowed)', async () => {
  // 1 CTE + 1 final = 2 stages, which is exactly MIN_STAGES. Confirms the floor
  // is the stage count, not the CTE count.
  const setup = 'CREATE TABLE nums (v INTEGER); INSERT INTO nums (v) VALUES (1),(2),(3);'
  const sql = `WITH evens AS (SELECT v FROM nums WHERE v % 2 = 0) SELECT v FROM evens`
  const trace = await runPipelineTrace(sql, setup)
  assert.ok(trace)
  assert.deepEqual(trace!.stages, ['evens', 'result'])
  assert.equal(trace!.deltas.length, 2)
})

test('a query with an empty final result returns null', async () => {
  const setup = 'CREATE TABLE nums (v INTEGER); INSERT INTO nums (v) VALUES (1),(3),(5);'
  const sql = `
    WITH evens AS (SELECT v FROM nums WHERE v % 2 = 0),
         doubled AS (SELECT v, v * 2 AS d FROM evens)
    SELECT v, d FROM doubled
  `
  const trace = await runPipelineTrace(sql, setup)
  assert.equal(trace, null)
})

test('missing setup or reference in metadata returns null', async () => {
  const noSetup = await buildSteppedPipelineFromMetadata({
    reference_solution: { sql: REFERENCE_SQL },
    test_cases: [{ id: 't1', expected_rows: EXPECTED_ROWS }],
  })
  assert.equal(noSetup, null)

  const noRef = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: SETUP, dialect: 'sqlite' },
    test_cases: [{ id: 't1', expected_rows: EXPECTED_ROWS }],
  })
  assert.equal(noRef, null)
})

test('no visible test case with expected_rows means no oracle, returns null', async () => {
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: SETUP, dialect: 'sqlite' },
    reference_solution: { sql: REFERENCE_SQL },
    test_cases: [{ id: 't1', label: 'main' /* no expected_rows */ }],
  })
  assert.equal(candidate, null)
})

// ---------------------------------------------------------------------------
// SEV-3: certification runs on the FULL un-capped result, not the <=5 display cap.
// A query whose full result has 6 rows must NOT certify against expected_rows that
// only list 5 (the displayed slice), even though every displayed row is a subset.
// ---------------------------------------------------------------------------

// 6-row result: the harness display caps to 5, but the full set is 6 rows.
const SIX_ROW_SETUP =
  'CREATE TABLE n (v INTEGER); INSERT INTO n (v) VALUES (1),(2),(3),(4),(5),(6);'
const SIX_ROW_SQL = `
  WITH base AS (SELECT v FROM n),
       doubled AS (SELECT v, v * 2 AS d FROM base)
  SELECT v, d FROM doubled ORDER BY v
`
// The true full result is 6 rows: (1,2)...(6,12).
const SIX_ROW_FULL_EXPECTED = [
  { v: 1, d: 2 }, { v: 2, d: 4 }, { v: 3, d: 6 },
  { v: 4, d: 8 }, { v: 5, d: 10 }, { v: 6, d: 12 },
]
// The adversarial "subset" expected_rows: only the first 5 rows (matches what the
// capped display shows). The wrong 6th real row lives past the display cap.
const SIX_ROW_SUBSET_EXPECTED = SIX_ROW_FULL_EXPECTED.slice(0, 5)

test('SEV-3: a result with a row past the 5-row display cap is NOT certified by a 5-row subset', async () => {
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: SIX_ROW_SETUP, dialect: 'sqlite' },
    reference_solution: { sql: SIX_ROW_SQL },
    // expected_rows lists only the 5 displayed rows; the 6th real row is omitted.
    // Subset-on-display would certify; full set-equality must reject.
    test_cases: [{ id: 't1', label: 'main', expected_rows: SIX_ROW_SUBSET_EXPECTED }],
  })
  assert.equal(candidate, null)
})

test('SEV-3: the same query DOES certify when expected_rows lists the full result set', async () => {
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: SIX_ROW_SETUP, dialect: 'sqlite' },
    reference_solution: { sql: SIX_ROW_SQL },
    test_cases: [{ id: 't1', label: 'main', expected_rows: SIX_ROW_FULL_EXPECTED }],
  })
  assert.ok(candidate)
  assert.equal(candidate!.diagram.trace_verified, true)
  // The displayed final table is still capped to 5 rows (DISPLAY only)...
  const finalStep = candidate!.diagram.steps[candidate!.diagram.steps.length - 1]
  assert.equal(finalStep.delta.base, 'pipeline')
  if (finalStep.delta.base !== 'pipeline') throw new Error('expected a pipeline delta')
  assert.equal(finalStep.delta.table!.rows.length, 5)
})

test('SEV-3: a wrong 6th row (full set != expected) returns null even if the first 5 match', async () => {
  // Full result is 6 rows. expected claims a DIFFERENT 6th row (v=7) — same size,
  // first 5 identical, last divergent. Full set-equality must catch it.
  const wrongSixth = [...SIX_ROW_FULL_EXPECTED.slice(0, 5), { v: 7, d: 14 }]
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: SIX_ROW_SETUP, dialect: 'sqlite' },
    reference_solution: { sql: SIX_ROW_SQL },
    test_cases: [{ id: 't1', label: 'main', expected_rows: wrongSixth }],
  })
  assert.equal(candidate, null)
})

test('SEV-3: a non-ORDER-BY query over the cap shows a deterministic display slice', async () => {
  // No top-level ORDER BY and >5 rows: the displayed 5 must be a deterministic,
  // sorted slice (sorted by all columns), not the engine's arbitrary first 5.
  const sql = `
    WITH base AS (SELECT v FROM n),
         doubled AS (SELECT v, v * 2 AS d FROM base)
    SELECT v, d FROM doubled
  `
  const trace = await runPipelineTrace(sql, SIX_ROW_SETUP)
  assert.ok(trace)
  // fullFinal carries all 6 rows; the displayed final table caps to 5.
  assert.equal(trace!.fullFinal.rows.length, 6)
  const displayed = trace!.deltas[trace!.deltas.length - 1].table!
  assert.equal(displayed.rows.length, 5)
  // Deterministic: sorted by all columns string-wise -> v in ['1','2','3','4','5'].
  assert.deepEqual(displayed.rows, [
    ['1', '2'], ['2', '4'], ['3', '6'], ['4', '8'], ['5', '10'],
  ])
})

// ---------------------------------------------------------------------------
// SEV-4: prune CTEs the tail never reaches.
// ---------------------------------------------------------------------------

test('SEV-4: a dead CTE the tail never references is not emitted as a stage', async () => {
  const setup = 'CREATE TABLE nums (v INTEGER); INSERT INTO nums (v) VALUES (1),(2),(3),(4);'
  // `dead` is declared but never referenced by the tail or any live CTE.
  const sql = `
    WITH dead AS (SELECT 999 AS z),
         used AS (SELECT v FROM nums WHERE v % 2 = 0),
         doubled AS (SELECT v, v * 2 AS d FROM used)
    SELECT v, d FROM doubled ORDER BY v
  `
  const trace = await runPipelineTrace(sql, setup)
  assert.ok(trace)
  // 'dead' is pruned; stages are the two live CTEs plus the final label.
  assert.deepEqual(trace!.stages, ['used', 'doubled', 'result'])
  assert.equal(trace!.stages.includes('dead'), false)
  assert.deepEqual(trace!.deltas.map((d) => d.activeStage), [0, 1, 2])
  assert.deepEqual(trace!.deltas[trace!.deltas.length - 1].table!.rows, [['2', '4'], ['4', '8']])
})

test('SEV-4: pruning that drops below the stage floor returns null', async () => {
  // Only one CTE is referenced by the tail; the other is dead. After pruning,
  // 1 live CTE + 1 final = 2 stages = MIN_STAGES, so this still traces. Confirm
  // it does, then a case where pruning leaves zero live CTEs returns null.
  const setup = 'CREATE TABLE nums (v INTEGER); INSERT INTO nums (v) VALUES (1),(2);'
  // tail references neither CTE; both are dead -> 0 live CTEs -> below floor.
  const sql = `
    WITH dead1 AS (SELECT 1 AS z),
         dead2 AS (SELECT 2 AS z)
    SELECT v FROM nums ORDER BY v
  `
  const trace = await runPipelineTrace(sql, setup)
  assert.equal(trace, null)
})

test('SEV-4: a CTE referenced only transitively by a live CTE is kept', async () => {
  const setup = 'CREATE TABLE nums (v INTEGER); INSERT INTO nums (v) VALUES (2),(4),(6);'
  // tail -> doubled -> evens. `evens` is not named by the tail but is live via doubled.
  const sql = `
    WITH evens AS (SELECT v FROM nums WHERE v % 2 = 0),
         doubled AS (SELECT v, v * 2 AS d FROM evens)
    SELECT v, d FROM doubled ORDER BY v
  `
  const trace = await runPipelineTrace(sql, setup)
  assert.ok(trace)
  assert.deepEqual(trace!.stages, ['evens', 'doubled', 'result'])
})

// ---------------------------------------------------------------------------
// SEV-5: the final stage label must not collide with a CTE literally named 'result'.
// ---------------------------------------------------------------------------

test('SEV-5: a CTE named "result" does not collide with the final stage label', async () => {
  const setup = 'CREATE TABLE nums (v INTEGER); INSERT INTO nums (v) VALUES (1),(2),(3),(4);'
  const sql = `
    WITH result AS (SELECT v FROM nums WHERE v % 2 = 0),
         scaled AS (SELECT v, v * 10 AS x FROM result)
    SELECT v, x FROM scaled ORDER BY v
  `
  const trace = await runPipelineTrace(sql, setup)
  assert.ok(trace)
  // First stage keeps its real CTE name 'result'; the final stage falls back to
  // a non-colliding label so the two stages are distinct.
  assert.equal(trace!.stages[0], 'result')
  const finalLabel = trace!.stages[trace!.stages.length - 1]
  assert.notEqual(finalLabel, 'result')
  assert.equal(finalLabel, 'output')
  // Stage labels are unique (no collision).
  assert.equal(new Set(trace!.stages).size, trace!.stages.length)
  // activeStage indices still line up 0..2.
  assert.deepEqual(trace!.deltas.map((d) => d.activeStage), [0, 1, 2])
})

// ---------------------------------------------------------------------------
// SEV-6: single-CTE pipelines (one CTE -> final SELECT = 2 stages) are eligible.
// The schema floor was lowered to 2 for the PIPELINE base only (array/grid stay
// at >=3). A single-CTE query is a real "build the intermediate, then assemble
// the result" walkthrough where both stages are separately executed against the
// real data, so a 2-step verified pipeline is honest and worth showing. The
// cross-check still runs on the FULL un-capped final result.
// ---------------------------------------------------------------------------

// Mirrors the live single-CTE shape (DoorDash: Top 3 Restaurants per City):
// one CTE ranks rows, the final SELECT filters + projects. Two genuine stages.
const TOP3_SETUP = `
CREATE TABLE orders (order_id INTEGER, restaurant_id INTEGER, subtotal INTEGER, status TEXT);
CREATE TABLE restaurants (restaurant_id INTEGER, city TEXT, name TEXT);
INSERT INTO restaurants (restaurant_id, city, name) VALUES
  (1, 'SF', 'Alpha'), (2, 'SF', 'Beta'), (3, 'SF', 'Gamma'), (4, 'SF', 'Delta');
INSERT INTO orders (order_id, restaurant_id, subtotal, status) VALUES
  (1, 1, 100, 'delivered'), (2, 1, 100, 'delivered'),
  (3, 2, 150, 'delivered'),
  (4, 3, 120, 'delivered'),
  (5, 4, 50, 'delivered');
`
// rk: revenue per (city, restaurant) ranked desc. Final: keep rnk<=3, project.
// Alpha=200(rnk1), Beta=150(rnk2), Gamma=120(rnk3), Delta=50(rnk4, dropped).
const TOP3_SQL = `
WITH rk AS (
  SELECT r.city, r.name, SUM(o.subtotal) AS total_rev,
         RANK() OVER (PARTITION BY r.city ORDER BY SUM(o.subtotal) DESC) AS rnk
  FROM orders o
  JOIN restaurants r ON o.restaurant_id = r.restaurant_id
  WHERE o.status = 'delivered'
  GROUP BY r.city, r.restaurant_id, r.name
)
SELECT city, name, total_rev, rnk
FROM rk
WHERE rnk <= 3
ORDER BY city, rnk
`
const TOP3_EXPECTED = [
  { city: 'SF', name: 'Alpha', total_rev: 200, rnk: 1 },
  { city: 'SF', name: 'Beta', total_rev: 150, rnk: 2 },
  { city: 'SF', name: 'Gamma', total_rev: 120, rnk: 3 },
]

test('SEV-6: a single-CTE query traces to exactly 2 stages (CTE intermediate -> final result)', async () => {
  const trace = await runPipelineTrace(TOP3_SQL, TOP3_SETUP)
  assert.ok(trace)
  // 1 CTE + 1 final outer SELECT = 2 stages.
  assert.deepEqual(trace!.stages, ['rk', 'result'])
  assert.deepEqual(trace!.deltas.map((d) => d.activeStage), [0, 1])
  // Stage 0 (rk) materializes all 4 ranked rows; the final filters to rnk<=3.
  assert.equal(trace!.deltas[0].table!.rows.length, 4)
  assert.equal(trace!.deltas[1].table!.rows.length, 3)
})

test('SEV-6: a single-CTE pipeline builds an eligible 2-step verified diagram that passes the schema', async () => {
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: TOP3_SETUP, dialect: 'sqlite' },
    reference_solution: { sql: TOP3_SQL },
    test_cases: [{ id: 't1', label: 'main', expected_rows: TOP3_EXPECTED }],
  })
  assert.ok(candidate)
  assert.equal(candidate!.diagram.trace_verified, true)
  assert.equal(candidate!.diagram.base.kind, 'pipeline')
  // The 2-step diagram is now SCHEMA-VALID (the pipeline floor is 2, not 3).
  assert.equal(candidate!.diagram.steps.length, 2)
  assert.equal(SolutionDiagramSchema.safeParse(candidate!.diagram).success, true)
  assert.equal(InteractiveStepDiagramSchema.safeParse(candidate!.diagram).success, true)
})

test('SEV-6: the 2-stage cross-check still rejects a wrong final result', async () => {
  // The trace is a real, well-formed 2-stage pipeline, but the expected_rows claim
  // a wrong total_rev for one row. The full-set cross-check must reject it so a
  // single-CTE walkthrough is never shown with a result that disagrees with the
  // challenge's own expected output.
  const wrongExpected = [
    { city: 'SF', name: 'Beta', total_rev: 999, rnk: 1 }, // wrong revenue
    { city: 'SF', name: 'Alpha', total_rev: 200, rnk: 2 },
    { city: 'SF', name: 'Gamma', total_rev: 120, rnk: 3 },
  ]
  const candidate = await buildSteppedPipelineFromMetadata({
    sql_schema: { setup_script: TOP3_SETUP, dialect: 'sqlite' },
    reference_solution: { sql: TOP3_SQL },
    test_cases: [{ id: 't1', label: 'main', expected_rows: wrongExpected }],
  })
  assert.equal(candidate, null)
})

test('SEV-6: a 2-step pipeline diagram is schema-valid but a 2-step ARRAY diagram is NOT (floor stays 3 for array)', () => {
  // The pipeline floor was lowered to 2; the array floor is unchanged at 3. Build a
  // minimal 2-step diagram on each base and confirm only the pipeline one validates.
  const twoStepPipeline = {
    kind: 'stepped' as const,
    trace_verified: true,
    base: { kind: 'pipeline' as const, stages: ['cte', 'result'] },
    steps: [
      { title: 'Build the cte stage', explanation: 'The CTE materializes the intermediate rows.', delta: { base: 'pipeline' as const, activeStage: 0, table: { columns: ['v'], rows: [['1']] } } },
      { title: 'Assemble the final result', explanation: 'The outer query reads the CTE and projects the answer.', delta: { base: 'pipeline' as const, activeStage: 1, table: { columns: ['v'], rows: [['1']] } } },
    ],
  }
  assert.equal(SolutionDiagramSchema.safeParse(twoStepPipeline).success, true)

  const twoStepArray = {
    kind: 'stepped' as const,
    trace_verified: true,
    base: { kind: 'array' as const, cells: [{ value: '1' }, { value: '2' }], pointers: ['lo', 'hi'] },
    steps: [
      { title: 'A', explanation: 'first.', delta: { base: 'array' as const, pointerAt: { lo: 0, hi: 1 } } },
      { title: 'B', explanation: 'second.', delta: { base: 'array' as const, pointerAt: { lo: 0, hi: 1 }, found: true } },
    ],
  }
  // An array stepped diagram needs at least 3 steps; the 2-step one must be rejected.
  assert.equal(SolutionDiagramSchema.safeParse(twoStepArray).success, false)
})
