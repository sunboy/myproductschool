// Casebook Loop — server-side projections for the expert-session replay.
//
// cc_expert_sessions.decision_points is the complete answer key for paid
// content (option `quality`, `explanation`, `expert_option_id`,
// `expert_move_id`). These helpers build explicit allowlisted response
// objects field-by-field — NEVER spread a raw DB row into a response, or the
// answer key leaks into the JSON body regardless of any client-side
// "watch only" flag.

export interface TranscriptTurn {
  t: number
  role: 'user' | 'assistant' | 'tool'
  text: string
  annotation?: { title: string; body: string }
}

export interface DecisionPointOption {
  id: string
  text: string
  quality: 'best' | 'good_but_incomplete' | 'surface' | 'plausible_wrong'
  explanation: string
}

export interface DecisionPoint {
  id: string
  t: number
  question: string
  options: DecisionPointOption[]
  expert_option_id: string
  expert_move_id: string
}

export interface ExpertMove {
  id: string
  t: number
  label: string
  description: string
}

export interface ExpertSessionRow {
  id: string
  case_id: string
  duration_s: number
  transcript: TranscriptTurn[]
  moves: ExpertMove[]
  decision_points: DecisionPoint[]
}

export interface CaseRow {
  id: string
  title: string
  hook: string
}

// Teaser: first 3 minutes only. Public, unauthenticated, watch-only.
export const TEASER_WINDOW_S = 180

function projectCase(caseRow: CaseRow) {
  return {
    id: caseRow.id,
    title: caseRow.title,
    hook: caseRow.hook,
  }
}

function projectTranscriptTurn(turn: TranscriptTurn) {
  return {
    t: turn.t,
    role: turn.role,
    text: turn.text,
  }
}

/**
 * Public teaser projection. Returns ONLY: case {id,title,hook}, duration_s,
 * transcript turns truncated to t <= TEASER_WINDOW_S, and decision points
 * (id, t, question only — no options, no answer key) within that window.
 */
export function projectTeaserReplay(caseRow: CaseRow, session: ExpertSessionRow) {
  const transcript = session.transcript
    .filter((turn) => turn.t <= TEASER_WINDOW_S)
    .map(projectTranscriptTurn)

  const decisionPoints = session.decision_points
    .filter((dp) => dp.t <= TEASER_WINDOW_S)
    .map((dp) => ({
      id: dp.id,
      t: dp.t,
      question: dp.question,
    }))

  return {
    case: projectCase(caseRow),
    duration_s: session.duration_s,
    transcript,
    decision_points: decisionPoints,
  }
}

/**
 * Authenticated full-mode projection. Full transcript + full moves, and
 * decision points with options reduced to {id, text} only.
 *
 * STILL never includes: quality, explanation, expert_option_id,
 * expert_move_id, or queries. Those are the reveal and belong to the
 * predictions/reveal endpoint, served only after the player commits a
 * choice — surfacing them here defeats the prediction mechanic entirely.
 */
export function projectFullReplay(caseRow: CaseRow, session: ExpertSessionRow) {
  const transcript = session.transcript.map(projectTranscriptTurn)

  const moves = session.moves.map((move) => ({
    id: move.id,
    t: move.t,
    label: move.label,
    description: move.description,
  }))

  const decisionPoints = session.decision_points.map((dp) => ({
    id: dp.id,
    t: dp.t,
    question: dp.question,
    options: dp.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
    })),
  }))

  return {
    case: projectCase(caseRow),
    duration_s: session.duration_s,
    transcript,
    moves,
    decision_points: decisionPoints,
  }
}
