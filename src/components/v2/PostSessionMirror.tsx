'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { Brain, ArrowRight, ArrowUp, ArrowDown, ListChecks, Mic, ChevronDown, ExternalLink } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { StepDetailModal } from './StepDetailModal'
import { AnswerGalleryPanel } from '@/components/community/AnswerGalleryPanel'
import {
  VERDICT_COLOR, VERDICT_BG, VERDICT_LABEL,
  QUALITY_BADGE,
  qualityToVerdict,
} from './flow-constants'

// ── Types ────────────────────────────────────────────────────────────────────

export interface StepResultQuestion {
  questionText: string
  selectedOptionId: string | null
  options: Array<{
    id: string
    option_label: string
    option_text: string
    quality: string
    explanation: string
    framework_hint?: string
  }>
}

export interface StepResult {
  step: 'frame' | 'list' | 'optimize' | 'win'
  score: number
  quality_label: string
  confidence: number | null
  reasoning: string
  competency_signal?: {
    // Transitional: pre-migration rows have `primary`; post-migration have `competency`.
    competency?: string
    primary?: string
    signal: string
    framework_hint: string
  }
  hatchSignal?: string | null
  frameworkHint?: string | null
  selectedOptionId?: string | null
  questions?: StepResultQuestion[]
}

export interface CompetencyDelta {
  competency: string
  before: number
  after: number
  direction: 'up' | 'down' | 'flat'
}

interface PostSessionMirrorProps {
  challengeTitle: string
  totalScore: number
  maxScore?: number
  xpAwarded: number
  stepResults: StepResult[]
  competencyDeltas: CompetencyDelta[]
  challengeId?: string
  attemptId?: string
  onRunAnother?: () => void
  onDashboard: () => void
  onNextChallenge?: () => void
  /**
   * Optional "do it out loud" step-2 invite. When set, renders a celebrated
   * band above the action row pointing the just-graded user into a live voice
   * interview. This is the P2 activation ladder: written graded rep first
   * (mic-free), voice as the deliberate next step. Omitted → band hidden.
   */
  onVoiceStep?: () => void
}

// ── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

/** Discipline accents per redesign spec §Palette (flow-dot colors in the
 * feedback-debrief preview): frame=green, list=blue, optimize=purple, win=orange. */
const STEP_COLORS: Record<string, string> = {
  frame: 'var(--color-sd-fg)',
  list: 'var(--color-ps-fg)',
  optimize: 'var(--color-dm-fg)',
  win: 'var(--color-sql-fg)',
}

const STEP_COMPETENCY_KEYS: Record<string, string[]> = {
  frame: ['Motivation Theory', 'Cognitive Empathy'],
  list: ['Cognitive Empathy', 'Creative Execution'],
  optimize: ['Taste', 'Strategic Thinking'],
  win: ['Strategic Thinking', 'Domain Expertise'],
}

const COMPETENCY_LABELS: Record<string, string> = {
  motivation_theory: 'Motivation Theory',
  cognitive_empathy: 'Cognitive Empathy',
  taste: 'Taste',
  strategic_thinking: 'Strategic Thinking',
  creative_execution: 'Creative Execution',
  domain_expertise: 'Domain Expertise',
}

function formatCompetencyName(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}


// ── Sub-components ────────────────────────────────────────────────────────────

/** Dark-hero stat cell: serif white value, muted mint-grey label (preview .hero-stat). */
function HeroStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 15,
        color: accent ? 'var(--color-mint-glow)' : '#ffffff',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.2,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: '#9db79f', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function buildChoiceChips(result: StepResult): string[] {
  const questions = result.questions ?? []
  const multi = questions.length > 1
  return questions.map((q, i) => {
    const selectedOpt = q.options.find(
      o => o.id === q.selectedOptionId || o.option_label === q.selectedOptionId
    )
    const letter = selectedOpt?.option_label ?? (q.selectedOptionId ?? '?')
    return multi ? `Q${i + 1} · Option ${letter}` : `Option ${letter}`
  })
}

interface StepCardProps {
  result: StepResult
  index: number
  cardRef: (el: HTMLDivElement | null) => void
  badgeRef: (el: HTMLDivElement | null) => void
  onOpenModal: (result: StepResult) => void
}

function StepCard({ result, index, cardRef, badgeRef, onOpenModal }: StepCardProps) {
  const [expanded, setExpanded] = useState(false)
  const verdict = qualityToVerdict(result.quality_label)
  const verdictColor = VERDICT_COLOR[verdict]
  const stepColor = STEP_COLORS[result.step]
  const coaching = result.hatchSignal ?? result.competency_signal?.signal
    ?? (verdict === 'pass' ? 'You made this move well. That is the one a panel scores.' : verdict === 'partial' ? 'The move is there, one rep would sharpen it.' : "Caught it here, which beats catching it in the room. This is the move to run again.")
  // Transitional fallback: post-migration rows store `competency`; pre-migration rows store `primary`.
  const competencyKey = result.competency_signal?.competency ?? result.competency_signal?.primary
  const competency = competencyKey
    ? formatCompetencyName(competencyKey)
    : (STEP_COMPETENCY_KEYS[result.step]?.[0] ?? null)
  const chips = buildChoiceChips(result)
  const frameworkHint = result.competency_signal?.framework_hint ?? result.frameworkHint ?? null
  // StepResult.score is the weighted step aggregate on the 0-3 scale
  // (FlowWorkspace normalizes history rows the same way). Bar width derives
  // from it; no invented numbers.
  const stepPct = Math.max(0, Math.min(100, Math.round((result.score / 3) * 100)))

  return (
    <div
      ref={cardRef}
      onClick={() => setExpanded(e => !e)}
      style={{
        background: 'var(--color-card-bright)',
        border: '1px solid var(--color-hairline)',
        borderRadius: 12,
        padding: '14px 16px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative',
        minWidth: 0,
        cursor: 'pointer',
      }}
    >
      {/* Header row: step dot + name + verdict + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span
            ref={badgeRef}
            aria-hidden
            style={{ width: 8, height: 8, borderRadius: '50%', background: stepColor, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: stepColor }}>
            {String(index + 1).padStart(2, '0')} {STEP_LABELS[result.step]}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 9px', borderRadius: 999,
            background: VERDICT_BG[verdict],
            border: `1.5px solid ${verdictColor}`,
            color: verdictColor,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            {VERDICT_LABEL[verdict]}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            style={{
              color: 'var(--color-ink-muted)',
              transition: 'transform 200ms',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </div>

      {/* Serif step score + bar (real weighted aggregate, 0-3 scale) */}
      <div>
        <div style={{
          fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 22,
          color: 'var(--color-forest-950)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
        }}>
          {stepPct}%
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--color-hairline)', marginTop: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, width: `${stepPct}%`,
            background: verdict === 'pass' ? 'var(--color-forest-600)' : 'var(--color-flame)',
          }} />
        </div>
      </div>

      {/* Answer chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {chips.map((chip, i) => (
            <span key={i} style={{
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 99,
              background: 'var(--color-card-bright)',
              color: 'var(--color-ink-secondary)',
              border: '1px solid var(--color-hairline)',
            }}>
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Hatch coaching - always visible, clamp when collapsed */}
      <p style={{
        fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-ink-secondary)', margin: 0,
        ...(expanded ? {} : {
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }),
      } as React.CSSProperties}>
        {coaching}
      </p>

      {/* Expanded content */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Framework hint - amber tip note per §7 */}
          {frameworkHint && (
            <div className="note-amber" style={{
              borderRadius: 10, padding: '10px 14px',
              fontSize: 12, color: 'var(--color-ink-strong)', lineHeight: 1.5,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <Brain size={14} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-ink-secondary)' }} />
              <span>{frameworkHint}</span>
            </div>
          )}

          {/* Selected choices summary */}
          {(result.questions ?? []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(result.questions ?? []).map((q, qi) => {
                const selectedOpt = q.options.find(
                  o => o.id === q.selectedOptionId || o.option_label === q.selectedOptionId
                )
                if (!selectedOpt) return null
                const b = QUALITY_BADGE[selectedOpt.quality] ?? QUALITY_BADGE.plausible_wrong
                return (
                  <div key={qi} style={{
                    background: 'var(--color-page-field)',
                    border: '1px solid var(--color-hairline)',
                    borderRadius: 10, padding: '10px 12px',
                    fontSize: 12, lineHeight: 1.5,
                  }}>
                    {(result.questions ?? []).length > 1 && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Q{qi + 1}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink-secondary)', flexShrink: 0, paddingTop: 1 }}>
                        {selectedOpt.option_label}.
                      </span>
                      <span style={{ flex: 1, color: 'var(--color-ink-strong)' }}>{selectedOpt.option_text}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 7px', borderRadius: 99,
                        background: b.bg, color: b.color,
                        flexShrink: 0,
                      }}>
                        {b.label}
                      </span>
                    </div>
                    {selectedOpt.explanation && (
                      <p style={{ fontSize: 11, color: 'var(--color-ink-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
                        {selectedOpt.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer: competency + full detail */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
            {competency && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                background: 'transparent',
                border: '1.5px solid var(--color-forest-600)',
                color: 'var(--color-forest-600)',
              }}>
                {competency}
              </span>
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onOpenModal(result) }}
              style={{
                fontSize: 12, fontWeight: 700, color: '#ffffff',
                display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto',
                background: 'var(--color-forest-800)', border: 'none', cursor: 'pointer',
                padding: '6px 12px', borderRadius: 8,
              }}
            >
              Full detail
              <ExternalLink size={13} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}

      {/* Collapsed footer: competency only */}
      {!expanded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {competency && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: 'transparent',
              border: '1.5px solid var(--color-forest-600)',
              color: 'var(--color-forest-600)',
            }}>
              {competency}
            </span>
          )}
          <span style={{ fontSize: 10, color: 'var(--color-ink-muted)', marginLeft: 'auto' }}>
            Click to expand
          </span>
        </div>
      )}
    </div>
  )
}


function DeltaChip({ data, refCb }: { data: CompetencyDelta; refCb: (el: HTMLDivElement | null) => void }) {
  const delta = Math.round(data.after - data.before)
  const up = delta >= 0
  const c = up ? '#2f7a4a' : '#b23a2a'
  const bg = up ? 'rgba(47,122,74,0.08)' : 'rgba(178,58,42,0.08)'
  const barWidth = Math.min(100, Math.abs(delta) / 12 * 100)

  return (
    <div
      ref={refCb}
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '8px 10px', borderRadius: 10,
        background: 'var(--color-page-field)',
        border: '1px solid var(--color-hairline)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-ink-secondary)', lineHeight: 1.2 }}>
          {COMPETENCY_LABELS[data.competency] ?? formatCompetencyName(data.competency)}
        </div>
        {delta !== 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 13, color: c,
            padding: '1px 6px', borderRadius: 6, background: bg,
          }}>
            {up ? <ArrowUp size={11} strokeWidth={2.2} /> : <ArrowDown size={11} strokeWidth={2.2} />}
            {up ? '+' : ''}{delta}
          </div>
        )}
      </div>
      <div style={{ position: 'relative', height: 4, background: 'var(--color-hairline)', borderRadius: 999 }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: up ? `${data.before}%` : `${data.before + delta}%`,
          width: `${barWidth * 0.1 + Math.abs(delta) * 1.2}%`,
          background: c,
          borderRadius: 999,
        }} />
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--color-ink-muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {data.before} → {data.after}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PostSessionMirror({
  totalScore,
  maxScore = 3,
  xpAwarded,
  stepResults,
  competencyDeltas,
  challengeId,
  attemptId,
  onRunAnother,
  onDashboard,
  onNextChallenge,
  onVoiceStep,
}: PostSessionMirrorProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([])
  const deltaRefs = useRef<(HTMLDivElement | null)[]>([])
  const xpRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [modalStep, setModalStep] = useState<StepResult | null>(null)

  // Deduplicate by step key - keep the last occurrence (most recent data wins)
  const seenSteps = new Set<string>()
  const uniqueStepResults = [...stepResults].reverse().filter(r => {
    if (seenSteps.has(r.step)) return false
    seenSteps.add(r.step)
    return true
  }).reverse()

  const passCount = uniqueStepResults.filter(r => qualityToVerdict(r.quality_label) === 'pass').length
  const partialCount = uniqueStepResults.filter(r => qualityToVerdict(r.quality_label) === 'partial').length
  const missCount = uniqueStepResults.filter(r => qualityToVerdict(r.quality_label) === 'miss').length

  const summaryLine = passCount === 4
    ? "That's the run that gets the offer. Now do it under a harder prompt and it's yours for good."
    : passCount >= 2
    ? `You framed the right problem. ${missCount > 0 ? 'The gap was the Win: it needed a real metric, which is the move that turns a good answer into a defensible one' : 'One move below would sharpen the whole answer'}.`
    : "Better to find this here than in the room. The coaching below shows the move to run again while it's fresh."

  // Overall percent from the real attempt score (props come straight from the
  // completion payload / history record).
  const overallPct = Number.isFinite(totalScore) && Number.isFinite(maxScore) && maxScore > 0
    ? Math.max(0, Math.min(100, Math.round((totalScore / maxScore) * 100)))
    : null

  // Hatch's hero bubble names the weakest move from real verdicts; when all
  // four landed clean it says so instead of inventing a gap.
  const verdictRank: Record<string, number> = { miss: 0, partial: 1, pass: 2 }
  const weakestStep = uniqueStepResults.length > 0
    ? [...uniqueStepResults].sort((a, b) =>
        (verdictRank[qualityToVerdict(a.quality_label)] ?? 2) - (verdictRank[qualityToVerdict(b.quality_label)] ?? 2)
      )[0]
    : null
  const hatchBubble = weakestStep && qualityToVerdict(weakestStep.quality_label) !== 'pass'
    ? `${STEP_LABELS[weakestStep.step]} is the gap. Drill it next.`
    : uniqueStepResults.length > 0
      ? 'All four moves landed clean.'
      : null

  const RING_SIZE = 104
  const RING_STROKE = 10
  const ringRadius = (RING_SIZE - RING_STROKE) / 2
  const ringCircumference = 2 * Math.PI * ringRadius

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      gsap.set([headerRef.current, ...cardRefs.current, ...badgeRefs.current, ...deltaRefs.current, xpRef.current, footerRef.current], { opacity: 1, y: 0, scale: 1, rotation: 0 })
      return
    }

    gsap.set(headerRef.current, { opacity: 0, y: -6 })
    gsap.set(cardRefs.current.filter(Boolean), { opacity: 0, y: 18, scale: 0.98 })
    gsap.set(badgeRefs.current.filter(Boolean), { scale: 0, opacity: 0, rotation: -45, transformOrigin: '50% 50%' })
    gsap.set(deltaRefs.current.filter(Boolean), { opacity: 0, y: 8 })
    if (xpRef.current) gsap.set(xpRef.current, { opacity: 0, scale: 0.4, rotation: -12 })
    if (footerRef.current) gsap.set(footerRef.current, { opacity: 0, y: 8 })

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.4 })

    uniqueStepResults.forEach((_, i) => {
      tl.to(badgeRefs.current[i], { scale: 1, opacity: 1, rotation: 0, duration: 0.32, ease: 'back.out(2.2)' }, 0.55 + i * 0.22)
      tl.to(cardRefs.current[i], { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, 0.62 + i * 0.22)
    })

    tl.to(deltaRefs.current.filter(Boolean), { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 }, '-=0.2')
    if (xpRef.current) tl.to(xpRef.current, { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2.5)' }, '-=0.15')
    if (footerRef.current) tl.to(footerRef.current, { opacity: 1, y: 0, duration: 0.35 }, '-=0.3')

    return () => { tl.kill() }
  }, [uniqueStepResults.length])

  return (
    <section
      className="w-full h-full overflow-hidden flex flex-col"
      style={{ background: 'var(--color-page-field)' }}
    >
      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 p-4">

        {/* Score hero band — dark forest gradient, ring + headline + XP + Hatch */}
        <div
          ref={headerRef}
          style={{
            borderRadius: 16,
            padding: '20px 24px',
            background: 'linear-gradient(120deg, var(--color-forest-950) 0%, var(--color-forest-900) 45%, var(--color-forest-800) 100%)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexShrink: 0,
          }}
        >
          {overallPct != null && (
            <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
              <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={ringRadius} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={RING_STROKE} />
                <circle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={ringRadius} fill="none"
                  stroke="var(--color-gold)" strokeWidth={RING_STROKE} strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference * (1 - overallPct / 100)}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 24, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {overallPct}<sup style={{ fontSize: 12 }}>%</sup>
                </span>
              </div>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9db79f' }}>
              Hatch&rsquo;s debrief
            </div>
            <h2 style={{
              fontFamily: 'var(--font-headline)', color: '#f9faf5', fontSize: 19, fontWeight: 600,
              lineHeight: 1.3, margin: '4px 0 10px', maxWidth: 520,
            }}>
              {summaryLine}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div ref={xpRef}>
                <HeroStat label="earned this session" value={`+${xpAwarded} XP`} accent />
              </div>
              <HeroStat label="moves landed clean" value={`${passCount}/${uniqueStepResults.length || 4}`} />
              {partialCount > 0 && <HeroStat label="partial" value={String(partialCount)} />}
              {missCount > 0 && <HeroStat label="caught here" value={String(missCount)} />}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: 128 }}>
            <HatchImage state="celebrating" size={100} priority />
            {hatchBubble && (
              <div style={{
                marginTop: 4, background: 'rgba(255,255,255,0.95)', color: 'var(--color-forest-900)',
                fontSize: 11, fontWeight: 700, lineHeight: 1.35, padding: '7px 11px',
                borderRadius: 10, maxWidth: 140, textAlign: 'center',
              }}>
                {hatchBubble}
              </div>
            )}
          </div>
        </div>

        {/* FLOW breakdown — four step cards */}
        {uniqueStepResults.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: 17, fontWeight: 600, color: 'var(--color-forest-950)' }}>
                FLOW breakdown
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--color-ink-secondary)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-forest-600)' }} />
                  On track
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-flame)' }} />
                  Needs focus
                </span>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${uniqueStepResults.length}, minmax(0, 1fr))`,
              gap: 12,
              width: '100%',
              alignItems: 'start',
            }}>
              {uniqueStepResults.map((result, i) => (
                <StepCard
                  key={result.step}
                  result={result}
                  index={i}
                  cardRef={el => { cardRefs.current[i] = el }}
                  badgeRef={el => { badgeRefs.current[i] = el }}
                  onOpenModal={setModalStep}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {uniqueStepResults.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-body text-sm text-ink-secondary italic">Loading results…</p>
          </div>
        )}

        {/* Competency delta strip - always shown, falls back to neutral 50 baseline if no deltas */}
        {(() => {
          const ALL_COMPETENCIES = ['motivation_theory', 'cognitive_empathy', 'taste', 'strategic_thinking', 'creative_execution', 'domain_expertise']
          const displayDeltas: CompetencyDelta[] = ALL_COMPETENCIES.map(key => {
            const found = competencyDeltas.find(d => d.competency === key)
            return found ?? { competency: key, before: 50, after: 50, direction: 'flat' as const }
          })
          return (
            <div style={{
              background: 'var(--color-card-bright)', border: '1px solid var(--color-hairline)',
              borderRadius: 12, padding: '12px 14px', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  fontSize: 12, fontWeight: 700,
                  color: 'var(--color-ink-strong)',
                }}>
                  <Brain size={15} strokeWidth={1.8} style={{ color: 'var(--color-forest-600)' }} />
                  Mental model movement
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6 }}>
                {displayDeltas.map((d, i) => (
                  <DeltaChip
                    key={d.competency}
                    data={d}
                    refCb={el => { deltaRefs.current[i] = el }}
                  />
                ))}
              </div>
            </div>
          )
        })()}

        <AnswerGalleryPanel challengeId={challengeId} attemptId={attemptId} />
      </div>

      {/* Footer */}
      <div
        ref={footerRef}
        style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid var(--color-hairline)',
          background: 'var(--color-card-bright)',
          gap: 12,
        }}
      >
        {/* Voice step-2 invite — the activation ladder: written rep first, then
            "now do it out loud". Only rendered when the workspace passes
            onVoiceStep (see FlowWorkspace). Kept visually distinct from the
            action row so it reads as the deliberate next move, not a competing CTA. */}
        {onVoiceStep && (
          <button
            onClick={onVoiceStep}
            className="w-full text-left note-mint"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            <Mic size={18} strokeWidth={1.8} style={{ color: 'var(--color-forest-600)', flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--color-ink-strong)', lineHeight: 1.2 }}>
                Now do it out loud
              </span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--color-ink-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                Take the same thinking into a live interview with Hatch. You can stay in chat if you prefer.
              </span>
            </span>
            <ArrowRight size={16} strokeWidth={1.8} style={{ color: 'var(--color-forest-600)', flexShrink: 0 }} />
          </button>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
          <button
            onClick={onDashboard}
            style={{
              padding: '9px 14px', fontSize: 13, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--color-card-bright)', color: 'var(--color-ink-strong)',
              border: '1px solid var(--color-hairline)', borderRadius: 8, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <ListChecks size={15} strokeWidth={1.8} />
            Back to practice
          </button>
          {onNextChallenge && (
            <button
              onClick={onNextChallenge}
              style={{
                padding: '9px 16px', fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--color-forest-950)', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Next challenge
              <ArrowRight size={15} strokeWidth={2} />
            </button>
          )}
          {onRunAnother && !onNextChallenge && (
            <button
              onClick={onRunAnother}
              style={{
                padding: '9px 16px', fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--color-forest-950)', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Run another
              <ArrowRight size={15} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      {modalStep && (
        <StepDetailModal
          stepResult={modalStep}
          attemptId={attemptId}
          onClose={() => setModalStep(null)}
        />
      )}
    </section>
  )
}
