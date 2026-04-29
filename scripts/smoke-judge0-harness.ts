#!/usr/bin/env npx tsx
/**
 * Smoke test for Judge0 harness and languageMap (no network calls).
 * Client module requires JUDGE0_RAPIDAPI_KEY — tested separately via verify-judge0.ts.
 *
 * Run: npx tsx scripts/smoke-judge0-harness.ts
 */

import { wrapWithHarness } from '../src/lib/judge0/harness'
import { JUDGE0_LANGUAGE_IDS } from '../src/lib/judge0/languageMap'

console.log('=== smoke-judge0-harness ===\n')

// 1. Language map
console.log('JUDGE0_LANGUAGE_IDS:', JUDGE0_LANGUAGE_IDS)
console.log()

// 2. Python harness
const pyCode = 'def solution(a, b):\n    return a + b'
const pyWrapped = wrapWithHarness(pyCode, 'python')
console.log('--- Python harness ---')
console.log(pyWrapped)

// 3. JavaScript harness
const jsCode = 'function solution(a, b) {\n  return a + b\n}'
const jsWrapped = wrapWithHarness(jsCode, 'javascript')
console.log('--- JavaScript harness ---')
console.log(jsWrapped)

// 4. Java harness (verify it generates without throwing)
const javaCode = 'class Solution {\n  public int solution(int a, int b) { return a + b; }\n}'
const javaWrapped = wrapWithHarness(javaCode, 'java')
console.log('--- Java harness (first 3 lines) ---')
console.log(javaWrapped.split('\n').slice(0, 3).join('\n'))
console.log()

// 5. C++ harness (verify no throw)
const cppCode = 'vector<int> solution(vector<int> nums, int target) { return {0,1}; }'
const cppWrapped = wrapWithHarness(cppCode, 'cpp')
console.log('--- C++ harness (first 3 lines) ---')
console.log(cppWrapped.split('\n').slice(0, 3).join('\n'))
console.log()

// 6. Go harness (verify no throw)
const goCode = 'func solution(nums []int, target int) []int { return []int{0, 1} }'
const goWrapped = wrapWithHarness(goCode, 'go')
console.log('--- Go harness (first 3 lines) ---')
console.log(goWrapped.split('\n').slice(0, 3).join('\n'))
console.log()

// 7. Verify Python harness contains the expected boilerplate
const expectedPyStart = 'import sys, json'
const expectedPyArgs = '_args = json.loads(sys.stdin.read())'
const expectedPyResult = '_result = solution(*_args)'
const expectedPyPrint = 'print(json.dumps(_result))'

const checks: [string, boolean][] = [
  ['Python: starts with import sys, json', pyWrapped.startsWith(expectedPyStart)],
  ['Python: contains user code', pyWrapped.includes('def solution(a, b):')],
  ['Python: reads stdin', pyWrapped.includes(expectedPyArgs)],
  ['Python: calls solution(*_args)', pyWrapped.includes(expectedPyResult)],
  ['Python: prints json result', pyWrapped.includes(expectedPyPrint)],
  ['JS: contains user code', jsWrapped.includes('function solution(a, b)')],
  ['JS: reads /dev/stdin', jsWrapped.includes("readFileSync('/dev/stdin'")],
  ['JS: calls solution(..._args)', jsWrapped.includes('solution(..._args)')],
  ['JS: prints JSON', jsWrapped.includes('console.log(JSON.stringify(_result))')],
  ['Java: has Main class', javaWrapped.includes('public class Main')],
  ['C++: has #include', cppWrapped.includes('#include')],
  ['Go: has package main', goWrapped.includes('package main')],
  ['Go: has encoding/json', goWrapped.includes('encoding/json')],
]

let allPassed = true
for (const [label, passed] of checks) {
  const icon = passed ? '✓' : '✗'
  console.log(`  ${icon} ${label}`)
  if (!passed) allPassed = false
}

console.log()
if (allPassed) {
  console.log('✓ All smoke checks passed')
} else {
  console.error('✗ Some checks failed')
  process.exit(1)
}
