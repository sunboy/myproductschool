/**
 * Test harness utilities — no external dependencies.
 *
 * Run:
 *   USE_MOCK_DATA=true npx tsx scripts/test-api.ts
 */

export const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
export const MOCK_USER_ID = 'mock-user-00000000-0000-0000-0000-000000000000'

// ── Tracking ───────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

// ── Assertions ─────────────────────────────────────────────────

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

export function assertExists(value: unknown, message: string): void {
  if (value === null || value === undefined) {
    throw new Error(`assertExists failed: ${message} (got ${value})`)
  }
}

export function assertShape(obj: unknown, keys: string[], label: string): void {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`assertShape failed: ${label} — expected object, got ${typeof obj}`)
  }
  const record = obj as Record<string, unknown>
  const missing = keys.filter(k => !(k in record))
  if (missing.length > 0) {
    throw new Error(`assertShape failed: ${label} — missing keys: ${missing.join(', ')}`)
  }
}

// ── Test runner ────────────────────────────────────────────────

export async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  try {
    await fn()
    const elapsed = Date.now() - start
    console.log(`  ✓ ${name} (${elapsed}ms)`)
    passed++
  } catch (err: unknown) {
    const elapsed = Date.now() - start
    const message = err instanceof Error ? err.message : String(err)
    console.log(`  ✗ ${name} (${elapsed}ms)`)
    console.log(`    ${message}`)
    failed++
    failures.push(`${name}: ${message}`)
  }
}

// ── Fetch wrapper ──────────────────────────────────────────────

export async function request(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const url = `${BASE_URL}${path}`
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }
  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)
  const text = await res.text()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = text
  }

  return { status: res.status, body: parsed }
}

// ── Summary ────────────────────────────────────────────────────

export function summary(): void {
  const total = passed + failed
  console.log('\n=== RESULTS ===')
  console.log(`PASSED: ${passed}/${total}`)
  console.log(`FAILED: ${failed}/${total}`)
  if (failures.length > 0) {
    for (const f of failures) {
      console.log(`  ✗ ${f}`)
    }
    process.exit(1)
  }
}
