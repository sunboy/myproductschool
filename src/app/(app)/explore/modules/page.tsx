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

const TRACK_CONFIG: Record<string, { label: string; accent: string }> = {
  'foundations':      { label: 'Foundations',      accent: '#4a7c59' },
  'systems':          { label: 'Systems',           accent: '#4a4a9c' },
  'ai-llms':          { label: 'AI & LLMs',         accent: '#c9933a' },
  'new-era':          { label: 'New Era',            accent: '#8b46d4' },
  'product-thinking': { label: 'Product Thinking',  accent: '#2a7ab5' },
}

const TRACK_ORDER = ['foundations', 'systems', 'ai-llms', 'new-era', 'product-thinking']

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
  // Subtle grid confined to bottom-right corner
  return (
    <svg viewBox="0 0 260 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {[0,1,2,3].map(i => (
        <line key={`v${i}`} x1={160 + i * 30} y1={100} x2={160 + i * 30} y2={170} stroke={color} strokeWidth={1} opacity={0.07 + i * 0.02} />
      ))}
      {[0,1,2].map(i => (
        <line key={`h${i}`} x1={150} y1={110 + i * 28} x2={270} y2={110 + i * 28} stroke={color} strokeWidth={1} opacity={0.07 + i * 0.02} />
      ))}
    </svg>
  )
}

function BeginnerArt({ color }: { color: string }) {
  // Two gentle waves along the bottom edge only
  return (
    <svg viewBox="0 0 220 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      <path d="M-10 145 C 40 138, 90 152, 140 145 C 180 140, 210 150, 230 145" stroke={color} strokeWidth={1.5} fill="none" opacity={0.10} />
      <path d="M-10 158 C 40 151, 90 165, 140 158 C 180 153, 210 163, 230 158" stroke={color} strokeWidth={1.5} fill="none" opacity={0.07} />
    </svg>
  )
}

function IntermediateArt({ color }: { color: string }) {
  // Small dot cluster in bottom-right only
  const dots = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      dots.push({ cx: 160 + col * 28, cy: 110 + row * 22, opacity: 0.06 + (row + col) * 0.015 })
    }
  }
  return (
    <svg viewBox="0 0 260 176" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={2} fill={color} opacity={d.opacity} />
      ))}
    </svg>
  )
}

function AdvancedArt({ color }: { color: string }) {
  // Single thin chevron tucked into the right edge
  return (
    <svg viewBox="0 0 260 155" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      <path d="M 210 40 L 255 77 L 210 115" stroke={color} strokeWidth={6} fill="none" opacity={0.09} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 228 50 L 258 77 L 228 105" stroke={color} strokeWidth={4} fill="none" opacity={0.06} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NewEraArt({ color }: { color: string }) {
  // Rings anchored to far right, only partially visible
  return (
    <svg viewBox="0 0 260 170" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} aria-hidden>
      {[45, 70, 95].map((r, i) => (
        <circle key={i} cx={265} cy={85} r={r} stroke={color} strokeWidth={1} fill="none" opacity={0.07 + i * 0.02} />
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

function ModuleCard({ module, index: _index }: { module: LearnModuleWithProgress; index: number }) {
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
        gap: 10,
        background: cfg.bg,
        borderRadius: 20,
        padding: '18px 16px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.05)',
        minHeight: 200,
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
          width: 36, height: 36, borderRadius: 10,
          background: cfg.iconBg,
          boxShadow: `0 4px 12px -4px ${cfg.iconBg}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
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
        fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2,
        color: '#1e1b14',
      }}>
        {module.name}
      </div>

      {/* Tagline */}
      {module.tagline && (
        <div style={{
          position: 'relative', zIndex: 1, flex: 1,
          fontFamily: 'var(--font-label)',
          fontSize: 12, fontWeight: 600, lineHeight: 1.5, color: 'rgba(0,0,0,0.70)',
        }}>
          {module.tagline}
        </div>
      )}

      {/* Stats */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', gap: 10,
        fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.5)',
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
          padding: '7px 14px', borderRadius: 999,
          fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-label)',
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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>

      {/* ── Hero ── */}
      <div style={{
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        background: 'linear-gradient(135deg, #1e3528 0%, #14241c 58%, #0e1a14 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 32px',
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Left */}
          <div>
            <div style={{
              fontFamily: 'var(--font-label)',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'rgba(243,237,224,0.45)', marginBottom: 8,
            }}>
              Explore › Guides
            </div>
            <h1 style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 34, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1,
              color: '#f3ede0', marginBottom: 8,
            }}>
              Theory, built for{' '}
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
              fontSize: 14, lineHeight: 1.55,
              color: 'rgba(243,237,224,0.70)',
              maxWidth: 500, marginBottom: 16,
            }}>
              Self-paced reading tracks from foundations to the new era of AI product. Each module builds the mental models Hatch grades you on.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/explore" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f3ede0', color: '#1e1b14',
                padding: '9px 18px', borderRadius: 999,
                fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 13,
                textDecoration: 'none',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>explore</span>
                Back to Explore
              </Link>
              <Link href="/explore/plans" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.08)', color: '#f3ede0',
                border: '1px solid rgba(255,255,255,0.14)',
                padding: '9px 18px', borderRadius: 999,
                fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: 13,
                textDecoration: 'none',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>school</span>
                Study Plans
              </Link>
            </div>
          </div>

          {/* Right — stat pills */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {[
              { label: 'Guides', value: String(modules.length || 12) },
              { label: 'Levels', value: '5' },
              { label: 'Avg. read', value: '~18 min' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 14, padding: '10px 16px', minWidth: 90, textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: 'rgba(243,237,224,0.45)', marginBottom: 3,
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-headline)',
                  fontSize: 18, fontWeight: 600, color: '#f3ede0',
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
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
          background: 'var(--color-primary-container, #cfe3d3)',
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.04)',
          marginBottom: 16,
        }}>
          <HatchGlyph size={36} state="speaking" className="text-primary flex-shrink-0" />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 14, fontWeight: 600, color: 'var(--color-on-primary-container, #0f3d1f)', marginBottom: 2,
            }}>
              {firstInProgress.name} — {firstInProgress.progress_percentage}% complete. Pick up where you left off.
            </div>
          </div>
          <Link href={`/explore/modules/${firstInProgress.slug}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'var(--color-primary, #4a7c59)', color: '#fff',
            borderRadius: 999, padding: '7px 14px', flexShrink: 0,
            fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
          }}>
            Continue
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </Link>
        </div>
      )}

      {/* ── Section heading + filters ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} style={{ height: 200, borderRadius: 20, background: 'var(--color-surface-container, #f0ece4)', animation: 'pulse 1.5s ease-in-out infinite' }} />
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
      ) : filter === 'all' ? (
        <div className="space-y-10">
          {TRACK_ORDER.map(trackKey => {
            const trackModules = modules.filter(m => (m.track ?? 'product-thinking') === trackKey)
            if (trackModules.length === 0) return null
            const cfg = TRACK_CONFIG[trackKey]
            return (
              <div key={trackKey}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-outline-variant" />
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: cfg.accent }}
                    />
                    <span className="font-label font-semibold text-sm text-on-surface-variant uppercase tracking-wide">
                      {cfg.label}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-outline-variant" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {trackModules.map((m, i) => (
                    <ModuleCard key={m.id} module={m} index={i} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {filtered.map((m, i) => (
            <ModuleCard key={m.id} module={m} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
