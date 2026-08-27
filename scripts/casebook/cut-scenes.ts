#!/usr/bin/env npx tsx
/**
 * Casebook Loop — scene cutter (plan §2 step 3).
 *
 * Cuts warm-up scenes out of an annotated expert-session transcript: one scene
 * per decision point. Each scene is a standalone drill (goal, preloaded
 * context, rubric detectors, skill lane, time budget) that puts the learner in
 * the exact spot the expert stood right before making that call.
 *
 * This script does NOT call any LLM/API. Where real authoring judgment is
 * needed (choosing a skill_lane, writing a sharp goal_md, picking a
 * fail_condition), it emits an explicit "needs authoring" scaffold plus a
 * ready-to-paste handoff prompt a Claude Code sub-agent (or a human) can use
 * to finish the scene. It never invents plausible-sounding content on its own.
 *
 * Output is a FILE on disk. No DB writes, no network calls.
 *
 * Usage:
 *   npx tsx scripts/casebook/cut-scenes.ts <case-id> --in <expert-session-json> --out <scenes-json>
 *
 * Example:
 *   npx tsx scripts/casebook/cut-scenes.ts tuesday-dip \
 *     --in content/casebook/tuesday-dip/expert-session.json \
 *     --out content/casebook/tuesday-dip/scenes.json
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// Types (mirrors cc_expert_sessions / cc_scenes JSONB shapes from
// supabase/migrations/20260826100000_casebook_content.sql)
// ---------------------------------------------------------------------------

interface DecisionOption {
  id: string
  text: string
  quality: 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'
  explanation: string
}

interface DecisionPoint {
  id: string
  t: number
  question: string
  options: DecisionOption[]
  expert_option_id: string
  expert_move_id: string
}

interface TranscriptTurn {
  t: number
  role: 'user' | 'assistant' | 'tool'
  text: string
  annotation?: { title: string; body: string }
}

interface ExpertMove {
  id: string
  t: number
  label: string
  description: string
}

interface ExpertSession {
  id: string
  case_id: string
  duration_s: number
  transcript: TranscriptTurn[]
  moves: ExpertMove[]
  decision_points: DecisionPoint[]
  is_published?: boolean
}

interface Detector {
  kind: 'regex' | 'llm'
  pattern?: string
  prompt?: string
}

interface RequiredMove {
  id: string
  label: string
  detector: Detector
}

interface SceneRubric {
  required_moves: RequiredMove[]
  bonus_moves: RequiredMove[]
  fail_conditions: string[]
}

interface ScenePreload {
  context_md: string
  seed_transcript?: TranscriptTurn[]
  visible_tables: string[]
  /** Present only on scaffolds that still need human/sub-agent authoring. */
  needs_authoring?: true
  authoring_prompt?: string
}

interface Scene {
  id: string
  case_id: string
  ordinal: number
  title: string
  goal_md: string
  skill_lane: string
  decision_point_id: string
  preload: ScenePreload
  time_budget_s: number
  rubric: SceneRubric
  is_published: boolean
  /** Non-schema field, stripped by publish-case.ts before upsert. Flags scenes
   *  that still need a human/sub-agent pass before they can ship. */
  _needs_authoring?: boolean
}

const DEFAULT_TIME_BUDGET_S = 300

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const [caseId, ...rest] = argv
  if (!caseId || caseId.startsWith('--')) {
    console.error('Usage: npx tsx scripts/casebook/cut-scenes.ts <case-id> --in <expert-session-json> --out <scenes-json>')
    process.exit(1)
  }
  let inPath: string | undefined
  let outPath: string | undefined
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--in') inPath = rest[++i]
    else if (rest[i] === '--out') outPath = rest[++i]
  }
  if (!inPath || !outPath) {
    console.error('Both --in <expert-session-json> and --out <scenes-json> are required.')
    process.exit(1)
  }
  return { caseId, inPath, outPath }
}

// ---------------------------------------------------------------------------
// Skill-lane inference (best-effort heuristic, always paired with
// needs_authoring so a human/sub-agent confirms or corrects it)
// ---------------------------------------------------------------------------

/**
 * Cheap keyword heuristic to propose a starting skill_lane. This is a
 * SUGGESTION only — every scene ships with needs_authoring=true regardless,
 * because lane choice is an authoring judgment call, not something a keyword
 * match should decide unsupervised.
 */
function suggestSkillLane(dp: DecisionPoint, precedingMoves: ExpertMove[]): string {
  const haystack = [dp.question, ...precedingMoves.map((m) => `${m.label} ${m.description}`)]
    .join(' ')
    .toLowerCase()

  if (/\bquery|sql|select|group by|warehouse|table\b/.test(haystack)) return 'driving-the-agent'
  if (/\bhypothes|rule out|confirm|baseline|isolate\b/.test(haystack)) return 'forming-hypotheses'
  if (/\bmetric|threshold|falsifiab|verdict|escalat\b/.test(haystack)) return 'naming-the-verdict'
  return 'driving-the-agent'
}

/** Moves at or before the decision point's timestamp: the causal lead-up. */
function movesBeforeDecisionPoint(moves: ExpertMove[], dp: DecisionPoint): ExpertMove[] {
  return moves.filter((m) => m.t <= dp.t).sort((a, b) => a.t - b.t)
}

/** Transcript turns strictly before the decision point: what the learner would see preloaded. */
function transcriptBeforeDecisionPoint(transcript: TranscriptTurn[], dp: DecisionPoint): TranscriptTurn[] {
  return transcript.filter((turn) => turn.t < dp.t).sort((a, b) => a.t - b.t)
}

function extractQueriesFromTranscript(turns: TranscriptTurn[]): string[] {
  const queries: string[] = []
  for (const turn of turns) {
    if (turn.role !== 'tool') continue
    // Heuristic: a tool turn containing SELECT is a query call.
    const match = turn.text.match(/SELECT[\s\S]*?;/i)
    if (match) queries.push(match[0].trim())
  }
  return queries
}

// ---------------------------------------------------------------------------
// Handoff prompt for the sub-agent that finishes authoring
// ---------------------------------------------------------------------------

function buildAuthoringPrompt(caseId: string, dp: DecisionPoint, expertMove: ExpertMove | undefined, precedingMoves: ExpertMove[]): string {
  const moveList = precedingMoves.map((m) => `  - [${m.t}s] ${m.label}: ${m.description}`).join('\n') || '  (none — this is the opening decision point)'
  const bestOption = dp.options.find((o) => o.quality === 'best')

  return [
    `You are finishing a Casebook Loop warm-up scene scaffold for case "${caseId}", decision point "${dp.id}".`,
    '',
    'CONTEXT — the expert session moment this scene is cut from:',
    `  Question the expert faced: ${dp.question}`,
    `  Expert's chosen option: ${bestOption ? bestOption.text : '(unresolved — check expert_option_id)'}`,
    `  Expert move that resolved it: ${expertMove ? `${expertMove.label} — ${expertMove.description}` : '(not found in moves[])'}`,
    '',
    'Moves the expert made leading up to this point:',
    moveList,
    '',
    'YOUR JOB — fill in the scene fields marked needs_authoring:',
    '  1. title: a short, punchy scene title (not a restatement of the question).',
    '  2. goal_md: 1-3 sentences. Tell the learner what decision they need to make right now,',
    '     using the SAME facts the expert had at this point (no more, no less). Do not reveal',
    '     the expert\'s answer or which option is "best".',
    '  3. skill_lane: confirm or correct the suggested lane against src/lib/labs or cc_skill_lanes rows.',
    '  4. rubric.required_moves: 1-3 detectors (regex or llm-prompt) that would fire if the learner',
    '     reproduces the expert\'s key move. Prefer regex on query shape/keywords when the move is a',
    '     query; use kind:"llm" with a prompt only when the move is a judgment call regex cannot see.',
    '  5. rubric.fail_conditions: plain-language conditions that should end the scene as a miss',
    '     (e.g. "learner escalates without checking the historical baseline").',
    '',
    'VOICE RULES (hard requirements, checked by validate-case.ts):',
    '  - No em dashes.',
    '  - No second-person role framing ("you are a...", "as a...").',
    '  - No AI-slop words (delve, leverage, utilize, holistic, robust, seamlessly, ensure, ...).',
    '  - Full sentences, not fragments (except UI chrome).',
    '',
    'Do NOT reveal or restate any option\'s quality tier or explanation text in goal_md — the',
    'learner has to reach the decision point cold, the same way the expert did.',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { caseId, inPath, outPath } = parseArgs(process.argv.slice(2))

  const raw = readFileSync(resolve(inPath), 'utf-8')
  let session: ExpertSession
  try {
    session = JSON.parse(raw) as ExpertSession
  } catch (err) {
    console.error(`Failed to parse ${inPath} as JSON: ${(err as Error).message}`)
    process.exit(1)
  }

  if (session.case_id !== caseId) {
    console.error(`Expert session case_id "${session.case_id}" does not match requested case "${caseId}". Aborting — refusing to cut scenes for the wrong case.`)
    process.exit(1)
  }
  if (!Array.isArray(session.decision_points) || session.decision_points.length === 0) {
    console.error(`Expert session "${session.id}" has no decision_points. Nothing to cut.`)
    process.exit(1)
  }

  const decisionPoints = [...session.decision_points].sort((a, b) => a.t - b.t)
  const scenes: Scene[] = decisionPoints.map((dp, index) => {
    const precedingMoves = movesBeforeDecisionPoint(session.moves ?? [], dp)
    const precedingTranscript = transcriptBeforeDecisionPoint(session.transcript ?? [], dp)
    const expertMove = (session.moves ?? []).find((m) => m.id === dp.expert_move_id)
    const queries = extractQueriesFromTranscript(precedingTranscript)
    const skillLane = suggestSkillLane(dp, precedingMoves)

    const contextLines = [
      `## What you know so far`,
      '',
      ...precedingTranscript
        .filter((t) => t.role !== 'tool')
        .map((t) => `- ${t.text}`),
    ]
    if (queries.length > 0) {
      contextLines.push('', '## Queries already run', '', ...queries.map((q) => '```sql\n' + q + '\n```'))
    }

    const scene: Scene = {
      id: `${caseId}-s${index + 1}`,
      case_id: caseId,
      ordinal: index + 1,
      // Scaffold placeholders. Deliberately generic/marked so nobody mistakes
      // these for finished, ship-ready copy — validate-case.ts's voice checks
      // don't run against needs_authoring scenes, but publish-case.ts refuses
      // to publish any case that still has one.
      title: `[NEEDS AUTHORING] Scene ${index + 1}: ${dp.question.slice(0, 60)}${dp.question.length > 60 ? '…' : ''}`,
      goal_md: `[NEEDS AUTHORING] Draft a learner-facing goal for decision point "${dp.id}". See authoring_prompt for the handoff brief. Raw expert question for reference only, do not ship verbatim: ${dp.question}`,
      skill_lane: skillLane,
      decision_point_id: dp.id,
      preload: {
        context_md: contextLines.join('\n'),
        seed_transcript: precedingTranscript,
        visible_tables: [],
        needs_authoring: true,
        authoring_prompt: buildAuthoringPrompt(caseId, dp, expertMove, precedingMoves),
      },
      time_budget_s: DEFAULT_TIME_BUDGET_S,
      rubric: {
        required_moves: expertMove
          ? [
              {
                id: expertMove.id,
                label: `[NEEDS AUTHORING] ${expertMove.label}`,
                detector: { kind: 'regex', pattern: '' },
              },
            ]
          : [],
        bonus_moves: [],
        fail_conditions: [],
      },
      is_published: false,
      _needs_authoring: true,
    }
    return scene
  })

  writeFileSync(resolve(outPath), JSON.stringify(scenes, null, 2) + '\n')
  console.log(`Cut ${scenes.length} scene(s) from ${decisionPoints.length} decision point(s) → ${outPath}`)
  console.log('Every scene is a needs_authoring scaffold. Hand preload.authoring_prompt to a Claude Code sub-agent (or a human author) to finish each one before validate-case.ts / publish-case.ts.')
}

main()
