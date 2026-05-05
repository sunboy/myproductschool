export type TestStatus = 'passed' | 'failed' | 'error' | 'timeout' | 'no_solution'

/** Supported structured input/output types for LeetCode-style problems */
export type StructuredType = 'tree' | 'linked_list' | 'graph' | 'matrix' | 'int' | 'string' | 'array'

/** A single test case for a coding challenge */
export interface TestCase {
  id: string
  label: string
  args: unknown[]
  expected: unknown
  hidden: boolean
  /** Positional input types — when present, harness deserializes structured inputs */
  input_types?: StructuredType[]
  /** Output type — when present, harness serializes structured output */
  output_type?: StructuredType
  /**
   * How to compare actual vs expected output for this test case.
   * - 'exact'       (default) — JSON.stringify equality
   * - 'set'         — any order at the top level (array of primitives/objects)
   * - 'sorted'      — numerically sorted arrays
   * - 'sorted_each' — each sub-array sorted + outer array sorted
   *                   (for 3Sum / Group Anagrams)
   */
  compare_mode?: 'exact' | 'set' | 'sorted' | 'sorted_each'
}

export type TestResult = {
  id: string
  label: string
  status: TestStatus
  hidden: boolean
  input?: unknown
  output?: unknown
  expected?: unknown
  actual?: unknown
  matchMode?: string
  errorMessage?: string
  durationMs?: number
}

export type RunResult = {
  runId: string
  testsPassed: number
  testsTotal: number
  results: TestResult[]
}

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'go' | 'sql'

// Grading dimension key as returned by the coding-grader skill
export type GradingDimensionKey =
  | 'problem_approach'
  | 'ai_collaboration'
  | 'code_quality'
  | 'verification_discipline'
  | 'interview_communication'

export interface GradingDimension {
  score: number          // 1-5
  verdict: string
  evidence: string
  hole_to_poke: string
  how_to_improve: string
}

// Full grading feedback as returned by /api/challenges/[id]/coding-submit
export interface GradingFeedback {
  overall_score: number                                   // e.g. 3.8
  headline: string
  dimensions: Record<GradingDimensionKey, GradingDimension>
  top_strength: string
  top_improvement: string
  what_a_5_would_look_like: string
}
