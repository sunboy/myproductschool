// Casebook Loop — projects a filed report's frozen snapshot down to what is
// safe to render on the LOGGED-OUT public share page.
//
// THE LEAK THIS PREVENTS: cc_case_attempts.diff (move-diff.ts's MoveDiffResult)
// carries `missed: [{id, label}]` — the expert reference moves the learner did
// NOT make, with their labels. A public page that renders that list IS the
// answer key to the case, readable by anyone holding a slug and potentially
// search-indexed. `matched`/`extra` carry the same expert-vocabulary risk.
// Objective evidence strings can also quote transcript detail. None of that
// belongs on a page that renders with no auth check.
//
// RULE: this module is the ONLY place allowed to read a raw report snapshot
// and produce the public payload. It builds that payload by explicit
// field-by-field construction — it NEVER spreads its input — so a future
// column added to the snapshot (or to cc_case_attempts.report) cannot
// silently ride along onto the public page. GET /api/casebook/reports/[slug]
// and the /reports/[slug] page both call this before returning/rendering
// anything, even though the upstream /file route (owned by another dev) is
// also expected to write an already-safe snapshot — this is defense in
// depth at the read boundary, not a substitute for that.
//
// WRITE SIDE (POST /api/casebook/case/[attemptId]/share, Phase 5): that route
// assembles a RawReportSnapshot from cc_case_attempts + cc_cases columns via
// buildRawReportSnapshot below, then ALWAYS passes it through
// toPublicReportPayload before writing cc_reports.snapshot. The stored
// snapshot is therefore already the safe, allowlisted shape — the read route
// re-projecting it is a no-op today and a second guard tomorrow. There is
// deliberately no separate/parallel projection on the write side: one
// allowlist, enforced at both ends.

/** Loose shape of whatever is stored in cc_reports.snapshot. Every field is
 *  optional because the writer (another dev's /file route) is still being
 *  built — this module must degrade safely if a field is absent, and must
 *  actively DROP any field it does not explicitly allow through below. */
export interface RawReportSnapshot {
  case_title?: unknown
  hook?: unknown
  narrative_md?: unknown
  grade_label?: unknown
  total_score?: unknown
  verdict?: { cause?: unknown; confidence?: unknown; falsifiable_check?: unknown }
  diff?: {
    matched?: unknown
    missed?: unknown
    extra?: unknown
    expert_moves_total?: unknown
  }
  objectives?: unknown
  [key: string]: unknown
}

export interface PublicReportPayload {
  case_title: string
  hook: string
  grade_label: string
  total_score: number | null
  verdict_cause: string | null
  verdict_confidence: 'high' | 'medium' | 'low' | null
  /** Aggregate only — "matched 9 of 14" — never the move list. */
  moves_matched_count: number | null
  moves_total_count: number | null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asConfidence(value: unknown): 'high' | 'medium' | 'low' | null {
  return value === 'high' || value === 'medium' || value === 'low' ? value : null
}

/**
 * Builds the public payload from a raw snapshot. Field-by-field only — see
 * the module doc comment. Anything not explicitly copied here (narrative_md
 * with its "moves you missed" section, diff.matched/diff.missed entries,
 * objective evidence text, rubric content) is dropped, not forwarded.
 */
export function toPublicReportPayload(snapshot: RawReportSnapshot | null | undefined): PublicReportPayload {
  const s = snapshot ?? {}
  const matchedCount = Array.isArray(s.diff?.matched) ? s.diff!.matched!.length : null
  const totalCount = asFiniteNumber(s.diff?.expert_moves_total)

  return {
    case_title: asString(s.case_title, 'Challenge report'),
    hook: asString(s.hook, ''),
    grade_label: asString(s.grade_label, ''),
    total_score: asFiniteNumber(s.total_score),
    verdict_cause: typeof s.verdict?.cause === 'string' ? s.verdict.cause : null,
    verdict_confidence: asConfidence(s.verdict?.confidence),
    moves_matched_count: matchedCount,
    moves_total_count: totalCount,
  }
}

/** Minimal shape of a graded cc_case_attempts row needed to build a snapshot.
 *  Intentionally narrow — this is NOT `cc_case_attempts`'s full row type, so a
 *  caller cannot accidentally pass (and this function cannot accidentally
 *  read) columns like `evidence`, `transcript_ref`, or `resume_context` that
 *  have no business anywhere near a public payload. */
export interface GradedAttemptForSnapshot {
  verdict: { cause?: unknown; confidence?: unknown; falsifiable_check?: unknown } | null
  diff: {
    matched?: Array<{ id: string; label: string }>
    missed?: Array<{ id: string; label: string }>
    extra?: unknown
    expert_moves_total?: number
  } | null
  grade: { total_score?: unknown; grade_label?: unknown } | null
}

/** Minimal shape of a cc_cases row needed to build a snapshot. */
export interface CaseForSnapshot {
  title: string
  hook: string
}

/**
 * Assembles a RawReportSnapshot from a graded attempt + its case, for the
 * publish/share writer. This is the single mapping from
 * cc_case_attempts/cc_cases columns into the snapshot shape — used by
 * POST /api/casebook/case/[attemptId]/share. The caller MUST still pass the
 * result through toPublicReportPayload before writing cc_reports.snapshot;
 * this function only shapes the input, it does not itself allowlist.
 */
export function buildRawReportSnapshot(
  attempt: GradedAttemptForSnapshot,
  caseRow: CaseForSnapshot,
): RawReportSnapshot {
  return {
    case_title: caseRow.title,
    hook: caseRow.hook,
    grade_label: attempt.grade?.grade_label,
    total_score: attempt.grade?.total_score,
    verdict: {
      cause: attempt.verdict?.cause,
      confidence: attempt.verdict?.confidence,
      falsifiable_check: attempt.verdict?.falsifiable_check,
    },
    diff: {
      matched: attempt.diff?.matched,
      missed: attempt.diff?.missed,
      extra: attempt.diff?.extra,
      expert_moves_total: attempt.diff?.expert_moves_total,
    },
  }
}
