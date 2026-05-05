'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { StudyPlanCard } from '@/components/explore/StudyPlanCard'
import type { StudyPlanWithItems } from '@/lib/types'

const DIFFICULTY_FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const
type DifficultyFilter = typeof DIFFICULTY_FILTERS[number]

function SpiralSVG() {
  const points: string[] = []
  for (let t = 0; t <= Math.PI * 6; t += 0.10) {
    const r = 5 + t * 6
    const x = 110 + r * Math.cos(t)
    const y = 85 + r * Math.sin(t)
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return (
    <svg
      viewBox="0 0 220 170"
      style={{ position: 'absolute', bottom: -10, right: -10, width: '70%', height: '70%', pointerEvents: 'none', zIndex: 0 }}
      aria-hidden
    >
      <polyline points={points.join(' ')} stroke="#7ee099" strokeWidth={1.6} fill="none" opacity={0.15} />
    </svg>
  )
}

interface Props {
  studyPlans: StudyPlanWithItems[]
}

export function StudyPlansClient({ studyPlans }: Props) {
  const [activeFilter, setActiveFilter] = useState<DifficultyFilter>('All')

  const enrolledPlans = studyPlans.filter(p => p.is_enrolled && p.progress_percentage > 0)
  const firstEnrolled = enrolledPlans[0]

  const filtered = activeFilter === 'All'
    ? studyPlans
    : studyPlans.filter(p => (p.difficulty ?? '').toLowerCase() === activeFilter.toLowerCase())

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>

      {/* ── Hero ── */}
      <div style={{
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 32,
        background: 'linear-gradient(135deg, #1e3528 0%, #14241c 58%, #0e1a14 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '44px 52px',
        position: 'relative',
      }}>
        {/* Dot grid */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 72% 50%, black 35%, transparent 78%)',
          maskImage: 'radial-gradient(ellipse 80% 100% at 72% 50%, black 35%, transparent 78%)',
        }} />
        {/* Ambient glow */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(600px 420px at 82% 55%, rgba(78,180,120,0.17), transparent 62%)',
        }} />
        <SpiralSVG />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 36, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Left */}
          <div>
            <div style={{
              fontFamily: 'var(--font-label)',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'rgba(243,237,224,0.45)', marginBottom: 18,
            }}>
              Explore › Study Plans
            </div>
            <h1 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 52, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05,
              color: '#f3ede0', marginBottom: 16,
            }}>
              Structured paths<br />
              <span style={{
                background: 'linear-gradient(90deg, #7ee099, #c9e86e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                to sharper thinking
              </span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16, lineHeight: 1.58,
              color: 'rgba(243,237,224,0.70)',
              maxWidth: 500, marginBottom: 28,
            }}>
              Hatch curates multi-week tracks across all four FLOW moves. Follow a plan, or build your own from any challenge.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/explore/plans" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#f3ede0', color: '#1e1b14',
                padding: '14px 24px', borderRadius: 999,
                fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>school</span>
                Browse all plans
              </Link>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(255,255,255,0.08)', color: '#f3ede0',
                border: '1px solid rgba(255,255,255,0.14)',
                padding: '14px 24px', borderRadius: 999,
                fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
                Hatch builds mine
              </button>
            </div>
          </div>

          {/* Right — stat pills */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {[
              { label: 'Study Plans', value: '12' },
              { label: 'Enrolled learners', value: '4,890' },
              { label: 'Avg. completion rate', value: '68%' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 18, padding: '12px 20px', minWidth: 190,
              }}>
                <div style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: 'rgba(243,237,224,0.45)', marginBottom: 3,
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: 22, fontWeight: 600, color: '#f3ede0',
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hatch recommendation banner ── */}
      {firstEnrolled && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 16,
          padding: '18px 20px',
          background: 'var(--color-primary-container, #cfe3d3)',
          borderRadius: 24,
          border: '1px solid rgba(0,0,0,0.04)',
          marginBottom: 28,
        }}>
          <HatchGlyph size={48} state="speaking" className="text-primary flex-shrink-0" />
          <div>
            <div style={{
              fontFamily: 'var(--font-label)',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--color-on-primary-container, #0f3d1f)', opacity: 0.7, marginBottom: 4,
            }}>
              Hatch&rsquo;s Recommendation
            </div>
            <div style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 17, fontWeight: 600, color: 'var(--color-on-primary-container, #0f3d1f)', marginBottom: 4,
            }}>
              {firstEnrolled.title} is your best next step.
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-on-primary-container, #0f3d1f)',
              opacity: 0.85, maxWidth: 580, margin: '0 0 12px',
            }}>
              Based on your progress across FLOW moves, this track is calibrated to push your weakest moves without dropping what you&rsquo;ve already built.
            </p>
            <Link href={`/explore/plans/${firstEnrolled.slug}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--color-primary, #4a7c59)', color: '#fff',
              borderRadius: 999, padding: '8px 16px',
              fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
            }}>
              Continue {firstEnrolled.title}
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Section heading + filters ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-label)',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--color-on-surface-muted, #78715f)', marginBottom: 4,
          }}>
            All study plans
          </div>
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em',
            color: 'var(--color-on-surface, #1e1b14)', margin: 0,
          }}>
            Pick your track.
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-label)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--color-on-surface-muted, #78715f)', marginRight: 4,
          }}>
            Difficulty
          </span>
          {DIFFICULTY_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '7px 14px', borderRadius: 999,
                fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'background 150ms, color 150ms',
                background: activeFilter === f ? 'var(--color-on-surface, #1e1b14)' : 'transparent',
                color: activeFilter === f ? '#f7ede0' : 'var(--color-on-surface-variant, #4e4a3f)',
                border: activeFilter === f ? '1px solid transparent' : '1px solid var(--color-outline-variant, #d5cab1)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plan grid ── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          fontFamily: 'var(--font-label)', fontSize: 14,
          color: 'var(--color-on-surface-muted, #78715f)',
        }}>
          No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} plans yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map((plan, i) => (
            <StudyPlanCard key={plan.id} plan={plan} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
