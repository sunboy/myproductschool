import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import type { ResumeOrStartAction } from '@/components/dashboard/cards/resume-or-start'
import { difficultyLabel } from '@/lib/utils'

interface DashboardHeroProps {
  displayName: string
  action: ResumeOrStartAction | null
  firstScenario?: string | null
}

export function DashboardHero({ displayName, action, firstScenario }: DashboardHeroProps) {
  const isResume = action?.kind === 'resume'
  const isFirst = action?.kind === 'first'
  const eyebrow = isResume ? 'Continue where you left off' : isFirst ? 'A focused place to begin' : 'Recommended next'
  const cta = isResume ? 'Resume session' : isFirst ? 'Start first challenge' : 'Start session'
  const meta = action?.kind === 'resume'
    ? action.step ? `Step ${action.step} of ${action.totalSteps ?? 4}` : action.difficulty ? difficultyLabel(action.difficulty) : null
    : action?.kind === 'next'
      ? [action.domain, action.difficulty ? difficultyLabel(action.difficulty) : null].filter(Boolean).join(' · ')
      : null

  return (
    <section data-hatch-target="dashboard-hero" className="relative isolate flex min-h-[218px] overflow-hidden rounded-[24px] bg-forest-950 px-5 py-6 text-white shadow-[0_18px_50px_-36px_rgba(8,40,27,.72)] sm:px-8 sm:py-7">
      <div aria-hidden className="absolute inset-y-0 right-0 w-[42%] bg-forest-900 [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%)]" />
      <div aria-hidden className="absolute -bottom-9 right-[31%] h-28 w-40 rotate-[-14deg] bg-gold/20 [clip-path:polygon(0_22%,100%_0,82%_100%,14%_84%)]" />
      <div aria-hidden className="absolute right-0 top-0 h-full w-[18%] bg-forest-700/35 [clip-path:polygon(36%_0,100%_0,100%_100%,0_100%)]" />

      <div className="relative grid w-full items-center gap-6 lg:grid-cols-[minmax(220px,.62fr)_minmax(420px,1.38fr)]">
        <div className="self-start lg:self-center">
          <p className="text-sm font-bold text-mint-glow">{isFirst ? `Welcome, ${displayName}` : `Welcome back, ${displayName}`}</p>
          <h1 className="mt-2 font-headline text-[30px] font-semibold leading-tight tracking-[-0.025em] text-on-hero-strong sm:text-[32px]">Your next step</h1>
        </div>

        {action ? (
          <div className="max-w-2xl lg:justify-self-end lg:pr-6">
            <p className="font-label text-xs font-extrabold uppercase tracking-[.11em] text-gold">{eyebrow}</p>
            <h2 className="mt-2 font-headline text-[21px] font-semibold leading-snug text-white sm:text-[23px]">{action.title ?? 'Your first challenge'}</h2>
            {isFirst && firstScenario ? (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/72">{firstScenario}</p>
            ) : meta ? <p className="mt-2 text-xs font-semibold text-white/65">{meta}</p> : null}
            <Link href={action.href} data-hatch-target="dashboard-session" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-extrabold text-forest-950 transition-transform hover:-translate-y-0.5">
              {isResume ? <Play size={14} fill="currentColor" strokeWidth={0} /> : null}
              {cta}
              {!isResume ? <ArrowRight size={16} strokeWidth={2.2} /> : null}
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl lg:justify-self-end lg:pr-6">
            <h2 className="font-headline text-[23px] font-semibold text-white">Choose a skill to strengthen</h2>
            <p className="mt-2 text-base leading-relaxed text-white/72">Browse practical challenges by area and difficulty.</p>
            <Link href="/challenges" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-extrabold text-forest-950">Browse challenges <ArrowRight size={16} /></Link>
          </div>
        )}
      </div>
    </section>
  )
}
