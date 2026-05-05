/* eslint-disable no-console */
/**
 * Layer 2 — Claude-judged tests for Canvas Coach v2.
 *
 * Run with: npx tsx scripts/test-canvas-judge.ts
 *
 * Prerequisites:
 *   - Dev server running on http://localhost:3000 (or set BASE_URL)
 *   - ANTHROPIC_API_KEY in env (for the judge model)
 *   - SUPABASE_TEST_USER_COOKIE in env (sb-access-token cookie value)
 *     OR run with --no-auth to skip server calls and judge fixture responses
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... SUPABASE_TEST_USER_COOKIE=... npx tsx scripts/test-canvas-judge.ts
 *   npx tsx scripts/test-canvas-judge.ts --no-auth   # judge bundled fixtures only
 *
 * Exit code: 0 if all cases pass, 1 otherwise.
 */

import Anthropic from '@anthropic-ai/sdk'
import { summarizeScene } from '../src/lib/hatch/canvas-scene'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually so we don't add a dependency
try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* no .env.local — fine */ }

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const SKIP_LIVE = process.argv.includes('--no-auth')

const judge = new Anthropic()

/**
 * Mint a Supabase session for an existing test user, then format it as the
 * cookies that @supabase/ssr expects (base64url-encoded JSON session,
 * possibly chunked).
 *
 * Looks for TEST_USER_EMAIL / TEST_USER_PASSWORD in env. If absent, returns
 * empty string and the script will run in 401 mode.
 */
function stringToBase64URL(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function mintTestCookie(): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD
  if (!url || !anon || !email || !password) return ''
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    console.error(`Auth failed: ${res.status} ${await res.text()}`)
    return ''
  }
  const session = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
    expires_at: number
    token_type: string
    user: Record<string, unknown>
  }
  // The SSR storage adapter calls JSON.stringify(session) and then prefixes
  // with "base64-" + base64url(jsonString). The full session object is what
  // gets serialized (not an array).
  const projectRef = url.replace('https://', '').split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`
  const sessionJson = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: session.user,
  })
  const encoded = `base64-${stringToBase64URL(sessionJson)}`
  // Chunk if > 3180 bytes (Supabase SSR uses 3180-byte chunks)
  const CHUNK_SIZE = 3180
  if (encoded.length <= CHUNK_SIZE) {
    return `${cookieName}=${encoded}`
  }
  const chunks: string[] = []
  for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
    chunks.push(`${cookieName}.${chunks.length}=${encoded.slice(i, i + CHUNK_SIZE)}`)
  }
  return chunks.join('; ')
}

let COOKIE = process.env.SUPABASE_TEST_USER_COOKIE ?? ''

interface TestCase {
  id: string
  description: string
  setup: { elements: unknown[] }
  userMessage?: string
  endpoint: 'interpret' | 'nudge'
  recentDelta?: { added: number }
  challengeType?: string
  judgeRubric: string
}

/**
 * Build a rectangle + bound text element pair so summarizeScene parses
 * columns out of the body text (schema-as-text convention).
 */
function makeTable(
  rectId: string,
  textId: string,
  body: string,
  x: number,
  y: number,
  w = 180,
  h = 110
): unknown[] {
  return [
    {
      id: rectId,
      type: 'rectangle',
      x,
      y,
      width: w,
      height: h,
      boundElements: [{ id: textId, type: 'text' }],
      isDeleted: false,
    },
    {
      id: textId,
      type: 'text',
      containerId: rectId,
      text: body,
      x,
      y,
    },
  ]
}

const CASES: TestCase[] = [
  {
    id: 'Q1',
    description: 'Build with connection',
    setup: { elements: [] },
    userMessage: 'add a users table and a posts table connected to it',
    endpoint: 'interpret',
    judgeRubric:
      'Two shapes (users + posts) appear in actions, AND there is a connect action between them, AND the message mentions both by name. Pass if all three are true.',
  },
  {
    id: 'Q2',
    description: 'Open-ended design request',
    setup: { elements: [] },
    userMessage: 'design a URL shortener',
    endpoint: 'interpret',
    judgeRubric:
      'Hatch either asks a clarifying question OR proposes a structured starting set (3+ create actions). A generic "great idea, lets start" with no actions and no clarifying question fails.',
  },
  {
    id: 'Q3',
    description: 'Identifies cache-on-write-path issue',
    setup: {
      elements: [
        { id: '1', type: 'rectangle', label: { text: 'API' }, x: 0, y: 0, width: 100, height: 50 },
        { id: '2', type: 'rectangle', label: { text: 'Cache' }, x: 200, y: 0, width: 100, height: 50 },
        { id: '3', type: 'rectangle', label: { text: 'DB' }, x: 400, y: 0, width: 100, height: 50 },
        {
          id: 'a1', type: 'arrow', x: 100, y: 25, points: [[0, 0], [100, 0]],
          startBinding: { elementId: '1' }, endBinding: { elementId: '2' },
        },
        {
          id: 'a2', type: 'arrow', x: 300, y: 25, points: [[0, 0], [100, 0]],
          startBinding: { elementId: '2' }, endBinding: { elementId: '3' },
        },
      ],
    },
    userMessage: 'any concerns?',
    endpoint: 'interpret',
    judgeRubric:
      'Hatch identifies the cache-between-API-and-DB consistency/staleness issue specifically. References at least one element by label (API, Cache, DB). A generic "consider consistency" without naming the cache placement fails.',
  },
  {
    id: 'Q4',
    description: 'Proactive nudge fires on a non-trivial scene',
    setup: {
      elements: [
        { id: '1', type: 'rectangle', label: { text: 'Web' }, x: 0, y: 0, width: 100, height: 50 },
        { id: '2', type: 'rectangle', label: { text: 'API' }, x: 200, y: 0, width: 100, height: 50 },
        { id: '3', type: 'rectangle', label: { text: 'Postgres' }, x: 400, y: 0, width: 100, height: 50 },
      ],
    },
    endpoint: 'nudge',
    recentDelta: { added: 3 },
    judgeRubric:
      'Hatch returns either a single sentence under 25 words referencing an element by label, OR null. If non-null, the nudge must point at something specific (missing component, suspicious topology). Vague "looks good so far" fails. Null is acceptable if scene is too sparse.',
  },
  // ── Data modeling cases ──────────────────────────────────────────────────
  {
    id: 'Q-DM-1',
    description: 'Build with columns — create users table with specified columns',
    setup: { elements: [] },
    userMessage: 'add a users table with id, email, tenant_id',
    endpoint: 'interpret',
    challengeType: 'data_modeling',
    judgeRubric:
      "The response includes a `create` action whose first element has a `columns` array containing all three column names: 'id', 'email', 'tenant_id'. The columns may include constraint tokens like PK, UNIQUE, FK→. The message acknowledges the table by name. Pass if the columns array exists with all three column names present (case-insensitive substring match).",
  },
  {
    id: 'Q-DM-2',
    description: 'FK via rename — add foreign key from posts to users using rename action',
    setup: {
      elements: [
        ...makeTable('rect-posts', 'text-posts', 'posts\n──\nid PK\nbody', 0, 0),
        ...makeTable('rect-users', 'text-users', 'users\n──\nid PK\nname', 300, 0),
      ],
    },
    userMessage: 'add the foreign key from posts to users',
    endpoint: 'interpret',
    challengeType: 'data_modeling',
    judgeRubric:
      "The response includes a `rename` action targeting `posts` (fromLabel: 'posts'). The toLabel_rename contains a foreign-key column with text matching `user_id FK→users.id` or similar (FK pointing from a posts.user_id-like column to users.id). The action MUST be 'rename' (editing the existing entity), NOT 'create' (which would duplicate the entity). Pass if action.action === 'rename' AND toLabel_rename contains both 'FK' and a reference to users.",
  },
  {
    id: 'Q-DM-3',
    description: 'Identifies normalization issue by column name',
    setup: {
      elements: [
        ...makeTable(
          'rect-orders',
          'text-orders',
          'orders\n──\nid PK\ncustomer_name\ncustomer_email\nitem',
          0,
          0,
          220,
          130
        ),
      ],
    },
    userMessage: "what's wrong with my schema?",
    endpoint: 'interpret',
    challengeType: 'data_modeling',
    judgeRubric:
      "Hatch's response identifies the denormalization or 'duplication' or 'should be normalized' or 'extract customer to its own table' issue. Must reference at least one column by name (e.g. customer_name, customer_email) — generic 'consider normalization' without naming the columns fails. Should suggest extracting customer fields into a separate Customer or Users table. Pass if the message names a column AND identifies the normalization concern.",
  },
  {
    id: 'Q-DM-4',
    description: 'Chat articulation as relationship signal — builds FK on canvas',
    setup: {
      elements: [
        ...makeTable('rect-posts2', 'text-posts2', 'posts\n──\nid PK\nbody', 0, 0),
        ...makeTable('rect-users2', 'text-users2', 'users\n──\nid PK\nname', 300, 0),
      ],
    },
    userMessage: 'posts belongs to users',
    endpoint: 'interpret',
    challengeType: 'data_modeling',
    judgeRubric:
      "Hatch should respond by building the relationship on canvas (since the user articulated it in chat). Per the schema-as-text convention, expect EITHER a rename action editing posts to add a user_id FK column, OR a connect action with cardinality label like 'N:1', OR (ideally) BOTH. The intent should be 'build' or 'build_and_coach' (NOT pure 'coach'). Pass if intent includes 'build' AND there's at least one rename or connect action targeting the right entities.",
  },
  {
    id: 'Q-DM-5',
    description: 'Coach references columns by exact entity.column_name notation',
    setup: {
      elements: [
        ...makeTable(
          'rect-users3',
          'text-users3',
          'users\n──\nid PK\nemail UNIQUE\nname',
          0,
          0
        ),
        ...makeTable(
          'rect-posts3',
          'text-posts3',
          'posts\n──\nid PK\ntitle\nbody\nuser_id FK→users.id',
          250,
          0
        ),
        ...makeTable(
          'rect-comments',
          'text-comments',
          'comments\n──\nid PK\nbody\npost_id FK→posts.id\nuser_id FK→users.id',
          500,
          0
        ),
      ],
    },
    userMessage: 'any concerns or improvements?',
    endpoint: 'interpret',
    challengeType: 'data_modeling',
    judgeRubric:
      "Hatch's response uses entity.column_name notation (e.g. 'users.email', 'posts.user_id', 'comments.post_id') — at least one such column reference must appear in the message. Generic 'the email field' or 'your foreign keys look good' without naming columns fails. The response should be substantive, not a one-line 'looks good'. Pass if at least one entity.column_name reference appears.",
  },
  // ── End data modeling cases ───────────────────────────────────────────────
  {
    id: 'Q6',
    description: 'Coach mode: provides specific feedback on reasonable design',
    setup: {
      elements: [
        { id: '1', type: 'rectangle', label: { text: 'CDN' }, x: 0, y: 0, width: 100, height: 50 },
        { id: '2', type: 'rectangle', label: { text: 'API Gateway' }, x: 200, y: 0, width: 100, height: 50 },
        { id: '3', type: 'rectangle', label: { text: 'Service' }, x: 400, y: 0, width: 100, height: 50 },
        { id: '4', type: 'rectangle', label: { text: 'Postgres' }, x: 600, y: 0, width: 100, height: 50 },
        { id: '5', type: 'rectangle', label: { text: 'Redis' }, x: 600, y: 200, width: 100, height: 50 },
      ],
    },
    userMessage: 'is my design missing anything?',
    endpoint: 'interpret',
    judgeRubric:
      'Hatch names a specific gap (e.g. auth, monitoring, rate limiting, replication) AND references at least one element on the canvas by exact label. Generic praise without specifics fails.',
  },
]

interface InterpretResponse {
  intent: string
  message: string
  actions: unknown[]
  annotations?: unknown[]
}

interface NudgeResponse {
  nudge: string | null
  reason?: string
}

type ApiResponse = InterpretResponse | NudgeResponse

async function callEndpoint(c: TestCase): Promise<ApiResponse> {
  if (SKIP_LIVE) {
    // Stub: return a believable fake so the judging pipeline is exercised.
    if (c.endpoint === 'interpret') {
      return {
        intent: 'coach',
        message: '[NO-AUTH MODE] Skipping live call — judge will fail this case.',
        actions: [],
      }
    }
    return { nudge: null, reason: 'no_auth_mode' }
  }

  const url = `${BASE_URL}/api/hatch/canvas/${c.endpoint}`
  const body =
    c.endpoint === 'interpret'
      ? {
          message: c.userMessage,
          scene: summarizeScene(c.setup.elements),
          challengeId: 'judge-test',
          challengeType: c.challengeType ?? 'system_design',
          attemptId: `judge-${c.id}`,
          history: [],
        }
      : {
          scene: summarizeScene(c.setup.elements),
          recentDelta: c.recentDelta,
          challengeId: 'judge-test',
          challengeType: c.challengeType ?? 'system_design',
          attemptId: `judge-${c.id}`,
        }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(COOKIE ? { Cookie: COOKIE } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`${url} → ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

const JUDGE_SYSTEM = `You are a strict QA judge for an AI coaching product. Given a user scenario, the AI's response, and a rubric, decide PASS or FAIL.

Output ONLY JSON: { "pass": boolean, "reasoning": "1-2 sentences explaining the verdict", "severity": "critical" | "minor" }
- severity is required only on FAIL.
- Be strict: "generic praise" and "vague concerns" should fail rubrics that ask for specificity.
- A response that meets the literal rubric but is generic prose still passes if the rubric only asks for structural properties.`

interface JudgeVerdict {
  pass: boolean
  reasoning: string
  severity?: 'critical' | 'minor'
}

async function judgeCase(c: TestCase, response: ApiResponse): Promise<JudgeVerdict> {
  const sceneSummary = JSON.stringify(summarizeScene(c.setup.elements), null, 2)
  const userInput =
    c.endpoint === 'interpret'
      ? `User typed: "${c.userMessage}"`
      : `User just added ${c.recentDelta?.added ?? 0} elements to the canvas (proactive nudge trigger).`

  const judgeUser = `# Test case: ${c.id} — ${c.description}

## Canvas scene (structured)
\`\`\`json
${sceneSummary}
\`\`\`

## User input
${userInput}

## Hatch's response
\`\`\`json
${JSON.stringify(response, null, 2)}
\`\`\`

## Rubric
${c.judgeRubric}

Verdict?`

  const result = await judge.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: judgeUser }],
  })
  const block = result.content[0]
  if (block.type !== 'text') throw new Error('Judge returned non-text')
  const cleaned = block.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  // Extract first JSON object — judge sometimes adds trailing prose despite instructions
  const match = cleaned.match(/\{[\s\S]*?\}\s*$/m) ?? cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Judge returned no JSON: ${cleaned.slice(0, 200)}`)
  return JSON.parse(match[0]) as JudgeVerdict
}

async function main() {
  console.log(`Canvas Coach v2 — Layer 2 AI-judged tests`)
  if (!SKIP_LIVE && !COOKIE) {
    COOKIE = await mintTestCookie()
    if (COOKIE) console.log(`Auth: minted session for ${process.env.TEST_USER_EMAIL}`)
    else console.log(`Auth: no test user configured (TEST_USER_EMAIL/TEST_USER_PASSWORD)`)
  }
  console.log(`Mode: ${SKIP_LIVE ? 'NO-AUTH (fixtures only)' : `live against ${BASE_URL}`}`)
  console.log(`Cases: ${CASES.length}\n`)

  const results: Array<{ id: string; verdict: JudgeVerdict; raw: ApiResponse }> = []
  let failures = 0

  for (const c of CASES) {
    process.stdout.write(`${c.id} (${c.description}): `)
    try {
      const response = await callEndpoint(c)
      const verdict = await judgeCase(c, response)
      results.push({ id: c.id, verdict, raw: response })
      if (verdict.pass) {
        console.log(`PASS — ${verdict.reasoning}`)
      } else {
        failures += 1
        console.log(`FAIL [${verdict.severity ?? 'unknown'}] — ${verdict.reasoning}`)
      }
    } catch (err) {
      failures += 1
      console.log(`ERROR — ${(err as Error).message}`)
    }
  }

  console.log(`\n${failures === 0 ? 'ALL CASES PASS' : `${failures} of ${CASES.length} FAILED`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
