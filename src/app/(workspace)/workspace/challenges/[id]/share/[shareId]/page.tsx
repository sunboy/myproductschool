import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ReportButton } from '@/components/feedback/ReportButton'
import { HatchImage } from '@/components/redesign/HatchImage'
import { SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSharedAttemptScorecard, type MoveKey } from '@/lib/share/attempt-scorecard'
import { getSharedAnalyticsReport } from '@/lib/share/analytics-report'
import { SharedAnalyticsArtifact } from '@/components/analytics/SharedAnalyticsArtifact'

interface PublicSharePageProps {
  params: Promise<{ id: string; shareId: string }>
}

const MOVE_ORDER: MoveKey[] = ['frame', 'list', 'optimize', 'win']

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1)
}

function formatDuration(seconds: number | null) {
  if (!seconds) return 'Practice session'
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}m ${remaining.toString().padStart(2, '0')}s`
}

export async function generateMetadata({ params }: PublicSharePageProps): Promise<Metadata> {
  const { id, shareId } = await params

  const report = await getSharedAnalyticsReport(createAdminClient(), { challengeId: id, shareId })
  if (report) {
    const title = `Data analysis: ${report.challengeTitle}`
    const description = 'An analytics report produced by driving Claude Code on a live dataset with HackProduct.'
    const url = `${SITE_URL}/workspace/challenges/${id}/share/${shareId}`
    return {
      title, description, alternates: { canonical: url },
      openGraph: { title, description, url, siteName: SITE_NAME, type: 'website' },
      twitter: { card: 'summary_large_image', title, description, creator: '@hackproduct' },
    }
  }

  const scorecard = await getSharedAttemptScorecard(createAdminClient(), { challengeId: id, shareId })
  if (!scorecard) {
    return {
      title: 'Shared scorecard not found',
      robots: { index: false, follow: false },
    }
  }

  const title = `My work on ${scorecard.challengeTitle}`
  const description = `A HackProduct practice scorecard with FLOW levels across Frame, List, Optimize, and Win.`
  const url = `${SITE_URL}/workspace/challenges/${id}/share/${shareId}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@hackproduct',
    },
  }
}

export default async function PublicShareScoreCardPage({ params }: PublicSharePageProps) {
  const { id, shareId } = await params

  // Claude Code Analytics shares render the generated report, not the FLOW scorecard.
  const report = await getSharedAnalyticsReport(createAdminClient(), { challengeId: id, shareId })
  if (report) {
    const reportShareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL}/workspace/challenges/${id}/share/${shareId}`
    const reportShareText = `My data analysis on ${report.challengeTitle}, done by driving Claude Code on HackProduct.`
    const reportLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reportShareUrl)}`
    const reportTwitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(reportShareUrl)}&text=${encodeURIComponent(reportShareText)}`
    return (
      <main className="min-h-screen bg-hero-forest px-5 py-8 text-white">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HatchImage size={32} state="celebrating" />
              <span className="font-headline text-lg font-bold">HackProduct</span>
            </div>
            <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed-variant">Analytics report</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-tertiary-container">Shared analysis</p>
            <h1 className="mt-2 font-headline text-3xl font-black leading-tight md:text-4xl">{report.challengeTitle}</h1>
            <p className="mt-2 text-sm text-white/72">
              {report.gradeLabel ? `Graded ${report.gradeLabel}` : 'Driven on a live BigQuery dataset with Claude Code.'}
            </p>
          </div>
          <SharedAnalyticsArtifact
            reportMarkdown={report.reportMarkdown}
            dimensions={report.dimensions}
            overallNote={report.overallNote}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={reportLinkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full bg-[#0a66c2] px-5 py-3 text-sm font-bold text-white">Share to LinkedIn</a>
            <a href={reportTwitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-hero-forest">Share to X</a>
            <Link href="/signup" className="inline-flex items-center justify-center rounded-full border border-white/24 px-5 py-3 text-sm font-bold text-white">Try HackProduct</Link>
          </div>
        </div>
      </main>
    )
  }

  const scorecard = await getSharedAttemptScorecard(createAdminClient(), { challengeId: id, shareId })
  if (!scorecard) notFound()

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL}/workspace/challenges/${id}/share/${shareId}`
  const shareText = `Here is my work on ${scorecard.challengeTitle} with HackProduct.`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`

  const levels = MOVE_ORDER.map(move => (
    scorecard.moveLevels.find(level => level.move === move) ?? { move, level: 1, progressPct: 0 }
  ))

  return (
    <main className="min-h-screen bg-hero-forest px-5 py-8 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:grid md:grid-cols-[420px_1fr] md:items-center">
        <section className="rounded-xl border border-white/12 bg-surface-container-low p-6 text-on-background shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HatchImage size={34} state="celebrating" />
              <span className="font-headline text-lg font-bold text-primary">HackProduct</span>
            </div>
            <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed-variant">
              Shared work
            </span>
          </div>

          <div className="mt-8 text-center">
            {scorecard.scorePercent !== null && <div className="font-headline text-[48px] font-medium leading-none text-primary">{scorecard.scoreLabel}</div>}
            <p className="mt-3 text-base font-bold">{scorecard.challengeTitle}</p>
            <p className="mt-1 text-sm text-outline">{scorecard.gradeLabel ?? formatDuration(scorecard.timeSpentSeconds)}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {levels.map(level => (
              <div key={level.move} className="rounded-lg border border-outline-variant bg-white/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-outline">{titleCase(level.move)}</span>
                  <span className="font-headline text-xl font-bold text-on-primary-fixed-variant">L{level.level}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-surface-container-highest">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${level.progressPct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-outline-variant pt-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-muted">hackproduct.dev</p>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-tertiary-container">Shared practice result</p>
            <h1 className="mt-3 font-headline text-4xl font-black leading-tight md:text-5xl">
              Product thinking scorecard.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
              Hatch evaluates how clearly a learner frames the problem, lists the right signals, optimizes tradeoffs, and wins stakeholder confidence.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full bg-[#0a66c2] px-5 py-3 text-sm font-bold text-white">
              Share to LinkedIn
            </a>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-hero-forest">
              Share to X
            </a>
            <Link href="/signup" className="inline-flex items-center justify-center rounded-full border border-white/24 px-5 py-3 text-sm font-bold text-white">
              Try HackProduct
            </Link>
            <ReportButton
              targetType="share_scorecard"
              targetId={shareId}
              targetUrl={`/workspace/challenges/${id}/share/${shareId}`}
              label="Report"
              metadata={{
                challengeId: id,
                scoreLabel: scorecard.scoreLabel,
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/24 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
            />
          </div>
        </section>
      </div>
    </main>
  )
}
