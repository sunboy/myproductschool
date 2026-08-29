import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withRoute } from '@/lib/api/withRoute'
import { apiError } from '@/lib/api/error'
import { createClient } from '@/lib/supabase/server'
import { toPublicReportPayload, type RawReportSnapshot } from '@/lib/casebook/public-report-projection'

// Short random slug, not a uuid — see cc_reports.slug (TEXT PRIMARY KEY) in
// 20260826100100_casebook_user_state.sql.
const SlugSchema = z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'invalid slug')

// GET /api/casebook/reports/[slug]
//
// Public, logged-out read of a filed Challenge report. Deliberately has NO
// requireAuth() call — this is the API behind the public /reports/[slug]
// share page (see that page's PLACEMENT note for why not /r/[slug]) and
// must serve anonymous visitors.
//
// Reads with the ANON-KEY server client (createClient(), not
// createAdminClient()) so RLS applies as the `anon` role: migration
// 20260828090000_casebook_reports_public_read.sql adds a SELECT policy
// scoped to `is_public = true` rows only. That migration's own comment
// argues against a service-role read here — the bypass-everything key has
// no place on an unauthenticated path where a query-shape mistake would
// expose every row. The `.eq('is_public', true)` filter below is kept as
// defense in depth on top of the RLS policy, not a substitute for it. Until
// that migration is applied, every read here 404s (RLS denies with no
// matching row), which is the correct fail-closed behavior.
//
// `snapshot` is FROZEN report content written once when the report was
// filed — this route reads ONLY cc_reports and never joins back to
// cc_case_attempts or any other live table. The snapshot is the sole source
// of truth for what renders; it must never be reconstructed from live
// attempt state.
//
// ANSWER-KEY GUARD: the raw snapshot may carry expert move-diff detail
// (cc_case_attempts.diff.missed/.matched, which name the case's expert
// reference moves, and report.narrative_md's "Moves you missed" section) —
// rendering that on a logged-out public page would leak the case's answer
// key to anyone with the slug. This route never returns the raw snapshot;
// it projects through toPublicReportPayload, the single allowlisted,
// field-by-field builder for this surface (see that module's doc comment).
// This holds regardless of what the eventual cc_reports writer puts in
// `snapshot` — defense in depth at the read boundary, not a substitute for
// that writer also being careful.
export const GET = withRoute(async (
  _req,
  { params }: { params: Promise<{ slug: string }> }
) => {
  const { slug: rawSlug } = await params
  const parsedSlug = SlugSchema.safeParse(rawSlug)
  if (!parsedSlug.success) {
    return apiError(400, 'invalid_slug', 'Invalid report slug')
  }
  const slug = parsedSlug.data

  const supabase = await createClient()

  const reportResult = await supabase
    .from('cc_reports')
    .select('slug, snapshot, og_image_path, created_at')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (reportResult.error) {
    return apiError(500, 'report_query_failed', reportResult.error.message)
  }
  if (!reportResult.data) {
    return apiError(404, 'not_found', 'Report not found')
  }

  const report = toPublicReportPayload(reportResult.data.snapshot as RawReportSnapshot)

  return NextResponse.json({
    slug: reportResult.data.slug as string,
    report,
    og_image_path: reportResult.data.og_image_path as string | null,
    created_at: reportResult.data.created_at as string,
  })
}, { name: 'casebook.reports.get' })
