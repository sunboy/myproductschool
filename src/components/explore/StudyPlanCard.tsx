'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StudyPlanWithItems } from '@/lib/types'

interface StudyPlanCardProps {
  plan: StudyPlanWithItems
}

const DIFF_CONFIG: Record<string, { bg: string; iconBg: string; artColor: string }> = {
  beginner:     { bg: '#cfe3d3', iconBg: '#4a7c59', artColor: '#4a7c59' },
  intermediate: { bg: '#f3e2b9', iconBg: '#c9933a', artColor: '#c9933a' },
  advanced:     { bg: '#ecdeff', iconBg: '#8b46d4', artColor: '#a878d6' },
}

const ENROLLED_COUNTS = [1243, 892, 441, 2104, 388, 219]

function BeginnersArt({ color }: { color: string }) {
  const waves = [
    'M-10 40 C 20 30, 60 50, 100 40 C 140 30, 180 50, 230 40',
    'M-10 60 C 20 50, 60 70, 100 60 C 140 50, 180 70, 230 60',
    'M-10 80 C 20 70, 60 90, 100 80 C 140 70, 180 90, 230 80',
    'M-10 100 C 20 90, 60 110, 100 100 C 140 90, 180 110, 230 100',
    'M-10 120 C 20 110, 60 130, 100 120 C 140 110, 180 130, 230 120',
    'M-10 140 C 20 130, 60 150, 100 140 C 140 130, 180 150, 230 140',
  ]
  const opacities = [0.11, 0.15, 0.18, 0.22, 0.26, 0.31]
  return (
    <svg viewBox="0 0 220 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {waves.map((d, i) => (
        <path key={i} d={d} stroke={color} strokeWidth={1.8} fill="none" opacity={opacities[i]} />
      ))}
    </svg>
  )
}

function IntermediateArt({ color }: { color: string }) {
  const dots = []
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 5; col++) {
      const t = (row * 5 + col) / 44
      const r = 1.2 + t * 3
      dots.push({ cx: 22 + col * 46, cy: 16 + row * 18, r, opacity: 0.08 + t * 0.18 })
    }
  }
  return (
    <svg viewBox="0 0 260 176" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} opacity={d.opacity} />
      ))}
    </svg>
  )
}

function AdvancedArt({ color }: { color: string }) {
  const chevrons = [
    { d: 'M 60 30 L 110 75 L 60 120', opacity: 0.13 },
    { d: 'M 90 20 L 155 75 L 90 130', opacity: 0.17 },
    { d: 'M 125 15 L 200 75 L 125 135', opacity: 0.21 },
    { d: 'M 165 12 L 248 75 L 165 138', opacity: 0.25 },
  ]
  return (
    <svg viewBox="0 0 260 155" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {chevrons.map((ch, i) => (
        <path key={i} d={ch.d} stroke={color} strokeWidth={11} fill="none" opacity={ch.opacity} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

export function StudyPlanCard({ plan, index = 0 }: StudyPlanCardProps & { index?: number }) {
  const [hovered, setHovered] = useState(false)
  const diff = (plan.difficulty ?? 'intermediate').toLowerCase()
  const cfg = DIFF_CONFIG[diff] ?? DIFF_CONFIG.intermediate
  const diffLabel = diff.charAt(0).toUpperCase() + diff.slice(1)
  const hasProgress = plan.progress_percentage > 0
  const isEnrolled = plan.is_enrolled ?? false
  const ctaLabel = hasProgress ? 'Resume' : isEnrolled ? 'Begin' : 'Start plan'
  const enrolledCount = ENROLLED_COUNTS[index % 6]

  return (
    <Link
      href={`/explore/plans/${plan.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: cfg.bg,
        borderRadius: 24,
        padding: '18px 16px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.05)',
        minHeight: 190,
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 200ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 200ms cubic-bezier(0.2,0.8,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 16px 40px -12px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      {/* Background art */}
      {diff === 'beginner' && <BeginnersArt color={cfg.artColor} />}
      {diff === 'intermediate' && <IntermediateArt color={cfg.artColor} />}
      {diff === 'advanced' && <AdvancedArt color={cfg.artColor} />}

      {/* Top row */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: cfg.iconBg,
          boxShadow: `0 4px 16px -4px ${cfg.iconBg}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
            {plan.icon ?? 'school'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {isEnrolled && (
            <span style={{
              background: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.65)',
              borderRadius: 999, padding: '3px 9px',
              fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' as const,
              fontFamily: 'var(--font-label)',
            }}>
              Enrolled
            </span>
          )}
          <span style={{
            background: 'rgba(255,255,255,0.6)', color: 'rgba(0,0,0,0.65)',
            borderRadius: 999, padding: '3px 9px',
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' as const,
            fontFamily: 'var(--font-label)',
          }}>
            {diffLabel}
          </span>
        </div>
      </div>

      {/* Title */}
      <div style={{
        position: 'relative', zIndex: 1,
        fontFamily: 'var(--font-headline)',
        fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2,
        color: '#1e1b14',
      }}>
        {plan.title}
      </div>

      {/* Description */}
      {plan.description && (
        <div style={{
          position: 'relative', zIndex: 1, flex: 1,
          fontFamily: 'var(--font-label)',
          fontSize: 12, lineHeight: 1.5, color: 'rgba(0,0,0,0.62)',
        }}>
          {plan.description}
        </div>
      )}

      {/* Stats */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', gap: 14,
        fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.5)',
        fontFamily: 'var(--font-label)',
      }}>
        <span><b style={{ color: 'rgba(0,0,0,0.72)' }}>{plan.chapter_count}</b> chapters</span>
        <span><b style={{ color: 'rgba(0,0,0,0.72)' }}>{plan.item_count}</b> items</span>
        {plan.estimated_hours != null && (
          <span>~<b style={{ color: 'rgba(0,0,0,0.72)' }}>{plan.estimated_hours}h</b></span>
        )}
      </div>

      {/* Progress bar */}
      {hasProgress && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 5, fontFamily: 'var(--font-label)' }}>
            <span>Progress</span>
            <span>{plan.progress_percentage}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${plan.progress_percentage}%`, height: '100%', background: cfg.iconBg, borderRadius: 999 }} />
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: cfg.iconBg, color: '#fff',
          padding: '7px 14px', borderRadius: 999,
          fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-label)',
          boxShadow: `0 4px 12px -4px ${cfg.iconBg}66`,
          transition: 'transform 120ms',
        }}>
          {ctaLabel}
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>group</span>
          {enrolledCount.toLocaleString()}
        </div>
      </div>
    </Link>
  )
}
