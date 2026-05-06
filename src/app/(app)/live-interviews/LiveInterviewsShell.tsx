'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { LiveInterviewPersona } from '@/lib/mock-live-interviews'
import type { ScenarioBrief } from './page'
import type { LoopDiscipline } from '@/lib/interview-loops/types'
import StartInterviewButton from './StartInterviewButton'
import SingleRoundPicker from './SingleRoundPicker'

// ── Design tokens (exact from styles.css) ─────────────────────────────────────
const T = {
  surface:               '#fdfbf6',
  surfaceContainerLow:   '#f4eee2',
  surfaceContainer:      '#ede6d6',
  surfaceContainerHigh:  '#e4dcc8',
  outline:               '#b8ad94',
  outlineVariant:        '#d5cab1',
  outlineFaint:          '#e7dfc9',
  onSurface:             '#1e1b14',
  onSurfaceVariant:      '#4e4a3f',
  onSurfaceMuted:        '#78715f',
  primary:               '#4a7c59',
  primaryContainer:      '#cfe3d3',
  primaryContainerStrong:'#b6d3bc',
  primaryFixed:          '#d8ead9',
  onPrimary:             '#ffffff',
  onPrimaryContainer:    '#0f3d1f',
  amber:                 '#c9933a',
  amberSoft:             '#f3e2b9',
  tertiary:              '#705c30',
  danger:                '#b23a2a',
  success:               '#2f7a4a',
  btnDarkBg:             '#1f2421',
  btnDarkText:           '#f0ede4',
}

const DIFF_LABEL: Record<string, string> = {
  standard: 'Standard',
  advanced: 'Advanced',
  staff_plus: 'Staff+',
}

const DIFF_DOT: Record<string, string> = {
  standard: T.primary,
  advanced: T.amber,
  staff_plus: T.danger,
}

// ── Chip (matches .chip from styles.css) ──────────────────────────────────────
function Chip({ label, outline, amber }: { label: string; outline?: boolean; amber?: boolean }) {
  if (amber) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
      background: T.amberSoft, color: T.tertiary,
      border: '1px solid transparent', lineHeight: 1.4,
    }}>{label}</span>
  )
  if (outline) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
      background: 'transparent', color: T.onSurfaceVariant,
      border: `1px solid ${T.outlineVariant}`, lineHeight: 1.4,
    }}>{label}</span>
  )
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
      background: T.surfaceContainer, color: T.onSurfaceVariant,
      border: `1px solid ${T.outlineFaint}`, lineHeight: 1.4,
    }}>{label}</span>
  )
}

// ── Mode card ──────────────────────────────────────────────────────────────────
function ModeCard({
  active, onClick, activeStyle, inactiveStyle, hoverStyle, sonic = 'nudge', children,
}: {
  active: boolean
  onClick: () => void
  sonic?: string
  activeStyle: React.CSSProperties
  inactiveStyle: React.CSSProperties
  hoverStyle: React.CSSProperties
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const computed = active ? activeStyle : hovered ? hoverStyle : inactiveStyle
  return (
    <button
      onClick={onClick}
      data-hatch-sound={active ? undefined : sonic}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: 'left', outline: 'none', cursor: 'pointer',
        borderRadius: 24, // --radius-lg
        padding: '22px 24px',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', overflow: 'hidden',
        transition: 'all 200ms cubic-bezier(.2,.8,.2,1)',
        transform: hovered && !active ? 'translateY(-2px)' : 'none',
        ...computed,
      }}
    >
      {/* "Select →" hint when inactive */}
      {!active && (
        <span style={{
          position: 'absolute', top: 14, right: 16,
          fontSize: 12, fontWeight: 700,
          opacity: hovered ? 0.9 : 0.35,
          color: 'inherit', letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 4,
          transition: 'opacity 200ms, transform 200ms',
          transform: hovered ? 'translateX(2px)' : 'none',
          pointerEvents: 'none',
        }}>
          Select <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
        </span>
      )}
      {children}
    </button>
  )
}

// ── Radio dot ──────────────────────────────────────────────────────────────────
function RadioDot({ active, dark }: { active: boolean; dark?: boolean }) {
  return (
    <div style={{
      marginLeft: 'auto', flexShrink: 0,
      width: 20, height: 20, borderRadius: '50%',
      border: active ? 'none' : `2px solid ${dark ? 'rgba(255,255,255,0.25)' : T.outlineVariant}`,
      background: active ? (dark ? '#7ee099' : T.primary) : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 200ms',
    }}>
      {active && (
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: dark ? '#0e2818' : '#fff', fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
          check
        </span>
      )}
    </div>
  )
}

// ── Loop stat pill ─────────────────────────────────────────────────────────────
function LoopStatPill({ label, count, dotColor }: { label: string; count: number; dotColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, boxShadow: `0 0 0 3px ${dotColor}22`, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontSize: 12, color: 'rgba(243,237,224,0.85)' }}>
        <b style={{ color: '#f3ede0' }}>{count}</b> {label}
      </span>
    </div>
  )
}

// ── Loop status badge ──────────────────────────────────────────────────────────
function LoopStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; bg: string; fg: string; dot: string; pulse?: boolean }> = {
    in_progress: { label: 'In progress', bg: '#fef3d7', fg: '#7a5a18', dot: T.amber, pulse: true },
    configured:  { label: 'Configured',  bg: T.primaryContainer, fg: T.onPrimaryContainer, dot: T.primary },
    completed:   { label: 'Completed',   bg: T.surfaceContainer,  fg: T.onSurfaceVariant,  dot: '#78715f' },
  }
  const c = cfg[status] ?? { label: status, bg: T.surfaceContainer, fg: T.onSurfaceVariant, dot: '#78715f' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 999,
      background: c.bg, color: c.fg,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0, display: 'inline-block',
        ...(c.pulse ? { animation: 'pulse-soft 2s ease-in-out infinite' } : {}),
      }} />
      {c.label}
    </span>
  )
}

// ── Round row ──────────────────────────────────────────────────────────────────
interface Round {
  name: string
  mins: number
  status: 'locked' | 'ready' | 'in_progress' | 'passed' | 'failed'
  grade?: string
  elapsed?: number
  sessionId?: string | null
  discipline?: string
}

function RoundRow({ round, index, isCurrent }: { round: Round; index: number; isCurrent: boolean }) {
  const ICON: Record<string, string> = {
    passed: 'check_circle', failed: 'cancel', in_progress: 'play_circle',
    ready: 'radio_button_unchecked', locked: 'lock',
  }
  const COLOR: Record<string, string> = {
    passed: T.success, failed: T.danger, in_progress: T.amber,
    ready: T.onSurfaceMuted, locked: T.outline,
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '28px 28px 1fr auto auto',
      gap: 14, alignItems: 'center',
      padding: '12px 14px', borderRadius: 12,
      background: isCurrent ? T.amberSoft : T.surfaceContainerLow,
      border: `1px solid ${isCurrent ? '#e8c87a' : T.outlineFaint}`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: T.onSurfaceMuted, letterSpacing: '0.06em' }}>R{index}</span>
      <span className="material-symbols-outlined" style={{ fontSize: 20, color: COLOR[round.status], fontVariationSettings: "'FILL' 1" }}>
        {ICON[round.status]}
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.onSurface }}>{round.name}</div>
        <div style={{ fontSize: 12, color: T.onSurfaceMuted }}>
          {round.status === 'passed'      && <>Passed · {round.grade}</>}
          {round.status === 'in_progress' && <>In progress · {round.elapsed} of {round.mins} min elapsed</>}
          {round.status === 'ready'       && <>Ready · ~{round.mins} min</>}
          {round.status === 'locked'      && <>Unlocks after previous round</>}
          {round.status === 'failed'      && <>Needs retry</>}
        </div>
      </div>
      {round.status === 'in_progress' ? (
        <div style={{ width: 80, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${((round.elapsed ?? 0) / round.mins) * 100}%`, height: '100%', background: T.amber }} />
        </div>
      ) : (
        <span style={{ width: 80, display: 'inline-block' }} />
      )}
      <div>
        {round.status === 'in_progress' && (
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: T.primary, color: T.onPrimary,
            fontSize: 12, fontWeight: 700,
          }}>
            Resume <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </button>
        )}
        {round.status === 'ready' && (
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
            background: 'transparent', color: T.onSurface,
            border: `1px solid ${T.outlineVariant}`, fontSize: 12, fontWeight: 700,
          }}>
            Start <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </button>
        )}
        {round.status === 'passed' && (
          <button style={{ border: 'none', background: 'transparent', color: T.primary, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            Review →
          </button>
        )}
        {round.status === 'locked' && <span style={{ fontSize: 12, color: T.onSurfaceMuted }}>-</span>}
      </div>
    </div>
  )
}

// ── Loop types ────────────────────────────────────────────────────────────────
interface Loop {
  id: string
  loopDbId: string
  name: string
  company: string
  icon: string
  status: 'in_progress' | 'configured' | 'completed'
  progressPct?: number
  lastActive: string
  totalMins: number
  grade?: string
  overallScore?: number
  rounds: Round[]
  targetRole?: string
  roundOrder?: LoopDiscipline[]
}

// ── API → UI mapping helpers ──────────────────────────────────────────────────
const ROUND_MINS: Record<LoopDiscipline, number> = {
  product_sense: 35, system_design: 40, data_modeling: 30, coding: 35,
}

const DISCIPLINE_LABELS: Record<LoopDiscipline, string> = {
  product_sense: 'Product sense',
  system_design: 'System design',
  data_modeling: 'Data modeling',
  coding: 'Coding',
}

const COMPANY_ICONS: Record<string, string> = {
  Airbnb: 'home', Netflix: 'movie', Figma: 'design_services',
  Google: 'search', Meta: 'groups', Notion: 'description',
  Stripe: 'credit_card', Uber: 'local_taxi',
}

interface ApiLoopRound {
  id: string
  status: string
  round_index: number
  discipline: string
  round_debrief_json?: { grade?: string } | null
  started_at?: string | null
  session_id?: string | null
}

interface ApiLoop {
  id: string
  title: string
  target_company?: string | null
  target_role?: string | null
  status: string
  created_at: string | null
  started_at?: string | null
  completed_at?: string | null
  round_order?: LoopDiscipline[] | null
  loop_debrief_json?: {
    overall_score?: number
    round_scores?: Array<{ grade?: string }>
  } | null
  loop_rounds?: ApiLoopRound[] | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function relTime(iso: string | null): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function mapApiLoop(l: ApiLoop): Loop {
  const rounds = [...(l.loop_rounds ?? [])].sort((a, b) => a.round_index - b.round_index)

  const DB_TO_UI_STATUS: Record<string, Loop['status']> = {
    draft: 'configured', active: 'in_progress', paused: 'in_progress',
    completed: 'completed', abandoned: 'completed',
  }

  const completedCount = rounds.filter((r) => r.status === 'completed').length
  const progressPct = rounds.length > 0 ? Math.round((completedCount / rounds.length) * 100) : 0
  const activeRound = rounds.find((r) => r.status === 'active' || r.status === 'paused')
  const uiStatus = DB_TO_UI_STATUS[l.status] ?? 'configured'

  let lastActive = `Configured ${fmtDate(l.created_at)}`
  if (l.status === 'completed' && l.completed_at) lastActive = `Completed ${fmtDate(l.completed_at)}`
  else if (l.started_at) lastActive = `Resumed ${relTime(l.started_at)}`

  return {
    id: l.id,
    loopDbId: l.id,
    name: l.title,
    company: l.target_company ?? 'General',
    icon: COMPANY_ICONS[l.target_company ?? ''] ?? 'corporate_fare',
    status: uiStatus,
    progressPct,
    lastActive,
    totalMins: rounds.reduce((sum, r) => sum + (ROUND_MINS[r.discipline as LoopDiscipline] ?? 30), 0),
    grade: l.loop_debrief_json?.round_scores?.[0]?.grade ?? undefined,
    overallScore: l.loop_debrief_json?.overall_score ?? undefined,
    targetRole: l.target_role ?? undefined,
    roundOrder: (l.round_order ?? []) as LoopDiscipline[],
    rounds: rounds.map((r, i): Round => {
      const prevDone = i === 0 || rounds[i - 1]?.status === 'completed'
      let roundStatus: Round['status'] = 'locked'
      if (r.status === 'completed') roundStatus = 'passed'
      else if (r.status === 'active') roundStatus = 'in_progress'
      else if (r.status === 'paused') roundStatus = 'in_progress'
      else if (r.status === 'pending' && (l.status === 'draft' || prevDone)) roundStatus = 'ready'
      return {
        name: DISCIPLINE_LABELS[r.discipline as LoopDiscipline] ?? r.discipline,
        mins: ROUND_MINS[r.discipline as LoopDiscipline] ?? 30,
        status: roundStatus,
        grade: r.round_debrief_json?.grade as string | undefined,
        elapsed: activeRound?.id === r.id && r.started_at
          ? Math.floor((Date.now() - new Date(r.started_at).getTime()) / 60000)
          : undefined,
        sessionId: r.session_id ?? null,
        discipline: r.discipline ?? null,
      }
    }),
  }
}

// ── Loop roster row ────────────────────────────────────────────────────────────
function LoopRow({ loop, active, onClick }: { loop: Loop; active: boolean; onClick: () => void }) {
  const done = loop.rounds.filter((r) => r.status === 'passed').length
  const inProg = loop.rounds.some((r) => r.status === 'in_progress')

  return (
    <button onClick={onClick} data-hatch-sound={active ? undefined : 'nudge'} style={{
      width: '100%', textAlign: 'left', border: 'none',
      background: active ? T.surface : 'transparent',
      boxShadow: active ? `0 1px 0 ${T.outlineFaint}, 0 6px 16px -10px rgba(30,27,20,0.18)` : 'none',
      borderRadius: 12, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      cursor: 'pointer', transition: 'all 200ms',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 18,
          color: active ? T.primary : T.onSurfaceMuted,
          fontVariationSettings: "'FILL' 0",
        }}>{loop.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.onSurface, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {loop.name}
          </div>
          <div style={{ fontSize: 11, color: T.onSurfaceMuted, marginTop: 1 }}>{loop.lastActive}</div>
        </div>
        {loop.status === 'completed' && loop.grade && (
          <span style={{ fontSize: 11, fontWeight: 800, color: T.primary, background: T.primaryFixed, padding: '2px 8px', borderRadius: 999 }}>
            {loop.grade}
          </span>
        )}
      </div>

      {/* Round pips */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {loop.rounds.map((r, i) => {
          const c = r.status === 'passed'      ? T.primary
                  : r.status === 'in_progress' ? T.amber
                  : r.status === 'failed'      ? T.danger
                  : r.status === 'ready'       ? '#b8ad94'
                  : '#d5cab1'
          return (
            <span key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: r.status === 'in_progress'
                ? `linear-gradient(90deg,${T.primary} 0%,${T.primary} 50%,${T.amber} 50%,${T.amber} 100%)`
                : c,
            }} />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.onSurfaceMuted }}>
        <span>{done}/{loop.rounds.length} rounds {inProg && '· 1 active'}</span>
        <span>~{loop.totalMins} min</span>
      </div>
    </button>
  )
}

// ── Loop group label ──────────────────────────────────────────────────────────
function LoopGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ padding: '4px 8px 6px', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.onSurfaceMuted }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  )
}

// ── Loop detail ───────────────────────────────────────────────────────────────
function LoopDetail({ loop, onEdit, onDelete }: { loop: Loop; onEdit?: () => void; onDelete?: () => void }) {
  const router = useRouter()
  const isInProgress = loop.status === 'in_progress'
  const isConfigured = loop.status === 'configured'
  const isCompleted  = loop.status === 'completed'
  const nextRound = loop.rounds.find((r) => r.status === 'in_progress' || r.status === 'ready')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 32px', gap: 22, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: T.primaryContainer, color: T.onPrimaryContainer,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}>{loop.icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <LoopStatusBadge status={loop.status} />
            <span style={{ fontSize: 12, color: T.onSurfaceMuted }}>{loop.lastActive}</span>
          </div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-headline,Literata,Georgia,serif)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.15, color: T.onSurface }}>
            {loop.name}
          </h2>
          <div style={{ marginTop: 6, fontSize: 13, color: T.onSurfaceMuted }}>
            {loop.rounds.length} rounds · ~{loop.totalMins} min total
            {isCompleted && loop.overallScore && <> · Final score <b style={{ color: T.primary }}>{loop.overallScore} · {loop.grade}</b></>}
          </div>
        </div>

        {/* Primary CTA */}
        {isInProgress && (() => {
          const inProgressIdx = loop.rounds.findIndex((r) => r.status === 'in_progress')
          const inProgressRound = loop.rounds[inProgressIdx]
          const params = new URLSearchParams({ loop_id: loop.loopDbId, round_index: String(inProgressIdx) })
          if (inProgressRound?.discipline) params.set('discipline', inProgressRound.discipline)
          const href = inProgressRound?.sessionId
            ? `/live-interviews/${inProgressRound.sessionId}?${params.toString()}`
            : `/live-interviews/loop/${loop.loopDbId}`
          return (
            <button
              onClick={() => router.push(href)}
              data-hatch-sound="submit"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 24px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: T.primary, color: T.onPrimary,
                fontSize: 15, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
              Resume round {inProgressIdx + 1}
            </button>
          )
        })()}
        {isConfigured && (
          <button
            onClick={() => router.push(`/live-interviews/loop/${loop.loopDbId}`)}
            data-hatch-sound="submit"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: T.btnDarkBg, color: T.btnDarkText,
              fontSize: 15, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
            Start loop
          </button>
        )}
        {isCompleted && (
          <button
            onClick={() => router.push(`/live-interviews/loop/${loop.loopDbId}`)}
            data-hatch-sound="nudge"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 999, cursor: 'pointer',
              background: 'transparent', color: T.onSurface,
              border: `1px solid ${T.outlineVariant}`,
              fontSize: 15, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>summarize</span>
            View debrief
          </button>
        )}
      </div>

      {/* Rounds */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.onSurfaceMuted, marginBottom: 10 }}>Rounds</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loop.rounds.map((r, i) => (
            <RoundRow key={i} round={r} index={i + 1} isCurrent={r === nextRound && isInProgress} />
          ))}
        </div>
      </div>

      {/* Config footer */}
      <div style={{
        marginTop: 'auto', display: 'flex', gap: 8, padding: '12px 14px',
        background: T.surfaceContainerLow, border: `1px solid ${T.outlineFaint}`,
        borderRadius: 12, alignItems: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.onSurfaceMuted }}>tune</span>
        <span style={{ fontSize: 12, color: T.onSurfaceVariant }}>
          Persona: <b>{loop.company}</b> · Difficulty <b>Staff+</b> · Chat mode · Auto-save every round
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {loop.status === 'configured' && (
            <>
              <button
                onClick={() => onEdit?.()}
                data-hatch-sound="open"
                style={{ border: 'none', background: 'transparent', color: T.primary, fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete?.()}
                data-hatch-sound="close"
                style={{ border: 'none', background: 'transparent', color: '#b83230', fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Loop builder ──────────────────────────────────────────────────────────────
const ROUND_OPTIONS = [
  { id: 'product-sense',  label: 'Product sense',  mins: 35, icon: 'center_focus_strong' },
  { id: 'system-design',  label: 'System design',  mins: 40, icon: 'schema' },
  { id: 'analytical',     label: 'Data modeling',  mins: 30, icon: 'bar_chart' },
  { id: 'coding',         label: 'Coding',         mins: 35, icon: 'code' },
]

const COMPANIES = [
  { name: 'Airbnb', icon: 'home' }, { name: 'Netflix', icon: 'movie' },
  { name: 'Figma', icon: 'design_services' }, { name: 'Google', icon: 'search' },
  { name: 'Meta', icon: 'groups' }, { name: 'Notion', icon: 'description' },
  { name: 'Stripe', icon: 'credit_card' }, { name: 'Uber', icon: 'local_taxi' },
]

const DIFF_LABELS: Record<string, string> = { standard: 'Standard', advanced: 'Advanced', staff_plus: 'Staff+' }

const UI_TO_DISCIPLINE: Record<string, LoopDiscipline> = {
  'product-sense': 'product_sense',
  'system-design': 'system_design',
  'analytical':    'data_modeling',
  'coding':        'coding',
}

// Maps a backend discipline to the first matching UI round id (used for pre-filling edit mode)
const DISCIPLINE_TO_UI: Record<LoopDiscipline, string> = {
  product_sense: 'product-sense',
  data_modeling: 'analytical',
  system_design: 'system-design',
  coding:        'coding',
}

// Reverse-map a target_role string (e.g. "Advanced") to the difficulty key
const DIFF_LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries({ standard: 'Standard', advanced: 'Advanced', staff_plus: 'Staff+' }).map(([k, v]) => [v, k])
)

interface LoopBuilderProps {
  editLoopId?: string
  initialCompany?: string
  initialDifficulty?: string
  initialRounds?: LoopDiscipline[]
  onCancel: () => void
  onSaved: (loopId: string) => void
}

function LoopBuilder({ editLoopId, initialCompany, initialDifficulty, initialRounds, onCancel, onSaved }: LoopBuilderProps) {
  const [selectedCo, setSelectedCo] = useState(initialCompany ?? 'Stripe')
  const [selectedRounds, setSelectedRounds] = useState<string[]>(() => {
    if (initialRounds && initialRounds.length > 0) {
      return initialRounds.map((d) => DISCIPLINE_TO_UI[d] ?? 'product-sense')
    }
    return ['product-sense', 'system-design']
  })
  const [difficulty, setDifficulty] = useState(() => {
    if (initialDifficulty) return DIFF_LABEL_TO_KEY[initialDifficulty] ?? initialDifficulty
    return 'advanced'
  })
  const voiceMode = false
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleRound = (id: string) =>
    setSelectedRounds((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id])

  const totalMins = selectedRounds.reduce((acc, id) => {
    return acc + (ROUND_OPTIONS.find((r) => r.id === id)?.mins ?? 0)
  }, 0)

  async function handleSave() {
    if (selectedRounds.length < 2 || saving) return
    setSaving(true)
    const roundOrder = selectedRounds.map((id) => UI_TO_DISCIPLINE[id] ?? 'product_sense')
    const isEdit = Boolean(editLoopId)
    const url = isEdit ? `/api/interview-loops/${editLoopId}` : '/api/interview-loops/create'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetCompany: selectedCo,
        targetRole: DIFF_LABELS[difficulty] ?? difficulty,
        roundOrder,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (res.ok && json.loopId) {
      onSaved(json.loopId)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 32px', gap: 20, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.primary, marginBottom: 6 }}>{editLoopId ? 'Edit loop' : 'New loop'}</div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-headline,Literata,Georgia,serif)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', color: T.onSurface }}>{editLoopId ? 'Update configuration' : 'Configure your loop'}</h2>
        </div>
        <button onClick={onCancel} data-hatch-sound="close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.onSurfaceMuted, padding: 6 }}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Name */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: T.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Loop name</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder={`${selectedCo} - ${DIFF_LABELS[difficulty]} loop`}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: `1px solid ${T.outlineVariant}`, background: T.surfaceContainerLow,
            fontFamily: 'inherit', fontSize: 14, color: T.onSurface, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Company */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: T.onSurfaceVariant, display: 'block', marginBottom: 8 }}>Company persona</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COMPANIES.map((c) => (
            <button key={c.name} onClick={() => setSelectedCo(c.name)} data-hatch-sound={selectedCo === c.name ? undefined : 'nudge'} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: selectedCo === c.name ? T.primaryContainer : T.surfaceContainerLow,
              color: selectedCo === c.name ? T.onPrimaryContainer : T.onSurfaceVariant,
              fontWeight: selectedCo === c.name ? 700 : 500, fontSize: 13,
              outline: selectedCo === c.name ? `2px solid ${T.primary}` : 'none',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: T.onSurfaceVariant, display: 'block', marginBottom: 8 }}>
          Rounds <span style={{ fontWeight: 400, color: T.onSurfaceMuted }}>- pick 2–5</span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {ROUND_OPTIONS.map((r) => {
            const on = selectedRounds.includes(r.id)
            const order = selectedRounds.indexOf(r.id)
            return (
              <button key={r.id} onClick={() => toggleRound(r.id)} data-hatch-sound="nudge" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: on ? T.primaryContainer : T.surfaceContainerLow,
                outline: on ? `1px solid ${T.primaryContainerStrong}` : '1px solid transparent',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: on ? T.primary : T.surfaceContainer,
                  color: on ? '#fff' : T.onSurfaceMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                }}>
                  {on ? `R${order + 1}` : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{r.icon}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: on ? 700 : 500, color: on ? T.onPrimaryContainer : T.onSurface }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: T.onSurfaceMuted }}>~{r.mins} min</div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: on ? T.primary : T.outlineVariant, fontVariationSettings: "'FILL' 1" }}>
                  {on ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Difficulty + options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.onSurfaceVariant, display: 'block', marginBottom: 8 }}>Difficulty</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(DIFF_LABELS).map(([k, label]) => (
              <button key={k} onClick={() => setDifficulty(k)} data-hatch-sound={difficulty === k ? undefined : 'nudge'} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: difficulty === k ? T.onSurface : T.surfaceContainerLow,
                color: difficulty === k ? '#f7ede0' : T.onSurfaceVariant,
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.onSurfaceVariant, display: 'block', marginBottom: 8 }}>Options</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'not-allowed', fontSize: 13, color: T.onSurfaceMuted }}>
              <input type="checkbox" checked={voiceMode} readOnly disabled style={{ accentColor: T.primary, width: 15, height: 15 }} />
              Chat mode
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: T.onSurface }}>
              <input type="checkbox" defaultChecked style={{ accentColor: T.primary, width: 15, height: 15 }} />
              Auto-save each round
            </label>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', borderRadius: 12,
        background: T.surfaceContainerLow, border: `1px solid ${T.outlineFaint}`,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.onSurface }}>{selectedRounds.length} rounds · ~{totalMins} min total</div>
          <div style={{ fontSize: 12, color: T.onSurfaceMuted }}>{selectedCo} · {DIFF_LABELS[difficulty]} · Chat mode</div>
        </div>
        <button onClick={onCancel} data-hatch-sound="close" style={{
          padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
          background: 'transparent', color: T.onSurface, border: `1px solid ${T.outlineVariant}`,
        }}>Cancel</button>
        <button onClick={handleSave} data-hatch-sound="submit" disabled={selectedRounds.length < 2 || saving} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 999, border: 'none', fontSize: 13, fontWeight: 700,
          background: T.btnDarkBg, color: T.btnDarkText,
          opacity: selectedRounds.length < 2 || saving ? 0.45 : 1,
          cursor: selectedRounds.length < 2 || saving ? 'not-allowed' : 'pointer',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{saving ? 'hourglass_empty' : 'save'}</span>
          {saving ? 'Saving…' : 'Save loop'}
        </button>
      </div>
    </div>
  )
}

// ── Mock loop data ─────────────────────────────────────────────────────────────
const MOCK_LOOPS: Loop[] = [
  {
    id: 'lp1', loopDbId: 'lp1', name: 'Stripe - Senior PM loop', company: 'Stripe', icon: 'credit_card',
    status: 'in_progress', progressPct: 33,
    lastActive: 'Resumed 2h ago', totalMins: 120,
    rounds: [
      { name: 'Product sense',  mins: 35, status: 'passed',      grade: 'B+' },
      { name: 'System design',  mins: 40, status: 'in_progress', elapsed: 14 },
      { name: 'Data modeling',  mins: 30, status: 'locked' },
      { name: 'Coding',         mins: 35, status: 'locked' },
    ],
  },
  {
    id: 'lp2', loopDbId: 'lp2', name: 'Netflix - Staff PM loop', company: 'Netflix', icon: 'movie',
    status: 'configured',
    lastActive: 'Configured Apr 22', totalMins: 140,
    rounds: [
      { name: 'Product sense', mins: 35, status: 'ready' },
      { name: 'System design', mins: 40, status: 'ready' },
      { name: 'Data modeling', mins: 30, status: 'ready' },
      { name: 'Coding',        mins: 35, status: 'ready' },
    ],
  },
  {
    id: 'lp3', loopDbId: 'lp3', name: 'Meta - IC6 PM loop', company: 'Meta', icon: 'groups',
    status: 'completed', grade: 'B+', overallScore: 84,
    lastActive: 'Completed Apr 16', totalMins: 110,
    rounds: [
      { name: 'Product sense', mins: 35, status: 'passed', grade: 'B+' },
      { name: 'System design', mins: 40, status: 'passed', grade: 'A-' },
      { name: 'Data modeling', mins: 30, status: 'passed', grade: 'B' },
      { name: 'Coding',        mins: 35, status: 'passed', grade: 'B+' },
    ],
  },
]

// ── Full loop panel ───────────────────────────────────────────────────────────
function FullLoopPanel() {
  const [loops, setLoops] = useState<Loop[]>(MOCK_LOOPS)
  const [selectedLoop, setSelectedLoop] = useState<string>(MOCK_LOOPS[0]?.id ?? '')
  const [building, setBuilding] = useState(false)
  const [editingLoopId, setEditingLoopId] = useState<string | undefined>(undefined)
  const [loadingLoops, setLoadingLoops] = useState(true)

  const fetchLoops = useCallback(async () => {
    try {
      const res = await fetch('/api/interview-loops')
      if (!res.ok) return
      const { loops: raw } = await res.json()
      if (Array.isArray(raw)) {
        const mapped = raw.map(mapApiLoop)
        setLoops(mapped.length > 0 ? mapped : MOCK_LOOPS)
        if (mapped.length > 0 && !mapped.find((l) => l.id === selectedLoop)) {
          setSelectedLoop(mapped[0].id)
        }
      }
    } catch {
      // keep mock data on error
    } finally {
      setLoadingLoops(false)
    }
  }, [selectedLoop])

  useEffect(() => {
    fetchLoops()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeLoop = loops.find((l) => l.id === selectedLoop) ?? loops[0]
  const inProgress = loops.filter((l) => l.status === 'in_progress')
  const configured = loops.filter((l) => l.status === 'configured')
  const completed  = loops.filter((l) => l.status === 'completed')

  async function handleLoopSaved(loopId: string) {
    await fetchLoops()
    setSelectedLoop(loopId)
    setBuilding(false)
    setEditingLoopId(undefined)
  }

  async function handleDeleteLoop(loopId: string) {
    const res = await fetch(`/api/interview-loops/${loopId}`, { method: 'DELETE' })
    if (!res.ok) return
    await fetchLoops()
    setSelectedLoop('')
    setBuilding(false)
    setEditingLoopId(undefined)
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
      borderRadius: 24, overflow: 'hidden',
      border: `1px solid ${T.outlineFaint}`,
      background: T.surface,
      minHeight: 540,
    }}>
      {/* Left roster */}
      <div style={{ borderRight: `1px solid ${T.outlineFaint}`, display: 'flex', flexDirection: 'column', background: T.surfaceContainerLow }}>
        <div style={{ padding: '16px 18px 10px', borderBottom: `1px solid ${T.outlineFaint}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.onSurfaceMuted }}>Your loops</div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 10px' }}>
          {loadingLoops ? (
            [0, 1, 2].map((i) => (
              <div key={i} style={{ height: 72, background: T.surfaceContainer, borderRadius: 12, marginBottom: 6, opacity: 0.6 }} />
            ))
          ) : (
            <>
              {inProgress.length > 0 && (
                <LoopGroup label="In progress">
                  {inProgress.map((l) => (
                    <LoopRow key={l.id} loop={l} active={l.id === selectedLoop && !building} onClick={() => { setSelectedLoop(l.id); setBuilding(false) }} />
                  ))}
                </LoopGroup>
              )}
              {configured.length > 0 && (
                <LoopGroup label="Configured">
                  {configured.map((l) => (
                    <LoopRow key={l.id} loop={l} active={l.id === selectedLoop && !building} onClick={() => { setSelectedLoop(l.id); setBuilding(false) }} />
                  ))}
                </LoopGroup>
              )}
              {completed.length > 0 && (
                <LoopGroup label="Completed">
                  {completed.map((l) => (
                    <LoopRow key={l.id} loop={l} active={l.id === selectedLoop && !building} onClick={() => { setSelectedLoop(l.id); setBuilding(false) }} />
                  ))}
                </LoopGroup>
              )}
            </>
          )}
          <button onClick={() => setBuilding(true)} data-hatch-sound={building ? undefined : 'open'} style={{
            width: '100%', marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 12,
            background: building ? T.primaryContainer : 'transparent',
            border: building ? `1.5px solid ${T.primary}` : `1.5px dashed ${T.outlineVariant}`,
            color: building ? T.onPrimaryContainer : T.onSurface,
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Build new loop
          </button>
        </div>
      </div>

      {/* Right: detail or builder */}
      {building
        ? <LoopBuilder
            editLoopId={editingLoopId}
            initialCompany={editingLoopId ? activeLoop?.company : undefined}
            initialDifficulty={editingLoopId ? activeLoop?.targetRole : undefined}
            initialRounds={editingLoopId ? activeLoop?.roundOrder : undefined}
            onCancel={() => { setBuilding(false); setEditingLoopId(undefined) }}
            onSaved={handleLoopSaved}
          />
        : activeLoop
          ? <LoopDetail
              loop={activeLoop}
              onEdit={() => { setEditingLoopId(activeLoop.loopDbId); setBuilding(true) }}
              onDelete={() => handleDeleteLoop(activeLoop.loopDbId)}
            />
          : null
      }
    </div>
  )
}

// ── Past sessions ─────────────────────────────────────────────────────────────
interface PastSession {
  id: string; company: string; role: string
  score: number | null; grade: string | null
  duration: string; date: string
}

function PastSessionsTable() {
  const [sessions, setSessions] = useState<PastSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/live-interview/history')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessions) {
          setSessions(data.sessions.map((s: {
            id: string; companyName: string; roleId: string
            overallScore: number | null; grade?: string | null
            durationSeconds: number | null; endedAt: string | null
          }) => {
            const mins = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0
            const secs = s.durationSeconds ? s.durationSeconds % 60 : 0
            return {
              id: s.id, company: s.companyName, role: s.roleId,
              score: s.overallScore, grade: s.grade ?? null,
              duration: s.durationSeconds ? `${mins}:${String(secs).padStart(2, '0')}` : '-',
              date: s.endedAt ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
            }
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const displaySessions: PastSession[] = sessions.length > 0 ? sessions : [
    { id: 's1', company: 'Meta',   role: 'PM',       score: 82, grade: 'B+', duration: '28:14', date: 'Apr 18' },
    { id: 's2', company: 'Google', role: 'PM',       score: 71, grade: 'B-', duration: '22:50', date: 'Apr 14' },
    { id: 's3', company: 'Stripe', role: 'SWE',      score: null, grade: null, duration: '-',  date: 'Apr 10' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ height: 56, background: T.surfaceContainerLow, borderRadius: 12, animation: 'shimmer-h 1.2s linear infinite' }} />)}
    </div>
  )

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.outlineFaint}`, borderRadius: 24, overflow: 'hidden' }}>
      {displaySessions.map((s, i) => (
        <div key={s.id} style={{
          display: 'grid', gridTemplateColumns: '28px 1fr auto auto',
          alignItems: 'center', gap: 16, padding: '14px 20px',
          borderBottom: i < displaySessions.length - 1 ? `1px solid ${T.outlineFaint}` : 'none',
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 20, fontVariationSettings: "'FILL' 1",
            color: s.score != null ? T.success : T.onSurfaceMuted,
          }}>
            {s.score != null ? 'check_circle' : 'cancel'}
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.onSurface }}>
              {s.company} <span style={{ fontWeight: 400, color: T.onSurfaceMuted }}>· {s.role}</span>
            </div>
            <div style={{ fontSize: 12, color: T.onSurfaceMuted }}>{s.duration} · {s.date}</div>
          </div>
          {s.score != null ? (
            <span style={{ fontSize: 13, fontWeight: 800, color: T.primary, background: T.primaryFixed, padding: '4px 10px', borderRadius: 999 }}>
              {s.score} · {s.grade}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: T.onSurfaceMuted, fontStyle: 'italic' }}>incomplete</span>
          )}
          {s.score != null ? (
            <Link
              href={`/live-interviews/${s.id}/debrief`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 999, textDecoration: 'none',
                background: 'transparent', color: T.onSurface,
                border: `1px solid ${T.outlineVariant}`,
                fontSize: 12, fontWeight: 700,
              }}
            >
              Debrief <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          ) : <span />}
        </div>
      ))}
    </div>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────
export function LiveInterviewsShell({
  personas,
  scenarios,
}: {
  personas: LiveInterviewPersona[]
  scenarios: ScenarioBrief[]
}) {
  const [mode, setMode] = useState<'single' | 'loop'>('single')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Mode switcher ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>

        {/* Single Round */}
        <ModeCard
          active={mode === 'single'}
          onClick={() => setMode('single')}
          activeStyle={{
            background: T.surface,
            border: `2px solid ${T.primary}`,
            boxShadow: '0 6px 20px -8px rgba(30,27,20,0.12), 0 1px 2px rgba(30,27,20,0.04)',
          }}
          inactiveStyle={{
            background: T.surfaceContainerLow,
            border: '2px solid transparent',
            boxShadow: 'none',
          }}
          hoverStyle={{
            background: T.surface,
            border: `2px solid ${T.outlineVariant}`,
            boxShadow: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: mode === 'single' ? T.primaryContainer : T.surfaceContainer,
              transition: 'background 200ms',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.primary, fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
            </div>
            <span style={{ fontFamily: 'var(--font-headline,Literata,Georgia,serif)', fontSize: 20, fontWeight: 600, color: T.onSurface }}>Single round</span>
            <RadioDot active={mode === 'single'} />
          </div>
          <div style={{ fontSize: 13.5, color: T.onSurfaceVariant, lineHeight: 1.5 }}>
            One AI-run interview type with a company persona. 25-45 min.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            <Chip label="Product sense" />
            <Chip label="System design" />
            <Chip label="Data modeling" outline />
            <Chip label="Coding" outline />
            <Chip label="SQL" outline />
          </div>
        </ModeCard>

        {/* Full Loop */}
        <ModeCard
          active={mode === 'loop'}
          onClick={() => setMode('loop')}
          activeStyle={{
            background: 'linear-gradient(135deg, #1e3528 0%, #14241c 100%)',
            color: '#f3ede0',
            border: '2px solid #7ee099',
            boxShadow: '0 8px 32px -12px rgba(74,124,89,0.5)',
          }}
          inactiveStyle={{
            background: 'linear-gradient(135deg, #243d2e 0%, #182c21 100%)',
            color: '#f3ede0',
            border: '2px solid transparent',
            boxShadow: 'none',
          }}
          hoverStyle={{
            background: 'linear-gradient(135deg, #1e3528 0%, #14241c 100%)',
            color: '#f3ede0',
            border: '2px solid rgba(126,224,153,0.4)',
            boxShadow: 'none',
          }}
        >
          {/* Dot grid overlay */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            maskImage: 'radial-gradient(ellipse 70% 100% at 90% 50%, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 100% at 90% 50%, black 30%, transparent 75%)',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(126,224,153,0.15)', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#7ee099', fontVariationSettings: "'FILL' 1" }}>laps</span>
            </div>
            <span style={{ fontFamily: 'var(--font-headline,Literata,Georgia,serif)', fontSize: 20, fontWeight: 600, color: '#f3ede0' }}>Full loop</span>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: '#7ee099', color: '#0e2818', padding: '3px 8px', borderRadius: 999,
            }}>New</span>
            <RadioDot active={mode === 'loop'} dark />
          </div>
          <div style={{ position: 'relative', fontSize: 13.5, color: 'rgba(243,237,224,0.78)', lineHeight: 1.5 }}>
            Sequential rounds with shared memory. Pause, resume, and let Hatch synthesize the loop-level signal.
          </div>
          <div style={{
            position: 'relative', display: 'flex', gap: 14, marginTop: 6,
            paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.10)',
          }}>
            <LoopStatPill label="In progress" count={1} dotColor="#c9e86e" />
            <LoopStatPill label="Configured"  count={1} dotColor="#7ee099" />
            <LoopStatPill label="Completed"   count={1} dotColor="rgba(255,255,255,0.4)" />
          </div>
        </ModeCard>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {[
          { icon: 'forum', label: 'Live pressure', sub: 'Fast probing, no scheduling' },
          { icon: 'draw', label: 'Artifacts watched', sub: 'Canvas, schema, code, SQL' },
          { icon: 'memory', label: 'Round memory', sub: 'Signals carry into the loop' },
          { icon: 'summarize', label: 'Debrief engine', sub: 'Scores, transcript, next drills' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              padding: '12px 14px',
              borderRadius: 16,
              background: T.surfaceContainerLow,
              border: `1px solid ${T.outlineFaint}`,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: T.primary, fontSize: 20, fontVariationSettings: "'FILL' 1" }}
            >
              {item.icon}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, color: T.onSurface, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: T.onSurfaceMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.sub}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      {mode === 'loop' ? <FullLoopPanel /> : <SingleRoundPicker personas={personas} scenarios={scenarios} />}

      {/* ── Past sessions ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.onSurfaceMuted, marginBottom: 14 }}>
          Past sessions
        </div>
        <PastSessionsTable />
      </div>
    </div>
  )
}
