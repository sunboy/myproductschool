'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { useLearnModules } from '@/hooks/useLearnModules'
import type { LearnDifficulty, LearnModuleWithProgress } from '@/lib/types'

const DIFFICULTIES: Array<{ id: LearnDifficulty | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'new-era', label: 'New Era' },
]

const DIFF_CONFIG: Record<string, { bg: string; iconBg: string; artColor: string }> = {
  foundation:   { bg: '#e8f4ed', iconBg: '#2d6a4a', artColor: '#2d6a4a' },
  beginner:     { bg: '#cfe3d3', iconBg: '#4a7c59', artColor: '#4a7c59' },
  intermediate: { bg: '#f3e2b9', iconBg: '#c9933a', artColor: '#c9933a' },
  advanced:     { bg: '#ecdeff', iconBg: '#8b46d4', artColor: '#a878d6' },
  'new-era':    { bg: '#daeeff', iconBg: '#2a7ab5', artColor: '#3a8aca' },
  'entry-point':{ bg: '#fff3e0', iconBg: '#bf6000', artColor: '#d97000' },
}

// ── Background arts (same pattern as StudyPlanCard) ───────────────────────

function FoundationArt({ color }: { color: string }) {
  const lines = [0, 1, 2, 3, 4].map(i => ({
    x1: 10 + i * 48, y1: 0, x2: 10 + i * 48, y2: 170, opacity: 0.06 + i * 0.03,
  }))
  return (
    <svg viewBox="0 0 260 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={1.5} opacity={l.opacity} />
      ))}
      <line x1={0} y1={140} x2={260} y2={140} stroke={color} strokeWidth={1.5} opacity={0.18} />
    </svg>
  )
}

function BeginnerArt({ color }: { color: string }) {
  const waves = [
    'M-10 40 C 20 30, 60 50, 100 40 C 140 30, 180 50, 230 40',
    'M-10 60 C 20 50, 60 70, 100 60 C 140 50, 180 70, 230 60',
    'M-10 80 C 20 70, 60 90, 100 80 C 140 70, 180 90, 230 80',
    'M-10 100 C 20 90, 60 110, 100 100 C 140 90, 180 110, 230 100',
    'M-10 120 C 20 110, 60 130, 100 120 C 140 110, 180 130, 230 120',
  ]
  return (
    <svg viewBox="0 0 220 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {waves.map((d, i) => (
        <path key={i} d={d} stroke={color} strokeWidth={1.8} fill="none" opacity={0.10 + i * 0.04} />
      ))}
    </svg>
  )
}

function IntermediateArt({ color }: { color: string }) {
  const dots = []
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 5; col++) {
      const t = (row * 5 + col) / 44
      dots.push({ cx: 22 + col * 46, cy: 16 + row * 18, r: 1.2 + t * 3, opacity: 0.08 + t * 0.18 })
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

function NewEraArt({ color }: { color: string }) {
  const rings = [60, 90, 120, 150]
  return (
    <svg viewBox="0 0 260 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {rings.map((r, i) => (
        <circle key={i} cx={220} cy={85} r={r} stroke={color} strokeWidth={1.5} fill="none" opacity={0.07 + i * 0.04} />
      ))}
    </svg>
  )
}

// ── Hero spiral (same as StudyPlansClient) ────────────────────────────────

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

// ── Module card ────────────────────────────────────────────────────────────

const MODULE_ICONS: Record<string, string> = {
  foundation: 'foundation',
  beginner: 'auto_stories',
  intermediate: 'layers',
  advanced: 'bolt',
  'new-era': 'auto_awesome',
  'entry-point': 'play_circle',
}

function ModuleCard({ module, index }: { module: LearnModuleWithProgress; index: number }) {
  const [hovered, setHovered] = useState(false)
  const diff = module.difficulty ?? 'beginner'
  const cfg = DIFF_CONFIG[diff] ?? DIFF_CONFIG.beginner
  const diffLabel = diff === 'new-era' ? 'New Era' : diff.charAt(0).toUpperCase() + diff.slice(1)
  const hasProgress = module.completed_chapters > 0
  const ctaLabel = hasProgress ? 'Continue' : 'Start module'
  const icon = MODULE_ICONS[diff] ?? 'auto_stories'

  return (
    <Link
      href={`/explore/modules/${module.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: cfg.bg,
        borderRadius: 24,
        padding: '24px 22px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.05)',
        minHeight: 240,
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 200ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 200ms cubic-bezier(0.2,0.8,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 16px 40px -12px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      {/* Background art by difficulty */}
      {diff === 'foundation' && <FoundationArt color={cfg.artColor} />}
      {diff === 'beginner' && <BeginnerArt color={cfg.artColor} />}
      {diff === 'intermediate' && <IntermediateArt color={cfg.artColor} />}
      {diff === 'advanced' && <AdvancedArt color={cfg.artColor} />}
      {diff === 'new-era' && <NewEraArt color={cfg.artColor} />}

      {/* Top row */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14,
          background: cfg.iconBg,
          boxShadow: `0 4px 16px -4px ${cfg.iconBg}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22, fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
            {icon}
          </span>
        </div>
        <span style={{
          background: 'rgba(255,255,255,0.6)', color: 'rgba(0,0,0,0.65)',
          borderRadius: 999, padding: '3px 9px',
          fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' as const,
          fontFamily: 'var(--font-label)',
        }}>
          {diffLabel}
        </span>
      </div>

      {/* Title */}
      <div style={{
        position: 'relative', zIndex: 1,
        fontFamily: 'var(--font-headline)',
        fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2,
        color: '#1e1b14',
      }}>
        {module.name}
      </div>

      {/* Tagline */}
      {module.tagline && (
        <div style={{
          position: 'relative', zIndex: 1, flex: 1,
          fontFamily: 'var(--font-label)',
          fontSize: 13, lineHeight: 1.55, color: 'rgba(0,0,0,0.62)',
        }}>
          {module.tagline}
        </div>
      )}

      {/* Stats */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', gap: 14,
        fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.5)',
        fontFamily: 'var(--font-label)',
      }}>
        <span><b style={{ color: 'rgba(0,0,0,0.72)' }}>{module.chapter_count}</b> chapters</span>
        <span>~<b style={{ color: 'rgba(0,0,0,0.72)' }}>{module.est_minutes}</b> min</span>
      </div>

      {/* Progress bar */}
      {hasProgress && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.5)', marginBottom: 5, fontFamily: 'var(--font-label)' }}>
            <span>Progress</span>
            <span>{module.progress_percentage}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${module.progress_percentage}%`, height: '100%', background: cfg.iconBg, borderRadius: 999 }} />
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: cfg.iconBg, color: '#fff',
          padding: '9px 18px', borderRadius: 999,
          fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-label)',
          boxShadow: `0 4px 12px -4px ${cfg.iconBg}66`,
        }}>
          {ctaLabel}
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
        </span>
        {hasProgress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-label)', fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {module.completed_chapters}/{module.chapter_count} done
          </div>
        )}
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ModulesPage() {
  const { modules, isLoading } = useLearnModules()
  const [filter, setFilter] = useState<LearnDifficulty | 'all'>('all')

  const filtered = filter === 'all' ? modules : modules.filter(m => m.difficulty === filter)

  const inProgress = modules.filter(m => m.completed_chapters > 0 && m.progress_percentage < 100)
  const firstInProgress = inProgress[0]

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
              Explore › Guides
            </div>
            <h1 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 52, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05,
              color: '#f3ede0', marginBottom: 16,
            }}>
              Theory, built for<br />
              <span style={{
                background: 'linear-gradient(90deg, #7ee099, #c9e86e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                sharp product thinking
              </span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16, lineHeight: 1.58,
              color: 'rgba(243,237,224,0.70)',
              maxWidth: 500, marginBottom: 28,
            }}>
              Self-paced reading tracks from foundations to the new era of AI product. Each module builds the mental models Hatch grades you on.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/explore" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#f3ede0', color: '#1e1b14',
                padding: '14px 24px', borderRadius: 999,
                fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>explore</span>
                Back to Explore
              </Link>
              <Link href="/explore/plans" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(255,255,255,0.08)', color: '#f3ede0',
                border: '1px solid rgba(255,255,255,0.14)',
                padding: '14px 24px', borderRadius: 999,
                fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 15,
                textDecoration: 'none',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>school</span>
                Study Plans
              </Link>
            </div>
          </div>

          {/* Right — stat pills */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {[
              { label: 'Guides', value: String(modules.length || 12) },
              { label: 'Difficulty levels', value: '5' },
              { label: 'Avg. read time', value: '~18 min' },
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

      {/* ── Hatch in-progress banner ── */}
      {firstInProgress && (
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
              Keep going
            </div>
            <div style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 17, fontWeight: 600, color: 'var(--color-on-primary-container, #0f3d1f)', marginBottom: 4,
            }}>
              {firstInProgress.name} — pick up where you left off.
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-on-primary-container, #0f3d1f)',
              opacity: 0.85, maxWidth: 580, margin: '0 0 12px',
            }}>
              You&rsquo;re {firstInProgress.progress_percentage}% through. Completing this module unlocks the mental model signals Hatch uses to calibrate your coaching.
            </p>
            <Link href={`/explore/modules/${firstInProgress.slug}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--color-primary, #4a7c59)', color: '#fff',
              borderRadius: 999, padding: '8px 16px',
              fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700,
              textDecoration: 'none',
            }}>
              Continue {firstInProgress.name}
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
            All guides
          </div>
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em',
            color: 'var(--color-on-surface, #1e1b14)', margin: 0,
          }}>
            Pick your level.
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
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setFilter(d.id)}
              style={{
                padding: '7px 14px', borderRadius: 999,
                fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'background 150ms, color 150ms',
                background: filter === d.id ? 'var(--color-on-surface, #1e1b14)' : 'transparent',
                color: filter === d.id ? '#f7ede0' : 'var(--color-on-surface-variant, #4e4a3f)',
                border: filter === d.id ? '1px solid transparent' : '1px solid var(--color-outline-variant, #d5cab1)',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Module grid ── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ height: 240, borderRadius: 24, background: 'var(--color-surface-container, #f0ece4)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          fontFamily: 'var(--font-label)', fontSize: 14,
          color: 'var(--color-on-surface-muted, #78715f)',
        }}>
          No {filter !== 'all' ? filter : ''} modules yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map((m, i) => (
            <ModuleCard key={m.id} module={m} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
