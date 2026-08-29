import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth-helpers'
import { withRoute } from '@/lib/api/withRoute'
import { apiError } from '@/lib/api/error'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildRawReportSnapshot,
  toPublicReportPayload,
  type GradedAttemptForSnapshot,
  type CaseForSnapshot,
} from '@/lib/casebook/public-report-projection'

export const dynamic = 'force-dynamic'

// cc_case_attempts.id is a real uuid — see the identical note in the
// sibling /file route. cc_reports.slug (below) is a TEXT PRIMARY KEY short
// random slug, not a uuid — the two ids are never the same kind of string.
const AttemptIdSchema = z.string().uuid()

interface CaseAttemptRow {
  id: string
  user_id: string
  case_id: string
  status: string
  verdict: GradedAttemptForSnapshot['verdict']
  diff: GradedAttemptForSnapshot['diff']
  grade: GradedAttemptForSnapshot['grade']
  report: { narrative_md?: string; chart_specs?: unknown[]; shared_slug?: string } | null
}

interface CaseRow {
  title: string
  hook: string
}

function isUniqueViolation(error: { code?: string } | null | undefined) {
  return error?.code === '23505'
}

// Short, unguessable, non-sequential slug. cc_reports's public-read RLS
// policy (20260828090000_casebook_reports_public_read.sql) makes any row
// with is_public = true readable by anyone who holds its slug — the slug
// IS the access-control token, not a cosmetic id. crypto.randomUUID() twice
// concatenated gives 244 bits of randomness before trimming, matching the
// precedent in src/lib/share/attempt-scorecard.ts's createShareId. Trimmed
// to 24 chars (96+ bits) — short enough for a shareable URL, still
// astronomically unguessable, and never derived from attemptId/userId/case
// slug so it can't be computed from data an attacker might already have.
function createReportSlug(): string {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '').slice(0, 24)
}

// POST /api/casebook/case/[attemptId]/share
//
// Publishes a graded Challenge attempt's report as a public, logged-out
// shareable page at /reports/[slug]. This is the writer half of the share
// flow — GET /api/casebook/reports/[slug] and the /reports/[slug] page
// (both owned by another dev) already read cc_reports; nothing wrote it
// until this route.
//
// IDEMPOTENCY: publishing twice must not create two rows for one attempt.
// cc_case_attempts.report.shared_slug (already reserved in the column
// comment on cc_case_attempts.report, see the 20260826100100 migration) is
// the durable pointer from attempt -> slug. On a repeat call this route
// reads that pointer first and, if the referenced cc_reports row still
// exists, returns its slug unchanged rather than inserting a second row.
// This also means re-publishing an attempt never rotates its slug — a link
// a learner already shared keeps working.
//
// SNAPSHOT SAFETY: buildRawReportSnapshot (public-report-projection.ts) maps
// the graded attempt + its case onto the RawReportSnapshot shape, then this
// route ALWAYS runs that through toPublicReportPayload — the same allowlist
// GET /api/casebook/reports/[slug] uses to read — before the snapshot is
// written. cc_case_attempts.report.narrative_md (which contains a "Moves you
// missed" section naming expert moves verbatim, per report-narrative.ts) and
// cc_case_attempts.diff.matched/.missed/.extra (raw expert move ids/labels)
// are NEVER copied into the snapshot; only the aggregate counts
// toPublicReportPayload derives from them survive. See that module's doc
// comment for the full leak this prevents.
export const POST = withRoute(async (
  _req,
  { params }: { params: Promise<{ attemptId: string }> },
) => {
  const { attemptId: rawAttemptId } = await params
  const parsedId = AttemptIdSchema.safeParse(rawAttemptId)
  if (!parsedId.success) {
    return apiError(400, 'invalid_attempt_id', 'Invalid attempt id')
  }
  const attemptId = parsedId.data

  const { user, error: authError } = await requireAuth()
  if (authError) return authError

  const admin = createAdminClient()

  const attemptResult = await admin
    .from('cc_case_attempts')
    .select('id, user_id, case_id, status, verdict, diff, grade, report')
    .eq('id', attemptId)
    .maybeSingle()

  if (attemptResult.error) {
    return apiError(500, 'attempt_query_failed', attemptResult.error.message)
  }
  const attempt = attemptResult.data as CaseAttemptRow | null
  if (!attempt) {
    return apiError(404, 'not_found', 'Attempt not found')
  }
  // Ownership check happens before the status check so a non-owner probing
  // attempt ids learns nothing about an attempt's grading state either.
  if (attempt.user_id !== user.id) {
    return apiError(404, 'not_found', 'Attempt not found')
  }
  if (attempt.status !== 'graded') {
    return apiError(409, 'invalid_status', `Attempt is ${attempt.status}, must be graded before it can be shared`)
  }

  // --- Idempotency: an existing shared_slug wins if its cc_reports row is still there ---
  const existingSlug = attempt.report?.shared_slug
  if (existingSlug) {
    const existingReport = await admin
      .from('cc_reports')
      .select('slug')
      .eq('slug', existingSlug)
      .eq('case_attempt_id', attemptId)
      .maybeSingle()

    if (existingReport.error) {
      return apiError(500, 'report_query_failed', existingReport.error.message)
    }
    if (existingReport.data) {
      return NextResponse.json({ slug: existingReport.data.slug as string, already_published: true })
    }
    // shared_slug pointed at a row that no longer exists (e.g. manually
    // deleted) — fall through and publish a fresh one below.
  }

  const caseResult = await admin
    .from('cc_cases')
    .select('title, hook')
    .eq('id', attempt.case_id)
    .maybeSingle()

  if (caseResult.error || !caseResult.data) {
    return apiError(500, 'case_load_failed', 'Module content not found')
  }
  const caseRow = caseResult.data as CaseRow

  const rawSnapshot = buildRawReportSnapshot(
    { verdict: attempt.verdict, diff: attempt.diff, grade: attempt.grade },
    caseRow as unknown as CaseForSnapshot,
  )
  // Same allowlist the public read route re-applies — see this route's doc
  // comment. The stored snapshot is the already-safe payload, not the raw one.
  const snapshot = toPublicReportPayload(rawSnapshot)

  let slug: string | null = null
  for (let tries = 0; tries < 5 && !slug; tries += 1) {
    const candidate = createReportSlug()
    const insertResult = await admin
      .from('cc_reports')
      .insert({
        slug: candidate,
        case_attempt_id: attemptId,
        user_id: user.id,
        snapshot,
        is_public: true,
      })
      .select('slug')
      .maybeSingle()

    if (insertResult.data) {
      slug = insertResult.data.slug as string
      break
    }
    if (isUniqueViolation(insertResult.error)) {
      continue // slug collision on the primary key — retry with a new one
    }
    if (insertResult.error) {
      return apiError(500, 'report_insert_failed', insertResult.error.message)
    }
  }

  if (!slug) {
    return apiError(500, 'slug_generation_failed', 'Could not generate a unique report slug')
  }

  const updatedReport = { ...(attempt.report ?? {}), shared_slug: slug }
  const writeBackResult = await admin
    .from('cc_case_attempts')
    .update({ report: updatedReport })
    .eq('id', attemptId)

  if (writeBackResult.error) {
    // The cc_reports row is already live and correct; the pointer write-back
    // failing just means a future publish call won't find it via
    // shared_slug and will (harmlessly, per the idempotency note above)
    // fall through to a fresh insert next time. Not worth failing the
    // request the learner is waiting on for this.
    return NextResponse.json({ slug, already_published: false, pointer_write_back_failed: true })
  }

  return NextResponse.json({ slug, already_published: false })
}, { name: 'casebook.case.share' })
