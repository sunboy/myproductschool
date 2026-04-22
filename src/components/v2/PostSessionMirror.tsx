'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { StepDetailModal } from './StepDetailModal'

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
    primary: string
    signal: string
    framework_hint: string
  }
  lumaSignal?: string | null
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
  onRunAnother?: () => void
  onDashboard: () => void
  onNextChallenge?: () => void
}

// ── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const STEP_ICONS: Record<string, string> = {
  frame: 'center_focus_strong',
  list: 'format_list_bulleted',
  optimize: 'tune',
  win: 'emoji_events',
}

const STEP_COLORS: Record<string, string> = {
  frame: '#4a7c59',
  list: '#6b8275',
  optimize: '#c9933a',
  win: '#a878d6',
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

type Verdict = 'pass' | 'partial' | 'miss'

function qualityToVerdict(quality: string): Verdict {
  if (quality === 'best') return 'pass'
  if (quality === 'good_but_incomplete' || quality === 'surface') return 'partial'
  return 'miss'
}

const VERDICT_COLOR: Record<Verdict, string> = {
  pass: '#2f7a4a',
  partial: '#c9933a',
  miss: '#b23a2a',
}

const VERDICT_BG: Record<Verdict, string> = {
  pass: 'rgba(47,122,74,0.08)',
  partial: 'rgba(201,147,58,0.10)',
  miss: 'rgba(178,58,42,0.08)',
}

const VERDICT_LABEL: Record<Verdict, string> = {
  pass: 'CLEAN',
  partial: 'PARTIAL',
  miss: 'MISSED',
}

const VERDICT_ICON: Record<Verdict, string> = {
  pass: 'check_circle',
  partial: 'change_circle',
  miss: 'cancel',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      padding: '4px 10px', borderRadius: 10,
      background: 'var(--color-surface)', border: '1px solid var(--color-outline-faint)',
      minWidth: 52,
    }}>
      <div style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', fontWeight: 700, marginTop: 2 }}>{label}</div>
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
  const verdict = qualityToVerdict(result.quality_label)
  const verdictColor = VERDICT_COLOR[verdict]
  const coaching = result.lumaSignal ?? result.competency_signal?.signal
    ?? (verdict === 'pass' ? 'Strong reasoning on this move.' : verdict === 'partial' ? 'Partially on track — room to sharpen.' : 'The key move was missed here.')
  const competency = result.competency_signal?.primary
    ? formatCompetencyName(result.competency_signal.primary)
    : (STEP_COMPETENCY_KEYS[result.step]?.[0] ?? null)
  const chips = buildChoiceChips(result)

  return (
    <div
      ref={cardRef}
      onClick={() => onOpenModal(result)}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-outline-faint)',
        borderLeft: `3px solid ${verdictColor}`,
        borderRadius: 14,
        padding: '12px 12px 10px',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative',
        boxShadow: '0 1px 2px rgba(30,27,20,0.04)',
        minWidth: 0,
        cursor: 'pointer',
        transition: 'box-shadow 200ms, border-color 200ms',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = `0 4px 16px -6px ${verdictColor}44`
        el.style.borderColor = verdictColor
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = '0 1px 2px rgba(30,27,20,0.04)'
        el.style.borderTopColor = 'var(--color-outline-faint)'
        el.style.borderRightColor = 'var(--color-outline-faint)'
        el.style.borderBottomColor = 'var(--color-outline-faint)'
        el.style.borderLeftColor = verdictColor
      }}
    >
      {/* Diamond badge */}
      <div
        ref={badgeRef}
        style={{
          position: 'absolute', top: -14, left: 12,
          width: 30, height: 30,
          background: verdictColor,
          color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 12,
          transform: 'rotate(45deg)',
          borderRadius: 4,
          boxShadow: `0 6px 14px -4px ${verdictColor}`,
          zIndex: 3,
        }}
      >
        <span style={{ transform: 'rotate(-45deg)', display: 'inline-block' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Header: step pill + verdict */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginLeft: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 999,
          background: VERDICT_BG[verdict],
          color: verdictColor,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
            {STEP_ICONS[result.step]}
          </span>
          {STEP_LABELS[result.step]}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color: verdictColor }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
            {VERDICT_ICON[verdict]}
          </span>
          {VERDICT_LABEL[verdict]}
        </div>
      </div>

      {/* Choice chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {chips.map((chip, i) => (
            <span
              key={i}
              style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 99,
                background: 'var(--color-surface-container-high)',
                color: 'var(--color-on-surface-variant)',
                border: '1px solid var(--color-outline-faint)',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Luma coaching — 2-line clamp */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, marginTop: -2 }}>
          <LumaGlyph size={20} state={verdict === 'pass' ? 'celebrating' : verdict === 'partial' ? 'listening' : 'idle'} className="text-primary" />
        </div>
        <p style={{
          fontSize: 12, lineHeight: 1.5, color: 'var(--color-on-surface)', margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}>
          {coaching}
        </p>
      </div>

      {/* Footer: competency tag + detail link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        {competency && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: 'var(--color-primary-fixed)',
            color: 'var(--color-primary)',
          }}>
            {competency}
          </span>
        )}
        <span style={{
          fontSize: 11, fontWeight: 600, color: 'var(--color-primary)',
          display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 'auto',
        }}>
          Full detail ›
        </span>
      </div>
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
        background: 'var(--color-surface-container-low)',
        border: '1px solid var(--color-outline-faint)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-on-surface-variant)', lineHeight: 1.2 }}>
          {COMPETENCY_LABELS[data.competency] ?? formatCompetencyName(data.competency)}
        </div>
        {delta !== 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 13, color: c,
            padding: '1px 6px', borderRadius: 6, background: bg,
          }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 12, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              {up ? 'arrow_upward' : 'arrow_downward'}
            </span>
            {up ? '+' : ''}{delta}
          </div>
        )}
      </div>
      <div style={{ position: 'relative', height: 4, background: 'var(--color-outline-faint)', borderRadius: 999 }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: up ? `${data.before}%` : `${data.before + delta}%`,
          width: `${barWidth * 0.1 + Math.abs(delta) * 1.2}%`,
          background: c,
          borderRadius: 999,
        }} />
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--color-on-surface-variant)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {data.before} → {data.after}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PostSessionMirror({
  xpAwarded,
  stepResults,
  competencyDeltas,
  onRunAnother,
  onDashboard,
  onNextChallenge,
}: PostSessionMirrorProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([])
  const deltaRefs = useRef<(HTMLDivElement | null)[]>([])
  const xpRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [modalStep, setModalStep] = useState<StepResult | null>(null)

  const passCount = stepResults.filter(r => qualityToVerdict(r.quality_label) === 'pass').length
  const partialCount = stepResults.filter(r => qualityToVerdict(r.quality_label) === 'partial').length
  const missCount = stepResults.filter(r => qualityToVerdict(r.quality_label) === 'miss').length

  const summaryLine = passCount === 4
    ? 'Clean run. Every move landed.'
    : passCount >= 2
    ? `You framed the right problem, but ${missCount > 0 ? 'your Win needed a metric' : 'room to sharpen the final move'}.`
    : 'Partial run — the coaching below shows where each move went.'

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

    if (pathRef.current) {
      const len = pathRef.current.getTotalLength()
      pathRef.current.style.strokeDasharray = String(len)
      pathRef.current.style.strokeDashoffset = String(len)
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.4 })
    if (pathRef.current) {
      tl.to(pathRef.current, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, '-=0.15')
    }

    stepResults.forEach((_, i) => {
      tl.to(badgeRefs.current[i], { scale: 1, opacity: 1, rotation: 0, duration: 0.32, ease: 'back.out(2.2)' }, 0.55 + i * 0.22)
      tl.to(cardRefs.current[i], { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, 0.62 + i * 0.22)
    })

    tl.to(deltaRefs.current.filter(Boolean), { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 }, '-=0.2')
    if (xpRef.current) tl.to(xpRef.current, { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2.5)' }, '-=0.15')
    if (footerRef.current) tl.to(footerRef.current, { opacity: 1, y: 0, duration: 0.35 }, '-=0.3')

    return () => { tl.kill() }
  }, [stepResults.length])

  return (
    <section
      className="w-full h-full overflow-hidden flex flex-col"
      style={{
        background: 'var(--color-background)',
        backgroundImage: `
          linear-gradient(to right, rgba(74,124,89,0.045) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(74,124,89,0.045) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 p-4">

        {/* Header */}
        <div
          ref={headerRef}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <LumaGlyph size={48} state="celebrating" className="text-primary" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                Luma's Debrief
              </div>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 2, lineHeight: 1.3 }}>
                {summaryLine}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 4, maxWidth: 480, lineHeight: 1.5 }}>
                The FLOW path below shows where you stayed inside the move and where you drifted out.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>
              Results
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <MiniStat label="Clean" value={`${passCount}/${stepResults.length}`} color="#2f7a4a" />
              {partialCount > 0 && <MiniStat label="Partial" value={String(partialCount)} color="#c9933a" />}
              {missCount > 0 && <MiniStat label="Miss" value={String(missCount)} color="#b23a2a" />}
            </div>
          </div>
        </div>

        {/* FLOW path + 4 step cards */}
        {stepResults.length > 0 && (
          <div style={{ position: 'relative', flexShrink: 0, paddingTop: 18 }}>
            <svg
              width="100%" height="100%"
              viewBox="0 0 1000 260"
              preserveAspectRatio="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}
              aria-hidden
            >
              <defs>
                <marker id="psArrowHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#c9933a" />
                </marker>
              </defs>
              {/* Path near top of cards — matches reference design */}
              <path
                ref={pathRef}
                d="M 125 22 C 200 0, 260 80, 375 46 S 570 -6, 625 42 S 820 90, 875 28"
                fill="none"
                stroke="#c9933a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="6 6"
                markerEnd="url(#psArrowHead)"
                style={{ opacity: 0.55 }}
              />
            </svg>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${stepResults.length}, minmax(0, 1fr))`,
              gap: 10,
              position: 'relative', zIndex: 2,
              width: '100%',
            }}>
              {stepResults.map((result, i) => (
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
        {stepResults.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-body text-sm text-on-surface-variant italic">Loading results…</p>
          </div>
        )}

        {/* Competency delta strip — always shown, falls back to neutral 50 baseline if no deltas */}
        {(() => {
          const ALL_COMPETENCIES = ['motivation_theory', 'cognitive_empathy', 'taste', 'strategic_thinking', 'creative_execution', 'domain_expertise']
          const displayDeltas: CompetencyDelta[] = ALL_COMPETENCIES.map(key => {
            const found = competencyDeltas.find(d => d.competency === key)
            return found ?? { competency: key, before: 50, after: 50, direction: 'flat' as const }
          })
          return (
            <div style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-outline-faint)',
              borderRadius: 14, padding: '12px 14px', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: 'var(--color-on-surface-variant)',
                }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                  >
                    psychology
                  </span>
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
      </div>

      {/* Footer */}
      <div
        ref={footerRef}
        style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid var(--color-outline-faint)',
          background: 'var(--color-surface)',
          gap: 12,
        }}
      >
        {/* XP coin */}
        <div ref={xpRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            position: 'relative', width: 52, height: 52,
            background: 'radial-gradient(circle at 30% 30%, #f4d98a, #c9933a 60%, #8a6620)',
            borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 15,
            boxShadow: '0 8px 24px -6px rgba(201,147,58,0.5), inset 0 1px 0 rgba(255,255,255,0.5)',
            border: '2px solid #fff8e6',
            flexShrink: 0,
          }}>
            +{xpAwarded}
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: '2px dashed rgba(201,147,58,0.4)',
              animation: 'lumaAntenna 9s linear infinite',
            }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700, lineHeight: 1.15 }}>
              +{xpAwarded} XP earned
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
              Keep the streak going
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={onDashboard}
            className="btn btn--ghost"
            style={{ padding: '9px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
            >
              dashboard
            </span>
            Dashboard
          </button>
          {onNextChallenge && (
            <button
              onClick={onNextChallenge}
              className="btn btn--primary"
              style={{ padding: '9px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Next Challenge
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                arrow_forward
              </span>
            </button>
          )}
          {onRunAnother && !onNextChallenge && (
            <button
              onClick={onRunAnother}
              className="btn btn--primary"
              style={{ padding: '9px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Run another
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                arrow_forward
              </span>
            </button>
          )}
        </div>
      </div>
      {modalStep && (
        <StepDetailModal
          stepResult={modalStep}
          onClose={() => setModalStep(null)}
        />
      )}
    </section>
  )
}
