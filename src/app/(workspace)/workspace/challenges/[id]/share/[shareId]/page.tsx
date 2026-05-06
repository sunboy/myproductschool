import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { SITE_NAME, SITE_URL } from '@/lib/seo/site'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSharedAttemptScorecard, type MoveKey } from '@/lib/share/attempt-scorecard'

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
  const scorecard = await getSharedAttemptScorecard(createAdminClient(), { challengeId: id, shareId })
  if (!scorecard) {
    return {
      title: 'Shared scorecard not found',
      robots: { index: false, follow: false },
    }
  }

  const title = `${scorecard.scoreLabel} on ${scorecard.challengeTitle}`
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
  const scorecard = await getSharedAttemptScorecard(createAdminClient(), { challengeId: id, shareId })
  if (!scorecard) notFound()

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL}/workspace/challenges/${id}/share/${shareId}`
  const shareText = `I scored ${scorecard.scoreLabel} on ${scorecard.challengeTitle} with HackProduct.`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`

  const levels = MOVE_ORDER.map(move => (
    scorecard.moveLevels.find(level => level.move === move) ?? { move, level: 1, progressPct: 0 }
  ))

  return (
    <main className="min-h-screen bg-[#1f2a23] px-5 py-8 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:grid md:grid-cols-[420px_1fr] md:items-center">
        <section className="rounded-xl border border-white/12 bg-[#f8f3ea] p-6 text-[#233028] shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HatchGlyph size={34} state="celebrating" className="text-primary" />
              <span className="font-headline text-lg font-bold text-primary">HackProduct</span>
            </div>
            <span className="rounded-full bg-[#dfe8d8] px-3 py-1 text-xs font-bold text-[#2d5a3d]">
              Scorecard
            </span>
          </div>

          <div className="mt-8 text-center">
            <div className="font-headline text-[72px] font-black leading-none text-primary">
              {scorecard.scoreLabel}
            </div>
            <p className="mt-3 text-base font-bold">{scorecard.challengeTitle}</p>
            <p className="mt-1 text-sm text-[#647064]">{scorecard.gradeLabel ?? formatDuration(scorecard.timeSpentSeconds)}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {levels.map(level => (
              <div key={level.move} className="rounded-lg border border-[#d7d2c8] bg-white/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-[#647064]">{titleCase(level.move)}</span>
                  <span className="font-headline text-xl font-bold text-[#2d5a3d]">L{level.level}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#e7e0d5]">
                  <div className="h-full rounded-full bg-[#4a7c59]" style={{ width: `${level.progressPct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-[#d7d2c8] pt-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8274]">hackproduct.dev</p>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c4a66a]">Shared practice result</p>
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
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-[#1f2a23]">
              Share to X
            </a>
            <Link href="/signup" className="inline-flex items-center justify-center rounded-full border border-white/24 px-5 py-3 text-sm font-bold text-white">
              Try HackProduct
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
