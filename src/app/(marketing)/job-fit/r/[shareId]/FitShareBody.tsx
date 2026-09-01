'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

import { HatchMascotSprite } from '@/components/hatch/HatchMascotSprite'
import { FitReportDashboard } from '@/components/careerops/report/FitReportDashboard'
import { FitShareActions } from '@/components/careerops/public/FitShareActions'
import { ReportButton } from '@/components/feedback/ReportButton'
import { motionVariants } from '@/components/motion/tokens'
import { fromSharedFitReport } from '@/components/careerops/report/types'
import { SITE_NAME } from '@/lib/seo/site'
import type { SharedFitReport } from '@/lib/careerops/public/types'

interface FitShareBodyProps {
  report: SharedFitReport
  shareId: string
  shareUrl: string
  shareText: string
}

export function FitShareBody({ report, shareId, shareUrl, shareText }: FitShareBodyProps) {
  const isRoast = report.mode === 'resume_roast'
  const role = [report.roleTitle, report.company].filter(Boolean).join(' at ')

  const hatchState =
    isRoast && report.grade === 'F'
      ? 'failed'
      : (report.score ?? 0) >= 70
        ? 'celebrating'
        : 'speaking'

  return (
    <main className="min-h-screen bg-ink px-5 py-8 text-on-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:grid md:grid-cols-[440px_1fr] md:items-start">
        {/* Report card — cream surface, ink hero nested inside */}
        <section className="rounded-xl bg-surface-container-low p-5 text-on-surface shadow-2xl">
          {/* Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HatchMascotSprite state={hatchState} size={40} />
              <span className="font-headline text-lg font-bold text-primary">{SITE_NAME}</span>
            </div>
            <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-surface">
              {isRoast ? 'Resume roast' : 'Job fit report'}
            </span>
          </div>

          {/* Dashboard — ink hero card + cascade */}
          <div className="mt-5">
            <FitReportDashboard variant="share" data={fromSharedFitReport(report)} />
          </div>

          {/* Footer watermark */}
          <div className="mt-6 border-t border-outline-variant pt-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
              hackproduct.com/job-fit
            </p>
          </div>
        </section>

        {/* Pitch + actions */}
        <motion.section
          variants={motionVariants.list}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={motionVariants.listItem}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-tertiary-container">
              {isRoast ? 'Shared resume teardown' : 'Shared job fit analysis'}
            </p>
            <h1 className="mt-3 font-headline text-4xl font-black leading-tight md:text-5xl">
              {isRoast ? 'A resume, read honestly.' : 'The bar behind the listing.'}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-on-ink-muted">
              {isRoast
                ? 'Hatch reads a resume the way a tired hiring manager does: looking for evidence, scope, and a reason to keep reading. Every finding points at a fixable line.'
                : 'Hatch reads a job description for what the interview loop actually tests, then maps each demanded discipline to a readiness bar. The score is a snapshot; the gaps are the plan.'}
            </p>
          </motion.div>

          {isRoast && (report.roast?.strengths.length ?? 0) > 0 && (
            <motion.div variants={motionVariants.listItem} className="flex flex-col gap-2">
              {report.roast!.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm leading-6 text-on-ink-muted">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-accent-lime" />
                  {s}
                </div>
              ))}
            </motion.div>
          )}

          {!isRoast && report.gaps.length > 0 && (
            <motion.div variants={motionVariants.listItem} className="flex flex-col gap-2">
              {report.gaps.slice(0, 3).map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-sm leading-6 text-on-ink-muted">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-tertiary-container" />
                  {g}
                </div>
              ))}
            </motion.div>
          )}

          <motion.div
            variants={motionVariants.listItem}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            <Link
              href="/job-fit"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-ink no-underline"
            >
              Get your own score
            </Link>
            <Link
              href="/signup?redirectTo=/career-ops"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary no-underline"
            >
              Sign up and build the fix plan
            </Link>
            <ReportButton
              targetType="share_fit_report"
              targetId={shareId}
              targetUrl={`/job-fit/r/${shareId}`}
              label="Report"
              metadata={{ mode: report.mode }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-border px-5 py-3 text-sm font-bold text-on-ink hover:bg-ink-container disabled:opacity-50"
            />
          </motion.div>

          <motion.div variants={motionVariants.listItem}>
            <FitShareActions shareUrl={shareUrl} shareText={shareText} mode={report.mode} />
          </motion.div>
        </motion.section>
      </div>
    </main>
  )
}
