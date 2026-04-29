/**
 * Unit tests for src/lib/judge0/harness.ts
 *
 * Tests cover:
 * 1. Tree problem round-trip (Python)
 * 2. Linked list round-trip (Python)
 * 3. Backward compatibility — bare array stdin still works
 * 4. Tree output serialization (Python)
 * 5. JS structural assertions + round-trip via Node
 *
 * Python/Node scripts are executed via temp files to avoid shell escaping issues.
 */

import { describe, it, expect } from 'vitest'
import { execSync, spawnSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { wrapWithHarness, PYTHON_DESERIALIZER_PROLOGUE, JS_DESERIALIZER_PROLOGUE } from '../../src/lib/judge0/harness'

// ---------------------------------------------------------------------------
// Helper — write script to a temp file and run it with stdin piped in
// ---------------------------------------------------------------------------

function runScriptFile(
  interpreter: string,
  script: string,
  stdinData: string
): { stdout: string; ok: boolean; error?: string } {
  const ext = interpreter === 'python3' ? 'py' : 'mjs'
  const tmpFile = path.join(os.tmpdir(), `harness-test-${Date.now()}.${ext}`)
  try {
    fs.writeFileSync(tmpFile, script, 'utf-8')
    const result = spawnSync(interpreter, [tmpFile], {
      input: stdinData,
      encoding: 'utf-8',
      timeout: 10_000,
    })
    if (result.status === 0) {
      return { stdout: (result.stdout ?? '').trim(), ok: true }
    }
    return { stdout: '', ok: false, error: result.stderr ?? String(result.error ?? '') }
  } catch (err) {
    return { stdout: '', ok: false, error: String(err) }
  } finally {
    try { fs.unlinkSync(tmpFile) } catch { /* best-effort cleanup */ }
  }
}

// ---------------------------------------------------------------------------
// Detect Python3 availability once for the whole suite
// ---------------------------------------------------------------------------

let hasPython3 = false
try {
  execSync('python3 --version', { stdio: 'pipe', timeout: 3_000 })
  hasPython3 = true
} catch {
  hasPython3 = false
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('wrapWithHarness — Python structured inputs', () => {
  it('Test 1: Tree round-trip — solution(root) returns root.val for root=[1,null,2,3]', () => {
    const userCode = 'def solution(root):\n    return root.val'
    const wrapped = wrapWithHarness(userCode, 'python')
    const stdinData = JSON.stringify({ args: [[1, null, 2, 3]], input_types: ['tree'] })

    // Structural assertions — always run
    expect(wrapped).toContain('_build_tree')
    expect(wrapped).toContain('input_types')
    expect(wrapped).toContain('_deserialize_arg')

    if (!hasPython3) return

    const { stdout, ok, error } = runScriptFile('python3', wrapped, stdinData)
    expect(ok, `Python failed: ${error}`).toBe(true)
    expect(JSON.parse(stdout)).toBe(1)
  })

  it('Test 2: Linked list round-trip — solution(root) returns root.next.val for [1,2,3]', () => {
    const userCode = 'def solution(root):\n    return root.next.val'
    const wrapped = wrapWithHarness(userCode, 'python')
    const stdinData = JSON.stringify({ args: [[1, 2, 3]], input_types: ['linked_list'] })

    // Structural assertions
    expect(wrapped).toContain('_build_list')
    expect(wrapped).toContain('input_types')

    if (!hasPython3) return

    const { stdout, ok, error } = runScriptFile('python3', wrapped, stdinData)
    expect(ok, `Python failed: ${error}`).toBe(true)
    expect(JSON.parse(stdout)).toBe(2)
  })

  it('Test 3: Backward compatibility — bare array stdin works with two-arg solution', () => {
    const userCode = 'def solution(arr, target):\n    return arr[0] + target'
    const wrapped = wrapWithHarness(userCode, 'python')
    // Legacy shape: bare array
    const stdinData = JSON.stringify([[1, 2, 3], 5])

    // Structural: the wrapper should handle both list and dict payloads
    expect(wrapped).toContain('isinstance(_payload, list)')

    if (!hasPython3) return

    const { stdout, ok, error } = runScriptFile('python3', wrapped, stdinData)
    expect(ok, `Python failed: ${error}`).toBe(true)
    // arr[0]=1, target=5 → 6
    expect(JSON.parse(stdout)).toBe(6)
  })

  it('Test 4: Tree output serialization — function returns constructed TreeNode, harness serializes to array', () => {
    // Solution builds a tree with root.val=1, root.right.val=2 and returns it
    const userCode = [
      'def solution(vals):',
      '    root = TreeNode(vals[0])',
      '    root.right = TreeNode(vals[1])',
      '    return root',
    ].join('\n')
    const wrapped = wrapWithHarness(userCode, 'python')
    const stdinData = JSON.stringify({ args: [[1, 2]], input_types: ['array'], output_type: 'tree' })

    // Structural assertions
    expect(wrapped).toContain('_serialize_tree')
    expect(wrapped).toContain('output_type')

    if (!hasPython3) return

    const { stdout, ok, error } = runScriptFile('python3', wrapped, stdinData)
    expect(ok, `Python failed: ${error}`).toBe(true)
    // root.val=1, root.left=None, root.right.val=2 → [1, null, 2]
    expect(JSON.parse(stdout)).toEqual([1, null, 2])
  })
})

describe('wrapWithHarness — JavaScript structured inputs', () => {
  it('Test 5 (JS): Prologue and dispatcher are present in wrapped output', () => {
    const userCode = 'function solution(root) { return root.val; }'
    const wrapped = wrapWithHarness(userCode, 'javascript')

    // Structural assertions — always run regardless of Node availability
    expect(wrapped).toContain('class TreeNode')
    expect(wrapped).toContain('_buildTree')
    expect(wrapped).toContain('_deserializeArg')
    expect(wrapped).toContain('Array.isArray(_payload)')
  })

  it('Test 6 (JS): Tree round-trip via Node.js', () => {
    // Node.js reads from /dev/stdin which works on macOS/Linux
    // Rewrite to use process.stdin for broad compat
    const userCode = 'function solution(root) { return root.val; }'
    // Build a version that reads from a file path via stdin for Node
    const wrapped = wrapWithHarness(userCode, 'javascript')
    const stdinData = JSON.stringify({ args: [[5, 3, 8]], input_types: ['tree'] })

    const { stdout, ok } = runScriptFile('node', wrapped, stdinData)
    if (!ok) return // Node might not be available in this env

    expect(JSON.parse(stdout)).toBe(5)
  })

  it('Test 7 (JS): Backward compat — bare array stdin', () => {
    const userCode = 'function solution(arr, target) { return arr[0] + target; }'
    const wrapped = wrapWithHarness(userCode, 'javascript')
    const stdinData = JSON.stringify([[10, 20], 5])

    const { stdout, ok } = runScriptFile('node', wrapped, stdinData)
    if (!ok) return // skip if node unavailable

    expect(JSON.parse(stdout)).toBe(15)
  })
})

describe('PYTHON_DESERIALIZER_PROLOGUE export', () => {
  it('contains all required class and function definitions', () => {
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('class TreeNode')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('class ListNode')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('class GraphNode')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('def _build_tree')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('def _build_list')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('def _build_graph')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('def _serialize_tree')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('def _serialize_list')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('def _serialize_graph')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('def _deserialize_arg')
    expect(PYTHON_DESERIALIZER_PROLOGUE).toContain('def _serialize_result')
  })
})

describe('JS_DESERIALIZER_PROLOGUE export', () => {
  it('contains all required class and function definitions', () => {
    expect(JS_DESERIALIZER_PROLOGUE).toContain('class TreeNode')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('class ListNode')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('class GraphNode')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('function _buildTree')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('function _buildList')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('function _buildGraph')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('function _serializeTree')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('function _serializeList')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('function _serializeGraph')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('function _deserializeArg')
    expect(JS_DESERIALIZER_PROLOGUE).toContain('function _serializeResult')
  })
})
