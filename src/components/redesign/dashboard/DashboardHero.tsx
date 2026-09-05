import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import type { ResumeOrStartAction } from '@/components/dashboard/cards/resume-or-start'
import { LearningArtwork } from '@/components/redesign/LearningGeometry'
import { difficultyLabel } from '@/lib/utils'

interface DashboardHeroProps {
  displayName: string
  action: ResumeOrStartAction | null
  firstScenario?: string | null
}

/** Retains the real resume/recommendation resolver, never demo content. */
export function DashboardHero({ action, firstScenario }: DashboardHeroProps) {
  const isResume = action?.kind === 'resume'
  const isFirst = action?.kind === 'first'
  const meta = action?.kind === 'resume'
    ? action.step ? `Step ${action.step} of ${action.totalSteps ?? 4}` : action.difficulty ? difficultyLabel(action.difficulty) : null
    : action?.kind === 'next'
      ? [action.domain, action.difficulty ? difficultyLabel(action.difficulty) : null].filter(Boolean).join(' · ')
      : null
  return <section data-hatch-target="dashboard-hero" className="learning-continuation">
    <LearningArtwork />
    <div>
      <p className="learning-eyebrow">{isResume ? 'Continue your challenge' : isFirst ? 'A good place to begin' : 'Recommended for you'}</p>
      <h2>{action?.title ?? 'Find a problem worth exploring.'}</h2>
      {isFirst && firstScenario ? <p className="line-clamp-2">{firstScenario}</p> : meta ? <p>{meta}</p> : <p>Work through a real decision. Make your thinking clear.</p>}
      <Link href={action?.href ?? '/challenges'} data-hatch-target="dashboard-session">
        {isResume && <Play size={15} />}
        {isResume ? 'Continue working' : action ? 'Explore challenge' : 'Browse challenges'}
        <ArrowRight size={17} />
      </Link>
    </div>
  </section>
}
