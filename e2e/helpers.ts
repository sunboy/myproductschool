/**
 * E2E test helpers for coding challenge tests.
 *
 * These helpers use the Supabase service role key to insert test data
 * directly into the database, bypassing the auth layer for test setup.
 * They mirror the pattern used in existing E2E specs (page.route() for
 * API mocking, direct Supabase admin calls for data setup).
 */

import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function uuidv4(): string {
  return crypto.randomUUID()
}

// ---------------------------------------------------------------------------
// Supabase admin client — only used in helpers, never in the browser
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for E2E setup')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestUser {
  id: string
  email: string
  password: string
}

export interface TestChallenge {
  id: string
  slug: string
  title: string
  language: string
}

// ---------------------------------------------------------------------------
// createTestUser
//
// Inserts a real user into auth.users via the admin API, then creates
// a matching profiles row with onboarding_completed_at set so the user
// bypasses onboarding.
// ---------------------------------------------------------------------------

export async function createTestUser(opts: { executionsToday?: number } = {}): Promise<TestUser> {
  const admin = getAdminClient()
  const id = uuidv4()
  const email = `test-coding-${id.slice(0, 8)}@test.hackproduct.dev`
  const password = 'Test1234!'

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: 'Test User' },
  })
  if (authError || !authData.user) {
    throw new Error(`createTestUser: auth error — ${authError?.message ?? 'no user'}`)
  }

  const userId = authData.user.id

  // Upsert profiles row — must have onboarding_completed_at to pass proxy checks
  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    display_name: 'Test User',
    role: 'engineer',
    plan: 'free',
    streak_days: 0,
    xp_total: 0,
    onboarding_completed_at: new Date().toISOString(),
    // execution cap tracking — used by T18 test
    ...(opts.executionsToday !== undefined
      ? { daily_attempts_today: opts.executionsToday }
      : {}),
  })
  if (profileError) {
    // Non-fatal: profile row may not exist yet if migration hasn't run
    console.warn('createTestUser: profile upsert warn:', profileError.message)
  }

  return { id: userId, email, password }
}

// ---------------------------------------------------------------------------
// seedCodingChallenge
//
// Inserts a coding challenge into the challenges table with realistic
// metadata matching the shape the rest of the system expects.
// ---------------------------------------------------------------------------

export interface SeedCodingChallengeOpts {
  language?: string
  title?: string
  sqlSchema?: {
    setupScript: string
    schemaDiagram?: object
    samplePreview?: object
  }
  languages?: string[]
  // Allow T5-style shorthand
  setupScript?: string
  expectedRows?: object[]
}

export async function seedCodingChallenge(
  opts: SeedCodingChallengeOpts = {}
): Promise<TestChallenge> {
  const admin = getAdminClient()

  const id = uuidv4()
  const language = opts.language ?? 'python'
  const languages = opts.languages ?? [language]
  const title = opts.title ?? `Test Coding Challenge ${id.slice(0, 6)}`
  const slug = `test-coding-${id.slice(0, 8)}`

  // Build test cases appropriate for the language
  const isSql = language === 'sql' || languages.includes('sql')

  // For SQL: build a test case from setupScript + expectedRows if provided
  const sqlSetupScript =
    opts.sqlSchema?.setupScript ??
    opts.setupScript ??
    'CREATE TABLE users (id INT, name TEXT); INSERT INTO users VALUES (1, \'Alice\'), (2, \'Bob\');'

  const sqlExpectedRows: object[] = opts.expectedRows ?? opts.sqlSchema?.samplePreview ? Object.values(opts.sqlSchema?.samplePreview ?? {})[0] as object[] ?? [] : []

  const testCases = isSql
    ? [
        {
          id: 'tc1',
          label: 'Basic query',
          setup_script: sqlSetupScript,
          expected_rows: sqlExpectedRows.length > 0 ? sqlExpectedRows : [{ id: 1, name: 'Alice' }],
          match_mode: 'exact_unordered',
          hidden: false,
        },
        {
          id: 'tc2',
          label: 'Filter check',
          setup_script: sqlSetupScript,
          expected_rows: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
          match_mode: 'exact_unordered',
          hidden: false,
        },
        {
          id: 'tc3',
          label: 'Hidden edge case',
          setup_script: sqlSetupScript,
          expected_rows: [],
          match_mode: 'exact_unordered',
          hidden: true,
        },
      ]
    : [
        { id: 'tc1', label: 'Basic', args: [[2, 7, 11, 15], 9], expected: [0, 1], hidden: false },
        { id: 'tc2', label: 'Sorted', args: [[3, 2, 4], 6], expected: [1, 2], hidden: false },
        { id: 'tc3', label: 'Empty', args: [[], 0], expected: [], hidden: false },
        { id: 'tc4', label: 'Negative', args: [[-1, -2, -3], -5], expected: [1, 2], hidden: false },
        { id: 'tc5', label: 'Hidden 1', args: [[1, 2], 3], expected: [0, 1], hidden: true },
        { id: 'tc6', label: 'Hidden 2', args: [[5, 6], 11], expected: [0, 1], hidden: true },
        { id: 'tc7', label: 'Hidden 3', args: [[10, 20], 30], expected: [0, 1], hidden: true },
      ]

  const starterCode: Record<string, string> = {
    python: 'def solution(nums, target):\n    pass',
    javascript: 'function solution(nums, target) {\n    // your code here\n}',
    java: 'class Solution {\n    public int[] solution(int[] nums, int target) {\n        return new int[]{};\n    }\n}',
    cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums, int target) {\n        return {};\n    }\n};',
    go: 'func solution(nums []int, target int) []int {\n    return nil\n}',
    sql: 'SELECT *\nFROM users\nWHERE 1=1',
  }

  const starter = languages.reduce((acc, lang) => {
    acc[lang] = starterCode[lang] ?? `# ${lang} solution here`
    return acc
  }, {} as Record<string, string>)

  const sqlSchemaData = opts.sqlSchema
    ? {
        setup_script: opts.sqlSchema.setupScript,
        schema_diagram: opts.sqlSchema.schemaDiagram ?? null,
        sample_data_preview: opts.sqlSchema.samplePreview ?? null,
      }
    : null

  const metadata = {
    problem_statement_markdown: `# ${title}\n\nGiven an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers that add up to \`target\`.\n\n**Example:**\n\`\`\`\nnums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\n\`\`\``,
    test_cases: testCases,
    starter_code: starter,
    supported_languages: languages,
    reference_solution: language === 'sql'
      ? 'SELECT * FROM users'
      : 'def solution(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen: return [seen[diff], i]\n        seen[n] = i\n    return []',
    reference_approach: 'Use a hash map for O(n) lookup.',
    time_limit_seconds: 1800,
    ...(sqlSchemaData ? { sql_schema: sqlSchemaData } : {}),
  }

  const { error } = await admin.from('challenges').insert({
    id,
    slug,
    title,
    challenge_type: 'coding',
    difficulty: 'standard',
    is_published: true,
    metadata,
    // Required NOT NULL columns
    scenario_context: isSql
      ? 'SQL challenge context'
      : 'Given an array of integers and a target sum, return indices of the two numbers that add up to the target.',
    scenario_trigger: isSql
      ? 'Write a SQL query to solve the problem.'
      : 'Return the solution as a list of two indices.',
    scenario_question: isSql
      ? 'Write the SQL query.'
      : `Write a ${language} function to solve the Two Sum problem.`,
  })

  if (error) {
    throw new Error(`seedCodingChallenge: DB error — ${error.message}`)
  }

  return { id, slug, title, language }
}

// ---------------------------------------------------------------------------
// mockJudge0
//
// Intercepts /api/code/run calls and returns a canned response based on
// the requested scenario. Adapted from spec §14.2.
// ---------------------------------------------------------------------------

type Judge0Scenario = 'all_pass' | 'partial' | 'all_fail' | 'timeout' | 'error'

export async function mockJudge0(page: Page, scenario: Judge0Scenario) {
  const responses: Record<Judge0Scenario, object> = {
    all_pass: {
      runId: 'r1',
      testsPassed: 7,
      testsTotal: 7,
      results: Array.from({ length: 7 }, (_, i) => ({
        id: `tc${i + 1}`,
        label: `Test ${i + 1}`,
        status: 'passed',
        hidden: i >= 3,
      })),
    },
    partial: {
      runId: 'r1',
      testsPassed: 5,
      testsTotal: 7,
      results: [
        { id: 'tc1', label: 'Basic', status: 'passed', hidden: false },
        { id: 'tc2', label: 'Sorted', status: 'passed', hidden: false },
        {
          id: 'tc3',
          label: 'Empty',
          status: 'failed',
          hidden: false,
          expected: '[]',
          output: 'null',
        },
        { id: 'tc4', label: 'Negative', status: 'passed', hidden: false },
        { id: 'tc5', label: 'Hidden', status: 'passed', hidden: true },
        { id: 'tc6', label: 'Hidden', status: 'failed', hidden: true },
        { id: 'tc7', label: 'Hidden', status: 'passed', hidden: true },
      ],
    },
    all_fail: {
      runId: 'r1',
      testsPassed: 0,
      testsTotal: 7,
      results: Array.from({ length: 7 }, (_, i) => ({
        id: `tc${i + 1}`,
        label: `Test ${i + 1}`,
        status: 'failed',
        hidden: i >= 3,
        expected: '[0,1]',
        output: 'null',
      })),
    },
    timeout: {
      runId: 'r1',
      testsPassed: 0,
      testsTotal: 7,
      results: Array.from({ length: 7 }, (_, i) => ({
        id: `tc${i + 1}`,
        label: `Test ${i + 1}`,
        status: 'timeout',
        hidden: i >= 3,
        errorMessage: 'Time limit exceeded',
      })),
    },
    error: {
      runId: 'r1',
      testsPassed: 0,
      testsTotal: 7,
      results: Array.from({ length: 7 }, (_, i) => ({
        id: `tc${i + 1}`,
        label: `Test ${i + 1}`,
        status: 'error',
        hidden: i >= 3,
        errorMessage: 'Runtime error',
      })),
    },
  }

  await page.route('**/api/code/run', async (route) => {
    await route.fulfill({ json: responses[scenario] })
  })
}

// ---------------------------------------------------------------------------
// mockGrading
//
// Intercepts /api/challenges/*/coding-submit and returns a canned grading
// response. The spec uses /api/interview/grade but the actual implementation
// uses /api/challenges/[id]/coding-submit — we mock the real path.
// ---------------------------------------------------------------------------

export async function mockGrading(page: Page, overallScore = 3.8) {
  await page.route('**/api/challenges/*/coding-submit', async (route) => {
    await route.fulfill({
      json: {
        grade: {
          overall_score: overallScore,
          headline: 'Strong decomposition, but accepted AI output without verification.',
          dimensions: {
            problem_approach: {
              score: 4,
              verdict: 'Good approach. You asked clarifying questions before diving in.',
              evidence: 'You asked about edge cases in the first 2 minutes.',
              hole_to_poke: 'Did you consider the overflow case?',
              how_to_improve: 'List edge cases before writing any code. Then verify each one explicitly.',
            },
            ai_collaboration: {
              score: 3,
              verdict: 'You used AI but relied on it too heavily for implementation.',
              evidence: 'Large paste on minute 4 suggests you copied AI output directly.',
              hole_to_poke: 'Did you verify the AI output line by line?',
              how_to_improve: 'After getting AI help, verify each line against your own understanding.',
            },
            code_quality: {
              score: 4,
              verdict: 'Clean, readable code with good naming.',
              evidence: 'Variable names are descriptive. Logic is easy to follow.',
              hole_to_poke: 'Could this be more concise?',
              how_to_improve: 'Consider adding inline comments for the non-obvious parts.',
            },
            verification_discipline: {
              score: 3,
              verdict: 'You ran the visible tests but skipped manual edge-case verification.',
              evidence: 'No evidence of tracing through the algorithm manually.',
              hole_to_poke: 'What happens with duplicate values in the input?',
              how_to_improve: 'After writing code, trace through 2 examples by hand before running tests.',
            },
            interview_communication: {
              score: 4,
              verdict: 'Good verbal walk-through of your approach.',
              evidence: 'You explained the hash map approach clearly in the chat.',
              hole_to_poke: 'Did you explain the time/space complexity?',
              how_to_improve: 'Always close with complexity analysis: O(n) time, O(n) space.',
            },
          },
          top_strength: 'Excellent edge case awareness.',
          top_improvement: 'Verify AI output line-by-line.',
          what_a_5_would_look_like:
            'A 5-level candidate would have verified the AI output line-by-line, traced through edge cases manually, and explained the complexity tradeoff before submitting.',
        },
      },
    })
  })
}

// ---------------------------------------------------------------------------
// loginAs
//
// Logs in as a test user by navigating to /login and submitting the form.
// ---------------------------------------------------------------------------

export async function loginAs(page: Page, user: TestUser) {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002'

  await page.goto(`${BASE_URL}/login`)
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  // Wait for redirect away from /login
  await page.waitForURL(/\/(dashboard|onboarding|explore|challenges)/, { timeout: 20000 })
}

// ---------------------------------------------------------------------------
// fetchSessionLog
//
// Returns the chat messages and session events for the current test user's
// most recent challenge attempt. Calls the app's REST API directly using
// page.evaluate so cookies are forwarded.
// ---------------------------------------------------------------------------

export interface SessionLog {
  aiExchanges: Array<{ role: string; content: string }>
  events: Array<{ event_type: string; payload: Record<string, unknown> }>
}

export async function fetchSessionLog(page: Page): Promise<SessionLog> {
  // The session log lives in challenge_attempts.conversation_summary (events)
  // and the chat messages are stored in CanvasChatPanel state only
  // (not persisted server-side in the current implementation).
  // For testing purposes we return what's observable in the DOM.
  const aiExchanges = await page.evaluate(() => {
    const userMessages = Array.from(
      document.querySelectorAll('[data-testid="hatch-message-user"]')
    ).map((el) => ({ role: 'user', content: el.textContent ?? '' }))
    const assistantMessages = Array.from(
      document.querySelectorAll('[data-testid="hatch-message-assistant"]')
    ).map((el) => ({ role: 'assistant', content: el.textContent ?? '' }))
    // Interleave: user, assistant, user, assistant...
    const merged: Array<{ role: string; content: string }> = []
    const maxLen = Math.max(userMessages.length, assistantMessages.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < userMessages.length) merged.push(userMessages[i])
      if (i < assistantMessages.length) merged.push(assistantMessages[i])
    }
    return merged
  })

  const events = await fetchSessionEvents(page)

  return { aiExchanges, events }
}

// ---------------------------------------------------------------------------
// fetchSessionEvents
//
// Returns just the session events (paste events, run events) stored on the
// current attempt's conversation_summary via the API.
// ---------------------------------------------------------------------------

export interface SessionEvent {
  event_type: string
  payload: Record<string, unknown>
}

export async function fetchSessionEvents(page: Page): Promise<SessionEvent[]> {
  // Events are stored client-side in the FlowWorkspace sessionEvents ref.
  // We expose them via a global in FlowWorkspace for testing.
  const events = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__codingSessionEvents ?? []
  })
  return events as SessionEvent[]
}

// ---------------------------------------------------------------------------
// cleanupTestChallenge / cleanupTestUser
//
// Call these in afterEach/afterAll to remove test data.
// (Optional — tests create unique IDs so orphans are safe.)
// ---------------------------------------------------------------------------

export async function cleanupTestChallenge(challengeId: string) {
  const admin = getAdminClient()
  await admin.from('challenges').delete().eq('id', challengeId)
}

export async function cleanupTestUser(userId: string) {
  const admin = getAdminClient()
  await admin.auth.admin.deleteUser(userId)
}
