import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { FitShareActions } from '@/components/careerops/public/FitShareActions'
import { ReportButton } from '@/components/feedback/ReportButton'
import { SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSharedFitReport } from '@/lib/careerops/public/share'
import { EVENT_FIT_SHARE_VIEWED } from '@/lib/posthog/events'
import { captureServerImmediate } from '@/lib/posthog/server'

interface FitSharePageProps {
  params: Promise<{ shareId: string }>
}

export async function generateMetadata({ params }: FitSharePageProps): Promise<Metadata> {
  const { shareId } = await params
  const report = await getSharedFitReport(createAdminClient(), shareId)

  if (!report) {
    return { title: 'Shared report not found', robots: { index: false, follow: false } }
  }

  const role = [report.roleTitle, report.company].filter(Boolean).join(' at ')
  const title =
    report.mode === 'resume_roast'
      ? report.includeScore && report.grade
        ? `Resume roast: grade ${report.grade}`
        : 'Resume roast'
      : role
        ? `What it takes to land ${role}`
        : 'Job fit report'
  const description =
    report.mode === 'resume_roast'
      ? report.roast?.verdict_line || 'A line-by-line resume teardown by Hatch on HackProduct.'
      : 'The bar this role actually sets, per interview discipline, read by Hatch on HackProduct.'
  const url = `${SITE_URL}/job-fit/r/${shareId}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, creator: '@hackproduct' },
  }
}

export default async function FitSharePage({ params }: FitSharePageProps) {
  const { shareId } = await params
  const report = await getSharedFitReport(createAdminClient(), shareId)
  if (!report) notFound()

  await captureServerImmediate({
    distinctId: shareId,
    event: EVENT_FIT_SHARE_VIEWED,
    properties: { mode: report.mode },
  })

  const isRoast = report.mode === 'resume_roast'
  const showScore = report.includeScore && report.score != null && report.grade
  const role = [report.roleTitle, report.company].filter(Boolean).join(' at ')
  const demanded = report.readinessMap.filter((r) => r.demanded)
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL}/job-fit/r/${shareId}`
  const shareText = isRoast
    ? 'Hatch roasted my resume. The verdict is fair and it hurts.'
    : role
      ? `The real bar behind the ${role} listing, read by Hatch.`
      : 'The real bar behind a job listing, read by Hatch.'

  return (
    <main className="min-h-screen bg-[#1f2a23] px-5 py-8 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:grid md:grid-cols-[420px_1fr] md:items-center">
        {/* Report card */}
        <section className="rounded-xl border border-white/12 bg-[#f8f3ea] p-6 text-[#233028] shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HatchGlyph size={34} state={isRoast ? 'speaking' : 'reviewing'} className="text-primary" />
              <span className="font-headline text-lg font-bold text-primary">{SITE_NAME}</span>
            </div>
            <span className="rounded-full bg-[#dfe8d8] px-3 py-1 text-xs font-bold text-[#2d5a3d]">
              {isRoast ? 'Resume roast' : 'Job fit report'}
            </span>
          </div>

          <div className="mt-8 text-center">
            {showScore ? (
              <>
                <div className="font-headline text-[88px] font-black leading-none text-primary">{report.grade}</div>
                <p className="mt-2 text-2xl font-bold text-[#2d5a3d]">{report.score}/100</p>
              </>
            ) : (
              <div className="font-headline text-3xl font-black leading-tight text-primary">
                {role || 'The bar behind the listing'}
              </div>
            )}
            {showScore && role && <p className="mt-3 text-base font-bold">{role}</p>}
            {isRoast && report.roast?.verdict_line && (
              <p className="mt-4 text-base font-semibold italic leading-snug">&ldquo;{report.roast.verdict_line}&rdquo;</p>
            )}
          </div>

          {!isRoast && demanded.length > 0 && (
            <div className="mt-8 flex flex-col gap-2">
              {demanded.slice(0, 4).map((row) => (
                <div key={row.discipline} className="rounded-lg border border-[#d7d2c8] bg-white/70 p-3">
                  <div className="text-xs font-black uppercase tracking-[0.12em] text-[#647064]">
                    {row.discipline.replaceAll('_', ' ')}
                  </div>
                  {row.bar && <p className="mt-1 text-sm font-semibold leading-snug">{row.bar}</p>}
                </div>
              ))}
            </div>
          )}

          {isRoast && (report.roast?.sections.length ?? 0) > 0 && (
            <div className="mt-8 flex flex-col gap-2">
              {report.roast!.sections.slice(0, 3).map((section, i) => (
                <div key={i} className="rounded-lg border border-[#d7d2c8] bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{section.title}</span>
                    <span className="rounded-full bg-[#e7e0d5] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#647064]">
                      {section.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-snug text-[#4a4e4a]">{section.finding}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-[#d7d2c8] pt-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8274]">hackproduct.com/job-fit</p>
          </div>
        </section>

        {/* Pitch + actions */}
        <section className="space-y-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c4a66a]">
              {isRoast ? 'Shared resume teardown' : 'Shared job fit analysis'}
            </p>
            <h1 className="mt-3 font-headline text-4xl font-black leading-tight md:text-5xl">
              {isRoast ? 'A resume, read honestly.' : 'The bar behind the listing.'}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
              {isRoast
                ? 'Hatch reads a resume the way a tired hiring manager does: looking for evidence, scope, and a reason to keep reading. Every finding points at a fixable line.'
                : 'Hatch reads a job description for what the interview loop actually tests, then maps each demanded discipline to a readiness bar. The score is a snapshot; the gaps are the plan.'}
            </p>
          </div>

          {isRoast && (report.roast?.strengths.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              {report.roast!.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm leading-6 text-white/80">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#8ecf9e]" />
                  {s}
                </div>
              ))}
            </div>
          )}

          {!isRoast && report.gaps.length > 0 && (
            <div className="flex flex-col gap-2">
              {report.gaps.slice(0, 3).map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-sm leading-6 text-white/80">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: '#c4a66a' }} />
                  {g}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/job-fit"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-[#1f2a23] no-underline"
            >
              Get your own score
            </Link>
            <Link
              href="/signup?redirectTo=/career-ops"
              className="inline-flex items-center justify-center rounded-full bg-[#4a7c59] px-5 py-3 text-sm font-bold text-white no-underline"
            >
              Sign up and build the fix plan
            </Link>
            <ReportButton
              targetType="share_fit_report"
              targetId={shareId}
              targetUrl={`/job-fit/r/${shareId}`}
              label="Report"
              metadata={{ mode: report.mode }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/24 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
            />
          </div>

          <FitShareActions shareUrl={shareUrl} shareText={shareText} mode={report.mode} />
        </section>
      </div>
    </main>
  )
}
