'use client'

import { useState, useEffect } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type { AnalyticsSubProblem, MarkVerdict } from './types'

interface AnalyticsObjectiveCardProps {
  subProblem: AnalyticsSubProblem
  stepIdx: number
  totalSteps: number
  mcpConnected: boolean
  replRunning?: boolean
  skillsWritten: string[]
  reportWritten?: boolean
  /** Open-guidance learners see no teaching notes (design §3.3). */
  hideTeachingNote?: boolean
  onMark: (finding: string) => Promise<MarkVerdict>
}

export function AnalyticsObjectiveCard({
  subProblem,
  stepIdx,
  totalSteps,
  mcpConnected,
  replRunning = false,
  skillsWritten,
  reportWritten = false,
  hideTeachingNote = false,
  onMark,
}: AnalyticsObjectiveCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [finding, setFinding] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastVerdict, setLastVerdict] = useState<MarkVerdict | null>(null)
  const [teachDismissed, setTeachDismissed] = useState(false)

  // Per-step teaching note: dismissible, remembered so it does not nag on revisit.
  useEffect(() => {
    try {
      setTeachDismissed(localStorage.getItem(`cc-teach-${subProblem.id}`) === '1')
    } catch { /* SSR / no storage */ }
  }, [subProblem.id])
  function dismissTeach() {
    setTeachDismissed(true)
    try { localStorage.setItem(`cc-teach-${subProblem.id}`, '1') } catch { /* ignore */ }
  }

  const isSetupStep = subProblem.kind === 'mcp_setup' || subProblem.kind === 'connect'

  const canMark =
    isSetupStep ? (mcpConnected && replRunning)
    : subProblem.kind === 'skill' ? skillsWritten.length > 0
    : subProblem.kind === 'report' ? reportWritten
    : true

  // Setup-step hint names the NEXT move so the bash→REPL handoff is never tribal
  // knowledge: register the MCP, then start the analyst (`claude`).
  const gateHint =
    isSetupStep
      ? (!mcpConnected
          ? 'Register the BigQuery MCP first'
          : !replRunning
            ? 'Now start the analyst: type claude'
            : null)
    : subProblem.kind === 'skill' ? 'Write a .claude/skills/*.md file first'
    : subProblem.kind === 'report' ? 'Have Claude write the report file first'
    : null

  async function handleSubmit() {
    if (!finding.trim() || loading) return
    setLoading(true)
    setLastVerdict(null)
    try {
      const v = await onMark(finding.trim())
      setLastVerdict(v)
      if (v === 'pass') {
        setExpanded(false)
        setFinding('')
      }
    } finally {
      setLoading(false)
    }
  }

  const verdictColors: Record<MarkVerdict, string> = {
    pass: 'var(--color-primary)',
    partial: '#c9933a',
    retry: 'var(--color-error)',
  }
  const verdictLabels: Record<MarkVerdict, string> = {
    pass: 'Good. Stepping forward.',
    partial: 'Partial. Add a metric or sharper detail.',
    retry: 'Not quite. Revise and try again.',
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-outline-variant)',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 800,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            color: 'var(--color-on-surface-variant)',
            fontFamily: 'var(--font-label)',
          }}>
            Step {stepIdx + 1} of {totalSteps}
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '2px 8px', borderRadius: 99,
          background: 'var(--color-surface-container-high)',
          color: 'var(--color-on-surface-variant)',
        }}>
          {subProblem.kind}
        </span>
      </div>

      {/* Title + objective */}
      <div>
        <div style={{
          fontFamily: 'var(--font-headline)',
          fontSize: 15, fontWeight: 700,
          color: 'var(--color-on-surface)',
          lineHeight: 1.3, marginBottom: 4,
        }}>
          {subProblem.title}
        </div>
        <p style={{
          fontSize: 12, lineHeight: 1.6,
          color: 'var(--color-on-surface-variant)',
          margin: 0,
        }}>
          {subProblem.objective}
        </p>
      </div>

      {/* Teaching note — why this move matters (dismissible course content) */}
      {subProblem.teachingNote && !teachDismissed && !hideTeachingNote && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          background: 'var(--color-primary-fixed)',
          borderRadius: 10, padding: '8px 10px',
          borderLeft: '3px solid var(--color-primary)',
        }}>
          <HatchGlyph size={20} state="speaking" />
          <p style={{
            flex: 1, margin: 0,
            fontSize: 11.5, lineHeight: 1.55,
            color: 'var(--color-on-surface)',
          }}>
            {subProblem.teachingNote}
          </p>
          <button
            onClick={dismissTeach}
            aria-label="Dismiss tip"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--color-on-surface-variant)', padding: 0, lineHeight: 1,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>
      )}

      {/* Success criterion */}
      <div style={{
        fontSize: 11, lineHeight: 1.5,
        color: 'var(--color-on-surface-variant)',
        background: 'var(--color-surface-container-low)',
        borderRadius: 8, padding: '6px 10px',
        borderLeft: '3px solid var(--color-primary)',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--color-primary)', marginRight: 4 }}>Done when:</span>
        {subProblem.successCriterion}
      </div>

      {/* Learn checklist — orientation for EDA-style steps (not interactive) */}
      {subProblem.learnChecklist && subProblem.learnChecklist.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: 'var(--color-on-surface-variant)',
            fontFamily: 'var(--font-label)',
          }}>
            What you should learn here
          </span>
          {subProblem.learnChecklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 14, color: 'var(--color-on-surface-variant)', marginTop: 1,
              }}>
                radio_button_unchecked
              </span>
              <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--color-on-surface-variant)' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Mark CTA */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          disabled={!canMark}
          title={!canMark && gateHint ? gateHint : undefined}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 99,
            background: canMark ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
            color: canMark ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
            border: 'none', cursor: canMark ? 'pointer' : 'not-allowed',
            fontSize: 12, fontWeight: 700,
            fontFamily: 'var(--font-label)',
            alignSelf: 'flex-start',
            transition: 'background 200ms, color 200ms',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
            task_alt
          </span>
          Mark this step
          {!canMark && gateHint && (
            <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75, marginLeft: 2 }}>({gateHint})</span>
          )}
        </button>
      )}

      {/* Expanded finding input */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--color-on-surface-variant)',
            fontFamily: 'var(--font-label)',
          }}>
            Paste your finding (one line):
          </label>
          <input
            type="text"
            value={finding}
            onChange={e => setFinding(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            placeholder={subProblem.successCriterion}
            autoFocus
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-outline-variant)',
              background: 'var(--color-surface-container-low)',
              color: 'var(--color-on-surface)',
              fontSize: 13,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {lastVerdict && (
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: verdictColors[lastVerdict],
              padding: '6px 10px', borderRadius: 8,
              background: `${verdictColors[lastVerdict]}18`,
              border: `1px solid ${verdictColors[lastVerdict]}30`,
            }}>
              {verdictLabels[lastVerdict]}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSubmit}
              disabled={!finding.trim() || loading}
              style={{
                padding: '7px 14px', borderRadius: 99,
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                border: 'none', cursor: loading || !finding.trim() ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 700,
                opacity: loading || !finding.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Checking…' : 'Submit'}
            </button>
            <button
              onClick={() => { setExpanded(false); setFinding(''); setLastVerdict(null) }}
              style={{
                padding: '7px 12px', borderRadius: 99,
                background: 'transparent',
                color: 'var(--color-on-surface-variant)',
                border: '1px solid var(--color-outline-variant)',
                cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
