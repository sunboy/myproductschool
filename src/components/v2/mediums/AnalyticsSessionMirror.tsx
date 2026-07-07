'use client'

import { useRef, useEffect, useState } from 'react'
import { MissionBookend, XpCoin } from '@/components/feedback'
import gsap from 'gsap'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { ReportCharts } from '@/components/analytics/ReportCharts'
import { AnalystDimensionChart } from '@/components/analytics/AnalystDimensionChart'
import type { AnalystDimensionView } from '@/lib/coding-grading/analyst-rubric'
import type { MarkedFinding } from './types'
import { REGISTER_LABELS, type AdaptiveSummary } from '@/lib/adaptive/registerLabel'
import type { GuidanceLevel } from '@/lib/adaptive/guidance'

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
  /** How the session adapted (guidance register, injected steps, movements). */
  adaptive?: AdaptiveSummary | null
  /** The mission's opening question — pays off the Mission Brief's promise. */
  missionQuestion?: string | null
  /** The learner's proven finding (answer-kind pass/partial, else last pass). */
  provenAnswer?: string | null
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
  adaptive = null,
  missionQuestion = null,
  provenAnswer = null,
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
  // The number of analyst moves the user actually worked, not a hardcoded count.
  const stepCount = markedFindings.length

  const summaryLine =
    stepCount > 0 && passCount === stepCount
      ? 'Full run. Every analyst move landed.'
      : passCount >= 2
      ? `You covered ${passCount} of ${stepCount} analyst moves.`
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
            state={stepCount > 0 && passCount === stepCount ? 'celebrating' : passCount >= 2 ? 'speaking' : 'idle'}
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
              {stepCount > 0 && (
                <StatChip label="Steps done" value={`${passCount}/${stepCount}`} />
              )}
              {skillsWritten.length > 0 && (
                <StatChip label="Skills written" value={String(skillsWritten.length)} />
              )}
            </div>
          </div>
        </div>

        {/* Bookend — pays off the Mission Brief (shared component). */}
        {missionQuestion && (
          <MissionBookend asked={missionQuestion} proved={provenAnswer} />
        )}

        {/* Analyst scorecard — the real graded analyst_v1 dimensions (7). This
            replaced a stale hardcoded 4-card grid that matched findings by
            ordinal position and never reflected the actual grade. */}
        {dimensions && dimensions.length > 0 && (
          <div ref={el => { cardRefs.current[0] = el }}>
            <AnalystDimensionChart dimensions={dimensions} variant="mirror" />
          </div>
        )}

        {/* How the session adapted — honest narration of the register and any
            arc changes the engine made, from the same log the grader reads. */}
        {adaptive && (adaptive.injected.length > 0 || adaptive.adjustments.length > 0 || adaptive.guidance !== 'guided') && (
          <div
            ref={el => { cardRefs.current[5] = el }}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 14,
              padding: '14px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}
          >
            <div style={{
              fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'var(--color-on-surface-variant)',
            }}>
              How this session adapted
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-on-surface)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>
                Coaching ran at the {REGISTER_LABELS[adaptive.guidance].toLowerCase()} register
                {adaptive.adjustments.length === 0 ? ' the whole way.' : '.'}
              </span>
              {adaptive.adjustments.map((a, i) => (
                <span key={`adj-${i}`}>
                  Hatch moved from {REGISTER_LABELS[a.from as GuidanceLevel]?.toLowerCase() ?? a.from} to {REGISTER_LABELS[a.to as GuidanceLevel]?.toLowerCase() ?? a.to} after {a.trigger}.
                </span>
              ))}
              {adaptive.injected.map((inj, i) => (
                <span key={`inj-${i}`}>
                  {inj.kind === 'scaffold_explainer'
                    ? 'A regroup step was added when the session stalled, then you worked back to the blocked step.'
                    : 'A stretch step was added because you were moving fast and clean.'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* What the user marked, in their own words — the per-step findings that
            fed the grade, shown verbatim so the debrief cites real receipts. */}
        {markedFindings.length > 0 && (
          <div
            ref={el => { cardRefs.current[1] = el }}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 14,
              padding: '14px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div style={{
              fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'var(--color-on-surface-variant)',
            }}>
              Your marked findings
            </div>
            {markedFindings.map((finding, i) => {
              const passed = finding.verdict === 'pass'
              const partial = finding.verdict === 'partial'
              const accent = passed ? 'var(--color-primary)' : partial ? '#c9933a' : 'var(--color-outline)'
              return (
                <div key={finding.id ?? i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: 18, marginTop: 1, color: accent,
                    fontVariationSettings: "'FILL' 1, 'wght' 400",
                  }}>
                    {passed ? 'check_circle' : partial ? 'pending' : 'radio_button_unchecked'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {finding.text && (
                      <p style={{
                        fontSize: 12.5, lineHeight: 1.5, margin: 0,
                        color: 'var(--color-on-surface)', wordBreak: 'break-word',
                      }}>
                        &ldquo;{finding.text}&rdquo;
                      </p>
                    )}
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: accent,
                    }}>
                      {passed ? 'Done' : partial ? 'Partial' : 'Missed'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
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
        <XpCoin amount={xpAwarded} />

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
