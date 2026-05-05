# HackProduct — Coding Interview Workspace
## Focused Implementation Spec (Phase 2)

This document is a self-contained, focused spec for the coding interview 
workspace. It assumes the broader interview platform spec 
(`hackproduct-interview-workspace-spec-v3.md`) is the source of truth for 
foundational concepts (FlowWorkspace, grading skill, naming conventions, 
session lifecycle, autosave, analytics). This document specifies only 
what's coding-specific and provides E2E test coverage.

---

## ⚠️ Naming Convention Reminder

Names like `FlowWorkspace`, `Hatch`, `challenges`, and API paths in this 
document are **placeholders**. The agent resolves every placeholder to its 
actual codebase name during the audit (Step 0 of the foundational spec). 
All implementation uses the actual names from the audit's 
"Placeholder → Actual Name Map."

---

## ⚠️ EXTEND, DO NOT CREATE — Mandatory Reading

This spec describes adding a new capability to an **existing platform**. 
HackProduct already has a working backend, frontend, database schema, 
auth, AI chat, challenge catalog, and submission history. Coding 
challenges are a new `challenge_type`, not a new product.

### Before Writing Any Code, The Agent Must:

1. **Audit the existing codebase** (per the foundational spec's Step 0)
2. **Document every existing piece** that relates to:
   - The challenges table and its current columns
   - The submissions/attempts table and its current columns
   - The Hatch AI chat component and its current props
   - The Hatch AI API route and its current request shape
   - The grading flow used for product_sense challenges today
   - The Explore page sections and Learn page filters
   - The session/autosave mechanism
   - Test user creation helpers and E2E test conventions
3. **Produce the Placeholder → Actual Name Map** before any implementation

### The Extension Principle, By Concern

For every concern in this spec, the rule is the same: **find what exists, 
extend it. Do not create parallel structures.**

**Database — extend, don't create:**
- The `challenges` table already exists for product_sense — add 
  `challenge_type` column and metadata fields, do NOT create 
  `coding_challenges`
- The submissions/attempts table already exists — add 
  `final_code`, `final_language`, `test_results`, `grading_feedback` 
  columns, do NOT create `coding_submissions`
- The Hatch chat persistence table already exists — log coding-mode 
  exchanges to the same table, do NOT create `coding_ai_messages`

**API routes — extend, don't create:**
- The Hatch chat API route already exists — extend it to accept 
  `challenge_type` (or infer from session), do NOT create 
  `/api/coding/hatch`
- The submission/grade endpoint pattern already exists for 
  product_sense — extend the existing pattern, do NOT create a parallel 
  `/api/coding/submit`
- New routes are justified ONLY for: `/api/code/run` (Judge0 proxy is 
  genuinely new) and `/api/interview/grade` (only if no existing 
  grading endpoint can be extended — verify in audit first)

**Components — extend, don't create:**
- FlowWorkspace already renders product_sense — branch its right panel 
  on `challenge_type`, do NOT create `CodingWorkspace.tsx`
- The Hatch chat component already exists — pass a `systemPrompt` prop 
  for coding mode, do NOT create `CodingHatch.tsx`
- The challenge card component already exists — extend with 
  challenge_type badge + best-score field, do NOT fork
- The submission history list already exists — extend rendering for 
  coding submissions, do NOT create a parallel history page
- The inline feedback renderer already exists for product_sense — 
  extend to render the rubric schema for coding, do NOT create 
  `CodingFeedback.tsx`

**Genuinely new files (the only ones the agent creates):**
- Monaco editor wrapper component
- sql.js Web Worker
- `useCodeRunner` hook
- Output panel component (test pass/fail + SQL table renderer)
- `interview-coding` grading skill prompts (per project's skill 
  convention)
- Any of the above only after confirming nothing similar exists today

### Self-Check Before Creating Any New File

Before creating any new file, the agent answers four questions:

1. Does the audit document show an existing piece serving this purpose?
2. If yes, can it be extended via a prop, parameter, branch, or column?
3. If no existing piece serves, is this purpose distinct enough to 
   justify net-new code (not just a different style or different name 
   for the same thing)?
4. Will this new file's name match the project's existing naming 
   conventions exactly?

If any answer is unclear, pause and re-read the audit before proceeding.

### What Goes Wrong Without This Discipline

Two failure modes the agent must avoid:

- **Schema fork:** Creating `coding_challenges` and `coding_submissions` 
  tables in parallel to existing tables. This breaks every existing 
  query, every aggregate report, every admin tool that assumes one 
  challenges table. Fix: extend with `challenge_type` column.

- **Component fork:** Creating `CodingWorkspace`, `CodingFeedback`, 
  `CodingChat` parallel to existing FlowWorkspace and feedback 
  renderers. This means UI changes have to happen in two places forever. 
  Fix: branch on `challenge_type` inside the existing components.

The audit phase exists specifically to prevent these forks. It is not 
optional.

---

## 1. Scope and Thesis

### 1.1 What This Workspace Is

A coding interview challenge surface where users:

1. Read a problem statement
2. Write code in a Monaco editor
3. Run it against test cases via Judge0 (or sql.js for SQL)
4. Chat with an AI co-pilot (Hatch AI) while solving
5. Submit
6. Receive **two distinct outputs side-by-side**:
   - Standard correctness results — which test cases passed/failed
   - A grading card from HackProduct's grading skill — *how* they approached the problem and how well they used AI

### 1.2 The Differentiator

Other platforms tell you whether your code is correct. HackProduct tells 
you whether you'd pass the interview — based on your problem-solving 
process and how thoughtfully you collaborated with AI.

Most major tech companies now allow AI-assisted coding interviews. The 
interview signal has shifted: it's not "can you write a binary search 
from memory" anymore — it's "can you collaborate with AI without becoming 
its puppet." Candidates who blindly paste problems into AI fail. 
Candidates who think first, scope carefully, then use AI surgically pass. 
HackProduct is the first prep tool built for this new reality.

---

## 2. Languages Supported

| Language | Execution path | Notes |
|---|---|---|
| Python | Judge0 API | Most common interview language |
| JavaScript | Judge0 API | Web/full-stack interviews |
| Java | Judge0 API | Enterprise/Android interviews |
| C++ | Judge0 API | Systems/competitive interviews |
| Go | Judge0 API | Backend/infrastructure interviews |
| **SQL** | **sql.js in browser** | **Different execution path — see Section 6** |

All languages share the same Monaco editor, same chat surface, same 
grading rubric, same output panel UI. Only the execution backend differs.

---

## 3. Architecture Overview

```
                           User opens challenge
                                    │
                                    ▼
                          FlowWorkspace renders
                          (challenge_type='coding')
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
       Left Panel              Right Panel           Chat Panel
       Problem               Monaco Editor          Hatch AI
       statement             + Output Panel         (collapsible)
       Visible test                │
       cases                       │
                                   │
                                   ▼
                            User clicks Run
                                   │
                                   ▼
                          useCodeRunner hook
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
         language='sql'?                      language ∈ {python, js,
                                                java, cpp, go}?
              │                                         │
              ▼                                         ▼
          sql.js Worker                         /api/code/run
          (browser)                             (proxies to Judge0)
              │                                         │
              └────────────────────┬────────────────────┘
                                   ▼
                      Unified Test Result Format
                                   │
                                   ▼
                      Output panel renders results
                                   │
                                   ▼
                          User clicks Submit
                                   │
                       Two parallel requests fire
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
       Final test run                         /api/interview/grade
       (visible + hidden)                     (HackProduct grading skill)
              │                                         │
              ▼                                         ▼
       Correctness payload                    Rubric feedback JSON
              │                                         │
              └────────────────────┬────────────────────┘
                                   ▼
                  FlowWorkspace switches to feedback mode
                                   │
                                   ▼
              Inline feedback view in right panel:
              ╔════════════════════════════════════╗
              ║  [Correctness]   [Grading Card]   ║
              ║   5 of 7 passed   Overall: 4/5     ║
              ║                                    ║
              ║   ✓ tc1 ...      Process: 4/5     ║
              ║   ✗ tc4 (hid)    AI Use: 5/5      ║
              ║                  Discussion: 3/5   ║
              ║                  ...               ║
              ╚════════════════════════════════════╝
                                   │
                                   ▼
                      Submission record persisted
                  (correctness + grading + session log)
                                   │
                                   ▼
                      User can view in History tab
```

---

## 4. Monaco Editor Integration

### 4.1 Setup

Install `@monaco-editor/react`. Render inside FlowWorkspace's right panel 
when `challenge.challenge_type === 'coding'`.

```tsx
// Pseudocode — actual component name and import paths from naming map
import Editor from '@monaco-editor/react'

<Editor
  height="60%"
  language={selectedLanguage}
  value={code}
  theme={isDarkMode ? 'vs-dark' : 'vs'}
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    tabSize: 2,
    automaticLayout: true,
    scrollBeyondLastLine: false,
  }}
  onMount={handleEditorMount}
  onChange={handleCodeChange}
/>
```

### 4.2 Instrumentation — The Critical Part

The grading skill grades on *behavior signals*, not just final code. Every 
relevant editor event must be captured.

```typescript
function handleEditorMount(editor, monaco) {
  // Paste detection — biggest signal of AI dependency
  editor.onDidPaste((e) => {
    const pastedText = editor.getModel().getValueInRange(e.range)
    logEvent('code_paste', {
      length: pastedText.length,
      percentOfBuffer: pastedText.length / editor.getValue().length,
      timestamp: Date.now(),
    })
  })

  // Cursor activity — sampled, not every event
  editor.onDidChangeCursorPosition(throttle((e) => {
    logEvent('cursor_active', { line: e.position.lineNumber })
  }, 5000))
}

// Code snapshots captured on every Run/Submit, not on every keystroke
```

Events flow into the autosave/event endpoint specified in the foundational 
spec. The grading skill reads them as part of its session log context.

### 4.3 Language Selector

Dropdown above the editor. On change:
1. Save current buffer to a per-language draft (allows switching back without losing work)
2. Load language-specific starter code from `challenge.metadata.starter_code[newLanguage]`
3. Update Monaco's language mode
4. Log `language_change` event

### 4.4 Layout Inside Right Panel

```
┌─────────────────────────────────────────────┐
│  [Language ▾]   [Run]   [Submit]            │  ← toolbar (40px)
├─────────────────────────────────────────────┤
│                                             │
│            Monaco Editor                    │  ← 60% of remaining
│            (instrumented)                   │
│                                             │
├─────────────────────────────────────────────┤
│  Output Panel                               │  ← 40% of remaining
│  ✓ tc1: Basic case                          │
│  ✗ tc2: Empty input                         │
│      Expected: []                           │
│      Got:      null                         │
│  🐛 tc3: TypeError on line 4                │
└─────────────────────────────────────────────┘
```

---

## 5. Code Execution — Judge0 (Non-SQL Languages)

### 5.1 Backend Route

```
POST /api/code/run
  body: { 
    sessionId: string,
    code: string,
    language: 'python' | 'javascript' | 'java' | 'cpp' | 'go',
    testCaseIds?: string[]   // optional — if omitted, runs visible only
  }
  
  → fetch challenge.metadata.test_cases for testCaseIds (or visible set)
  → for each test case, build harness wrapper:
      - Wrap user code in language-appropriate harness that:
        1. Reads stdin as JSON
        2. Calls solution(...) with parsed args
        3. Prints json.dumps/JSON.stringify of result
  → POST to Judge0 RapidAPI /submissions for each
  → poll for results
  → unify into standard test result format
  → log code_run event with results
  → return { runId, results }
```

### 5.2 Test Case Harness — Per Language

The harness model lets challenges be authored once with `args` + `expected` 
fields. Server-side wraps user code with language-appropriate I/O glue.

**Python harness:**
```python
import sys, json
{user_code}
_args = json.loads(sys.stdin.read())
_result = solution(*_args)
print(json.dumps(_result))
```

**JavaScript harness:**
```javascript
{user_code}
const _args = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'))
const _result = solution(..._args)
console.log(JSON.stringify(_result))
```

**Java harness:** wraps user's `solution` method in a `Main` class with a 
`main` that reads stdin, parses JSON via a bundled library (e.g. Jackson 
single-file), invokes solution, prints result.

**C++ harness:** uses nlohmann/json (single-header) to parse stdin and 
serialize output.

**Go harness:** uses `encoding/json` to read stdin into args slice, calls 
solution, marshals result.

### 5.3 Test Case Format

Stored in `challenge.metadata.test_cases`:

```json
{
  "test_cases": [
    {
      "id": "tc1",
      "label": "Basic case",
      "args": [[2, 7, 11, 15], 9],
      "expected": [0, 1],
      "hidden": false
    },
    {
      "id": "tc_edge",
      "label": "Duplicate values",
      "args": [[3, 3], 6],
      "expected": [0, 1],
      "hidden": true
    }
  ],
  "starter_code": {
    "python": "def solution(nums, target):\n    pass",
    "javascript": "function solution(nums, target) {\n  \n}",
    "java": "class Solution {\n    public int[] solution(int[] nums, int target) {\n        return null;\n    }\n}",
    "cpp": "vector<int> solution(vector<int> nums, int target) {\n    return {};\n}",
    "go": "func solution(nums []int, target int) []int {\n    return nil\n}"
  },
  "reference_solution": {
    "python": "def solution(nums, target): ...",
    "javascript": "function solution(nums, target) { ... }"
  }
}
```

### 5.4 Unified Test Result Format

Every execution path (Judge0 or sql.js) returns this exact shape:

```typescript
type TestResult = {
  id: string
  label: string
  status: 'passed' | 'failed' | 'error' | 'timeout' | 'no_solution'
  hidden: boolean
  output?: string         // not exposed for hidden tests on failure
  expected?: string       // not exposed for hidden tests
  errorMessage?: string   // populated when status = 'error'
  durationMs?: number
}

type RunResult = {
  runId: string
  testsPassed: number
  testsTotal: number
  results: TestResult[]
}
```

### 5.5 Run vs Submit

| Action | Tests run | Hidden tests visible? |
|---|---|---|
| Run | Visible only | N/A |
| Submit | Visible + hidden | Labels yes, inputs/expected no |

For Submit, the response includes test labels for transparency but never 
exposes hidden test inputs or expected outputs (prevents reverse-engineering).

### 5.6 Cost Control

- Per-user daily execution cap: 100 runs (mirrors AI cap from foundational spec)
- Per-session max: 50 runs (catches stuck users before runaway cost)
- Judge0 RapidAPI tier monitored: alert at 80% of monthly budget

### 5.7 Judge0 RapidAPI Integration

**API host:** `judge0-ce.p.rapidapi.com`

**Authentication:** Two headers required on every request:

```
x-rapidapi-key:  ${process.env.JUDGE0_RAPIDAPI_KEY}
x-rapidapi-host: judge0-ce.p.rapidapi.com
```

#### ⚠️ API Key Hygiene — Mandatory

The Judge0 API key is a credential. Treat it accordingly:

- **Store only in environment variables** — `JUDGE0_RAPIDAPI_KEY` in 
  the production secrets manager, in a `.env.local` file for local dev 
  (gitignored)
- **Never commit to the repo** — not in any file, not in any test, not 
  in any comment, not in any documentation
- **Never reference in client-side code** — the key lives only on the 
  server. Client-side calls go through `/api/code/run`, which proxies 
  to Judge0 with the key attached server-side.
- **Rotate immediately** if the key ever appears in: source control 
  history, logs, screenshots, conversation transcripts (including AI 
  chat logs), bug reports, or screen recordings
- **Add an alert** on the RapidAPI dashboard for unusual usage spikes 
  (catches both legitimate growth and key leakage)

If the agent is ever given an API key in a conversation or message, 
the agent treats it as compromised, references it only via env var 
in code, and explicitly notes in the audit report that the key needs 
to be rotated before production deployment.

#### Endpoint Reference

```
GET  /about
  Health check, useful for connection sanity tests in CI

GET  /languages
  Returns full list of language IDs and versions
  Run once during setup to lock in language ID values

POST /submissions?base64_encoded=false&wait=false
  Submit code for execution
  body: { source_code, language_id, stdin, expected_output? }
  returns: { token: "abc-123-..." }

GET  /submissions/:token?base64_encoded=false
  Poll for result
  returns: { status: { id, description }, stdout, stderr, time, memory, ... }
  status.id values:
    1 = In Queue
    2 = Processing  
    3 = Accepted (ran successfully)
    4 = Wrong Answer (only if expected_output was set)
    5 = Time Limit Exceeded
    6 = Compilation Error
    7-12 = Runtime errors (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, other)
    13 = Internal Error
    14 = Exec Format Error
```

#### Language ID Mapping

Run `GET /languages` once to verify current IDs. Recent values:

| Language | ID | Notes |
|---|---|---|
| Python (3.8.1) | 71 | Default Python target |
| JavaScript (Node.js 12.14.0) | 63 | Default JS target |
| Java (OpenJDK 13.0.1) | 62 | Class wrapping required by harness |
| C++ (GCC 9.2.0) | 54 | nlohmann/json bundled in harness |
| Go (1.13.5) | 60 | encoding/json in harness |

Store in config:
```typescript
// lib/judge0/languageMap.ts
export const JUDGE0_LANGUAGE_IDS = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  go: 60,
}
```

#### Reference Implementation

```typescript
// lib/judge0/client.ts — server-side only
import { JUDGE0_LANGUAGE_IDS } from './languageMap'

const JUDGE0_HOST = 'judge0-ce.p.rapidapi.com'
const JUDGE0_KEY = process.env.JUDGE0_RAPIDAPI_KEY!

if (!JUDGE0_KEY) {
  throw new Error('JUDGE0_RAPIDAPI_KEY is not set')
}

async function judge0Fetch(path: string, init: RequestInit = {}) {
  return fetch(`https://${JUDGE0_HOST}${path}`, {
    ...init,
    headers: {
      'x-rapidapi-key': JUDGE0_KEY,
      'x-rapidapi-host': JUDGE0_HOST,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

export async function submitToJudge0(params: {
  sourceCode: string
  language: keyof typeof JUDGE0_LANGUAGE_IDS
  stdin: string
}): Promise<{ token: string }> {
  const res = await judge0Fetch('/submissions?base64_encoded=false&wait=false', {
    method: 'POST',
    body: JSON.stringify({
      source_code: params.sourceCode,
      language_id: JUDGE0_LANGUAGE_IDS[params.language],
      stdin: params.stdin,
    }),
  })
  
  if (!res.ok) {
    throw new Error(`Judge0 submit failed: ${res.status}`)
  }
  
  return res.json()
}

export async function pollJudge0Result(token: string) {
  // Judge0 is async — poll until status.id >= 3 (finished)
  const maxAttempts = 20
  const delayMs = 500
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, delayMs))
    
    const res = await judge0Fetch(`/submissions/${token}?base64_encoded=false`)
    if (!res.ok) continue
    
    const result = await res.json()
    if (result.status?.id >= 3) {
      return result
    }
  }
  
  throw new Error(`Judge0 polling timed out for token ${token}`)
}

export function mapJudge0Status(judge0StatusId: number): TestStatus {
  if (judge0StatusId === 3) return 'passed'  // tentative — actual pass/fail comes from output comparison
  if (judge0StatusId === 5) return 'timeout'
  if (judge0StatusId === 6) return 'error'  // compile error
  if (judge0StatusId >= 7 && judge0StatusId <= 12) return 'error'  // runtime errors
  if (judge0StatusId === 4) return 'failed'  // wrong answer
  return 'error'  // 13, 14, or unexpected
}
```

The actual `passed`/`failed` decision compares Judge0's `stdout` to the 
test case's `expected` (after JSON normalization), not Judge0's own 
status code. Judge0's status only tells us whether the program ran 
successfully — not whether the output was correct.

#### Connection Health Check

The audit phase includes verifying the API key works end-to-end:

```typescript
// scripts/verify-judge0.ts — run once during Phase 2 setup
import { judge0Fetch } from '../lib/judge0/client'

async function main() {
  const res = await judge0Fetch('/about')
  if (!res.ok) {
    console.error(`Judge0 health check failed: ${res.status}`)
    process.exit(1)
  }
  const body = await res.json()
  console.log('✓ Judge0 reachable:', body)
}

main()
```

Run this before writing any other Judge0 integration code. If it fails, 
the API key is missing, wrong, or the RapidAPI subscription is inactive 
— surface that immediately, not after building the rest of the proxy.

#### Cost Estimation

RapidAPI Judge0 CE pricing tiers (verify current pricing on RapidAPI 
dashboard before launch — these values change):

- Free tier: ~50 requests/day — fine for development and early testing
- Basic paid: ~$10/month for 1,000/day — fits early users, ~30-50 active users
- Pro: ~$40/month for 5,000/day — fits ~150-250 active daily users

Each user submission triggers up to N executions (one per test case). 
A challenge with 7 test cases = 7 Judge0 calls per submit + N per Run 
session (typically 3-5 visible test runs through a session). Plan 
capacity accordingly.

#### Self-Hosting Migration Path

If RapidAPI costs become a concern at scale, Judge0 can be self-hosted 
on a small VM via Docker Compose. The migration is a single 
environment variable change in `lib/judge0/client.ts` — swap the host 
URL and remove the RapidAPI key headers. The rest of the spec remains 
unchanged. **Do not self-host until usage demands it** — RapidAPI's 
pay-per-use model is the right starting point.

---

## 6. Code Execution — sql.js (SQL)

### 6.1 Why sql.js, Not Judge0

SQL benefits from instant execution (rapid iteration is the point) and 
structured row results (renders as a table, not stdout text). sql.js 
delivers both at zero infra cost. Judge0's SQL support exists but would 
require concatenating setup scripts and string-comparing stdout — both 
fragile and slower.

### 6.2 The Schema Propagation Problem

SQL challenges need a database with tables and seed data already 
populated when the user opens the workspace. The user writes a query 
against that database; nobody asks them to also write the schema and 
seed data themselves (that's not how SQL interviews work).

This means: the schema definition lives in the backend, but the actual 
SQLite database has to materialize in the browser at workspace mount. 
Here's how data flows from authoring to user execution:

```
┌─────────────────────────────────────────────────────────────┐
│  AUTHORING (during seed pipeline run)                       │
│                                                             │
│  Haiku agent generates a SQL challenge:                     │
│   • problem statement                                       │
│   • setup_script (CREATE TABLE + INSERT statements)         │
│   • test_cases (each with the expected query result rows)   │
│   • starter query                                           │
│                                                             │
│  Stored in: challenges.metadata.sql_schema                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PERSISTENCE (Postgres / existing DB)                       │
│                                                             │
│  challenges table extended with this metadata structure:    │
│  metadata: {                                                │
│    sql_schema: {                                            │
│      setup_script: "CREATE TABLE users ...; INSERT ...",    │
│      schema_diagram: { ... },        // for left panel UI   │
│      sample_data_preview: { ... }    // for left panel UI   │
│    },                                                       │
│    test_cases: [                                            │
│      { id, label, query_to_validate, expected_rows, ... }   │
│    ],                                                       │
│    starter_code: { sql: "-- Write your query here" }        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  TRANSPORT (challenge fetch on workspace mount)             │
│                                                             │
│  Existing /api/challenges/:id endpoint returns full         │
│  metadata. SQL setup_script is plain text, fits in the      │
│  same JSON response — no separate endpoint needed.          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  HYDRATION (browser, on workspace mount)                    │
│                                                             │
│  1. Workspace receives challenge.metadata.sql_schema        │
│  2. Spawns sql.js Web Worker, passes setup_script           │
│  3. Worker initializes SQL.Database()                       │
│  4. Worker runs setup_script — tables + data exist          │
│  5. Worker reports "ready" — workspace shows the schema     │
│     diagram in the left panel + enables the editor          │
│                                                             │
│  Cached: same setup_script on Try Again or refresh just     │
│  re-runs against a fresh in-memory DB. Tiny strings, fast.  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  EXECUTION (each Run/Submit)                                │
│                                                             │
│  Worker holds the hydrated DB in memory across runs.        │
│                                                             │
│  On each Run:                                               │
│   1. Worker resets DB to setup_script state (DROP TABLE +   │
│      re-run setup, OR re-create a fresh Database object).   │
│      Resetting matters because the user's query might have  │
│      side effects on UPDATE/DELETE challenges.              │
│   2. Worker runs user's query                               │
│   3. Worker compares result rows to test case expected_rows │
│   4. Worker posts back { status, actual, expected }         │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 SQL Schema in challenges.metadata — Full Shape

Stored as a single JSONB column extension on the existing challenges 
table. The agent verifies the existing metadata column structure during 
audit before adding fields to it.

```json
{
  "sql_schema": {
    "dialect": "sqlite",
    "setup_script": "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, state TEXT, created_at DATE); CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), total DECIMAL(10,2), placed_at DATE); INSERT INTO users VALUES (1,'Alice','CA','2024-01-15'),(2,'Bob','NY','2024-02-03'),(3,'Carol','CA','2024-03-21'); INSERT INTO orders VALUES (1,1,49.99,'2024-04-01'),(2,1,120.00,'2024-04-15'),(3,2,29.50,'2024-04-10'),(4,3,200.00,'2024-04-22');",
    "schema_diagram": {
      "tables": [
        {
          "name": "users",
          "columns": [
            { "name": "id", "type": "INTEGER", "constraints": ["PK"] },
            { "name": "name", "type": "TEXT", "constraints": ["NOT NULL"] },
            { "name": "state", "type": "TEXT" },
            { "name": "created_at", "type": "DATE" }
          ]
        },
        {
          "name": "orders",
          "columns": [
            { "name": "id", "type": "INTEGER", "constraints": ["PK"] },
            { "name": "user_id", "type": "INTEGER", "constraints": ["FK → users.id"] },
            { "name": "total", "type": "DECIMAL(10,2)" },
            { "name": "placed_at", "type": "DATE" }
          ]
        }
      ],
      "relationships": [
        { "from": "orders.user_id", "to": "users.id", "type": "many-to-one" }
      ]
    },
    "sample_data_preview": {
      "users": [
        { "id": 1, "name": "Alice", "state": "CA", "created_at": "2024-01-15" },
        { "id": 2, "name": "Bob", "state": "NY", "created_at": "2024-02-03" },
        "..."
      ],
      "orders": [
        { "id": 1, "user_id": 1, "total": 49.99, "placed_at": "2024-04-01" },
        "..."
      ]
    }
  },
  "test_cases": [
    {
      "id": "tc1",
      "label": "Find all CA users",
      "expected_rows": [
        { "id": 1, "name": "Alice", "state": "CA", "created_at": "2024-01-15" },
        { "id": 3, "name": "Carol", "state": "CA", "created_at": "2024-03-21" }
      ],
      "match_mode": "exact",
      "hidden": false
    },
    {
      "id": "tc2",
      "label": "Total revenue per user",
      "expected_rows": [
        { "name": "Alice", "total_revenue": 169.99 },
        { "name": "Carol", "total_revenue": 200.00 },
        { "name": "Bob", "total_revenue": 29.50 }
      ],
      "match_mode": "exact_unordered",
      "hidden": true
    }
  ],
  "starter_code": {
    "sql": "-- Find all users from California\nSELECT \n"
  }
}
```

Field meanings:

| Field | Purpose |
|---|---|
| `setup_script` | The actual SQL that runs in the browser to create tables + insert data. Single string, multiple statements separated by semicolons. |
| `schema_diagram` | Structured data for rendering the schema visually in the left panel (table boxes with columns) — same shape engineers see in real interviews |
| `sample_data_preview` | First few rows of each table, shown collapsed in the left panel so users can see what the data looks like |
| `expected_rows` | Each test case stores expected output as structured rows (not strings), enabling clean comparison |
| `match_mode` | `"exact"` means row order matters; `"exact_unordered"` means rows can be in any order; `"contains"` means user's query must include all expected rows but can have extras |

### 6.4 Why setup_script Is One String, Not Structured

Could the schema and seed data be stored as structured arrays (like 
`columns: [...]` and `rows: [...]`)? Yes. Should they be? No. Reasons:

- SQL has constraint syntax, type variants, indexes, views, CTEs — 
  encoding all that as structured JSON would reinvent SQL grammar
- Different SQLite dialect features (FOREIGN KEY ON DELETE CASCADE, 
  CHECK constraints, UNIQUE indexes) are easy in raw SQL, awkward in JSON
- The setup_script is generated once during seeding and read once during 
  hydration — there's no edit case that benefits from structure
- `schema_diagram` is the structured representation for *display 
  purposes only*. It's derived from the same source by the seed pipeline 
  (or hand-authored alongside) and used purely for rendering the schema 
  diagram in the UI. The actual runtime uses setup_script.

### 6.5 Browser Setup

```bash
npm install sql.js
```

Static asset: copy `sql-wasm.wasm` from `node_modules/sql.js/dist/` to 
`/public/sql.js/` (or per project static asset convention). Add a build 
step to keep this in sync if the npm package version updates.

### 6.6 SQL Worker — Full Implementation

```javascript
// public/workers/sql-worker.js

importScripts('/sql.js/sql-wasm.js')

let SQL = null
let baseSetupScript = null   // cached after first hydration

self.onmessage = async ({ data }) => {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: f => `/sql.js/${f}` })
  }
  
  if (data.action === 'hydrate') {
    // Called once per workspace mount with the challenge's setup_script
    baseSetupScript = data.setupScript
    try {
      const db = new SQL.Database()
      db.run(baseSetupScript)
      db.close()  // we don't keep this DB; we recreate per Run for isolation
      self.postMessage({ action: 'hydrate_ok', requestId: data.requestId })
    } catch (err) {
      self.postMessage({ 
        action: 'hydrate_error', 
        requestId: data.requestId,
        errorMessage: err.message 
      })
    }
    return
  }
  
  if (data.action === 'run') {
    // Run user query against fresh DB (rebuilt from setup_script each time)
    const { userQuery, testCases, requestId } = data
    const results = []
    
    for (const tc of testCases) {
      const db = new SQL.Database()
      
      try {
        db.run(baseSetupScript)
        
        const sqlResults = db.exec(userQuery)
        
        const actualRows = sqlResults[0]
          ? sqlResults[0].values.map(row =>
              Object.fromEntries(
                sqlResults[0].columns.map((col, i) => [col, row[i]])
              )
            )
          : []
        
        const passed = compareRows(actualRows, tc.expected_rows, tc.match_mode)
        
        results.push({
          id: tc.id,
          label: tc.label,
          status: passed ? 'passed' : 'failed',
          hidden: tc.hidden,
          // Actual rows only included for visible failed tests
          actual: (!tc.hidden && !passed) ? actualRows : undefined,
          expected: (!tc.hidden && !passed) ? tc.expected_rows : undefined,
        })
      } catch (err) {
        results.push({
          id: tc.id,
          label: tc.label,
          status: 'error',
          hidden: tc.hidden,
          errorMessage: err.message,
        })
      } finally {
        db.close()
      }
    }
    
    self.postMessage({ 
      action: 'run_complete',
      requestId,
      results,
      testsPassed: results.filter(r => r.status === 'passed').length,
      testsTotal: results.length,
    })
  }
}

function compareRows(actual, expected, matchMode) {
  if (matchMode === 'exact') {
    return JSON.stringify(actual) === JSON.stringify(expected)
  }
  if (matchMode === 'exact_unordered') {
    if (actual.length !== expected.length) return false
    const sortKey = obj => JSON.stringify(
      Object.keys(obj).sort().reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {})
    )
    const sortedActual = [...actual].map(sortKey).sort()
    const sortedExpected = [...expected].map(sortKey).sort()
    return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)
  }
  if (matchMode === 'contains') {
    const actualSet = new Set(actual.map(r => JSON.stringify(r)))
    return expected.every(e => actualSet.has(JSON.stringify(e)))
  }
  return false
}
```

### 6.7 Why Reset DB Between Runs

The worker creates a fresh `SQL.Database()` for each Run — not just 
DROP/CREATE on the same instance. Reasons:

- If the user writes `DELETE FROM users` in a SELECT challenge, you 
  don't want that to persist to the next test case
- UPDATE/DELETE/INSERT challenges (less common but valid) explicitly 
  need clean state per test case
- Memory cost is trivial — sample data is small (typically under 100 
  rows), creating a Database from a setup_script takes ~5-20ms

### 6.8 Workspace Mount — Hydration Sequence

```typescript
// Pseudocode for workspace mount when challenge_type='coding' && language='sql'

useEffect(() => {
  if (challenge.metadata.sql_schema) {
    const worker = new Worker('/workers/sql-worker.js')
    setSqlWorker(worker)
    
    const requestId = crypto.randomUUID()
    
    worker.postMessage({
      action: 'hydrate',
      setupScript: challenge.metadata.sql_schema.setup_script,
      requestId,
    })
    
    worker.onmessage = ({ data }) => {
      if (data.requestId !== requestId) return
      if (data.action === 'hydrate_ok') {
        setSqlReady(true)
      } else if (data.action === 'hydrate_error') {
        setSqlError(data.errorMessage)
      }
    }
    
    return () => worker.terminate()
  }
}, [challenge.id])
```

The Run button is disabled until `sqlReady` is true. Hydration typically 
completes in under 100ms — users won't notice unless they're spamming 
clicks immediately on workspace open.

### 6.9 Schema Diagram in the Left Panel

For SQL challenges, the left panel shows three things stacked:

1. Problem statement (markdown — same as other coding challenges)
2. **Schema diagram** — visual representation of tables and relationships, 
   rendered from `schema_diagram` JSON
3. **Sample data preview** — collapsible accordion showing first 5 rows 
   of each table, rendered from `sample_data_preview`

This matches the experience of a real SQL interview where the candidate 
is given a schema diagram and sample data upfront.

The schema diagram component is new to HackProduct (no existing 
component covers it) — implementation is straightforward styled HTML 
tables with connecting arrows for FKs. Roughly 100 lines.

### 6.10 SQL Output Rendering

Unlike text stdout, SQL results render as a **table** in the output panel:

```
✓ tc1: Find all CA users

  id │ name  │ state │ created_at
  ───┼───────┼───────┼────────────
   1 │ Alice │ CA    │ 2024-01-15
   3 │ Carol │ CA    │ 2024-03-21

(2 rows · 12ms)
```

For failed SQL tests, render expected and actual side-by-side as tables, 
with row-level diffs highlighted (rows in expected but not actual = 
green/missing; rows in actual but not expected = red/extra).

### 6.11 useCodeRunner Routing

```typescript
async function run(code, language, testCases) {
  if (language === 'sql') {
    return runViaSqlJs(code, testCases)   // browser worker path
  }
  return runViaJudge0(code, language, testCases)   // server proxy path
}
```

Same interface, same return shape — just different implementations behind.

---

## 7. Hatch AI Chat — Context-Aware In-Workspace Co-Pilot

### 7.1 Component Reuse

Hatch AI is HackProduct's existing chat component (placeholder name — 
audit reveals the real name). Reused verbatim with a coding-mode 
`systemPrompt` injected. **Do not create a parallel chat component for 
the coding workspace.**

### 7.2 Hatch Is Context-Aware

Hatch already has context-awareness as a core capability — it knows what 
the user is currently working on. For coding challenges, that context 
includes:

- The current challenge (problem statement, difficulty, time limit)
- The current code in the editor (live, not just on send)
- The current language selected
- Recent test run results (passed/failed, error messages)
- Time elapsed and time remaining
- For SQL: the schema and sample data the user is querying against

This is what makes Hatch genuinely useful as an in-challenge assistant 
rather than a generic ChatGPT clone. When the user asks "why isn't this 
working?" — Hatch already knows what "this" is.

### 7.3 Context Injection — How It Flows

Every message sent to Hatch from the coding workspace includes a context 
payload alongside the user's message text:

```typescript
// On user submit in chat panel
await sendHatchMessage({
  threadId: session.hatchThreadId,
  message: userText,
  context: {
    challenge_type: 'coding',
    challenge_title: challenge.title,
    challenge_difficulty: challenge.difficulty,
    current_language: selectedLanguage,
    current_code: monacoEditor.getValue(),     // live snapshot
    cursor_position: monacoEditor.getPosition(),
    last_run_result: lastRunResult || null,    // includes test pass/fail
    time_elapsed_seconds: timer.elapsed,
    time_remaining_seconds: timer.remaining,
    sql_schema_summary: language === 'sql' 
      ? challenge.metadata.sql_schema.schema_diagram 
      : null,
  }
})
```

The Hatch API route (existing — audit confirms) receives this context 
and injects it into the system prompt before calling Claude. The agent 
extends the existing route to accept an optional `context` field; 
existing usages without context are unaffected.

### 7.4 Coding-Mode System Prompt

```
You are Hatch AI, HackProduct's coding interview AI co-pilot.

The user is in a timed coding interview simulation. Your role is to be 
a Socratic thinking partner — guide, don't solve.

You are CONTEXT-AWARE. The user's current state is:
- Challenge: {{challenge_title}} ({{challenge_difficulty}})
- Language: {{current_language}}
- Time elapsed: {{time_elapsed}} of {{time_limit}}
- Current code:
```{{current_language}}
{{current_code}}
```
- Last run: {{last_run_summary}}
{{#if sql_schema_summary}}
- Schema:
{{sql_schema_summary}}
{{/if}}

When the user asks a question, refer to their actual code and recent 
test results. Don't speak in generalities. If the user asks "why isn't 
my code working", look at the code and the last run result.

Behavior rules:
- If user pastes the full problem statement and asks "solve this": 
  decline, ask "what's your initial read on the approach?"
- If user asks for the complete solution: give a directional hint, 
  not the answer.
- Freely explain: time/space complexity, data structure choices, 
  algorithm theory, language idioms, syntax.
- For debugging questions: look at their code, identify the issue, 
  ask a question that points them at it without revealing the fix.
  Example: "Look at line 4 — what happens if nums is empty?"
- Ask probing questions back: "What edge case would break this?"
- If user is stuck for 3+ exchanges, give a stronger hint — still not 
  the full solution.

Be warm, direct, and honest about misconceptions.
```

### 7.5 What Users Can Ask Hatch Mid-Challenge

Examples of context-aware interactions Hatch handles well:

| User asks | What Hatch does |
|---|---|
| "Why is my code returning null?" | Reads current code + last run result, identifies the issue, asks a leading question |
| "Is this O(n) or O(n²)?" | Analyzes their actual code, explains the complexity |
| "What edge cases am I missing?" | Reviews code + problem, lists 2-3 specific edge cases relevant to their approach |
| "Should I use a hash map here?" | Considers their current approach, discusses tradeoffs |
| "Explain how Python's `sorted()` works" | Pure language help, no penalty |
| "Just give me the solution" | Declines, redirects with a structured hint |
| "Walk me through how to start" | Offers a decomposition framework, doesn't write code |
| "What's wrong with my SQL JOIN?" | Reads the user's query + the schema, identifies the issue |

### 7.6 Chat Panel UX

- Collapsible from the right edge of the right panel
- Default state: open on first session, remembers user preference after
- Empty state shows 3 example prompts tailored to the challenge type:
  - General coding: "What approach should I take?", "What edge cases should I think about?", "Walk me through the time complexity"
  - SQL: "Can you explain the schema?", "What kind of JOIN do I need here?", "How do I aggregate by user?"
- Streaming responses, same behavior as existing Hatch elsewhere
- Each message timestamp visible — useful for users reviewing their own session later

### 7.7 Why This Is Critical for Grading

Every chat exchange is logged in the existing Hatch persistence table 
(extended with a `session_id` foreign key — audit confirms). The grading 
skill reads the full chat log and grades **how** the user used AI:

- Did they ideate before asking?
- Did they ask for the full solution upfront (penalized)?
- Did they verify what AI suggested?
- Did they ask probing follow-up questions?
- Did they engage with Hatch's Socratic prompts or ignore them?

The chat panel isn't a help feature — **it's the primary instrument the 
grading skill uses to evaluate AI collaboration.** Context-awareness 
makes the chat *useful* (so users actually engage with it); the logging 
makes that engagement *gradable*.

### 7.8 Hatch Persistence — Extension, Not Creation

The existing Hatch chat persistence stores message history per thread. 
Extension required:

- Each interview session creates a new Hatch thread (or reuses an 
  existing one keyed to the session — audit confirms current pattern)
- Thread is associated with the session via the existing 
  attempts/sessions table — add `hatch_thread_id` column if not already 
  present
- All coding-mode exchanges flow into the same Hatch table — no parallel 
  storage, no new "coding messages" table

---

## 8. Submit Flow — The Two-Track Output

### 8.1 What Happens On Submit

```
User clicks Submit
  ↓
Client disables Run/Submit buttons, shows "Submitting..." state
  ↓
Two parallel requests fire from the client:
  1. POST /api/code/run with all test case IDs (visible + hidden)
  2. POST /api/interview/grade with full session payload
  ↓
Both requests resolve (typically 5-15s combined)
  ↓
Client switches FlowWorkspace right panel to feedback mode
  ↓
Submission persisted with both correctness + grading
  ↓
User sees inline feedback view (Section 9)
```

### 8.2 The Grading API Route

```
POST /api/interview/grade
  body: {
    sessionId: string,
    challengeId: string,
    finalCode: string,
    language: string,
    correctnessPayload: RunResult   // from the parallel /api/code/run
  }
  
  → fetch full session log:
      - All chat exchanges with Hatch AI (timestamps, content)
      - All code_paste events (size, percent of buffer)
      - All code_run events (results, timestamps)
      - All language_change events
      - All cursor_active samples
  → fetch challenge.metadata.reference_solution
  → load 'interview-coding' skill (system prompt + output schema)
  → call Claude with grading prompt + structured JSON output
  → parse rubric response
  → write to submissions table (correctness + grading together)
  → return grading JSON to client
```

### 8.3 The Grading Rubric

Five dimensions, each scored 1-5, with cited evidence from the session log:

| Dimension | Weight | What it measures |
|---|---|---|
| **Problem Approach** | 25% | Did they decompose the problem before coding? Clarifying questions? Edge case thinking? |
| **AI Collaboration Quality** | 30% | The thesis dimension. Did they ideate first or paste-and-pray? Did they verify AI output? |
| **Code Quality** | 15% | Is the code idiomatic, readable, reasonably efficient? |
| **Verification Discipline** | 15% | Did they test, run multiple times, think about edge cases? |
| **Interview Communication** | 15% | Things they would have discussed with a real interviewer — assumptions, tradeoffs, alternatives |

The "Interview Communication" dimension is graded by inferring from the 
chat log: did the user articulate tradeoffs aloud (to Hatch), or just 
silently code?

### 8.4 Grading Skill Output Schema

```json
{
  "overall_score": 3.8,
  "headline": "Strong decomposition, but accepted AI output without verification.",
  "dimensions": {
    "problem_approach": {
      "score": 4,
      "verdict": "Asked good clarifying questions about edge cases before coding.",
      "evidence": "At t=02:14, you asked Hatch: 'What if the array has duplicates?' before writing any code.",
      "hole_to_poke": "You didn't think about the array-empty case until tc3 failed.",
      "how_to_improve": "Spend the first 2-3 minutes listing edge cases out loud (or to your AI partner) before coding."
    },
    "ai_collaboration": {
      "score": 3,
      "verdict": "Used Hatch reasonably for syntax, but accepted full code suggestions unchanged.",
      "evidence": "At t=08:42 you pasted a 12-line block from Hatch and ran immediately without inspection.",
      "hole_to_poke": "When you pasted Hatch's code, you didn't notice it used a sorted approach when O(n) was possible.",
      "how_to_improve": "After AI gives you code, read every line. Ask: 'What's the complexity? Is there a simpler approach?'"
    },
    "code_quality": { "score": 4, "verdict": "...", "evidence": "...", "hole_to_poke": "...", "how_to_improve": "..." },
    "verification_discipline": { "score": 3, "verdict": "...", "evidence": "...", "hole_to_poke": "...", "how_to_improve": "..." },
    "interview_communication": { "score": 4, "verdict": "...", "evidence": "...", "hole_to_poke": "...", "how_to_improve": "..." }
  },
  "top_strength": "Excellent edge case awareness during the framing phase.",
  "top_improvement": "Before pasting AI-generated code, read it line-by-line and verify it matches your intended approach.",
  "what_a_5_would_look_like": "A 5-level candidate would have noticed Hatch's sorted approach was suboptimal, asked Hatch about an O(n) hash-map alternative, and explained the tradeoff aloud before coding."
}
```

### 8.5 Why Grade In Parallel With Test Run

Latency optimization. The two operations are independent — grading reads 
session events that already exist; correctness re-runs tests. Firing them 
in parallel cuts user-facing wait time roughly in half. Both must complete 
before feedback view renders, but rendering can be progressive: show 
correctness as soon as it lands, show grading card as it lands, even if 
they arrive seconds apart.

---

## 9. Inline Feedback View

### 9.1 Layout

After submit, FlowWorkspace right panel switches to feedback mode. Two 
columns side-by-side:

```
┌────────────────────────────┬────────────────────────────┐
│  CORRECTNESS               │  GRADING CARD              │
│  ──────────                 │  ────────                  │
│  5 of 7 tests passed       │  Overall: 3.8 / 5          │
│                            │                            │
│  ✓ tc1: Basic case         │  Strong decomposition,     │
│  ✓ tc2: Sorted             │  but accepted AI output    │
│  ✗ tc3: Empty (failed)     │  without verification.     │
│      Expected: []          │                            │
│      Got:      null        │  ▼ Problem Approach   4/5  │
│  ✓ tc4: Negative           │    Verdict, evidence,      │
│  ✓ tc5 (hidden)            │    holes, how to improve   │
│  ✗ tc6 (hidden)            │                            │
│  ✓ tc7 (hidden)            │  ▼ AI Collaboration   3/5  │
│                            │    ...                     │
│                            │  ▼ Code Quality       4/5  │
│                            │  ▼ Verification       3/5  │
│                            │  ▼ Communication      4/5  │
│                            │                            │
│  [View code (read-only)]   │  Top strength: ...         │
│                            │  Top improvement: ...      │
│                            │  What a 5 would look like  │
│                            │                            │
│                            │  [Ask Hatch about this]    │
│                            │  [Try Again]               │
└────────────────────────────┴────────────────────────────┘
```

### 9.2 Behaviors

- Each grading dimension is collapsible (default collapsed; click to expand verdict + evidence + holes + improvement)
- Code panel becomes read-only Monaco showing final submission with the language toolbar still visible
- "Ask Hatch about this" expands the chat panel with a primer system prompt switching Hatch to **post-submit coach mode** (described in foundational spec Section 13.4)
- "Try Again" creates a new session for the same challenge, fresh timer, fresh workspace

### 9.3 Loading States

- Correctness column shows skeleton "Running tests..." for 1-3s
- Grading column shows skeleton "Analyzing your session..." for 5-15s
- Each column transitions to its result as it lands — no waiting for both

### 9.4 Error States

- Correctness fails → "Couldn't run tests. Retry?" with retry button. Grading still proceeds.
- Grading fails → "Couldn't generate feedback. Your attempt is saved — retry below." Correctness still shown.
- Both fail → user sees both error states; their attempt is preserved either way

---

## 10. Submission History

### 10.1 Schema

The submissions table (placeholder name — actual table from audit) gains 
columns to store the full picture:

```sql
ALTER TABLE {existing_submissions_table}
  ADD COLUMN IF NOT EXISTS final_code TEXT,
  ADD COLUMN IF NOT EXISTS final_language TEXT,
  ADD COLUMN IF NOT EXISTS test_results JSONB,
  ADD COLUMN IF NOT EXISTS grading_feedback JSONB;
```

`test_results` shape:
```json
{
  "tests_passed": 5,
  "tests_total": 7,
  "results": [
    { "id": "tc1", "status": "passed", "hidden": false },
    { "id": "tc3", "status": "failed", "hidden": false },
    { "id": "tc6", "status": "failed", "hidden": true }
  ]
}
```

`grading_feedback` shape: matches grading skill output schema (Section 8.4).

### 10.2 History UI

Reuses existing submission history pattern from product_sense challenges. 
Each row in the history list shows:

- Date + time
- Challenge title
- Language used
- Tests passed / total
- Overall grading score
- Click → opens read-only view of submission with both columns from Section 9.1

### 10.3 Best-Score Tracking

On the challenge card (in Explore and Learn pages), if the user has 
previous attempts at this challenge, show:

> "3 attempts · Best: 4.2/5"

Reuses the existing card pattern with extra fields populated from a 
submissions aggregate query.

---

## 11. Explore Page Integration

The coding workspace is only useful if users can find it. The Explore 
page already lists product_sense challenges and learning courses as 
sections. Coding interviews become a third section.

### 11.1 What Changes On The Explore Page

```
┌─────────────────────────────────────────────────────────────┐
│  EXPLORE                                                    │
├─────────────────────────────────────────────────────────────┤
│  Product Sense Challenges  [existing — untouched]           │
│  ──────────────────                                         │
│  [card] [card] [card] [card] →                              │
│                                                             │
│  Courses                   [existing — untouched]           │
│  ──────────────────                                         │
│  [card] [card] [card] [card] →                              │
│                                                             │
│  Coding Interviews         [NEW SECTION — Phase 2]          │
│  ──────────────────                                         │
│  [card] [card] [card] [card] →                              │
│                                                             │
│  + future sections (System Design, Data Modeling, etc.)     │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Implementation — Extension, Not Creation

**Extend** the Explore page composition. Reuse the existing section 
component and existing challenge card component. Section 11 of the 
foundational spec covers this pattern in detail; the focused spec just 
applies it to coding.

The new section component receives a query filter:
```typescript
<ChallengeSection 
  title="Coding Interviews" 
  filter={{ challenge_type: 'coding' }}
  emptyState="No coding challenges yet — check back soon."
/>
```

`ChallengeSection` (existing — audit confirms its real name) already 
knows how to query the challenges table, render cards, and handle empty 
states. Passing a `challenge_type` filter is the only new behavior.

### 11.3 Section Position

The "Coding Interviews" section appears **above** the existing Product 
Sense and Courses sections. Reasoning: coding interviews are the 
Phase 2 launch moment and are worth featuring; users already know about 
product sense from prior versions.

Once Phase 1 (system design, data modeling) ships, those will likely sit 
above coding (as more novel offerings). Order is configurable via the 
existing section composition pattern.

### 11.4 Card Treatment for Coding Challenges

The challenge card extends to show coding-specific fields when 
`challenge_type='coding'`:

```
┌──────────────────────────────────┐
│  [Coding] [Python] [Medium]      │  ← challenge_type + language + difficulty badges
│                                  │
│  Two Sum                         │
│  Find indices of two numbers     │
│  that sum to a target value      │
│                                  │
│  • 30 min                        │  ← time limit
│  • 7 test cases                  │
│  • 3 attempts · Best: 4.2/5      │  ← if user has attempted before
│                                  │
└──────────────────────────────────┘
```

For SQL challenges, the language badge says "SQL" instead of "Python". 
Cards link to `/challenge/:id` (the same workspace route — FlowWorkspace 
shape-shifts based on challenge_type).

### 11.5 Learn Page

Per the foundational spec's broader scope, the Learn page also gets a 
"Coding" category filter alongside Product Sense. This is a Phase 2 
deliverable — users browsing all coding challenges (filterable by 
language, difficulty) lands on the Learn page filtered to 
`challenge_type='coding'`.

The Learn page filter mechanism already exists for product_sense — 
extend it with the new category. Do not fork into a separate listing page.

### 11.6 E2E Coverage

```typescript
test('Explore page shows Coding Interviews section', async ({ page }) => {
  await seedCodingChallenge({ language: 'python', title: 'Two Sum' })
  await seedCodingChallenge({ language: 'sql', title: 'CA Users Query' })
  
  await page.goto('/explore')
  
  await expect(page.getByRole('heading', { name: 'Coding Interviews' })).toBeVisible()
  
  const codingSection = page.getByTestId('section-coding')
  await expect(codingSection.getByText('Two Sum')).toBeVisible()
  await expect(codingSection.getByText('CA Users Query')).toBeVisible()
  
  // Existing sections still rendered (extension, not replacement)
  await expect(page.getByRole('heading', { name: 'Product Sense Challenges' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible()
})
```

```typescript
test('clicking a coding card opens FlowWorkspace in coding mode', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python', title: 'Two Sum' })
  
  await page.goto('/explore')
  await page.getByRole('heading', { name: 'Two Sum' }).click()
  
  await expect(page).toHaveURL(`/challenge/${challenge.id}`)
  await expect(page.locator('.monaco-editor')).toBeVisible()
})
```

---

## 12. Seed Content — Real-World Inspired Challenges

### 12.1 Approach: Research, Don't Scrape

HackProduct launches with 6 seed coding challenges (4 algorithmic + 2 
SQL). These are generated by Claude Haiku agents that research common 
interview patterns on the web (real questions from LeetCode, HackerRank, 
StrataScratch, Glassdoor, etc.) and then produce **original** problem 
statements inspired by those patterns.

**Why not verbatim scraping:** Copying problem statements directly from 
LeetCode or HackerRank is a copyright issue. The classic problem 
*concepts* (two-pointer, sliding window, GROUP BY aggregation, JOIN 
patterns) are universal and fine to reuse. The specific wording is not.

**Why this is fine:** Real interviews ask versions of these classics 
constantly. A "Two Sum"-shaped problem with a different scenario, 
different variable names, and different constraints serves the same 
educational purpose without copying anyone's IP.

This pipeline is fully specified in the foundational spec (Section 10). 
This section ties that pipeline to Phase 2's specific output.

### 12.2 Seed Targets for Phase 2 Launch

**Algorithmic challenges (4 total):**

| Pattern | Difficulty | Languages | Inspired by |
|---|---|---|---|
| Hash map lookup | Easy | Python, JS | "Two Sum"-style |
| Two pointer | Easy | Python, JS | "Valid Palindrome"-style |
| Stack-based parsing | Medium | Python, JS, Java | "Valid Parentheses"-style |
| Sliding window | Medium | Python, JS | "Longest Substring"-style |

**SQL challenges (2 total):**

| Pattern | Difficulty | Inspired by |
|---|---|---|
| Aggregation + filter | Easy | "Top customers by revenue"-style (e-commerce schema) |
| Multi-table JOIN | Medium | "Reports across departments"-style (HR/employee schema) |

This gives users one easy + one medium per language they care about, 
and explicit SQL coverage out of the gate.

### 12.3 Seed Pipeline Configuration for Coding

The Haiku seed agent for `coding` challenges is configured in 
`scripts/seed-challenges.ts` (per foundational spec). Coding-specific 
prompt:

```
You are generating an original coding interview question for HackProduct.
Produce ONE high-quality coding challenge.

RESEARCH PHASE (use web_search):
Survey common coding interview patterns at difficulty: {difficulty}.
Look at real questions from LeetCode, HackerRank, StrataScratch, 
Glassdoor company-specific banks, Reddit r/cscareerquestions threads.
Pick a pattern category: hash_map, two_pointer, sliding_window, stack, 
binary_search, dp, graph, recursion, etc.
Already covered in this batch: {already_generated_patterns}.
Pick a pattern NOT yet covered.

GENERATION:
Write an ORIGINAL problem statement INSPIRED by patterns you researched, 
but do not copy wording from any source. The concept can be classic 
(e.g. two-pointer); the framing must be novel — different scenario, 
different variable names, different surface details.

Quality bar:
- Problem statement: 100-200 words, clear and unambiguous
- 1-2 worked examples embedded in the statement
- Solvable in under {time_limit} minutes by a competent candidate
- Reference solution in BOTH Python and JavaScript that actually works
- 3 visible test cases + 2 hidden test cases
- At least one edge case (empty, single element, bounds, duplicates)

OUTPUT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "title": "...",
  "challenge_type": "coding",
  "difficulty": "easy" | "medium" | "hard",
  "time_limit_seconds": 1800,
  "pattern": "hash_map",
  "problem_statement_markdown": "...",
  "metadata": {
    "test_cases": [
      { "id": "tc1", "label": "...", "args": [...], "expected": ..., "hidden": false },
      ... 5 total ...
    ],
    "starter_code": {
      "python": "def solution(...):\n    pass",
      "javascript": "function solution(...) {\n  \n}"
    },
    "reference_solution": {
      "python": "def solution(...):\n    ...",
      "javascript": "function solution(...) { ... }"
    },
    "reference_approach": "One paragraph: optimal approach + complexity analysis"
  }
}
```

### 12.4 Seed Pipeline Configuration for SQL

```
You are generating an original SQL interview question for HackProduct.
Produce ONE high-quality SQL challenge.

RESEARCH PHASE (use web_search):
Survey common SQL interview patterns at difficulty: {difficulty}.
Real questions come from StrataScratch, DataLemur, LeetCode SQL, 
Mode Analytics, company-specific banks (Meta, Amazon, Stripe).
Pattern categories: aggregation, JOIN (inner/left/self), GROUP BY, 
window functions, CTEs, subqueries, HAVING, date manipulation.
Already covered: {already_generated_patterns}.
Pick a pattern NOT yet covered.

GENERATION:
Write an ORIGINAL problem statement with an ORIGINAL schema. Domain can 
be familiar (e-commerce, social, HR, content) but the specific table 
structure and column names must be your own.

Quality bar:
- Problem statement: 80-150 words
- 2-4 tables with realistic columns and FKs
- Sample data: at least 5-10 rows per table, designed to expose 
  common pitfalls (NULLs, duplicates, edge cases)
- 2 visible test cases + 1 hidden test case (with expected_rows)
- Reference query that actually works against the schema
- The query should be solvable in under {time_limit} minutes

OUTPUT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "title": "...",
  "challenge_type": "coding",
  "difficulty": "easy" | "medium" | "hard",
  "time_limit_seconds": 1800,
  "pattern": "aggregation",
  "problem_statement_markdown": "...",
  "metadata": {
    "sql_schema": {
      "dialect": "sqlite",
      "setup_script": "CREATE TABLE ...; INSERT INTO ... VALUES ...",
      "schema_diagram": {
        "tables": [
          { 
            "name": "users", 
            "columns": [
              { "name": "id", "type": "INTEGER", "constraints": ["PK"] },
              ...
            ]
          }
        ],
        "relationships": [
          { "from": "orders.user_id", "to": "users.id", "type": "many-to-one" }
        ]
      },
      "sample_data_preview": {
        "users": [{"id": 1, "name": "Alice", ...}, ...],
        "orders": [...]
      }
    },
    "test_cases": [
      {
        "id": "tc1",
        "label": "...",
        "expected_rows": [...],
        "match_mode": "exact_unordered",
        "hidden": false
      }
    ],
    "starter_code": {
      "sql": "-- {hint about what to write}\n"
    },
    "reference_solution": {
      "sql": "SELECT ..."
    },
    "reference_approach": "One paragraph explaining the approach + any tradeoffs"
  }
}
```

### 12.5 Validation Pipeline (CRITICAL)

Before any seed challenge ships to production, two automated validations 
must pass. Both are part of the pipeline; failures prevent the 
`commit-seeds.ts` step.

**Validation 1: Coding challenges — reference solution passes its own tests.**

Already specified in the foundational spec. `validate-coding-seeds.ts` 
runs each `reference_solution` against its own `test_cases` using a 
Node-side Pyodide instance for Python (and a sandboxed eval for JS). 
Any reference solution that fails its own tests is flagged and 
regenerated.

**Validation 2: SQL challenges — reference query produces expected_rows.**

New for SQL. The script:

```typescript
// scripts/validate-sql-seeds.ts
import initSqlJs from 'sql.js'
import staged from '../seeds/staged-challenges.json'

async function main() {
  const SQL = await initSqlJs()
  const sqlChallenges = staged.filter(c => 
    c.challenge_type === 'coding' && c.metadata.sql_schema
  )

  for (const c of sqlChallenges) {
    const { setup_script } = c.metadata.sql_schema
    const referenceQuery = c.metadata.reference_solution.sql
    
    let allTestsPassed = true
    
    for (const tc of c.metadata.test_cases) {
      const db = new SQL.Database()
      try {
        db.run(setup_script)
        const results = db.exec(referenceQuery)
        const actual = results[0]
          ? results[0].values.map(row =>
              Object.fromEntries(
                results[0].columns.map((col, i) => [col, row[i]])
              )
            )
          : []
        
        const passed = compareRows(actual, tc.expected_rows, tc.match_mode)
        if (!passed) {
          console.warn(`✗ ${c.title} / ${tc.id}: reference query did not produce expected rows`)
          console.warn(`   Expected: ${JSON.stringify(tc.expected_rows)}`)
          console.warn(`   Actual:   ${JSON.stringify(actual)}`)
          allTestsPassed = false
        }
      } catch (err) {
        console.warn(`✗ ${c.title} / ${tc.id}: ${err.message}`)
        allTestsPassed = false
      } finally {
        db.close()
      }
    }
    
    console.log(`${allTestsPassed ? '✓' : '✗'} ${c.title}`)
  }
}

main()
```

This catches three classes of authoring bugs the Haiku agent will 
sometimes produce:

- Reference query has a syntax error that wasn't caught at generation
- Reference query returns the right rows but in different column order
- Setup script has a typo (missing comma, wrong type, missing FK)

Run order:
```
seed-challenges.ts        → produces staged-challenges.json
validate-coding-seeds.ts  → flags broken algorithmic challenges
validate-sql-seeds.ts     → flags broken SQL challenges
[human review]            → flip approved: true on each
commit-seeds.ts           → INSERT into existing challenges table
```

### 12.6 Human Review Gate

After validation, a reviewer (Sandeep + cofounder) opens 
`seeds/staged-challenges.json` and for each challenge:

- Reads the problem statement — clear? unambiguous? solvable in time limit?
- Spot-checks test cases — do they cover real edge cases or trivial ones?
- For SQL: opens the schema_diagram and sample_data_preview, sanity 
  checks the data tells a story
- Flips `approved: true` on the entries that pass

`commit-seeds.ts` only inserts `approved: true` entries.

### 12.7 Authentic Difficulty Distribution

For Phase 2 launch, target distribution across the 6 challenges:

- 2 Easy (1 algorithmic, 1 SQL) — onboarding-friendly, high completion rate
- 3 Medium (2 algorithmic, 1 SQL) — the bulk of real interview questions
- 1 Hard (algorithmic only) — for users who want to stretch

Sandeep configures the seed script with this distribution as a CLI flag:
```
npx tsx scripts/seed-challenges.ts \
  --type coding --count 4 --difficulty "easy:1,medium:2,hard:1"
npx tsx scripts/seed-challenges.ts \
  --type coding --count 2 --sql --difficulty "easy:1,medium:1"
```

### 12.8 Cost Estimate

Claude Haiku 4.5 with web search:
- ~$0.05-0.08 per coding challenge generated
- ~$0.06-0.10 per SQL challenge (web_search tool calls + slightly larger output)
- Total for 6 challenges: ~$0.50
- Including expected regenerations from validation failures (~30-40% retry rate): ~$1.00 total

Trivial cost relative to hand-authoring time.

### 12.9 Seed E2E Coverage

```typescript
test('seeded coding challenges appear correctly on Explore page', async ({ page }) => {
  // Run the seed pipeline + commit step in test setup
  await runSeedPipeline({ challenges: 6, type: 'coding' })
  
  await page.goto('/explore')
  
  const codingSection = page.getByTestId('section-coding')
  const cards = codingSection.getByTestId(/^challenge-card-/)
  
  await expect(cards).toHaveCount(6)
  
  // Verify mix: at least 1 SQL, at least 1 algorithmic
  const sqlCards = await cards.filter({ hasText: /SQL/i }).count()
  const codeCards = await cards.filter({ hasText: /Python|JavaScript/i }).count()
  
  expect(sqlCards).toBeGreaterThanOrEqual(1)
  expect(codeCards).toBeGreaterThanOrEqual(3)
})
```

---

## 13. Build Sequence (2 weeks)

### Week 1 — Core Editor + Execution

- [ ] **Audit and naming map committed** (per the foundational spec) — 
  with explicit documentation of: existing challenges table columns, 
  existing submissions/attempts table columns, existing Hatch 
  persistence pattern, existing Hatch chat component props, existing 
  Hatch API route shape
- [ ] **Judge0 API key provisioned** — environment variable set, 
  `scripts/verify-judge0.ts` run successfully before any Judge0 code is written
- [ ] Schema migrations: ADD COLUMN to existing tables for `final_code`, 
  `final_language`, `test_results`, `grading_feedback`, `hatch_thread_id` 
  on attempts table; ADD COLUMN `challenge_type` and metadata fields on 
  challenges table — never CREATE TABLE for parallel structures
- [ ] Monaco editor wrapper with paste/run instrumentation (NEW component)
- [ ] Language selector with per-language draft preservation
- [ ] `/api/code/run` route (NEW route — Judge0 proxy doesn't fit 
  existing routes) with harness wrapping per language
- [ ] sql.js worker with `hydrate` + `run` actions (NEW worker)
- [ ] Schema diagram component for SQL challenge left panel (NEW component)
- [ ] Sample data preview component for SQL challenge left panel (NEW component)
- [ ] `useCodeRunner` hook routing language → execution path (NEW hook)
- [ ] Output panel component (pass/fail badges + SQL table renderer) — 
  extend existing output/result component if one exists
- [ ] FlowWorkspace right-panel branch for `challenge_type='coding'` 
  (EXTEND, not new component)
- [ ] Hatch chat panel wired with coding-mode system prompt (EXTEND 
  existing component, do not create parallel)
- [ ] Hatch API route extended to accept context payload (EXTEND existing route)

### Week 2 — Grading + Submit Flow + Discovery + Seeds

- [ ] `/api/interview/grade` route with grading skill scaffold (NEW route, only after audit confirms no existing grading endpoint can be extended)
- [ ] `interview-coding` skill prompts written (per project's skill convention)
- [ ] Grading output schema + parser
- [ ] Submit flow with parallel correctness + grading requests
- [ ] Inline feedback view extending existing feedback renderer (two-column layout for correctness + grading card)
- [ ] Post-submit "Ask Hatch about this" coach mode
- [ ] Submission history rendering extended for coding submissions (EXTEND existing list/detail, not new pages)
- [ ] **Explore page: add "Coding Interviews" section** using existing section + card components with `challenge_type='coding'` filter (Section 11)
- [ ] **Learn page: add "Coding" category to existing filter** (Section 11.5)
- [ ] Challenge card extended with challenge_type badge + best-score field
- [ ] **Seed pipeline run** for coding challenges:
  - [ ] `seed-challenges.ts --type coding --count 4` (4 algorithmic)
  - [ ] `seed-challenges.ts --type coding --count 2 --sql` (2 SQL)
  - [ ] `validate-coding-seeds.ts` — every reference solution passes its own tests
  - [ ] `validate-sql-seeds.ts` — every reference query produces expected_rows
  - [ ] Human review — Sandeep + cofounder review each, flip `approved: true`
  - [ ] `commit-seeds.ts` inserts approved entries into existing challenges table
- [ ] 6 seed challenges live in production challenges table (4 algorithmic + 2 SQL)
- [ ] **E2E test suite (Section 14)**
- [ ] Manual QA pass: walk through 1 algorithmic + 1 SQL challenge end-to-end including submit + inline feedback + retry

---

## 14. End-to-End Tests (Playwright)

### 14.1 Test Architecture

- Use Playwright with the existing test setup (audit reveals config path)
- Mock the Judge0 API at the network layer for deterministic tests
- Mock the Claude API for grading skill — return canned rubric responses
- Real sql.js execution (it's deterministic anyway)
- Each test owns its own seeded test user via the existing test-user creation pattern

```typescript
// tests/e2e/coding-workspace.spec.ts
import { test, expect } from '@playwright/test'
import { createTestUser, seedCodingChallenge, mockJudge0, mockGrading } from './helpers'
```

### 14.2 Helper: Mock Judge0

```typescript
async function mockJudge0(page, scenario: 'all_pass' | 'partial' | 'all_fail' | 'timeout' | 'error') {
  await page.route('**/api/code/run', async (route) => {
    const responses = {
      all_pass: {
        runId: 'r1', testsPassed: 7, testsTotal: 7,
        results: Array.from({length: 7}, (_, i) => ({ 
          id: `tc${i+1}`, label: `Test ${i+1}`, status: 'passed', hidden: i >= 3 
        }))
      },
      partial: {
        runId: 'r1', testsPassed: 5, testsTotal: 7,
        results: [
          { id: 'tc1', label: 'Basic', status: 'passed', hidden: false },
          { id: 'tc2', label: 'Sorted', status: 'passed', hidden: false },
          { id: 'tc3', label: 'Empty', status: 'failed', hidden: false, expected: '[]', output: 'null' },
          { id: 'tc4', label: 'Negative', status: 'passed', hidden: false },
          { id: 'tc5', label: 'Hidden', status: 'passed', hidden: true },
          { id: 'tc6', label: 'Hidden', status: 'failed', hidden: true },
          { id: 'tc7', label: 'Hidden', status: 'passed', hidden: true },
        ]
      },
    }
    await route.fulfill({ json: responses[scenario] })
  })
}
```

### 14.3 Helper: Mock Grading

```typescript
async function mockGrading(page, overallScore = 3.8) {
  await page.route('**/api/interview/grade', async (route) => {
    await route.fulfill({
      json: {
        overall_score: overallScore,
        headline: 'Strong decomposition, but accepted AI output without verification.',
        dimensions: {
          problem_approach: { score: 4, verdict: '...', evidence: '...', hole_to_poke: '...', how_to_improve: '...' },
          ai_collaboration: { score: 3, verdict: '...', evidence: '...', hole_to_poke: '...', how_to_improve: '...' },
          code_quality: { score: 4, verdict: '...', evidence: '...', hole_to_poke: '...', how_to_improve: '...' },
          verification_discipline: { score: 3, verdict: '...', evidence: '...', hole_to_poke: '...', how_to_improve: '...' },
          interview_communication: { score: 4, verdict: '...', evidence: '...', hole_to_poke: '...', how_to_improve: '...' },
        },
        top_strength: 'Excellent edge case awareness.',
        top_improvement: 'Verify AI output line-by-line.',
        what_a_5_would_look_like: 'A 5-level candidate would have...',
      }
    })
  })
}
```

### 14.4 Test Suite

#### Test 1: Workspace renders with correct challenge type

```typescript
test('coding workspace renders Monaco editor and Hatch panel', async ({ page }) => {
  const user = await createTestUser()
  const challenge = await seedCodingChallenge({ language: 'python', title: 'Two Sum' })
  
  await page.goto(`/challenge/${challenge.id}`)
  
  // Left panel: problem statement
  await expect(page.getByRole('heading', { name: 'Two Sum' })).toBeVisible()
  
  // Right panel: Monaco editor
  await expect(page.locator('.monaco-editor')).toBeVisible()
  
  // Toolbar: language selector + Run + Submit
  await expect(page.getByRole('combobox', { name: /language/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
  
  // Hatch chat panel visible
  await expect(page.getByTestId('hatch-chat-panel')).toBeVisible()
  
  // Output panel empty initially
  await expect(page.getByTestId('output-panel')).toContainText(/click run/i)
})
```

#### Test 2: Language switching preserves per-language drafts

```typescript
test('switching language preserves separate code drafts', async ({ page }) => {
  const challenge = await seedCodingChallenge({ languages: ['python', 'javascript'] })
  await page.goto(`/challenge/${challenge.id}`)
  
  // Type some Python
  await page.locator('.monaco-editor textarea').fill('def solution(nums, target):\n    return [0, 1]')
  
  // Switch to JavaScript — should load JS starter, not Python
  await page.getByRole('combobox', { name: /language/i }).selectOption('javascript')
  await expect(page.locator('.monaco-editor')).toContainText('function solution')
  await expect(page.locator('.monaco-editor')).not.toContainText('def solution')
  
  // Type some JS
  await page.locator('.monaco-editor textarea').fill('function solution() { return [0, 1] }')
  
  // Switch back to Python — should restore the Python code
  await page.getByRole('combobox', { name: /language/i }).selectOption('python')
  await expect(page.locator('.monaco-editor')).toContainText('def solution(nums, target)')
})
```

#### Test 3: Run button executes visible tests via Judge0

```typescript
test('Run button executes visible tests and renders pass/fail', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await mockJudge0(page, 'partial')
  await page.goto(`/challenge/${challenge.id}`)
  
  await page.getByRole('button', { name: 'Run' }).click()
  
  // Loading state
  await expect(page.getByTestId('output-panel')).toContainText(/running/i)
  
  // Results land
  await expect(page.getByTestId('output-panel')).toContainText(/2 of 4 passed/i, { timeout: 5000 })
  
  // Per-test display
  await expect(page.locator('[data-test-id="tc1"]')).toContainText('Basic')
  await expect(page.locator('[data-test-id="tc1"]')).toHaveAttribute('data-status', 'passed')
  await expect(page.locator('[data-test-id="tc3"]')).toHaveAttribute('data-status', 'failed')
  
  // Failed test shows expected vs actual
  await expect(page.locator('[data-test-id="tc3"]')).toContainText('Expected: []')
  await expect(page.locator('[data-test-id="tc3"]')).toContainText('Got: null')
})
```

#### Test 4: Run does not include hidden tests

```typescript
test('Run only executes visible tests; hidden tests run on Submit', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  let runRequest, submitRequest
  
  await page.route('**/api/code/run', async (route) => {
    const body = JSON.parse(route.request().postData())
    if (!body.testCaseIds || body.testCaseIds.length <= 4) {
      runRequest = body  // visible-only run
    } else {
      submitRequest = body  // submit run
    }
    await route.fulfill({ json: { runId: 'x', testsPassed: 4, testsTotal: 4, results: [] } })
  })
  
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Run' }).click()
  await page.waitForResponse('**/api/code/run')
  
  expect(runRequest.testCaseIds).toBeUndefined()  // means visible-only
})
```

#### Test 5: SQL challenges use sql.js (no Judge0 call)

```typescript
test('SQL challenges execute via sql.js without hitting Judge0', async ({ page }) => {
  let judge0Called = false
  await page.route('**/api/code/run', () => { judge0Called = true })
  
  const challenge = await seedCodingChallenge({ 
    language: 'sql',
    setupScript: 'CREATE TABLE users (id INT, name TEXT); INSERT INTO users VALUES (1, "Alice"), (2, "Bob");',
    expectedRows: [{ id: 1, name: 'Alice' }],
  })
  
  await page.goto(`/challenge/${challenge.id}`)
  
  await page.locator('.monaco-editor textarea').fill('SELECT * FROM users WHERE id = 1')
  await page.getByRole('button', { name: 'Run' }).click()
  
  await expect(page.getByTestId('output-panel')).toContainText('passed', { timeout: 5000 })
  
  // SQL results render as a table, not stdout
  await expect(page.getByTestId('sql-result-table')).toBeVisible()
  await expect(page.getByTestId('sql-result-table')).toContainText('Alice')
  
  expect(judge0Called).toBe(false)  // critical assertion
})
```

#### Test 6: Hatch AI chat exchanges are logged for grading

```typescript
test('chat exchanges with Hatch are persisted to session log', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await page.goto(`/challenge/${challenge.id}`)
  
  await page.getByTestId('hatch-input').fill('What is the time complexity of a hash map?')
  await page.getByTestId('hatch-input').press('Enter')
  
  await expect(page.getByTestId('hatch-message-user').first()).toContainText('time complexity')
  await expect(page.getByTestId('hatch-message-assistant').first()).toBeVisible({ timeout: 10000 })
  
  // Verify it's in the session log via the backend
  const session = await fetchSessionLog(page)
  expect(session.aiExchanges).toHaveLength(2)  // user + assistant
  expect(session.aiExchanges[0].content).toContain('time complexity')
})
```

#### Test 7: Submit fires both correctness and grading in parallel

```typescript
test('Submit triggers parallel correctness + grading requests', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await mockJudge0(page, 'partial')
  await mockGrading(page, 3.8)
  
  await page.goto(`/challenge/${challenge.id}`)
  
  const correctnessPromise = page.waitForResponse('**/api/code/run')
  const gradingPromise = page.waitForResponse('**/api/interview/grade')
  
  await page.getByRole('button', { name: 'Submit' }).click()
  
  const [correctness, grading] = await Promise.all([correctnessPromise, gradingPromise])
  
  // Both fire roughly in parallel (within 500ms of each other)
  const timeDelta = Math.abs(correctness.request().timing().startTime - grading.request().timing().startTime)
  expect(timeDelta).toBeLessThan(500)
})
```

#### Test 8: Inline feedback renders both columns

```typescript
test('feedback view shows correctness column AND grading card', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await mockJudge0(page, 'partial')
  await mockGrading(page, 3.8)
  
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Submit' }).click()
  
  // Correctness column
  await expect(page.getByTestId('correctness-column')).toContainText(/5 of 7/)
  
  // Grading column
  await expect(page.getByTestId('grading-column')).toContainText('3.8')
  await expect(page.getByTestId('grading-column')).toContainText(/strong decomposition/i)
  
  // All 5 rubric dimensions present
  for (const dim of ['Problem Approach', 'AI Collaboration', 'Code Quality', 'Verification', 'Communication']) {
    await expect(page.getByTestId('grading-column')).toContainText(dim)
  }
  
  // Top strength + improvement + what-a-5
  await expect(page.getByTestId('grading-column')).toContainText(/top strength/i)
  await expect(page.getByTestId('grading-column')).toContainText(/top improvement/i)
  await expect(page.getByTestId('grading-column')).toContainText(/what a 5/i)
})
```

#### Test 9: Hidden tests are not exposed on failure

```typescript
test('hidden test failures show label but never inputs or expected', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await mockJudge0(page, 'partial')  // includes a failed hidden test
  await mockGrading(page)
  
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Submit' }).click()
  
  const hiddenFailedTest = page.locator('[data-test-id="tc6"][data-hidden="true"][data-status="failed"]')
  await expect(hiddenFailedTest).toBeVisible()
  
  // Label is visible
  await expect(hiddenFailedTest).toContainText(/hidden/i)
  
  // Inputs and expected MUST NOT be visible
  await expect(hiddenFailedTest).not.toContainText('Expected:')
  await expect(hiddenFailedTest).not.toContainText('Got:')
})
```

#### Test 10: Grading dimensions are individually expandable

```typescript
test('grading dimensions expand to show evidence and improvement', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await mockJudge0(page, 'all_pass')
  await mockGrading(page)
  
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grading-column')).toBeVisible()
  
  // Initially collapsed
  await expect(page.getByTestId('dimension-problem_approach-evidence')).not.toBeVisible()
  
  // Click to expand
  await page.getByTestId('dimension-problem_approach-toggle').click()
  await expect(page.getByTestId('dimension-problem_approach-evidence')).toBeVisible()
  await expect(page.getByTestId('dimension-problem_approach-evidence')).toContainText(/clarifying questions/i)
  await expect(page.getByTestId('dimension-problem_approach-improvement')).toContainText(/list edge cases/i)
})
```

#### Test 11: "Try Again" creates a fresh session

```typescript
test('Try Again button starts a new session for the same challenge', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await mockJudge0(page, 'all_pass')
  await mockGrading(page)
  
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grading-column')).toBeVisible()
  
  await page.getByRole('button', { name: 'Try Again' }).click()
  
  // Back in editing mode
  await expect(page.locator('.monaco-editor')).toBeVisible()
  await expect(page.getByTestId('grading-column')).not.toBeVisible()
  
  // Editor reset to starter code
  await expect(page.locator('.monaco-editor')).toContainText('def solution(nums, target):\n    pass')
  
  // Timer reset
  await expect(page.getByTestId('timer')).toContainText('30:00')  // assuming 30min limit
})
```

#### Test 12: Submission history shows past attempts with grading

```typescript
test('submission history lists past coding attempts with overall scores', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await mockJudge0(page, 'all_pass')
  
  // Make 2 submissions with different scores
  await mockGrading(page, 3.5)
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grading-column')).toBeVisible()
  
  await mockGrading(page, 4.5)
  await page.getByRole('button', { name: 'Try Again' }).click()
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grading-column')).toBeVisible()
  
  // Navigate to history
  await page.goto('/history')
  
  const rows = page.getByTestId('submission-row')
  await expect(rows).toHaveCount(2)
  
  // Most recent first
  await expect(rows.nth(0)).toContainText('4.5')
  await expect(rows.nth(0)).toContainText('Two Sum')
  await expect(rows.nth(0)).toContainText('python')
  await expect(rows.nth(1)).toContainText('3.5')
  
  // Click into a submission opens read-only view
  await rows.nth(0).click()
  await expect(page.getByTestId('correctness-column')).toBeVisible()
  await expect(page.getByTestId('grading-column')).toBeVisible()
  await expect(page.locator('.monaco-editor')).toHaveAttribute('data-readonly', 'true')
})
```

#### Test 13: Best score appears on challenge card after attempts

```typescript
test('challenge card shows attempt count and best score', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python', title: 'Two Sum' })
  await mockJudge0(page, 'all_pass')
  await mockGrading(page, 4.2)
  
  // Submit once
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grading-column')).toBeVisible()
  
  // Go to Explore
  await page.goto('/explore')
  
  const card = page.getByTestId(`challenge-card-${challenge.id}`)
  await expect(card).toContainText('1 attempt')
  await expect(card).toContainText('4.2')
})
```

#### Test 14: Paste events are instrumented and visible to grading

```typescript
test('large pastes are logged as events for grading context', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await page.goto(`/challenge/${challenge.id}`)
  
  // Simulate a large paste in Monaco
  const largeCode = 'def solution(nums, target):\n' + '    # AI-generated implementation\n'.repeat(15)
  await page.evaluate((code) => {
    const editor = window.monaco.editor.getEditors()[0]
    editor.executeEdits('paste', [{ range: editor.getModel().getFullModelRange(), text: code }])
    editor.trigger('keyboard', 'editor.action.clipboardPasteAction', null)
  }, largeCode)
  
  // Check session events via backend
  const events = await fetchSessionEvents(page)
  const pasteEvents = events.filter(e => e.event_type === 'code_paste')
  
  expect(pasteEvents.length).toBeGreaterThan(0)
  expect(pasteEvents[0].payload.length).toBeGreaterThan(100)
  expect(pasteEvents[0].payload.percentOfBuffer).toBeGreaterThan(0.5)
})
```

#### Test 15: Post-submit chat with Hatch coach mode

```typescript
test('Ask Hatch about this opens chat in coach mode after submit', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await mockJudge0(page, 'partial')
  await mockGrading(page, 3.5)
  
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grading-column')).toBeVisible()
  
  await page.getByRole('button', { name: /ask hatch/i }).click()
  await expect(page.getByTestId('hatch-chat-panel')).toBeVisible()
  
  await page.getByTestId('hatch-input').fill('Why did I get a 3 on AI Collaboration?')
  await page.getByTestId('hatch-input').press('Enter')
  
  // Hatch should respond with reference to the cited evidence
  await expect(page.getByTestId('hatch-message-assistant').last())
    .toContainText(/paste|verification|line-by-line/i, { timeout: 10000 })
})
```

#### Test 16: Network failure on Run shows recoverable error

```typescript
test('Judge0 failure shows retry-able error without losing code', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  
  await page.route('**/api/code/run', route => route.abort('failed'))
  
  await page.goto(`/challenge/${challenge.id}`)
  await page.locator('.monaco-editor textarea').fill('def solution(nums, target):\n    return [0, 1]')
  await page.getByRole('button', { name: 'Run' }).click()
  
  await expect(page.getByTestId('output-panel')).toContainText(/couldn.?t run.*retry/i)
  
  // Code preserved
  await expect(page.locator('.monaco-editor')).toContainText('return [0, 1]')
  
  // Retry works
  await mockJudge0(page, 'all_pass')
  await page.getByRole('button', { name: /retry/i }).click()
  await expect(page.getByTestId('output-panel')).toContainText('passed')
})
```

#### Test 17: Page refresh resumes session with code intact

```typescript
test('refreshing mid-session restores code, language, and chat history', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  await page.goto(`/challenge/${challenge.id}`)
  
  await page.getByRole('button', { name: 'Start' }).click()
  
  // Type code, switch language, chat with Hatch
  await page.locator('.monaco-editor textarea').fill('# Working on it\ndef solution(nums, target):\n    pass')
  await page.getByTestId('hatch-input').fill('What approach should I take?')
  await page.getByTestId('hatch-input').press('Enter')
  await expect(page.getByTestId('hatch-message-assistant').first()).toBeVisible({ timeout: 10000 })
  
  // Wait for autosave (10s debounce — force flush)
  await page.evaluate(() => window.flushAutosave?.())
  
  // Refresh
  await page.reload()
  
  // State restored
  await expect(page.locator('.monaco-editor')).toContainText('# Working on it')
  await expect(page.getByTestId('hatch-message-user').first()).toContainText('approach')
  await expect(page.getByTestId('hatch-message-assistant').first()).toBeVisible()
  
  // Timer continues — not reset
  const timerText = await page.getByTestId('timer').textContent()
  expect(timerText).not.toBe('30:00')
})
```

#### Test 18: Per-user execution cap enforced

```typescript
test('hitting daily execution cap shows clear message', async ({ page }) => {
  const user = await createTestUser({ executionsToday: 100 })  // at cap
  await loginAs(page, user)
  
  const challenge = await seedCodingChallenge({ language: 'python' })
  await page.goto(`/challenge/${challenge.id}`)
  await page.getByRole('button', { name: 'Run' }).click()
  
  await expect(page.getByTestId('output-panel')).toContainText(/daily.*limit/i)
})
```

#### Test 19: SQL workspace hydrates schema before enabling Run

```typescript
test('SQL challenge hydrates schema in worker before Run is enabled', async ({ page }) => {
  let judge0Called = false
  await page.route('**/api/code/run', () => { judge0Called = true })
  
  const challenge = await seedCodingChallenge({
    language: 'sql',
    sqlSchema: {
      setupScript: 'CREATE TABLE products (id INT, name TEXT, price DECIMAL); INSERT INTO products VALUES (1, "Widget", 9.99), (2, "Gadget", 19.99);',
      schemaDiagram: { tables: [{ name: 'products', columns: [/*...*/] }] },
      samplePreview: { products: [{ id: 1, name: 'Widget', price: 9.99 }] }
    }
  })
  
  await page.goto(`/challenge/${challenge.id}`)
  
  // Schema diagram visible in left panel
  await expect(page.getByTestId('schema-diagram')).toBeVisible()
  await expect(page.getByTestId('schema-diagram')).toContainText('products')
  await expect(page.getByTestId('schema-diagram')).toContainText('price')
  
  // Sample data preview shown in left panel
  await expect(page.getByTestId('sample-data-preview')).toContainText('Widget')
  
  // Run button enabled after worker hydration completes
  await expect(page.getByRole('button', { name: 'Run' })).toBeEnabled({ timeout: 3000 })
  
  // Write a query that uses the seeded data
  await page.locator('.monaco-editor textarea').fill('SELECT name FROM products WHERE price > 10')
  await page.getByRole('button', { name: 'Run' }).click()
  
  await expect(page.getByTestId('sql-result-table')).toContainText('Gadget')
  await expect(page.getByTestId('sql-result-table')).not.toContainText('Widget')  // filtered out by query
  
  expect(judge0Called).toBe(false)
})
```

#### Test 20: Hatch references the user's actual code in responses

```typescript
test('Hatch responses are context-aware of current code and last run', async ({ page }) => {
  const challenge = await seedCodingChallenge({ language: 'python' })
  
  // Stub Hatch API to capture the context payload
  let capturedContext = null
  await page.route('**/api/hatch/**', async (route) => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData())
      capturedContext = body.context
      await route.fulfill({ json: { reply: 'Looking at your code on line 4, what happens if nums is empty?' } })
    } else {
      await route.continue()
    }
  })
  
  await page.goto(`/challenge/${challenge.id}`)
  
  // User writes specific code
  await page.locator('.monaco-editor textarea').fill('def solution(nums, target):\n    return nums[0] + nums[1]')
  
  // Asks Hatch a question
  await page.getByTestId('hatch-input').fill('Why is my code wrong?')
  await page.getByTestId('hatch-input').press('Enter')
  
  // Wait for response
  await expect(page.getByTestId('hatch-message-assistant').first()).toBeVisible({ timeout: 5000 })
  
  // Verify the context payload included the live code + language + challenge
  expect(capturedContext).toBeDefined()
  expect(capturedContext.current_code).toContain('return nums[0] + nums[1]')
  expect(capturedContext.current_language).toBe('python')
  expect(capturedContext.challenge_title).toBeTruthy()
  expect(capturedContext.challenge_type).toBe('coding')
})
```

#### Test 21: Schema migrations were run as ALTER TABLE (extension)

This is a CI-only test that verifies the agent extended the existing 
schema rather than creating parallel tables. Run as part of pre-deploy 
checks.

```typescript
test('schema extends existing tables, no parallel coding_* tables exist', async () => {
  const tables = await db.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  `)
  const tableNames = tables.rows.map(r => r.table_name)
  
  // Extension assertions — these columns should now exist on existing tables
  const challengesColumns = await db.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = '{existing_challenges_table_name}'
  `)
  expect(challengesColumns.rows.map(r => r.column_name)).toContain('challenge_type')
  
  const submissionsColumns = await db.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = '{existing_submissions_table_name}'
  `)
  expect(submissionsColumns.rows.map(r => r.column_name)).toContain('test_results')
  expect(submissionsColumns.rows.map(r => r.column_name)).toContain('grading_feedback')
  expect(submissionsColumns.rows.map(r => r.column_name)).toContain('final_code')
  
  // Anti-fork assertions — parallel tables should NOT exist
  expect(tableNames).not.toContain('coding_challenges')
  expect(tableNames).not.toContain('coding_submissions')
  expect(tableNames).not.toContain('coding_attempts')
  expect(tableNames).not.toContain('coding_ai_messages')
})
```



| Concern | Test |
|---|---|
| Workspace renders | T1 |
| Multi-language drafts | T2 |
| Run via Judge0 | T3, T4 |
| Run via sql.js | T5 |
| Hatch chat instrumentation | T6, T14 |
| Parallel submit flow | T7 |
| Inline feedback | T8, T10 |
| Hidden test protection | T9 |
| Try Again flow | T11 |
| Submission history | T12, T13 |
| Post-submit Hatch | T15 |
| Error states | T16, T18 |
| Resume on refresh | T17 |

### 14.5 Test Coverage Summary

| Concern | Test |
|---|---|
| Workspace renders | T1 |
| Multi-language drafts | T2 |
| Run via Judge0 | T3, T4 |
| Run via sql.js | T5, T19 |
| SQL hydration + schema diagram | T19 |
| Hatch chat instrumentation | T6, T14 |
| Hatch context-awareness | T20 |
| Parallel submit flow | T7 |
| Inline feedback | T8, T10 |
| Hidden test protection | T9 |
| Try Again flow | T11 |
| Submission history | T12, T13 |
| Post-submit Hatch | T15 |
| Error states | T16, T18 |
| Resume on refresh | T17 |
| Schema extension (anti-fork) | T21 |
| Explore page section + card click-through | Section 11.6 tests |
| Seeded challenges appear correctly | Section 12.9 test |

### 14.6 Smoke Test (Run on Every PR)

A single happy-path test that exercises the entire flow end-to-end. Runs 
against a real test database, real sql.js, mocked Judge0 + grading.

```typescript
test('@smoke complete coding interview flow', async ({ page }) => {
  const user = await createTestUser()
  const challenge = await seedCodingChallenge({ language: 'python', title: 'Two Sum' })
  await mockJudge0(page, 'partial')
  await mockGrading(page, 3.8)
  
  await loginAs(page, user)
  await page.goto('/explore')
  await page.getByText('Two Sum').click()
  await page.getByRole('button', { name: 'Start' }).click()
  
  await page.locator('.monaco-editor textarea').fill('def solution(nums, target):\n    return [0, 1]')
  await page.getByRole('button', { name: 'Run' }).click()
  await expect(page.getByTestId('output-panel')).toContainText(/passed/)
  
  await page.getByTestId('hatch-input').fill('Is hash map the right approach?')
  await page.getByTestId('hatch-input').press('Enter')
  await expect(page.getByTestId('hatch-message-assistant').first()).toBeVisible({ timeout: 10000 })
  
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('correctness-column')).toBeVisible()
  await expect(page.getByTestId('grading-column')).toBeVisible()
  
  await expect(page.getByTestId('grading-column')).toContainText('3.8')
  
  await page.goto('/history')
  await expect(page.getByTestId('submission-row').first()).toContainText('3.8')
})
```

---

## 15. Open Questions Specific to This Spec

1. **Judge0 RapidAPI key** — provisioned ✓ (stored as 
   `JUDGE0_RAPIDAPI_KEY` env var). Run `scripts/verify-judge0.ts` 
   before any integration work to confirm it's active. **Rotate the 
   key shared in spec drafting conversations as a precaution.**
2. **Test user pattern** — does HackProduct have an existing 
   `createTestUser` test helper? If not, build one as part of E2E 
   setup. Audit confirms.
3. **Mocking layer** — are existing E2E tests using `page.route()` for 
   API mocking, or is there a different convention? Audit confirms.
4. **Submission history page** — does it exist for product_sense today? 
   If yes, extend its rendering for coding submissions. If no, this 
   becomes part of Phase 2 scope. Audit confirms.
5. **Per-language draft storage** — local state only (lost on refresh) 
   or part of autosave payload? **Recommendation: include in autosave 
   payload** so language switches survive refresh.
6. **Hatch thread linkage** — does the existing Hatch persistence 
   already support per-session threads, or do we add a `hatch_thread_id` 
   on the attempts table? Audit confirms which extension is needed.
7. **Schema diagram component** — does anything similar exist (ERD 
   renderer, table layout) that can be reused? Audit confirms before 
   building net-new.
8. **Existing grading flow** — does product_sense have a grading 
   endpoint that can be extended for coding rubric output, or is 
   `/api/interview/grade` genuinely new? Audit confirms.

---

## 16. What This Spec Does NOT Cover

The following are in the foundational spec (`hackproduct-interview-workspace-spec-v3.md`) and not duplicated here:

- Codebase audit and naming map
- FlowWorkspace mechanics
- Hatch AI chat component implementation (only the coding-mode prompt is here)
- Session lifecycle, autosave, retry-on-mount
- Analytics event taxonomy
- Rate limiting infrastructure
- Mobile / a11y / testing infrastructure beyond the E2E suite above
- Phase 1 (canvas) workspace
- Phase 3+ scaling concerns

The agent reads the foundational spec first, then this document for 
Phase 2 specifics.
