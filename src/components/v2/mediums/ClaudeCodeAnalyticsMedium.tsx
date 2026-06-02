'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SubProblemStepper } from './SubProblemStepper'
import { AnalyticsObjectiveCard } from './AnalyticsObjectiveCard'
import { AnalyticsConnectionStrip } from './AnalyticsConnectionStrip'
import { UsageMeter } from './UsageMeter'
import { AnalyticsTerminalFrame } from './AnalyticsTerminalFrame'
import { SuggestedPromptRail } from './SuggestedPromptRail'
import { AnalyticsOnboardingOverlay, shouldShowOnboarding } from './AnalyticsOnboardingOverlay'
import { AnalyticsSessionMirror } from './AnalyticsSessionMirror'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import type {
  MediumProps,
  AnalyticsSubProblem,
  ClaudeCodeTerminalHandle,
  MarkedFinding,
  MarkVerdict,
} from './types'

// ── Dev stub flag ──────────────────────────────────────────────────────────────
// Set to true to skip the real /api/claude-code/session/start call and use a mock wssUrl.
// This lets the UX components render before the infra route exists.
const USE_DEV_STUB = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_CC_DEV_STUB !== 'false'

const MOCK_WSS_URL = 'wss://echo.websocket.org/'

const MOCK_SUB_PROBLEMS: AnalyticsSubProblem[] = [
  {
    id: 'connect',
    sequence: 1,
    title: 'Connect the data',
    objective: 'Get BigQuery MCP connected and verify you can query the checkout funnel dataset.',
    successCriterion: 'Paste the output of a SELECT COUNT(*) query from the funnel table.',
    suggestedPrompts: [
      'mcp add bigquery --project hackproduct',
      'SELECT COUNT(*) FROM `hackproduct.case_001_checkout_funnel.events`',
    ],
    kind: 'connect',
    rubricDimension: 'data_connection',
  },
  {
    id: 'analyze',
    sequence: 2,
    title: 'Find the overall drop',
    objective: 'Measure the step-by-step funnel conversion rates and identify where the biggest drop happens.',
    successCriterion: 'State the step with the highest drop and the percentage, e.g. "Cart to checkout: 42% drop".',
    suggestedPrompts: [
      'Analyze the checkout funnel and show me conversion rates for each step',
      'Which funnel step has the biggest drop-off?',
    ],
    kind: 'analyze',
    rubricDimension: 'exploratory_analysis',
  },
  {
    id: 'segment',
    sequence: 3,
    title: 'Break it by device',
    objective: 'Segment the worst-performing funnel step by device type to find where mobile drops.',
    successCriterion: 'State the mobile vs desktop conversion rate at the key drop step.',
    suggestedPrompts: [
      'Break the cart-to-checkout step by device type',
      'Compare mobile vs desktop conversion at each funnel step',
    ],
    kind: 'segment',
    rubricDimension: 'segmentation',
  },
  {
    id: 'skill',
    sequence: 4,
    title: 'Write a skill',
    objective: 'Teach Claude how to analyze checkout funnels by writing a reusable .claude/skills file.',
    successCriterion: 'Confirm the file name of the skill you wrote.',
    suggestedPrompts: [
      'Write a .claude/skills/checkout-funnel-analyst.md skill that captures what you learned',
      'Create a skill file with the funnel analysis steps you just ran',
    ],
    kind: 'skill',
    rubricDimension: 'skill_construction',
  },
]

const IDLE_THRESHOLD_MS = 18000 // 18s

export function ClaudeCodeAnalyticsMedium({ challenge, attemptId }: MediumProps) {
  const terminalRef = useRef<ClaudeCodeTerminalHandle | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const sessionStartRef = useRef<number>(Date.now())

  const [wssUrl, setWssUrl] = useState<string | null>(USE_DEV_STUB ? MOCK_WSS_URL : null)
  const [subProblems, setSubProblems] = useState<AnalyticsSubProblem[]>(USE_DEV_STUB ? MOCK_SUB_PROBLEMS : [])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [activeSubProblemIdx, setActiveSubProblemIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [markedFindings, setMarkedFindings] = useState<MarkedFinding[]>([])
  const [mcpConnected, setMcpConnected] = useState(false)
  const [skillsWritten, setSkillsWritten] = useState<string[]>([])
  const [terminalTail, setTerminalTail] = useState('')
  const [proactiveNudge, setProactiveNudge] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showMirror, setShowMirror] = useState(false)
  const [usage, setUsage] = useState<{ spent_usd: number; budget_usd: number; input_tokens: number; output_tokens: number } | null>(null)

  const activeSubProblem = subProblems[activeSubProblemIdx] ?? null

  // Poll /state for live AI usage (spend vs the per-session budget cap). The hard
  // cap is enforced gateway-side; this just visualizes it. Skipped in dev stub.
  useEffect(() => {
    if (USE_DEV_STUB || !sessionId) return
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch(`/api/claude-code/session/${sessionId}/state`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.usage) setUsage(data.usage)
      } catch { /* transient */ }
    }
    poll()
    const t = setInterval(poll, 15000)
    return () => { cancelled = true; clearInterval(t) }
  }, [sessionId])

  // Check onboarding gate after mount (client-only)
  useEffect(() => {
    setShowOnboarding(shouldShowOnboarding())
  }, [])

  // Start session on mount
  useEffect(() => {
    if (USE_DEV_STUB) return

    async function startSession() {
      try {
        const res = await fetch('/api/claude-code/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge_id: challenge.id, attempt_id: attemptId }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string }
          setSessionError(err.error ?? `Session start failed (${res.status})`)
          return
        }
        const data = await res.json() as {
          session_id: string
          wss_url: string
          expires_at: string
          sub_problems?: AnalyticsSubProblem[]
        }
        setSessionId(data.session_id)
        setWssUrl(data.wss_url)
        if (data.sub_problems?.length) setSubProblems(data.sub_problems)
        sessionStartRef.current = Date.now()
      } catch (err) {
        setSessionError(String(err))
      }
    }

    startSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Idle detection — mirrors CanvasChatPanel:~189 setInterval pattern
  useEffect(() => {
    idleTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      if (elapsed > IDLE_THRESHOLD_MS) {
        fetchNudge()
        lastActivityRef.current = Date.now() // reset after nudge so it doesn't spam
      }
    }, 5000)

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubProblemIdx, terminalTail])

  async function fetchNudge() {
    if (!activeSubProblem) return
    try {
      const res = await fetch('/api/hatch/canvas/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          attemptId,
          challengeType: 'claude_code_analytics',
          mcp_connected: mcpConnected,
          terminal_tail: terminalTail.slice(-2000),
          active_sub_problem_id: activeSubProblem.id,
          active_sub_problem_title: activeSubProblem.title,
          active_sub_problem_objective: activeSubProblem.objective,
          time_elapsed_seconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
        }),
      })
      if (res.ok) {
        const data = await res.json() as { nudge?: string }
        if (data.nudge) setProactiveNudge(data.nudge)
      }
    } catch {
      // nudge failure is non-critical
    }
  }

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    setProactiveNudge(null)
  }, [])

  const handleOutput = useCallback((tail: string) => {
    setTerminalTail(tail)
  }, [])

  const handleMcpStatusChange = useCallback((connected: boolean) => {
    setMcpConnected(connected)
  }, [])

  const handleSkillWritten = useCallback((filename: string) => {
    setSkillsWritten(prev => prev.includes(filename) ? prev : [...prev, filename])
  }, [])

  async function handleMark(finding: string): Promise<MarkVerdict> {
    if (!activeSubProblem) return 'retry'

    try {
      const res = await fetch('/api/hatch/canvas/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Mark this step: ${finding}`,
          challengeId: challenge.id,
          attemptId,
          challengeType: 'claude_code_analytics',
          scene: { entities: [], connections: [] }, // not a canvas but schema requires it
          history: [],
          mcp_connected: mcpConnected,
          terminal_tail: terminalTail.slice(-3000),
          active_sub_problem_id: activeSubProblem.id,
          active_sub_problem_sequence: activeSubProblem.sequence,
          active_sub_problem_title: activeSubProblem.title,
          active_sub_problem_objective: activeSubProblem.objective,
          active_sub_problem_success_criterion: activeSubProblem.successCriterion,
          skills_written: skillsWritten,
          marked_findings: markedFindings,
          asserted_finding: finding,
          time_elapsed_seconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
        }),
      })

      if (!res.ok) return 'retry'

      const data = await res.json() as { verdict?: MarkVerdict; message?: string }
      const verdict: MarkVerdict = data.verdict ?? 'retry'

      const newFinding: MarkedFinding = { id: activeSubProblem.id, text: finding, verdict }
      setMarkedFindings(prev => [...prev, newFinding])

      if (verdict === 'pass' || verdict === 'partial') {
        setCompletedIds(prev => new Set([...prev, activeSubProblem.id]))
        const nextIdx = activeSubProblemIdx + 1
        if (nextIdx < subProblems.length) {
          setActiveSubProblemIdx(nextIdx)
        } else {
          // All steps done — show mirror
          setShowMirror(true)
        }
      }

      return verdict
    } catch {
      return 'retry'
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (showMirror) {
    return (
      <AnalyticsSessionMirror
        markedFindings={markedFindings}
        sessionDurationSeconds={Math.round((Date.now() - sessionStartRef.current) / 1000)}
        skillsWritten={skillsWritten}
        xpAwarded={50 + markedFindings.filter(f => f.verdict === 'pass').length * 25}
        onDashboard={() => { window.location.href = '/dashboard' }}
        onRunAnother={() => { window.location.reload() }}
      />
    )
  }

  if (sessionError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 14, padding: 32,
      }}>
        <HatchGlyph size={48} state="idle" className="text-primary" />
        <div style={{
          fontFamily: 'var(--font-headline)', fontSize: 17, fontWeight: 700,
          color: 'var(--color-on-surface)', textAlign: 'center',
        }}>
          Could not start the session
        </div>
        <div style={{
          fontSize: 13, color: 'var(--color-on-surface-variant)',
          background: 'var(--color-surface-container)',
          borderRadius: 10, padding: '10px 16px',
          fontFamily: 'monospace', maxWidth: 420, textAlign: 'center',
        }}>
          {sessionError}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '9px 20px', borderRadius: 99,
            background: 'var(--color-primary)', color: 'var(--color-on-primary)',
            border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
      {showOnboarding && (
        <AnalyticsOnboardingOverlay onDone={() => setShowOnboarding(false)} />
      )}

      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', minHeight: 0, overflow: 'hidden',
        background: 'var(--color-background)',
      }}>
        {/* Sub-problem stepper */}
        <div style={{
          flexShrink: 0, padding: '10px 16px',
          borderBottom: '1px solid var(--color-outline-variant)',
          background: 'var(--color-surface)',
          overflowX: 'auto',
        }}>
          {subProblems.length > 0 ? (
            <SubProblemStepper
              subProblems={subProblems}
              activeIdx={activeSubProblemIdx}
              completedIds={completedIds}
              onStepClick={idx => {
                if (completedIds.has(subProblems[idx]?.id ?? '')) {
                  setActiveSubProblemIdx(idx)
                }
              }}
            />
          ) : (
            <div style={{ height: 26, display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 120, height: 8,
                background: 'var(--color-surface-container-high)',
                borderRadius: 99, animation: 'pulse 1.5s ease infinite',
              }} />
            </div>
          )}
        </div>

        {/* Body split */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT — scenario + dataset */}
          <div style={{
            width: '28%', minWidth: 220, maxWidth: 320,
            flexShrink: 0,
            borderRight: '1px solid var(--color-outline-variant)',
            overflow: 'auto', padding: '14px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
            background: 'var(--color-surface-container-low)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              color: 'var(--color-on-surface-variant)',
            }}>
              Challenge scenario
            </div>
            <div style={{
              fontSize: 13, lineHeight: 1.7,
              color: 'var(--color-on-surface)',
            }}>
              {challenge.prompt_text || challenge.title || 'Analytics challenge'}
            </div>

            {/* Dataset badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8,
              background: 'var(--color-surface-container-high)',
              border: '1px solid var(--color-outline-variant)',
              alignSelf: 'flex-start',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                database
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                BigQuery · read-only
              </span>
            </div>
          </div>

          {/* RIGHT — live session */}
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column', gap: 10,
            padding: '12px 14px',
            overflow: 'auto',
          }}>

            {/* Objective card */}
            {activeSubProblem && (
              <AnalyticsObjectiveCard
                subProblem={activeSubProblem}
                stepIdx={activeSubProblemIdx}
                totalSteps={subProblems.length}
                mcpConnected={mcpConnected}
                skillsWritten={skillsWritten}
                onMark={handleMark}
              />
            )}

            {/* Connection strip */}
            <AnalyticsConnectionStrip
              mcpConnected={mcpConnected}
              skillsWritten={skillsWritten}
            />

            {/* Live AI usage meter — spend vs the per-session budget cap */}
            {usage && (
              <UsageMeter
                spentUsd={usage.spent_usd}
                budgetUsd={usage.budget_usd}
                inputTokens={usage.input_tokens}
                outputTokens={usage.output_tokens}
                active={!showMirror}
              />
            )}

            {/* Terminal frame */}
            <div style={{ flex: 1, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
              {wssUrl ? (
                <AnalyticsTerminalFrame
                  wssUrl={wssUrl}
                  terminalRef={terminalRef}
                  onOutput={handleOutput}
                  onActivity={handleActivity}
                  onMcpStatusChange={handleMcpStatusChange}
                  onSkillWritten={handleSkillWritten}
                />
              ) : (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#1c1f1e', borderRadius: 12,
                  flexDirection: 'column', gap: 10,
                }}>
                  <div style={{
                    width: 24, height: 24,
                    border: '3px solid rgba(142,207,158,0.2)',
                    borderTopColor: '#8ecf9e',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ fontSize: 12, color: '#8ecf9e', fontFamily: 'monospace' }}>
                    Starting sandbox…
                  </span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
                </div>
              )}
            </div>

            {/* Suggested prompt rail */}
            {activeSubProblem?.suggestedPrompts?.length && (
              <SuggestedPromptRail
                prompts={activeSubProblem.suggestedPrompts}
                terminalRef={terminalRef}
              />
            )}

            {/* Proactive nudge */}
            {proactiveNudge && (
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                padding: '10px 12px',
                background: 'var(--color-primary-fixed)',
                borderRadius: 10, border: '1px solid rgba(74,124,89,0.2)',
              }}>
                <HatchGlyph size={22} state="speaking" className="text-primary" />
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-on-surface)', margin: 0, flex: 1 }}>
                  {proactiveNudge}
                </p>
                <button
                  onClick={() => setProactiveNudge(null)}
                  style={{
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', padding: 2,
                    color: 'var(--color-on-surface-variant)',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    close
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
