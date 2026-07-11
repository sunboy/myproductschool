'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { HatchImage } from '@/components/redesign/HatchImage'

/**
 * Public, no-auth "Level Readiness Checker" at /quiz/readiness.
 *
 * Pick a role + a target level. The checker shows the reasoning bar you'd have
 * to clear at that level on one real prompt: a "typical answer" that reads fine
 * in the room but stalls at review, next to a "staff-level answer" that names
 * the criterion and the sacrifice. A level ladder highlights the rung the target
 * sits on. Then a proof-not-promise CTA into /signup.
 *
 * Pure static content. No AI call, no comp guarantees. The framing matches
 * /salary-negotiation: the platform helps you build an evidence trail, it does
 * not promise a title or a number.
 */

export interface ReadinessRole {
  id: string
  label: string
  icon: string
}

// Reuses the role list shape from src/app/(app)/first-run/page.tsx. Engineers first.
export const READINESS_ROLES: ReadinessRole[] = [
  { id: 'swe', label: 'Software Engineer', icon: 'terminal' },
  { id: 'data_eng', label: 'Data Engineer', icon: 'storage' },
  { id: 'ml_eng', label: 'ML Engineer', icon: 'model_training' },
  { id: 'devops', label: 'DevOps / Platform', icon: 'settings_suggest' },
  { id: 'em', label: 'Eng Manager', icon: 'groups' },
  { id: 'founding_eng', label: 'Founding Engineer', icon: 'rocket_launch' },
  { id: 'tech_lead', label: 'Tech Lead', icon: 'account_tree' },
  { id: 'pm', label: 'Product Manager', icon: 'track_changes' },
]

export interface ReadinessLevel {
  id: string
  label: string
  /** One-line summary of what the reasoning bar is at this level. */
  bar: string
  /** The reasoning move that separates this level from the one below it. */
  edge: string
}

// A four-rung ladder. The bar rises the same way for every role: the higher the
// level, the further past "correct answer" the reasoning has to go.
export const READINESS_LEVELS: ReadinessLevel[] = [
  {
    id: 'mid',
    label: 'Mid',
    bar: 'Pick a reasonable option and make it work.',
    edge: 'You can ship the obvious answer without breaking things.',
  },
  {
    id: 'senior',
    label: 'Senior',
    bar: 'Weigh a real tradeoff and defend the call.',
    edge: 'You compare options against a stated goal instead of picking on feel.',
  },
  {
    id: 'staff',
    label: 'Staff',
    bar: 'Name the criterion, own the sacrifice, make the bet measurable.',
    edge: 'You decide what you are optimizing for, then say what you give up to get it.',
  },
  {
    id: 'principal',
    label: 'Principal',
    bar: 'Set the criterion others will use and make the decision reversible.',
    edge: 'You leave behind a rule and a guardrail, not just a call.',
  },
]

// One real prompt, shared across roles. Lifted from the calibration Optimize
// scenario so the "staff-level answer" mirrors how HackProduct actually grades.
const SAMPLE = {
  prompt:
    'A checkout redesign test shows two variants. Variant A cuts cart abandonment by 18% but adds 40 seconds to average checkout time. Variant B trims 25 seconds off checkout but moves abandonment by nothing measurable. The team ships one this week.',
  typical:
    'Ship Variant A. Fewer abandoned carts means more revenue, and the extra 40 seconds only hits people who were going to buy anyway.',
  staff:
    'Name the criterion first: revenue per visitor, not abandonment in isolation. Model whether 18% fewer abandoned carts clears the friction of 40 extra seconds for completers, and check mobile conversion separately, since added time hurts small screens more. Ship the variant that wins on that number, and set an abandonment guardrail so a bad read is caught before it compounds.',
}

// What HackProduct watches for at each level on this exact prompt. This is the
// "reasoning bar" the target level has to clear.
const LEVEL_EXPECTATION: Record<string, string> = {
  mid: 'Picks a defensible variant and can say why in one line. That clears Mid.',
  senior:
    'Compares both variants against a goal, not a gut feel. Senior wants the tradeoff named out loud.',
  staff:
    'States the criterion (revenue per visitor), owns the sacrifice (40 seconds for completers), and attaches a guardrail. Staff is where "Variant A because revenue" stops being enough.',
  principal:
    'Leaves behind the decision rule the next person reuses and makes the bet reversible with a guardrail. Principal is judged on the criterion it sets, not the variant it picks.',
}

export function ReadinessChecker() {
  const [role, setRole] = useState<ReadinessRole | null>(null)
  const [level, setLevel] = useState<ReadinessLevel | null>(null)
  const [copied, setCopied] = useState(false)

  const stage: 'pick' | 'result' = role && level ? 'result' : 'pick'

  const rungIndex = useMemo(
    () => (level ? READINESS_LEVELS.findIndex((l) => l.id === level.id) : -1),
    [level]
  )

  function reset() {
    setRole(null)
    setLevel(null)
    setCopied(false)
  }

  const shareUrl =
    role && level
      ? `https://www.hackproduct.com/quiz/readiness?role=${role.id}&level=${level.id}`
      : ''

  async function handleShare() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can fail on non-secure origins or without permission. Harmless.
    }
  }

  const signupHref =
    role && level
      ? `/signup?role=${role.id}&level=${level.id}&redirectTo=${encodeURIComponent('/dashboard')}`
      : '/signup'

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col px-4 py-12 sm:px-6 sm:py-16">
      {stage === 'pick' && (
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <HatchImage size={72} state="idle" />
            <p className="font-label text-sm font-semibold uppercase tracking-widest text-tertiary">
              No signup, 20 seconds
            </p>
            <h1 className="font-headline text-4xl font-bold text-on-background sm:text-5xl">
              Are you reasoning at the level you&apos;re aiming for?
            </h1>
            <p className="max-w-md font-body text-base leading-relaxed text-on-surface-variant">
              Pick where you work and the level you want next. See the reasoning bar
              you&apos;d have to clear on one real prompt, and where a typical answer
              stops short of it.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              1. Your role
            </p>
            <div className="grid grid-cols-2 gap-3">
              {READINESS_ROLES.map((r) => {
                const active = role?.id === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r)}
                    aria-pressed={active}
                    className={[
                      'group flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.99]',
                      active
                        ? 'border-primary bg-primary-container/30'
                        : 'border-transparent bg-surface-container hover:border-outline-variant hover:bg-surface-container-high',
                    ].join(' ')}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                      <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
                    </span>
                    <span className="font-label text-sm font-semibold text-on-surface">
                      {r.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              2. The level you&apos;re aiming for
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {READINESS_LEVELS.map((l) => {
                const active = level?.id === l.id
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLevel(l)}
                    aria-pressed={active}
                    className={[
                      'flex flex-col items-center gap-1 rounded-xl border px-4 py-3.5 text-center transition-all active:scale-[0.99]',
                      active
                        ? 'border-primary bg-primary-container/30'
                        : 'border-transparent bg-surface-container hover:border-outline-variant hover:bg-surface-container-high',
                    ].join(' ')}
                  >
                    <span className="font-label text-base font-bold text-on-surface">
                      {l.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {role && level ? null : (
            <p className="text-center font-body text-sm text-on-surface-variant/70">
              Pick a role and a level to see your reasoning bar.
            </p>
          )}
        </div>
      )}

      {stage === 'result' && role && level && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <HatchImage size={64} state="reviewing" />
            <p className="font-label text-sm font-semibold uppercase tracking-widest text-tertiary">
              {role.label} aiming for {level.label}
            </p>
            <h1 className="font-headline text-3xl font-bold text-on-background sm:text-4xl">
              The bar at {level.label}: {level.bar}
            </h1>
            <p className="max-w-lg font-body text-base leading-relaxed text-on-surface-variant">
              {level.edge}
            </p>
          </div>

          {/* Level ladder with the target rung highlighted */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
            <p className="mb-4 font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              Where that sits on the ladder
            </p>
            <div className="flex flex-col-reverse gap-2">
              {READINESS_LEVELS.map((l, i) => {
                const isTarget = l.id === level.id
                const isBelow = i < rungIndex
                return (
                  <div
                    key={l.id}
                    aria-current={isTarget ? 'step' : undefined}
                    className={[
                      'flex items-center gap-4 rounded-lg border p-3 transition-colors',
                      isTarget
                        ? 'border-primary bg-primary-container/40'
                        : isBelow
                          ? 'border-outline-variant bg-surface-container'
                          : 'border-transparent bg-surface-container-low',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label text-sm font-bold',
                        isTarget
                          ? 'bg-primary text-on-primary'
                          : isBelow
                            ? 'bg-surface-container-high text-on-surface-variant'
                            : 'bg-surface-container text-on-surface-variant/60',
                      ].join(' ')}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={[
                          'font-label text-sm font-bold',
                          isTarget ? 'text-on-primary-container' : 'text-on-surface',
                        ].join(' ')}
                      >
                        {l.label}
                        {isTarget ? (
                          <span className="ml-2 rounded-full bg-primary px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wide text-on-primary">
                            Your target
                          </span>
                        ) : null}
                      </p>
                      <p
                        className={[
                          'font-body text-xs leading-relaxed',
                          isTarget ? 'text-on-primary-container' : 'text-on-surface-variant',
                        ].join(' ')}
                      >
                        {l.bar}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* The reasoning bar on one real prompt */}
          <div className="rounded-xl border border-outline-variant bg-surface-container p-5">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-tertiary">
              One real prompt
            </p>
            <p className="mt-2 font-body text-sm leading-relaxed text-on-surface">
              {SAMPLE.prompt}
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    remove_circle_outline
                  </span>
                  <p className="font-label text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    Typical answer
                  </p>
                </div>
                <p className="mt-2 font-body text-sm leading-relaxed text-on-surface-variant">
                  {SAMPLE.typical}
                </p>
              </div>

              <div className="rounded-lg border border-primary bg-primary-container/25 p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    check_circle
                  </span>
                  <p className="font-label text-xs font-bold uppercase tracking-wide text-primary">
                    Staff-level answer
                  </p>
                </div>
                <p className="mt-2 font-body text-sm leading-relaxed text-on-surface">
                  {SAMPLE.staff}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-lg bg-secondary-container p-4">
              <HatchImage size={32} state="speaking" className="mt-0.5 shrink-0" />
              <div>
                <p className="font-label text-xs font-bold uppercase tracking-wide text-on-secondary-container">
                  What clears the bar at {level.label}
                </p>
                <p className="mt-1 font-body text-sm leading-relaxed text-on-secondary-container">
                  {LEVEL_EXPECTATION[level.id]}
                </p>
              </div>
            </div>
          </div>

          {/* Proof-not-promise CTA. Matches /salary-negotiation framing. */}
          <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-5">
            <Link
              href={signupHref}
              className="w-full rounded-full bg-primary px-8 py-3.5 text-center font-label text-base font-semibold text-on-primary transition-transform active:scale-[0.98]"
            >
              Start free to build proof of level
            </Link>
            <p className="text-center font-body text-xs leading-relaxed text-on-surface-variant/80">
              HackProduct does not promise a title or a number. It gives you reps that
              grade this reasoning and a receipt trail that shows you cleared the bar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-full border border-outline bg-surface-container px-6 py-2.5 font-label text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              {copied ? 'Link copied' : 'Copy share link'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-outline bg-surface-container px-6 py-2.5 font-label text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Try another level
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
