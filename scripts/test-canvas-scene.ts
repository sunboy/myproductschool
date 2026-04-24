/* eslint-disable no-console */
/**
 * Pure-function tests for src/lib/hatch/canvas-scene.ts.
 * Run with: npx tsx scripts/test-canvas-scene.ts
 *
 * No test framework needed — fails fast with non-zero exit on any assertion.
 */

import { summarizeScene, sceneToPrompt } from '../src/lib/hatch/canvas-scene'

let failures = 0

function assert(cond: boolean, label: string) {
  if (!cond) {
    failures += 1
    console.error(`FAIL: ${label}`)
  } else {
    console.log(`pass: ${label}`)
  }
}

function assertEq<T>(actual: T, expected: T, label: string) {
  const eq = JSON.stringify(actual) === JSON.stringify(expected)
  if (!eq) {
    failures += 1
    console.error(`FAIL: ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`)
  } else {
    console.log(`pass: ${label}`)
  }
}

// --- Test 1: empty canvas
{
  const scene = summarizeScene([])
  assertEq(scene.elementCount, 0, 'empty canvas → elementCount 0')
  assertEq(scene.entities, [], 'empty canvas → no entities')
  assert(sceneToPrompt(scene).includes('empty'), 'empty canvas prompt mentions empty')
}

// --- Test 2: single labeled rectangle
{
  const elements = [
    {
      id: 'e1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 140,
      height: 60,
      label: { text: 'Users' },
      isDeleted: false,
    },
  ]
  const scene = summarizeScene(elements)
  assertEq(scene.entities.length, 1, 'one shape → one entity')
  assertEq(scene.entities[0].label, 'Users', 'entity label preserved')
  assertEq(scene.entities[0].type, 'rectangle', 'entity type preserved')
  assert(sceneToPrompt(scene).includes('Users'), 'prompt includes label')
}

// --- Test 3: deleted elements excluded
{
  const elements = [
    { id: 'e1', type: 'rectangle', label: { text: 'Live' }, x: 0, y: 0, width: 100, height: 50 },
    { id: 'e2', type: 'rectangle', label: { text: 'Dead' }, isDeleted: true, x: 0, y: 0, width: 100, height: 50 },
  ]
  const scene = summarizeScene(elements)
  assertEq(scene.entities.length, 1, 'deleted elements skipped')
  assertEq(scene.entities[0].label, 'Live', 'only live element retained')
}

// --- Test 4: arrow with explicit binding → connection
{
  const elements = [
    { id: 'a', type: 'rectangle', label: { text: 'API' }, x: 0, y: 0, width: 100, height: 50 },
    { id: 'b', type: 'rectangle', label: { text: 'DB' }, x: 200, y: 0, width: 100, height: 50 },
    {
      id: 'arr1',
      type: 'arrow',
      x: 100,
      y: 25,
      points: [[0, 0], [100, 0]],
      startBinding: { elementId: 'a' },
      endBinding: { elementId: 'b' },
    },
  ]
  const scene = summarizeScene(elements)
  assertEq(scene.connections.length, 1, 'one bound arrow → one connection')
  assertEq(scene.connections[0].from, 'API', 'connection from label resolved')
  assertEq(scene.connections[0].to, 'DB', 'connection to label resolved')
}

// --- Test 5: arrow without binding → nearest-entity heuristic
{
  const elements = [
    { id: 'a', type: 'rectangle', label: { text: 'X' }, x: 0, y: 0, width: 100, height: 50 },
    { id: 'b', type: 'rectangle', label: { text: 'Y' }, x: 200, y: 0, width: 100, height: 50 },
    { id: 'arr', type: 'arrow', x: 50, y: 25, points: [[0, 0], [200, 0]] },
  ]
  const scene = summarizeScene(elements)
  assertEq(scene.connections.length, 1, 'unbound arrow resolves via nearest-entity')
  assert(
    scene.connections[0].from === 'X' || scene.connections[0].to === 'X',
    'connection includes nearest entity X'
  )
}

// --- Test 6: spatial cluster (3+ entities within 250px)
{
  const elements = [
    { id: '1', type: 'rectangle', label: { text: 'A' }, x: 0, y: 0, width: 50, height: 50 },
    { id: '2', type: 'rectangle', label: { text: 'B' }, x: 100, y: 0, width: 50, height: 50 },
    { id: '3', type: 'rectangle', label: { text: 'C' }, x: 50, y: 100, width: 50, height: 50 },
    { id: '4', type: 'rectangle', label: { text: 'Far' }, x: 800, y: 800, width: 50, height: 50 },
  ]
  const scene = summarizeScene(elements)
  assert(scene.groups.length >= 1, '3 close entities form a group')
  const cluster = scene.groups[0]
  assert(cluster.members.includes('A'), 'cluster includes A')
  assert(!cluster.members.includes('Far'), 'far entity excluded from cluster')
}

// --- Test 7: standalone text → freeText
{
  const elements = [
    { id: 't1', type: 'text', text: 'Note: handle PII' },
    { id: 'r1', type: 'rectangle', label: { text: 'Server' }, x: 0, y: 0, width: 100, height: 50 },
  ]
  const scene = summarizeScene(elements)
  assertEq(scene.freeText, ['Note: handle PII'], 'standalone text → freeText')
  assertEq(scene.entities.length, 1, 'rectangle still counted as entity')
}

// --- Test 8: prompt includes all sections when populated
{
  const elements = [
    { id: '1', type: 'rectangle', label: { text: 'API' }, x: 0, y: 0, width: 100, height: 50 },
    { id: '2', type: 'rectangle', label: { text: 'DB' }, x: 300, y: 0, width: 100, height: 50 },
    {
      id: 'a',
      type: 'arrow',
      x: 100,
      y: 25,
      points: [[0, 0], [200, 0]],
      startBinding: { elementId: '1' },
      endBinding: { elementId: '2' },
    },
    { id: 't', type: 'text', text: 'Add caching here' },
  ]
  const prompt = sceneToPrompt(summarizeScene(elements))
  assert(prompt.includes('Entities'), 'prompt has Entities section')
  assert(prompt.includes('Connections'), 'prompt has Connections section')
  assert(prompt.includes('Notes'), 'prompt has Notes section')
  assert(prompt.includes('API'), 'prompt mentions API by label')
  assert(prompt.includes('DB'), 'prompt mentions DB by label')
}

// --- Test 9: shapes without labels are not counted as entities
{
  const elements = [
    { id: '1', type: 'rectangle', x: 0, y: 0, width: 50, height: 50 }, // no label
    { id: '2', type: 'rectangle', label: { text: 'Real' }, x: 0, y: 0, width: 50, height: 50 },
  ]
  const scene = summarizeScene(elements)
  assertEq(scene.entities.length, 1, 'unlabeled shapes excluded from entities')
}

// --- Test 10: many entities — connections section formatted properly
{
  const entities = Array.from({ length: 5 }, (_, i) => ({
    id: `e${i}`,
    type: 'rectangle',
    label: { text: `Node${i}` },
    x: i * 200,
    y: 0,
    width: 100,
    height: 50,
  }))
  const prompt = sceneToPrompt(summarizeScene(entities))
  // No arrows → expect "no arrows connecting the entities yet"
  assert(prompt.includes('no arrows'), 'multi-entity, zero arrows → notes the gap')
}

// ============================================================
// Schema-as-text parsing tests (bound-text element convention)
// ============================================================

// Helper: build a rectangle with a bound text element
function makeTableElements(
  rectId: string,
  textId: string,
  textBody: string,
  opts: { x?: number; y?: number; width?: number; height?: number } = {}
) {
  return [
    {
      id: rectId,
      type: 'rectangle',
      x: opts.x ?? 100,
      y: opts.y ?? 100,
      width: opts.width ?? 160,
      height: opts.height ?? 80,
      boundElements: [{ id: textId, type: 'text' }],
      isDeleted: false,
    },
    {
      id: textId,
      type: 'text',
      containerId: rectId,
      text: textBody,
      x: opts.x ?? 100,
      y: opts.y ?? 100,
    },
  ]
}

// --- Test 11 (new 1): Single-column table parses
{
  const elements = makeTableElements('r1', 't1', 'users\n──\nid')
  const scene = summarizeScene(elements)
  assertEq(scene.entities.length, 1, 'single-col: one entity')
  assertEq(scene.entities[0].label, 'users', 'single-col: entity label === users')
  assertEq(scene.entities[0].columns.length, 1, 'single-col: one column')
  assertEq(scene.entities[0].columns[0].name, 'id', 'single-col: column name === id')
}

// --- Test 12 (new 2): Multi-column table (3+ columns)
{
  const elements = makeTableElements('r2', 't2', 'users\n──\nid PK\nemail UNIQUE\ncreated_at')
  const scene = summarizeScene(elements)
  assertEq(scene.entities[0].columns.length, 3, 'multi-col: 3 columns parsed')
  assertEq(scene.entities[0].columns[0].name, 'id', 'multi-col: col[0] = id')
  assertEq(scene.entities[0].columns[1].name, 'email', 'multi-col: col[1] = email')
  assertEq(scene.entities[0].columns[2].name, 'created_at', 'multi-col: col[2] = created_at')
}

// --- Test 13 (new 3): PK constraint recognized
{
  const elements = makeTableElements('r3', 't3', 'orders\n──\nid PK')
  const scene = summarizeScene(elements)
  const col = scene.entities[0].columns[0]
  assert(col.constraints.includes('PK'), 'PK constraint: includes PK')
}

// --- Test 14 (new 4): UNIQUE constraint recognized
{
  const elements = makeTableElements('r4', 't4', 'users\n──\nemail UNIQUE')
  const scene = summarizeScene(elements)
  const col = scene.entities[0].columns[0]
  assert(col.constraints.includes('UNIQUE'), 'UNIQUE constraint: includes UNIQUE')
}

// --- Test 15 (new 5): FK→users.id parsed correctly
{
  const elements = makeTableElements('r5', 't5', 'posts\n──\ntenant_id FK→users.id')
  const scene = summarizeScene(elements)
  const col = scene.entities[0].columns[0]
  assert(col.constraints.includes('FK'), 'FK: constraints includes FK')
  assertEq(
    col.foreignKey,
    { table: 'users', column: 'id' },
    'FK: foreignKey === { table: users, column: id }'
  )
}

// --- Test 16 (new 6): NOT NULL recognized as two-word constraint
{
  const elements = makeTableElements('r6', 't6', 'people\n──\nname NOT NULL')
  const scene = summarizeScene(elements)
  const col = scene.entities[0].columns[0]
  assert(col.constraints.includes('NOT NULL'), 'NOT NULL: includes NOT NULL')
}

// --- Test 17 (new 7): INDEX constraint recognized
{
  const elements = makeTableElements('r7', 't7', 'products\n──\nsearch_term INDEX')
  const scene = summarizeScene(elements)
  const col = scene.entities[0].columns[0]
  assert(col.constraints.includes('INDEX'), 'INDEX constraint: includes INDEX')
}

// --- Test 18 (new 8): Combined constraints — PK + NOT NULL
{
  const elements = makeTableElements('r8', 't8', 'records\n──\nid PK NOT NULL')
  const scene = summarizeScene(elements)
  const col = scene.entities[0].columns[0]
  assert(col.constraints.includes('PK'), 'combined constraints: PK present')
  assert(col.constraints.includes('NOT NULL'), 'combined constraints: NOT NULL present')
}

// --- Test 19 (new 9): All separator variants stripped
{
  // Test 4 separator styles: ─ (unicode), -, =, --
  const separatorVariants = [
    { sep: '──', label: 'unicode ─ separator' },
    { sep: '-', label: 'hyphen separator' },
    { sep: '=', label: 'equals separator' },
    { sep: '--', label: 'double-hyphen separator' },
  ]
  for (const { sep, label } of separatorVariants) {
    const elements = makeTableElements('rs', 'ts', `entity\n${sep}\ncol_a\ncol_b`)
    const scene = summarizeScene(elements)
    assertEq(scene.entities[0].columns.length, 2, `separator variant (${label}): 2 columns, no separator row`)
  }
}

// --- Test 20 (new 10): Lines that don't match the column format
// Current behavior: line "this is just a sentence with multiple words" parses as
// name='this', remaining tokens stored; the column IS included with name='this'.
{
  const elements = makeTableElements('r10', 't10', 'misc\n──\nthis is just a sentence')
  const scene = summarizeScene(elements)
  // Per parseColumnLine: first token is name if it starts with \w — so column IS created
  assertEq(scene.entities[0].columns.length, 1, 'freeform line: still produces a column (first token as name)')
  assertEq(scene.entities[0].columns[0].name, 'this', 'freeform line: column name is first token')
}

// --- Test 21 (new 11): Backwards compat — single-label entity (no separator, no columns)
{
  const elements = makeTableElements('r11', 't11', 'users')
  const scene = summarizeScene(elements)
  assertEq(scene.entities[0].label, 'users', 'backwards compat: entity label === users')
  assertEq(scene.entities[0].columns, [], 'backwards compat: columns === []')
}

// --- Test 22 (new 12): sceneToPrompt renders columns as sub-bullets
{
  const elements = makeTableElements('r12', 't12', 'accounts\n──\nid PK\nemail')
  const prompt = sceneToPrompt(summarizeScene(elements))
  assert(prompt.includes('id'), 'sceneToPrompt: prompt contains column name id')
  assert(prompt.includes('email'), 'sceneToPrompt: prompt contains column name email')
  // Sub-bullets use "  - " prefix
  assert(prompt.includes('  - id'), 'sceneToPrompt: id rendered as sub-bullet')
  assert(prompt.includes('  - email'), 'sceneToPrompt: email rendered as sub-bullet')
}

// --- Test 23 (new 13): foreignKeys aggregated across multiple entities
{
  const elA = makeTableElements('ra', 'ta', 'comments\n──\npost_id FK→posts.id', { x: 0, y: 0 })
  const elB = makeTableElements('rb', 'tb', 'likes\n──\nuser_id FK→users.id', { x: 300, y: 0 })
  const scene = summarizeScene([...elA, ...elB])
  assertEq(scene.foreignKeys.length, 2, 'foreignKeys: 2 FK entries across entities')
  const fk0 = scene.foreignKeys.find((fk) => fk.from === 'comments')
  const fk1 = scene.foreignKeys.find((fk) => fk.from === 'likes')
  assert(fk0?.fromColumn === 'post_id' && fk0?.toTable === 'posts' && fk0?.toColumn === 'id',
    'foreignKeys: comments.post_id → posts.id')
  assert(fk1?.fromColumn === 'user_id' && fk1?.toTable === 'users' && fk1?.toColumn === 'id',
    'foreignKeys: likes.user_id → users.id')
}

// --- Test 24 (new 14): Whitespace tolerated in column lines
{
  const elements = makeTableElements('r14', 't14', 'things\n──\n  id  PK  ')
  const scene = summarizeScene(elements)
  const col = scene.entities[0].columns[0]
  assertEq(col.name, 'id', 'whitespace tolerated: name = id')
  assert(col.constraints.includes('PK'), 'whitespace tolerated: PK constraint recognized')
}

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`)
process.exit(failures === 0 ? 0 : 1)
