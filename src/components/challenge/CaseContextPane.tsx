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
    <section className="w-1/2 h-full overflow-y-auto bg-surface-container-low px-16 py-12 pb-32">

      {/* ── Nav Row ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/challenges" className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors font-label">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to challenges
        </Link>
        <button
          onClick={onTimerToggle}
          className={
            timerEnabled
              ? `flex items-center gap-1.5 bg-primary/10 ${timerTextColor} rounded-full px-3 py-1.5 font-label font-semibold text-sm transition-colors`
              : 'flex items-center justify-center w-9 h-9 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors'
          }
          aria-label={timerEnabled ? 'Stop timer' : 'Start timer'}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, fontVariationSettings: timerEnabled ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            schedule
          </span>
          {timerEnabled && <span>{formatTime(timeLeft)}</span>}
        </button>
      </div>

      {/* ── Category Pills Row ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Domain chip */}
        <span className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider px-3 py-1">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 12, fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 16" }}
          >
            {domainIcon}
          </span>
          {domainTitle}
        </span>

        {/* Difficulty chip */}
        <span className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-3 py-1 ${getDifficultyStyle(challenge.difficulty)}`}>
          {getDifficultyLabel(challenge.difficulty)}
        </span>

        {/* Estimated time chip */}
        <span className="flex items-center gap-1 border border-outline-variant rounded-full text-[10px] font-bold uppercase tracking-wider px-3 py-1 text-on-surface-variant">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 11, fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 16" }}
          >
            schedule
          </span>
          {challenge.estimated_minutes} min
        </span>

        {/* Company tag chip (if available) */}
        {companyTag && (
          <span className="border border-outline-variant rounded-full text-[10px] font-bold uppercase tracking-wider px-3 py-1 text-on-surface-variant">
            {companyTag}
          </span>
        )}
      </div>

      {/* ── Archival Subhead ──────────────────────────────── */}
      <p className="text-[10px] font-extrabold text-outline uppercase tracking-[0.2em] mb-3">
        Product Challenge &bull; Case Brief
      </p>

      {/* ── Challenge Title ───────────────────────────────── */}
      <h1 className="text-4xl font-headline font-bold text-primary leading-tight mb-10">
        {challenge.title}
      </h1>

      {/* ── Scenario Card ─────────────────────────────────── */}
      <div
        className="bg-surface-container-lowest p-8 rounded-2xl mb-6 space-y-6"
        style={{ boxShadow: '0 4px 20px rgba(46,50,48,0.03)' }}
      >
        {/* Icon header row */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span
              className="material-symbols-outlined text-on-secondary-container"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
            >
              menu_book
            </span>
          </div>
          <span className="font-label font-bold text-sm text-on-surface tracking-widest uppercase">
            The Scenario
          </span>
        </div>

        {/* Body text */}
        <p className="text-on-surface-variant leading-relaxed font-body">
          {challenge.prompt_text}
        </p>

        {/* Image placeholder */}
        <div className="rounded-xl overflow-hidden h-48 bg-surface-container-high flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-on-surface-variant/30">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 40, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}
            >
              image
            </span>
            <span className="text-xs font-label font-medium uppercase tracking-wider">
              Visual Context
            </span>
          </div>
        </div>
      </div>

      {/* ── Constraints / Sub-Questions Card ─────────────── */}
      <div
        className="bg-surface-container-lowest p-8 rounded-2xl mb-8 space-y-5"
        style={{ boxShadow: '0 4px 20px rgba(46,50,48,0.03)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span
              className="material-symbols-outlined text-on-secondary-container"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
            >
              rule
            </span>
          </div>
          <span className="font-label font-bold text-sm text-on-surface tracking-widest uppercase">
            Key Constraints
          </span>
        </div>

        {/* Numbered list */}
        <ol className="space-y-4">
          {subQuestions.map((question, index) => (
            <li key={index} className="flex items-start gap-4">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <p className="text-on-surface-variant leading-relaxed font-body text-sm flex-1">
                {question}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Tags Row ──────────────────────────────────────── */}
      {challenge.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {challenge.tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary-container text-on-secondary-container rounded-full text-xs px-3 py-1 font-label font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Framework Hint Pill ───────────────────────────── */}
      <div className="flex items-start gap-3 bg-primary px-5 py-3 rounded-full text-white shadow-lg">
        <span
          className="material-symbols-outlined flex-shrink-0 mt-0.5"
          style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
        >
          lightbulb
        </span>
        <p className="text-sm font-label font-semibold leading-snug">
          {frameworkHint}
        </p>
      </div>
    </section>
  )
}
