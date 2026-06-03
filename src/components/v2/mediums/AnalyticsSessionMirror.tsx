'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { ReportCharts } from '@/components/analytics/ReportCharts'
import { AnalystDimensionChart } from '@/components/analytics/AnalystDimensionChart'
import type { AnalystDimensionView } from '@/lib/coding-grading/analyst-rubric'
import type { MarkedFinding } from './types'

interface AnalystDimension {
  key: string
  label: string
  icon: string
  accent: string
  accentBg: string
  headline: string
  detail: string
}

const ANALYST_DIMENSIONS: AnalystDimension[] = [
  {
    key: 'data_connection',
    label: 'Data Connection',
    icon: 'database',
    accent: 'var(--color-primary)',
    accentBg: 'var(--color-primary-fixed)',
    headline: 'Connected and queried',
    detail: 'You got BigQuery talking to Claude. That is the first move.',
  },
  {
    key: 'exploratory_analysis',
    label: 'Exploratory Analysis',
    icon: 'query_stats',
    accent: '#1565c0',
    accentBg: 'rgba(21,101,192,0.1)',
    headline: 'Found the drop',
    detail: 'You named a real number from the data, not a guess.',
  },
  {
    key: 'segmentation',
    label: 'Segmentation',
    icon: 'splitscreen',
    accent: '#ad1457',
    accentBg: 'rgba(173,20,87,0.1)',
    headline: 'Broke it apart',
    detail: 'Segmenting by dimension surfaces the signal worth acting on.',
  },
  {
    key: 'skill_construction',
    label: 'Skill Construction',
    icon: 'construction',
    accent: 'var(--color-tertiary)',
    accentBg: 'var(--color-tertiary-container)',
    headline: 'Wrote a reusable skill',
    detail: 'Teaching Claude a skill compounds. Every future session starts smarter.',
  },
]

interface AnalyticsSessionMirrorProps {
  markedFindings: MarkedFinding[]
  sessionDurationSeconds: number
  skillsWritten: string[]
  /** analyst_v1 per-dimension scores from the finalize grade, for the scorecard chart. */
  dimensions?: AnalystDimensionView[] | null
  xpAwarded: number
  /** Path of the report the agent wrote (e.g. /workspace/report.md), if any. */
  reportPath?: string | null
  /** Endpoint to download the full report, if a report was written. */
  reportDownloadUrl?: string | null
  /** A shareable URL for the report/score card, if generated. */
  shareUrl?: string | null
  onDashboard: () => void
  onRunAnother?: () => void
}

export function AnalyticsSessionMirror({
  markedFindings,
  sessionDurationSeconds,
  skillsWritten,
  dimensions = null,
  xpAwarded,
  reportPath = null,
  reportDownloadUrl = null,
  shareUrl = null,
  onDashboard,
  onRunAnother,
}: AnalyticsSessionMirrorProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  // The mirror has the report path but not its content. Fetch the markdown from
  // the existing download endpoint (fetch().text() reads the body despite the
  // attachment header) so we can chart the tables the analyst wrote.
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null)
  useEffect(() => {
    if (!reportDownloadUrl) return
    let cancelled = false
    fetch(reportDownloadUrl)
      .then(r => r.ok ? r.text() : null)
      .then(t => { if (!cancelled && t) setReportMarkdown(t) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [reportDownloadUrl])

  const passCount = markedFindings.filter(f => f.verdict === 'pass').length

  const summaryLine =
    passCount === ANALYST_DIMENSIONS.length
      ? 'Full run. Every analyst move landed.'
      : passCount >= 2
      ? `You covered ${passCount} of ${ANALYST_DIMENSIONS.length} analyst moves.`
      : 'Session complete. The breakdown shows where each move landed.'

  const durationLabel = sessionDurationSeconds < 60
    ? `${sessionDurationSeconds}s`
    : `${Math.round(sessionDurationSeconds / 60)}m`

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      gsap.set([headerRef.current, ...cardRefs.current, footerRef.current], { opacity: 1, y: 0, scale: 1 })
      return
    }

    gsap.set(headerRef.current, { opacity: 0, y: -6 })
    gsap.set(cardRefs.current.filter(Boolean), { opacity: 0, y: 16, scale: 0.98 })
    gsap.set(footerRef.current, { opacity: 0, y: 8 })

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.4 })
    cardRefs.current.forEach((c, i) => {
      tl.to(c, { opacity: 1, y: 0, scale: 1, duration: 0.38 }, 0.3 + i * 0.1)
    })
    tl.to(footerRef.current, { opacity: 1, y: 0, duration: 0.3 }, '-=0.15')

    return () => { tl.kill() }
  }, [])

  return (
    <section
      className="w-full h-full overflow-hidden flex flex-col"
      style={{
        background: 'var(--color-background)',
        backgroundImage: `
          linear-gradient(to right, rgba(74,124,89,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(74,124,89,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 p-4">

        {/* Header */}
        <div
          ref={headerRef}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}
        >
          <HatchGlyph
            size={48}
            state={passCount >= ANALYST_DIMENSIONS.length ? 'celebrating' : passCount >= 2 ? 'speaking' : 'idle'}
            className="text-primary"
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-label)',
            }}>
              Session debrief
            </div>
            <div style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 18, fontWeight: 700,
              lineHeight: 1.3, marginTop: 2,
            }}>
              {summaryLine}
            </div>
            <div style={{
              display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap',
            }}>
              <StatChip label="Duration" value={durationLabel} />
              <StatChip label="Steps done" value={`${passCount}/${ANALYST_DIMENSIONS.length}`} />
              {skillsWritten.length > 0 && (
                <StatChip label="Skills written" value={String(skillsWritten.length)} />
              )}
            </div>
          </div>
        </div>

        {/* Analyst dimension cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {ANALYST_DIMENSIONS.map((dim, i) => {
            const finding = markedFindings.find(f =>
              f.id === dim.key ||
              // try to match by ordinal position
              markedFindings.indexOf(f) === i
            )
            const passed = finding?.verdict === 'pass'
            const partial = finding?.verdict === 'partial'

            return (
              <div
                key={dim.key}
                ref={el => { cardRefs.current[i] = el }}
                style={{
                  background: 'var(--color-surface)',
                  border: `1px solid ${passed ? dim.accent + '40' : 'var(--color-outline-variant)'}`,
                  borderRadius: 14,
                  padding: '14px 14px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: passed ? dim.accent : 'var(--color-outline-variant)',
                  borderRadius: '14px 14px 0 0',
                  transition: 'background 400ms',
                }} />

                {/* Icon + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{
                    width: 32, height: 32,
                    background: passed ? dim.accentBg : 'var(--color-surface-container-high)',
                    borderRadius: 8,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 400ms',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: 17,
                      color: passed ? dim.accent : 'var(--color-on-surface-variant)',
                      fontVariationSettings: `'FILL' ${passed ? 1 : 0}, 'wght' 400`,
                      transition: 'color 400ms',
                    }}>
                      {dim.icon}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {dim.label}
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 700,
                      color: passed ? dim.accent : 'var(--color-on-surface-variant)',
                      marginTop: 1,
                    }}>
                      {passed ? dim.headline : partial ? 'Partially done' : 'Not reached'}
                    </div>
                  </div>
                </div>

                {/* Detail */}
                <p style={{
                  fontSize: 11.5, lineHeight: 1.55,
                  color: 'var(--color-on-surface-variant)',
                  margin: 0,
                }}>
                  {dim.detail}
                </p>

                {/* Finding */}
                {finding?.text && (
                  <div style={{
                    fontSize: 11, lineHeight: 1.5,
                    color: 'var(--color-on-surface)',
                    background: 'var(--color-surface-container-low)',
                    borderRadius: 8, padding: '6px 10px',
                    borderLeft: `3px solid ${dim.accent}`,
                    wordBreak: 'break-word',
                  }}>
                    &ldquo;{finding.text}&rdquo;
                  </div>
                )}

                {/* Verdict badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700,
                  padding: '3px 8px', borderRadius: 99,
                  background: passed
                    ? `${dim.accent}18`
                    : partial
                    ? 'rgba(201,147,58,0.12)'
                    : 'var(--color-surface-container-high)',
                  color: passed ? dim.accent : partial ? '#c9933a' : 'var(--color-on-surface-variant)',
                  alignSelf: 'flex-start',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                    {passed ? 'check_circle' : partial ? 'pending' : 'radio_button_unchecked'}
                  </span>
                  {passed ? 'Done' : partial ? 'Partial' : 'Missed'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Analyst scorecard — the graded analyst_v1 dimensions. */}
        {dimensions && dimensions.length > 0 && (
          <AnalystDimensionChart dimensions={dimensions} variant="mirror" />
        )}

        {/* Charts from the report's tables (funnel, time series, breakdowns). */}
        {reportMarkdown && <ReportCharts markdown={reportMarkdown} variant="mirror" />}

        {/* Skills strip */}
        {skillsWritten.length > 0 && (
          <div style={{
            background: 'var(--color-tertiary-container)',
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'var(--color-tertiary)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                construction
              </span>
              Skills built this session
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {skillsWritten.map((name, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.4)',
                  color: 'var(--color-on-surface)',
                  fontFamily: 'monospace',
                }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Report strip — the deliverable: path + download + share */}
        {reportPath && (
          <div style={{
            background: 'var(--color-primary-fixed)',
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'var(--color-primary)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                description
              </span>
              Report generated
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: '3px 8px', borderRadius: 6, alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.5)',
              color: 'var(--color-on-surface)',
              fontFamily: 'monospace',
            }}>
              {reportPath}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a
                href={reportDownloadUrl ?? '#'}
                download
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 99,
                  background: 'var(--color-primary)', color: 'var(--color-on-primary)',
                  textDecoration: 'none', fontSize: 12, fontWeight: 700,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
                Download
              </a>
              {shareUrl && (
                <button
                  onClick={() => { navigator.clipboard?.writeText(shareUrl).catch(() => {}) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 99,
                    background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>share</span>
                  Copy share link
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        ref={footerRef}
        style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid var(--color-outline-variant)',
          background: 'var(--color-surface)',
          gap: 12,
        }}
      >
        {/* XP */}
        {xpAwarded > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 40, height: 40,
              background: 'radial-gradient(circle at 30% 30%, #f4d98a, #c9933a 60%, #8a6620)',
              borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: 'var(--font-headline)',
              fontWeight: 700, fontSize: 12,
              boxShadow: '0 4px 16px -4px rgba(201,147,58,0.5)',
            }}>
              +{xpAwarded}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>
              XP earned
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button
            onClick={onDashboard}
            style={{
              padding: '9px 14px', borderRadius: 99,
              background: 'transparent',
              color: 'var(--color-on-surface-variant)',
              border: '1px solid var(--color-outline-variant)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              dashboard
            </span>
            Dashboard
          </button>
          {onRunAnother && (
            <button
              onClick={onRunAnother}
              style={{
                padding: '9px 16px', borderRadius: 99,
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              Run another
              <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                arrow_forward
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      padding: '4px 10px', borderRadius: 8,
      background: 'var(--color-surface)',
      border: '1px solid var(--color-outline-variant)',
    }}>
      <span style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
        {label}
      </span>
    </div>
  )
}
