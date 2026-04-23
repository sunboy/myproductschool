'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PlanItem {
  title: string
  sub: string
  diff: string
  color: string
  bg: string
  enrolled: number
  icon: string
  slug: string
}

interface PersonalisedPlan {
  slug: string
  title: string
  description: string | null
  move_tag: string | null
}

const TR = '200ms cubic-bezier(0.2, 0.8, 0.2, 1)'

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#4a7c59',
  Intermediate: '#c9933a',
  Advanced: '#b83230',
}

const MOVE_ICON: Record<string, string> = {
  frame: 'center_focus_strong',
  list: 'format_list_bulleted',
  optimize: 'tune',
  win: 'emoji_events',
}

const MOVE_LABEL: Record<string, string> = {
  frame: 'Frame move',
  list: 'List move',
  optimize: 'Optimize move',
  win: 'Win move',
}

function StudyPlanCard({ pl }: { pl: PlanItem }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={`/explore/plans/${pl.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: pl.bg,
        borderRadius: 24,
        padding: '22px 20px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 200,
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid rgba(0,0,0,0.05)',
        transition: `transform ${TR}, box-shadow ${TR}`,
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 16px 40px -16px rgba(0,0,0,0.22)' : '0 2px 12px -4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Watermark icon */}
      <span
        aria-hidden
        className="material-symbols-outlined"
        style={{
          position: 'absolute',
          right: -6,
          bottom: -6,
          fontSize: 100,
          color: pl.color,
          opacity: 0.10,
          fontVariationSettings: "'FILL' 1, 'wght' 700",
          userSelect: 'none',
          pointerEvents: 'none',
          lineHeight: 1,
        }}
      >
        {pl.icon}
      </span>

      {/* Top section */}
      <div style={{ position: 'relative' }}>
        {/* Icon box */}
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: pl.color,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
          boxShadow: `0 4px 14px -4px ${pl.color}66`,
        }}>
          <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20, fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
            {pl.icon}
          </span>
        </div>

        {/* Difficulty eyebrow */}
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: DIFF_COLOR[pl.diff] ?? pl.color,
          marginBottom: 5,
        }}>
          {pl.diff}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--font-headline)',
          fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15,
          color: '#1e1b14',
          marginBottom: 4,
        }}>
          {pl.title}
        </div>

        {/* Sub label */}
        <div style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.55)', lineHeight: 1.4 }}>
          {pl.sub}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', fontVariationSettings: "'FILL' 1" }}>group</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.50)' }}>
            {pl.enrolled.toLocaleString()}
          </span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: pl.color,
          color: '#fff',
          padding: '7px 14px', borderRadius: 999,
          fontWeight: 700, fontSize: 12.5,
        }}>
          Start
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
        </div>
      </div>
    </Link>
  )
}

function PersonalisedPlanCard({ plan }: { plan: PersonalisedPlan }) {
  const [hovered, setHovered] = useState(false)
  const move = plan.move_tag ?? ''
  const icon = MOVE_ICON[move] ?? 'route'
  const moveLabel = MOVE_LABEL[move] ?? move

  return (
    <Link
      href={`/explore/plans/${plan.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(145deg, #1e3528 0%, #152b1e 100%)',
        borderRadius: 24,
        padding: '22px 20px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 200,
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid rgba(126,224,153,0.18)',
        transition: `transform ${TR}, box-shadow ${TR}`,
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered
          ? '0 16px 40px -16px rgba(74,124,89,0.40)'
          : '0 2px 12px -4px rgba(74,124,89,0.15)',
      }}
    >
      {/* Subtle glow */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(300px 200px at 80% 110%, rgba(126,224,153,0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Watermark icon */}
      <span
        aria-hidden
        className="material-symbols-outlined"
        style={{
          position: 'absolute', right: -6, bottom: -6,
          fontSize: 100, color: '#7ee099', opacity: 0.08,
          fontVariationSettings: "'FILL' 1, 'wght' 700",
          userSelect: 'none', pointerEvents: 'none', lineHeight: 1,
        }}
      >
        {icon}
      </span>

      {/* Top section */}
      <div style={{ position: 'relative' }}>
        {/* Your plan badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(126,224,153,0.14)', border: '1px solid rgba(126,224,153,0.22)',
          borderRadius: 999, padding: '3px 10px', marginBottom: 12,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
          color: '#7ee099',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7ee099', flexShrink: 0 }} />
          Your plan
        </div>

        {/* Move eyebrow */}
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'rgba(126,224,153,0.65)',
          marginBottom: 5,
        }}>
          {moveLabel}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--font-headline)',
          fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.15,
          color: '#f3ede0',
          marginBottom: 4,
        }}>
          {plan.title}
        </div>

        {/* Description */}
        {plan.description && (
          <div style={{
            fontSize: 12.5, color: 'rgba(243,237,224,0.55)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {plan.description}
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: '#4a7c59', color: '#fff',
          padding: '7px 14px', borderRadius: 999,
          fontWeight: 700, fontSize: 12.5,
        }}>
          Continue
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
        </div>
      </div>
    </Link>
  )
}

export function StudyPlanGrid({ plans, personalisedPlan }: { plans: PlanItem[]; personalisedPlan?: PersonalisedPlan | null }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {personalisedPlan && <PersonalisedPlanCard plan={personalisedPlan} />}
      {plans.map(pl => (
        <StudyPlanCard key={pl.title} pl={pl} />
      ))}
    </div>
  )
}
