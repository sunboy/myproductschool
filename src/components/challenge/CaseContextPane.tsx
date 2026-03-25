'use client'

import Link from 'next/link'
import type { ChallengePrompt } from '@/lib/types'

/* ── Types ───────────────────────────────────────────────── */

interface CaseContextPaneProps {
  challenge: ChallengePrompt
  domainTitle: string
  domainIcon: string
  timerEnabled: boolean
  onTimerToggle: () => void
  timeLeft: number
}

/* ── Helpers ─────────────────────────────────────────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseSubQuestions(text: string): string[] {
  const lines = text.split('\n')
  const questions: string[] = []
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\.\s+(.+)/)
    if (match) questions.push(match[2].trim())
  }
  return questions.length > 0 ? questions : [text]
}

function getDifficultyLabel(difficulty: ChallengePrompt['difficulty']): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

function getDifficultyStyle(difficulty: ChallengePrompt['difficulty']): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-primary/10 text-primary'
    case 'intermediate':
      return 'bg-tertiary/10 text-tertiary'
    case 'advanced':
      return 'bg-error/10 text-error'
    default:
      return 'bg-primary/10 text-primary'
  }
}

/* ── Framework Hint ──────────────────────────────────────── */

function deriveFrameworkHint(tags: string[], domainTitle: string): string {
  const lower = tags.map(t => t.toLowerCase())
  if (lower.some(t => t.includes('metrics') || t.includes('kpi') || t.includes('analytics'))) {
    return 'Try HEART framework — track Happiness, Engagement, Adoption, Retention, Task success'
  }
  if (lower.some(t => t.includes('priorit') || t.includes('roadmap'))) {
    return 'Apply RICE scoring — Reach × Impact × Confidence ÷ Effort'
  }
  if (lower.some(t => t.includes('diagnos') || t.includes('root cause') || t.includes('drop'))) {
    return "Use the '5 Whys' + funnel decomposition to isolate the root cause"
  }
  if (lower.some(t => t.includes('design') || t.includes('ux') || t.includes('user'))) {
    return 'Ground your answer in Jobs-to-be-Done: what outcome does the user want?'
  }
  if (lower.some(t => t.includes('monetiz') || t.includes('revenue') || t.includes('growth'))) {
    return 'Frame via business model levers: acquisition, activation, retention, revenue, referral'
  }
  return `Structure your answer: define the problem → identify users → propose metrics → suggest solutions for ${domainTitle}`
}

/* ── Component ───────────────────────────────────────────── */

export function CaseContextPane({ challenge, domainTitle, domainIcon, timerEnabled, onTimerToggle, timeLeft }: CaseContextPaneProps) {
  const subQuestions = challenge.sub_questions ?? parseSubQuestions(challenge.prompt_text)
  const frameworkHint = deriveFrameworkHint(challenge.tags, domainTitle)

  // Use the first tag as a "company" context if available, or fall back to nothing
  const companyTag = challenge.tags.find(t => /^[A-Z]/.test(t))

  const timerTextColor = timeLeft < 60 ? 'text-error' : timeLeft < 180 ? 'text-tertiary' : 'text-primary'

  return (
    <section className="w-1/2 h-full overflow-y-auto bg-surface-container-low px-6 py-6 pb-24 flex flex-col gap-5">

      {/* ── Back link ─────────────────────────────────────── */}
      <div>
        <Link href="/challenges" className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors font-label">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
          Back to challenges
        </Link>
      </div>

      {/* ── Metadata Row ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Domain chip — primary-fixed bg */}
        <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {domainTitle}
        </span>

        {/* Difficulty chip */}
        <span className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-3 py-1 ${getDifficultyStyle(challenge.difficulty)}`}>
          {getDifficultyLabel(challenge.difficulty)}
        </span>

        {/* Time chip */}
        <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          ~{challenge.estimated_minutes} min
        </span>

        {/* Company tag chip (if available) */}
        {companyTag && (
          <span className="flex items-center gap-1 px-3 py-1 bg-white border border-outline-variant rounded-full text-[10px] font-bold">
            {companyTag}
          </span>
        )}

        {/* Timer button — right-aligned */}
        <button
          onClick={onTimerToggle}
          className={`ml-auto flex items-center gap-1.5 font-label font-semibold text-xs transition-colors ${
            timerEnabled
              ? `bg-primary/10 ${timerTextColor} rounded-full px-3 py-1.5`
              : 'flex items-center justify-center w-8 h-8 rounded-full text-on-surface-variant hover:bg-surface-container-high'
          }`}
          aria-label={timerEnabled ? 'Stop timer' : 'Start timer'}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, fontVariationSettings: timerEnabled ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            schedule
          </span>
          {timerEnabled && <span>{formatTime(timeLeft)}</span>}
        </button>
      </div>

      {/* ── Title & Subtitle ──────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-headline font-bold text-primary leading-tight mb-1">
          {challenge.title}
        </h2>
        <p className="text-sm text-on-surface-variant font-medium">
          {challenge.tags.slice(0, 3).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' • ')}
        </p>
      </div>

      {/* ── Scenario Card ─────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/30 flex gap-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
          <span
            className="material-symbols-outlined text-on-secondary-container"
            style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
          >
            menu_book
          </span>
        </div>
        <div>
          <h3 className="text-xs font-bold text-secondary uppercase mb-2 tracking-widest">The Scenario</h3>
          <p className="text-sm leading-relaxed text-on-surface font-body">
            {challenge.prompt_text}
          </p>
          {challenge.image_url && (
            <div className="rounded-xl overflow-hidden h-40 bg-surface-container-high mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={challenge.image_url}
                alt="Visual context"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Key Constraints ───────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Key Constraints</h3>
        <ol className="grid gap-2">
          {subQuestions.map((question, index) => (
            <li key={index} className="flex gap-3 bg-surface-container/50 p-3 rounded-lg text-sm items-start">
              <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full text-[10px] font-bold text-primary shrink-0 border border-outline-variant mt-0.5">
                {index + 1}
              </span>
              <span className="text-on-surface font-body leading-relaxed">{question}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Footer: Tags + Framework Hint ─────────────────── */}
      <div className="mt-auto pt-4 flex flex-wrap items-center gap-3">
        {challenge.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {challenge.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold text-outline uppercase">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 bg-tertiary-container/20 px-3 py-1.5 rounded-full border border-tertiary-container/50">
          <span className="text-[10px] font-bold text-tertiary uppercase">Try: {frameworkHint.split(' ')[1] || 'Framework'}</span>
          <span
            className="material-symbols-outlined text-sm text-tertiary"
            style={{ fontSize: 14 }}
          >
            lightbulb
          </span>
        </div>
      </div>
    </section>
  )
}
