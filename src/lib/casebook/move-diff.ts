// Casebook Loop — pure move-diff set logic.
//
// Compares the set of expert move ids a learner's session actually hit against
// the reference move list on cc_expert_sessions.moves, and produces the
// `cc_case_attempts.diff` JSONB shape: {matched, missed, extra, expert_moves_total}.
//
// This module is deliberately pure set logic with NO fuzzy matching and NO LLM
// call. Deciding WHICH expert move ids a learner's transcript demonstrates is a
// separate, fuzzy step (case-grader.ts calls the grading skill for that and
// returns a `matchedExpertMoveIds: string[]`); this module only diffs two
// already-resolved id sets. Keeping the boundary here is what makes the diff
// logic exhaustively unit-testable — see tests/lib/casebook/move-diff.test.ts.

export interface ExpertMove {
  id: string
  t: number
  label: string
  description: string
}

export interface MoveDiffResult {
  /** Expert moves the learner's session demonstrated, id + label, in expert move order. */
  matched: Array<{ id: string; label: string }>
  /** Expert moves the learner's session never demonstrated, id + label, in expert move order. */
  missed: Array<{ id: string; label: string }>
  /** Learner-identified move ids that do not correspond to any expert move id (extra/off-script moves). */
  extra: string[]
  expert_moves_total: number
}

/**
 * Diffs a learner's matched expert-move ids against the case's reference move
 * list. `learnerMoveIds` may contain duplicates or ids outside the expert list
 * (an over-eager grader hit) — both are handled: duplicates collapse, unknown
 * ids land in `extra` rather than being silently dropped or crashing.
 */
export function computeMoveDiff(
  learnerMoveIds: string[],
  expertMoves: ExpertMove[],
): MoveDiffResult {
  const learnerSet = new Set(learnerMoveIds)
  const expertIds = new Set(expertMoves.map((m) => m.id))

  const matched: Array<{ id: string; label: string }> = []
  const missed: Array<{ id: string; label: string }> = []

  for (const move of expertMoves) {
    const entry = { id: move.id, label: move.label }
    if (learnerSet.has(move.id)) {
      matched.push(entry)
    } else {
      missed.push(entry)
    }
  }

  const extra = Array.from(learnerSet).filter((id) => !expertIds.has(id)).sort()

  return {
    matched,
    missed,
    extra,
    expert_moves_total: expertMoves.length,
  }
}
