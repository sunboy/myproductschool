import Link from 'next/link'
import { ArrowRight, BookOpen, Check } from 'lucide-react'
import type { StudyPlanWithItems } from '@/lib/types'

interface PausedInterview {
  title: string
  href: string
  detail: string
}

export function ContinueLearning({
  plan,
  unavailable,
  pausedInterview,
}: {
  plan: StudyPlanWithItems | null
  unavailable: boolean
  pausedInterview: PausedInterview | null
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-hairline bg-card-bright p-5 shadow-[0_14px_42px_-34px_rgba(30,27,20,.35)] sm:p-6" aria-labelledby="continue-learning-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label text-xs font-extrabold uppercase tracking-[.11em] text-forest-700">Study path</p>
          <h2 id="continue-learning-title" className="mt-1 font-headline text-[24px] font-semibold tracking-[-.02em] text-ink-strong">Continue learning</h2>
        </div>
        <Link href="/explore/plans" className="mt-1 hidden items-center gap-1.5 text-sm font-bold text-forest-700 sm:inline-flex">All paths <ArrowRight size={15} /></Link>
      </div>

      {pausedInterview && (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-forest-700/20 bg-note-mint px-4 py-3.5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-forest-900">Paused interview</p>
            <p className="mt-0.5 truncate text-sm text-ink-strong">{pausedInterview.title}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{pausedInterview.detail}</p>
          </div>
          <Link href={pausedInterview.href} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-extrabold text-white">
            Resume interview <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {unavailable ? (
        <div className={`${pausedInterview ? 'mt-3' : 'mt-5'} rounded-xl border border-gold/35 bg-amber-soft px-4 py-5`}>
          <p className="text-base font-bold text-ink-strong">Your study path could not be loaded.</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-secondary">Open the learning library to continue from there.</p>
          <Link href="/explore/plans" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-forest-700">Open learning paths <ArrowRight size={15} /></Link>
        </div>
      ) : plan ? (
        <div className={`${pausedInterview ? 'mt-3' : 'mt-5'} grid gap-5 rounded-[18px] bg-page-field p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5`}>
          <div className="flex size-12 items-center justify-center rounded-xl bg-forest-900 text-mint-glow"><BookOpen size={22} strokeWidth={1.8} /></div>
          <div className="min-w-0">
            <h3 className="font-headline text-lg font-semibold leading-tight text-ink-strong">{plan.title}</h3>
            {plan.description ? <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-secondary">{plan.description}</p> : null}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-hairline">
                <div className="h-full rounded-full bg-forest-600" style={{ width: `${Math.max(0, Math.min(100, plan.progress_percentage))}%` }} />
              </div>
              <span className="text-xs font-extrabold tabular-nums text-forest-700">{plan.progress_percentage}%</span>
            </div>
            {(plan.item_count > 0 || plan.chapter_count > 0) && (
              <p className="mt-2 text-xs text-ink-muted">
                {plan.completed_count > 0 ? `${plan.completed_count} of ${plan.item_count} challenges complete` : `${plan.chapter_count} ${plan.chapter_count === 1 ? 'chapter' : 'chapters'}`}
              </p>
            )}
          </div>
          <Link href={`/explore/plans/${plan.slug}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-extrabold text-white sm:self-end">
            {plan.progress_percentage > 0 ? 'Continue' : 'Start path'} <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className={`${pausedInterview ? 'mt-3' : 'mt-5'} flex flex-col items-start gap-4 rounded-[18px] bg-page-field p-5 sm:flex-row sm:items-center`}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-note-mint text-forest-700"><Check size={19} /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-ink-strong">Choose a guided learning path</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-secondary">Build depth through a sequence of challenges around one skill.</p>
          </div>
          <Link href="/explore/plans" className="inline-flex items-center gap-2 rounded-xl border border-hairline-strong bg-white px-4 py-2.5 text-sm font-extrabold text-forest-800">Browse paths <ArrowRight size={15} /></Link>
        </div>
      )}
    </section>
  )
}
