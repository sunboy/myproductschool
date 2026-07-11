import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { difficultyLabel } from '@/lib/utils'

// The single dominant dashboard action. One card, one button, one challenge URL.
// Its `kind` is resolved server-side by precedence (resume an in-progress rep >
// first rep for a brand-new user > next recommended rep), so the user never has
// to choose between competing CTAs to get back to practicing. This is also the
// retention hook: the resume destination is byte-identical to the resume-challenge
// email's ?resume=1 link, so an email click and this card land on the same attempt.

export type ResumeOrStartAction =
  | {
      kind: 'resume'
      href: string
      title: string
      /** 1-based FLOW step the attempt paused on, when known (1..4). */
      step?: number | null
      totalSteps?: number | null
    }
  | {
      kind: 'first'
      href: string
      title?: string | null
    }
  | {
      kind: 'next'
      href: string
      title: string
      difficulty?: string | null
      domain?: string | null
      hatchInsight?: string | null
    }

function eyebrowFor(action: ResumeOrStartAction): string {
  if (action.kind === 'resume') return 'Pick up where you left off'
  if (action.kind === 'first') return 'Your first rep'
  return 'Your next rep'
}

function headlineFor(action: ResumeOrStartAction): string {
  if (action.kind === 'first') {
    return 'Do one real rep. Hatch grades how you think.'
  }
  return action.title
}

function ctaLabelFor(action: ResumeOrStartAction): string {
  if (action.kind === 'resume') return 'Resume'
  if (action.kind === 'first') return 'Start your first rep'
  return 'Start challenge'
}

export function ResumeOrStartCard({ action }: { action: ResumeOrStartAction }) {
  const resumeSub =
    action.kind === 'resume' && action.step
      ? `Step ${action.step} of ${action.totalSteps ?? 4}`
      : null

  return (
    <div
      className="flex flex-col gap-4 rounded-[24px] border border-outline-variant/40 bg-surface-container-low p-6 shadow-[0_18px_40px_-34px_rgba(30,27,20,0.5)]"
      data-hatch-target="dashboard-resume-or-start"
    >
      <div className="flex items-center gap-2.5">
        <HatchGlyph size={24} state="idle" className="text-primary" />
        <span className="font-label text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">
          {eyebrowFor(action)}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="font-headline text-2xl font-bold leading-tight tracking-tight text-on-surface">
          {headlineFor(action)}
        </h2>

        {resumeSub && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">timelapse</span>
            <span className="font-label text-sm font-semibold text-on-surface-variant">{resumeSub}</span>
          </div>
        )}

        {action.kind === 'next' && (action.difficulty || action.domain) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {action.difficulty && (
              <span className="rounded-full bg-tertiary-fixed/80 px-2.5 py-0.5 font-label text-[11px] font-semibold text-on-tertiary-fixed-variant">
                {difficultyLabel(action.difficulty)}
              </span>
            )}
            {action.domain && (
              <span className="rounded-full bg-secondary-container px-2.5 py-0.5 font-label text-[11px] text-on-secondary-container">
                {action.domain}
              </span>
            )}
          </div>
        )}

        {action.kind === 'first' && (
          <p className="max-w-md font-body text-sm leading-relaxed text-on-surface-variant">
            A short product scenario you work through in writing. No microphone, no setup. It takes about five minutes.
          </p>
        )}

        {action.kind === 'next' && action.hatchInsight && (
          <div className="flex items-start gap-2 rounded-xl bg-primary-fixed/60 p-3">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[15px] text-primary">auto_awesome</span>
            <p className="font-label text-[12.5px] font-semibold leading-5 text-on-surface">{action.hatchInsight}</p>
          </div>
        )}
      </div>

      <Link
        href={action.href}
        data-hatch-target="dashboard-resume-or-start-cta"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-label text-base font-semibold text-on-primary transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
      >
        {ctaLabelFor(action)}
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </div>
  )
}
