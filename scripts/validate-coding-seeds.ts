/**
 * Validate algorithmic coding seeds — run each reference_solution through
 * Judge0 against its own test_cases.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/validate-coding-seeds.ts
 *
 * Exits 1 if any coding challenge's reference solution fails its own tests.
 * SQL challenges (those with metadata.sql_schema) are skipped — use
 * validate-sql-seeds.ts for those.
 */

import * as fs from 'fs'
import * as path from 'path'
import { submitToJudge0, pollJudge0Result } from '../src/lib/judge0/client'
import { wrapWithHarness } from '../src/lib/judge0/harness'
import type { SupportedJudge0Language } from '../src/lib/judge0/languageMap'
import { compareOutputs } from '../src/lib/coding/compare'
import type { CompareMode } from '../src/lib/coding/compare'

// ---------------------------------------------------------------------------
// Types mirroring the staged JSON shape
// ---------------------------------------------------------------------------

interface TestCase {
  id: string
  label: string
  args: unknown[]
  expected: unknown
  hidden: boolean
  compare_mode?: CompareMode
  /** Positional input types — when present, harness deserializes structured inputs */
  input_types?: string[]
  /** Output type — when present, harness serializes structured output */
  output_type?: string
}

interface CodingMetadata {
  test_cases: TestCase[]
  reference_solution: Record<string, string>  // lang -> code
  sql_schema?: unknown  // if present, this is a SQL challenge
}

type OptionQuality = 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'

interface PartOption {
  id: string
  option_label: string
  option_text: string
  quality: OptionQuality
  explanation: string
}

interface ChallengePart {
  id: string
  title: string
  prompt_markdown: string
  response_type: 'coding_subtask' | 'pure_mcq'
  weight: number           // integer percent; all parts must sum to 100
  test_case_ids?: string[] // required for coding_subtask
  starter_code?: Record<string, string>
  options?: PartOption[]   // required for pure_mcq
}

interface StagedChallenge {
  title: string
  challenge_type: string
  is_sql?: boolean
  approved: boolean
  metadata: CodingMetadata
  parts?: ChallengePart[]
}

// ---------------------------------------------------------------------------
// Compare actual vs expected output (JSON-normalized)
// Uses shared compareOutputs from src/lib/coding/compare.ts
// ---------------------------------------------------------------------------

function normalizeOutput(raw: string): unknown {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    return trimmed
  }
}

// ---------------------------------------------------------------------------
// Validate one challenge against one language
// ---------------------------------------------------------------------------

async function validateChallengeForLanguage(
  challenge: StagedChallenge,
  language: SupportedJudge0Language,
  solutionCode: string
): Promise<{ passed: boolean; failedCases: string[] }> {
  const failedCases: string[] = []

  const wrappedCode = wrapWithHarness(solutionCode, language)

  for (const tc of challenge.metadata.test_cases) {
    // Use structured stdin shape when input_types or output_type is present;
    // fall back to bare array for backward compatibility.
    const stdin =
      (tc.input_types && tc.input_types.length > 0) || tc.output_type
        ? JSON.stringify({ args: tc.args, input_types: tc.input_types ?? [], output_type: tc.output_type ?? null })
        : JSON.stringify(tc.args)
    try {
      const { token } = await submitToJudge0({
        sourceCode: wrappedCode,
        language,
        stdin,
      })
      const result = await pollJudge0Result(token)

      if (result.status.id !== 3) {
        // Execution error, compilation error, TLE, etc.
        const detail = result.compile_output ?? result.stderr ?? result.status.description
        failedCases.push(
          `  ${tc.id} [${tc.label}]: execution failed — ${result.status.description}` +
          (detail ? `\n    ${detail.trim().slice(0, 200)}` : '')
        )
        continue
      }

      const actual = normalizeOutput(result.stdout ?? '')
      if (!compareOutputs(actual, tc.expected, tc.compare_mode)) {
        failedCases.push(
          `  ${tc.id} [${tc.label}]: wrong answer\n` +
          `    expected: ${JSON.stringify(tc.expected)}\n` +
          `    actual:   ${JSON.stringify(actual)}`
        )
      }
    } catch (err) {
      failedCases.push(`  ${tc.id} [${tc.label}]: error — ${(err as Error).message}`)
    }
  }

  return { passed: failedCases.length === 0, failedCases }
}

// ---------------------------------------------------------------------------
// Validate `parts` array (structural — no Judge0 execution needed)
// ---------------------------------------------------------------------------

const VALID_RESPONSE_TYPES = new Set(['coding_subtask', 'pure_mcq'])
const VALID_QUALITIES = new Set<string>(['best', 'good_but_incomplete', 'surface', 'plausible_wrong'])

function validateParts(challenge: StagedChallenge): string[] {
  const errors: string[] = []
  const parts = challenge.parts!
  const testCaseIds = new Set(
    (challenge.metadata?.test_cases ?? []).map((tc: TestCase) => tc.id)
  )

  // 1. Count bounds
  if (parts.length < 1 || parts.length > 6) {
    errors.push(`parts.length must be 1–6, got ${parts.length}`)
  }

  // 2. Weights sum to 100
  const weightSum = parts.reduce((acc, p) => acc + p.weight, 0)
  if (weightSum !== 100) {
    errors.push(`parts weights must sum to 100, got ${weightSum}`)
  }

  // 3. Unique part ids
  const partIds = parts.map((p) => p.id)
  const uniquePartIds = new Set(partIds)
  if (uniquePartIds.size !== partIds.length) {
    const dupes = partIds.filter((id, idx) => partIds.indexOf(id) !== idx)
    errors.push(`duplicate part ids: ${[...new Set(dupes)].join(', ')}`)
  }

  for (const part of parts) {
    const prefix = `part[${part.id}]:`

    // 4. response_type in allowed set
    if (!VALID_RESPONSE_TYPES.has(part.response_type)) {
      errors.push(`${prefix} invalid response_type "${part.response_type}"`)
    }

    if (part.response_type === 'coding_subtask') {
      // 5. test_case_ids reference valid ids from metadata.test_cases
      if (!part.test_case_ids || part.test_case_ids.length === 0) {
        errors.push(`${prefix} coding_subtask must have at least one test_case_id`)
      } else {
        for (const tcId of part.test_case_ids) {
          if (!testCaseIds.has(tcId)) {
            errors.push(`${prefix} test_case_id "${tcId}" not found in metadata.test_cases`)
          }
        }
      }
    }

    if (part.response_type === 'pure_mcq') {
      const options = part.options ?? []

      // 6a. Exactly 4 options
      if (options.length !== 4) {
        errors.push(`${prefix} pure_mcq must have exactly 4 options, got ${options.length}`)
      }

      if (options.length > 0) {
        // 6b. Exactly one quality='best'
        const bestCount = options.filter((o) => o.quality === 'best').length
        if (bestCount !== 1) {
          errors.push(`${prefix} pure_mcq must have exactly one option with quality='best', got ${bestCount}`)
        }

        // 6c. All 4 quality values distinct and from the valid set
        const qualityValues = options.map((o) => o.quality)
        const uniqueQualities = new Set(qualityValues)
        if (uniqueQualities.size !== qualityValues.length) {
          errors.push(`${prefix} pure_mcq options must have distinct quality values`)
        }
        for (const q of qualityValues) {
          if (!VALID_QUALITIES.has(q)) {
            errors.push(`${prefix} invalid quality value "${q}"`)
          }
        }
      }
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const stagedPath = path.join(process.cwd(), 'seeds', 'staged-interview-challenges.json')

  if (!fs.existsSync(stagedPath)) {
    console.error('No staged challenges found. Run seed-interview-challenges.ts first.')
    process.exit(1)
  }

  const allStaged = JSON.parse(fs.readFileSync(stagedPath, 'utf-8')) as StagedChallenge[]

  // Filter to algorithmic coding challenges (challenge_type === 'coding', no sql_schema)
  const codingChallenges = allStaged.filter(
    (c) => c.challenge_type === 'coding' && !c.metadata?.sql_schema && !c.is_sql
  )

  if (codingChallenges.length === 0) {
    console.log('No algorithmic coding challenges found in staged file. Nothing to validate.')
    process.exit(0)
  }

  console.log(`Validating ${codingChallenges.length} algorithmic coding challenge(s) via Judge0...\n`)

  const LANGUAGES_TO_VALIDATE: SupportedJudge0Language[] = ['python', 'javascript']

  let anyFailed = false

  for (const challenge of codingChallenges) {
    // Validate optional `parts` array (structural checks, no Judge0)
    if (challenge.parts !== undefined) {
      const partErrors = validateParts(challenge)
      if (partErrors.length > 0) {
        console.log(`✗ ${challenge.title} — parts validation failed:`)
        partErrors.forEach((e) => console.log(`  ${e}`))
        anyFailed = true
        continue
      }
      console.log(`✓ ${challenge.title} (parts validation passed — ${challenge.parts.length} part(s))`)
    }

    const refSolution = challenge.metadata.reference_solution
    if (!refSolution) {
      console.log(`✗ ${challenge.title} — no reference_solution in metadata`)
      anyFailed = true
      continue
    }

    let challengePassed = true
    const challengeDetails: string[] = []

    for (const lang of LANGUAGES_TO_VALIDATE) {
      const code = refSolution[lang]
      if (!code) {
        // Not all challenges provide all languages — skip gracefully
        continue
      }

      process.stdout.write(`  [${lang}] ${challenge.title}... `)
      const { passed, failedCases } = await validateChallengeForLanguage(challenge, lang, code)

      if (passed) {
        process.stdout.write('✓\n')
      } else {
        process.stdout.write('✗\n')
        challengePassed = false
        challengeDetails.push(...failedCases)
      }
    }

    if (challengePassed) {
      console.log(`✓ ${challenge.title}`)
    } else {
      console.log(`✗ ${challenge.title}`)
      challengeDetails.forEach((d) => console.log(d))
      anyFailed = true
    }

    console.log()
  }

  if (anyFailed) {
    console.error('Validation FAILED — fix broken challenges before running commit-interview-seeds.ts')
    process.exit(1)
  } else {
    console.log('All coding challenges passed validation ✓')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
