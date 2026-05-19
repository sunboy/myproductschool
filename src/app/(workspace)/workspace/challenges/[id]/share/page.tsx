import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { COMMUNITY_LENS_LABELS, formatCommunityDisplayName } from '@/lib/community-shared'
import type { CommunityDisplayMode, CommunityLensTag } from '@/lib/types'

type AttemptShareRow = {
  id: string
  user_id: string
  challenge_id: string
  total_score: number | null
  max_score: number | null
  grade_label: string | null
  feedback_json: Record<string, unknown> | null
  completed_at: string | null
  challenges?: { title?: string | null; slug?: string | null; move_tags?: string[] | null } | { title?: string | null; slug?: string | null; move_tags?: string[] | null }[] | null
  profiles?: { display_name?: string | null } | { display_name?: string | null }[] | null
}

type SubmissionShareRow = {
  display_mode: CommunityDisplayMode
  status: string
  lens_tag: CommunityLensTag
  excerpt: string
}

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function getXp(feedback: Record<string, unknown> | null): number {
  const raw = feedback?.xp_awarded
  return typeof raw === 'number' ? raw : 0
}

export default async function ShareScoreCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: attempt } = await admin
    .from('challenge_attempts')
    .select('id, user_id, challenge_id, total_score, max_score, grade_label, feedback_json, completed_at, challenges(title, slug, move_tags), profiles(display_name)')
    .eq('id', id)
    .eq('status', 'completed')
    .maybeSingle()

  if (!attempt) {
    return (
      <main className="min-h-screen bg-background px-4 py-12 text-on-surface">
        <div className="mx-auto max-w-lg rounded-2xl border border-outline-variant bg-surface p-8 text-center">
          <HatchGlyph size={44} state="idle" className="mx-auto text-primary" />
          <h1 className="mt-4 font-headline text-2xl font-bold">Share receipt not found</h1>
          <p className="mt-2 text-sm text-on-surface-variant">This practice receipt may be private or no longer available.</p>
          <Link href="/challenges" className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary">
            Try a challenge
          </Link>
        </div>
      </main>
    )
  }

  const attemptRow = attempt as AttemptShareRow
  const challenge = firstJoin(attemptRow.challenges)
  const profile = firstJoin(attemptRow.profiles)

  const { data: submission } = await admin
    .from('community_submissions')
    .select('display_mode, status, lens_tag, excerpt')
    .eq('attempt_id', id)
    .in('status', ['published', 'featured'])
    .maybeSingle()

  const publishedSubmission = submission as SubmissionShareRow | null
  const score = attemptRow.max_score && attemptRow.max_score > 0 && attemptRow.total_score !== null
    ? Math.round((attemptRow.total_score / attemptRow.max_score) * 100)
    : 0
  const move = challenge?.move_tags?.[0] ?? 'frame'
  const challengeHref = `/workspace/challenges/${challenge?.slug ?? attemptRow.challenge_id}`
  const displayName = formatCommunityDisplayName(publishedSubmission?.display_mode ?? 'anonymous', profile?.display_name ?? null)

  return (
    <main className="min-h-screen bg-inverse-surface px-4 py-8 text-on-surface">
      <Link href="/dashboard" className="fixed right-6 top-6 z-10 flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white">
        <span className="material-symbols-outlined text-lg">close</span>
        Close
      </Link>

      <div className="mx-auto flex w-full max-w-[460px] flex-col items-center gap-6">
        <section className="w-full overflow-hidden rounded-2xl border border-primary/25 bg-surface p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HatchGlyph size={32} state="idle" className="text-primary" />
              <span className="font-headline text-lg font-bold text-primary">HackProduct</span>
            </div>
            {publishedSubmission && (
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                {COMMUNITY_LENS_LABELS[publishedSubmission.lens_tag]}
              </span>
            )}
          </div>

          <div className="mt-8 text-center">
            <span className="font-headline text-[68px] font-bold leading-none text-primary">{score}</span>
            <span className="font-headline text-2xl text-primary/60">/100</span>
          </div>

          <div className="mt-3 text-center">
            <p className="px-4 text-base font-semibold text-on-surface">{challenge?.title ?? 'Practice challenge'}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-tertiary-container/30 px-3 py-1 text-xs font-bold capitalize text-tertiary">
              <span>{move}</span>
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface-variant">
            <span>{attemptRow.grade_label ?? 'Completed'}</span>
            <span className="text-outline-variant">|</span>
            <span>XP +{getXp(attemptRow.feedback_json)}</span>
            <span className="text-outline-variant">|</span>
            <span>{displayName}</span>
          </div>

          <div className="mt-6 border-t border-outline-variant/40 pt-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-outline-variant">hackproduct.com</p>
          </div>
        </section>

        <section className="w-full rounded-2xl border border-white/10 bg-white/10 p-5 text-white">
          <div className="flex items-start gap-3">
            <HatchGlyph size={46} state="celebrating" className="shrink-0 text-primary-fixed" />
            <div>
              <h2 className="font-headline text-lg font-bold">Try the same prompt first</h2>
              <p className="mt-1 text-sm leading-6 text-white/75">
                {publishedSubmission
                  ? 'Their answer is in the gallery, but the best comparison happens after you take your own swing.'
                  : 'This receipt is based on a real completed attempt. Take the challenge and compare your result.'}
              </p>
            </div>
          </div>
          <Link href={challengeHref} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-fixed px-4 py-3 text-sm font-bold text-on-primary-fixed hover:brightness-105">
            Attempt this challenge
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </section>
      </div>
    </main>
  )
}
