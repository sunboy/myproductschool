import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { toPublicReportPayload, type RawReportSnapshot } from '@/lib/casebook/public-report-projection'
import { ReportSnapshot } from './ReportSnapshot'

// PLACEMENT (Phase 5, devBB, settled by orchestrator): the brief specified
// the public URL as /r/[slug], but src/app/r/[code]/route.ts already owns
// the entire /r/* path as the live affiliate short-link redirect handler —
// a page.tsx cannot coexist with that route.ts at the same segment, and a
// different dynamic param name at the same level is also a Next.js
// build-time conflict. This page is FINAL at /reports/[slug] (plural),
// chosen over teaching /r/[code]/route.ts to dispatch cc_reports lookups:
// that alternative would have put a DB lookup on every affiliate click's
// hot path and permanently coupled the affiliate code namespace to report
// slugs, to preserve a URL nobody had published yet. Do not move this back
// under /r/ — that route stays the affiliate handler's alone.
//
// Renders purely from the frozen `snapshot` on cc_reports, projected
// through toPublicReportPayload before it ever reaches JSX (see that
// module's doc comment for why: the raw snapshot's move-diff detail is the
// case's answer key and must never reach a logged-out page).

interface PublicReportPageProps {
  params: Promise<{ slug: string }>
}

// Reads with the ANON-KEY server client, not the service-role admin client,
// so RLS applies as the `anon` role (migration
// 20260828090000_casebook_reports_public_read.sql scopes the SELECT policy
// to is_public = true rows only) — see the API route's matching comment for
// why service-role has no place on an unauthenticated read path. The
// `.eq('is_public', true)` filter is defense in depth on top of that
// policy, not a substitute for it.
async function loadReport(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cc_reports')
    .select('slug, snapshot, og_image_path, created_at')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (error || !data) return null
  return data as { slug: string; snapshot: RawReportSnapshot; og_image_path: string | null; created_at: string }
}

export async function generateMetadata({ params }: PublicReportPageProps): Promise<Metadata> {
  const { slug } = await params
  const row = await loadReport(slug)

  if (!row) {
    return { title: 'Report not found', robots: { index: false, follow: false } }
  }

  const report = toPublicReportPayload(row.snapshot)
  const title = `Feedback on ${report.case_title}`
  const description = 'A completed Challenge, reviewed and filed on HackProduct.'
  const url = `${SITE_URL}/reports/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, creator: '@hackproduct' },
  }
}

/**
 * Public, logged-out report page. Renders ONLY from the frozen `snapshot`
 * JSONB on cc_reports, passed through toPublicReportPayload — never
 * re-reads cc_case_attempts, cc_cases, or any other live table, and never
 * passes the raw snapshot to a component. The snapshot is authoritative by
 * design: it is written once when a report is filed and stays fixed even if
 * the underlying attempt is later re-graded or deleted.
 */
export default async function PublicReportPage({ params }: PublicReportPageProps) {
  const { slug } = await params
  const row = await loadReport(slug)
  if (!row) notFound()

  const report = toPublicReportPayload(row.snapshot)

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <ReportSnapshot report={report} />

        <div className="mt-8 flex justify-center">
          <Link
            href="/signup"
            className="rounded-full bg-primary px-6 py-2.5 font-label text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            Try HackProduct
          </Link>
        </div>
      </div>
    </main>
  )
}
