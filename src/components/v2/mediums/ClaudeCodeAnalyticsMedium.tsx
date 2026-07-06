'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ArtifactSpineStrip } from './ArtifactSpineStrip'
import { deriveArtifactRows, artifactProgress, artifactSummaryText } from './analyticsArtifact'
import { AnalyticsObjectiveCard } from './AnalyticsObjectiveCard'
import { AnalyticsConnectionStrip } from './AnalyticsConnectionStrip'
import { UsageMeter } from './UsageMeter'
import { AnalyticsTerminalFrame } from './AnalyticsTerminalFrame'
import { SuggestedPromptRail } from './SuggestedPromptRail'
import { SkillsLibraryPanel } from './SkillsLibraryPanel'
import { IdleReapModal } from './IdleReapModal'
import { MissionBrief, shouldShowMissionBrief, markMissionBriefSeen } from './MissionBrief'
import { AnalyticsSessionMirror } from './AnalyticsSessionMirror'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { PaywallModal } from '@/components/paywalls/PaywallModal'
import { CanvasChatPanel } from '@/components/challenge/CanvasChatPanel'
import { mergeArc } from './analyticsArc'
import {
  applyVerdict,
  planBranch,
  applyBranch,
  INITIAL_MACHINE,
  type GuidanceMachineState,
} from '@/lib/adaptive/branching'
import { REGISTER_LABELS, REGISTER_TOOLTIPS } from '@/lib/adaptive/registerLabel'
import { toDimensionViews, type AnalystDimensionView } from '@/lib/coding-grading/analyst-rubric'
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


const IDLE_THRESHOLD_MS = 18000 // 18s

// Idle-reap warning. The server cron reaps an active session after ~15 min of no
// activity; the client warns the (still-present) user a bit BEFORE that with a
// countdown so they can keep their warm instance. WARN fires at 13 min idle, with
// a 90s countdown → if ignored, ~14.5 min, just under the server's 15 min sweep.
const REAP_WARN_MS = 13 * 60 * 1000
const REAP_COUNTDOWN_SECONDS = 90

export function ClaudeCodeAnalyticsMedium({ challenge, attemptId, scenario, exitHref }: MediumProps) {
  const terminalRef = useRef<ClaudeCodeTerminalHandle | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const sessionStartRef = useRef<number>(Date.now())
  // Real terminal activity timestamp (NOT reset by the nudge loop) — drives the
  // idle-reap warning independently of nudges.
  const reapActivityRef = useRef<number>(Date.now())

  const [wssUrl, setWssUrl] = useState<string | null>(USE_DEV_STUB ? MOCK_WSS_URL : null)
  // The sandbox (a live Cloud Run container) is provisioned only when the user
  // explicitly starts it, not on page load — so we incur infra cost only once
  // they commit to working the challenge. The dev stub skips the gate.
  const [started, setStarted] = useState<boolean>(USE_DEV_STUB)
  // True while the mount-time check for an already-live sandbox is in flight (e.g.
  // after a browser refresh). Holds back the "Start sandbox" button so it doesn't
  // flash before we know whether to auto-reconnect. Init false in the dev stub.
  const [resuming, setResuming] = useState<boolean>(!USE_DEV_STUB)
  // True once a prior session for this attempt was reaped/expired and its work
  // can be restored — flips the start CTA to "Resume". Shown the idle-reap modal
  // when idle near the reap threshold.
  const [wasReaped, setWasReaped] = useState(false)
  const [showReapModal, setShowReapModal] = useState(false)
  // The arc is the default analyst course (tiered by difficulty), with any
  // per-challenge overrides merged on top once the start route returns them.
  const [subProblems, setSubProblems] = useState<AnalyticsSubProblem[]>(
    () => mergeArc(challenge.difficulty, undefined),
  )
  // Guidance level for this session (adaptive workspaces). Server-derived in
  // session/start; 'guided' is the compatibility default and today's behavior.
  const [guidance, setGuidance] = useState<'scaffolded' | 'guided' | 'open'>('guided')
  // In-session adaptation bookkeeping: the bounded guidance state machine plus
  // the injection/adjustment log persisted via PATCH session/[id]/adaptive.
  const machineRef = useRef<GuidanceMachineState>({ ...INITIAL_MACHINE })
  const adaptiveLogRef = useRef<{
    injected: Array<{ id: string; kind: string; afterStepId: string | null; reason: string }>
    adjustments: Array<{ from: string; to: string; trigger: string; atStepId: string | null }>
  }>({ injected: [], adjustments: [] })

  // ── Terminal-as-hero frame: resizable split (ported from cc-analytics-hero).
  // The left "Mission" column owns all guidance and the single scroll; the
  // right pane is the terminal only. Same clamps + storage pattern as
  // FlowWorkspace so the lab reads like the coding workspace.
  const containerRef = useRef<HTMLDivElement>(null)
  const dragCleanupRef = useRef<null | (() => void)>(null)
  const [leftWidth, setLeftWidth] = useState(30) // percent, md and up only
  const [questionCollapsed, setQuestionCollapsed] = useState(false)
  const questionTouchedRef = useRef(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`cc-analytics-layout:${challenge.id}`)
      if (stored) {
        const parsed = JSON.parse(stored) as { leftWidth?: number }
        if (typeof parsed.leftWidth === 'number') setLeftWidth(Math.max(20, Math.min(50, parsed.leftWidth)))
      }
    } catch { /* no storage */ }
  }, [challenge.id])
  useEffect(() => {
    try {
      localStorage.setItem(`cc-analytics-layout:${challenge.id}`, JSON.stringify({ leftWidth }))
    } catch { /* no storage */ }
  }, [challenge.id, leftWidth])


  const handleLeftDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const onMouseMove = (ev: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.max(20, Math.min(50, pct)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      dragCleanupRef.current = null
    }
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    dragCleanupRef.current = onMouseUp
  }, [])
  useEffect(() => () => { dragCleanupRef.current?.() }, [])

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  // Free quota exhausted (HTTP 402). Opens the unified PaywallModal (analytics
  // tier) instead of a generic error. Holds the used/limit for the modal copy.
  const [paywall, setPaywall] = useState<{ used?: number; limit?: number } | null>(null)
  // Which provisioning phase we're in, for the progress indicator. The sandbox
  // boot is multi-step (wake DB → mint key → boot container → wait readiness),
  // and on a cold start it can take ~30-60s — so we show the user what they're
  // waiting on rather than an opaque spinner.
  const [provisionPhase, setProvisionPhase] = useState<
    'requesting' | 'waking' | 'booting' | 'connecting' | null
  >(null)

  const [activeSubProblemIdx, setActiveSubProblemIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [markedFindings, setMarkedFindings] = useState<MarkedFinding[]>([])
  const [mcpConnected, setMcpConnected] = useState(false)
  // True once the `claude` REPL has launched (its banner/prompt appeared). Step 1
  // gates on this so we never advance the user into bash with REPL-only prompts.
  const [replRunning, setReplRunning] = useState(false)

  // Auto-collapse the scenario prose once the session is live, unless the
  // user has toggled it themselves.
  useEffect(() => {
    if (mcpConnected && replRunning && !questionTouchedRef.current) {
      setQuestionCollapsed(true)
    }
  }, [mcpConnected, replRunning])
  const [skillsWritten, setSkillsWritten] = useState<string[]>([])
  const [reportPath, setReportPath] = useState<string | null>(null)
  // analyst_v1 per-dimension scores from the finalize grade, for the mirror chart.
  const [dimensions, setDimensions] = useState<AnalystDimensionView[] | null>(null)
  const [terminalTail, setTerminalTail] = useState('')
  // AI-generated "Try next" chips, contextual to the live terminal + state.
  // Empty → the rail shows the step's static arc prompts (the fallback).
  const [aiPrompts, setAiPrompts] = useState<string[]>([])
  const [proactiveNudge, setProactiveNudge] = useState<string | null>(null)
  const [showBrief, setShowBrief] = useState(false)
  const [showMirror, setShowMirror] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const finalizedRef = useRef(false)
  // Set from the finalize response once the attempt has a share_id (the public
  // share page reuses the existing /workspace/challenges/[id]/share/[shareId]
  // route). Null until then, so the mirror shows Download but not Share.
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ spent_usd: number; budget_usd: number; input_tokens: number; output_tokens: number } | null>(null)
  // The floating Hatch dock: closed by default, opens to a bubble the user can
  // dock to the right. Hatch sees the live session (terminal tail, active step,
  // MCP + skills state) on every turn via the analytics context props below.
  const [hatchOpen, setHatchOpen] = useState(false)

  const activeSubProblem = subProblems[activeSubProblemIdx] ?? null

  // ── Artifact spine: the deliverable-as-progress, derived from live signals
  // (no new state). Recomputes when the arc changes, so injected adaptive
  // steps appear in the strip the moment planBranch inserts them.
  const artifactRows = useMemo(() => deriveArtifactRows({
    scenarioQuestion: scenario?.question ?? null,
    mcpConnected,
    replRunning,
    markedFindings,
    reportPath,
    skillsWritten,
    dimensions,
    subProblems,
    activeStepId: activeSubProblem?.id ?? null,
  }), [scenario?.question, mcpConnected, replRunning, markedFindings, reportPath, skillsWritten, dimensions, subProblems, activeSubProblem?.id])
  const { done: artifactDone, total: artifactTotal } = useMemo(() => artifactProgress(artifactRows), [artifactRows])

  // Capped milestone-state string for Hatch (interpret + nudge): lets the
  // coach name the exact missing deliverable. 550 chars keeps the request
  // body comfortably inside the routes' validation caps.
  const artifactSummary = useMemo(() => artifactSummaryText(artifactRows).slice(0, 550), [artifactRows])

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
    setShowBrief(shouldShowMissionBrief(challenge.id))
  }, [])
  // First-session coaching: the dock is opened once via CanvasChatPanel's
  // autoOpenKey below (the panel owns its open state, so setHatchOpen can't
  // drive it).

  // Mount-time auto-resume. On a page refresh the client loses sessionId/wssUrl,
  // so without this we'd show "Start sandbox" even when a container is still live.
  // GET /session/current is a READ-ONLY probe (never provisions), so this respects
  // the cost gate: no live session → it returns `none` and we fall through to the
  // Start button. A live session → reconnect straight into the terminal.
  useEffect(() => {
    if (USE_DEV_STUB) return // stub renders the mock terminal; resuming is already false
    let cancelled = false
    ;(async () => {
      try {
        const params = new URLSearchParams({ challenge_id: challenge.id })
        // Anchor the probe to a specific attempt when we have one so a refresh
        // never reconnects to a sibling in-progress attempt for this challenge.
        if (attemptId) params.set('attempt_id', attemptId)
        const res = await fetch(`/api/claude-code/session/current?${params.toString()}`)
        if (!res.ok) {
          if (!cancelled) setResuming(false)
          return
        }
        const data = (await res.json()) as {
          status?: string
          session_id?: string
          wss_url?: string | null
          sub_problems?: AnalyticsSubProblem[]
          arc_complete?: boolean
          guidance?: 'scaffolded' | 'guided' | 'open'
        }
        if (!cancelled && data.status === 'active' && data.wss_url && data.session_id) {
          setSessionId(data.session_id) // → usage poll + finalize (keyed on sessionId)
          setWssUrl(data.wss_url) // → terminal renders (first branch) + idle-reap watcher
          setStarted(true) // keep the invariant: started ⟺ committed to a session
          // arc_complete → the server sent the full per-session adaptive arc:
          // use it verbatim. Legacy payloads are overrides to merge locally.
          if (data.sub_problems?.length) {
            setSubProblems(
              data.arc_complete
                ? data.sub_problems
                : mergeArc(challenge.difficulty, data.sub_problems),
            )
          }
          if (data.guidance) setGuidance(data.guidance)
          sessionStartRef.current = Date.now()
          setResuming(false)
        } else if (!cancelled) {
          setResuming(false) // none/unknown → normal Start button
        }
      } catch {
        if (!cancelled) setResuming(false) // network error → Start button
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start + provision session. The flow is split so it fits Vercel Hobby's 60s
  // function ceiling on a cold start:
  //   1. POST /session/start    → fast: gates + create a `provisioning` row.
  //   2. POST /session/[id]/provision → the heavy step (wake DB, mint key, boot
  //      revision, wait readiness). Runs in its own request.
  //   3. While (2) runs, poll /session/[id]/state to advance the progress phase
  //      and pick up wss_url the moment the row flips to `active`.
  useEffect(() => {
    // Provision only after the user clicks "Start sandbox" (started=true). The
    // dev stub sets started=true up front so the UX renders without real infra.
    if (USE_DEV_STUB || !started) return
    // Mount-resume already reconnected (set wssUrl + started together) — don't
    // re-provision. On a normal Start click wssUrl is null when started flips, so
    // this guard is false and provisioning proceeds unchanged.
    if (wssUrl) return

    let cancelled = false
    let pollTimer: ReturnType<typeof setInterval> | null = null

    async function run() {
      try {
        setProvisionPhase('requesting')
        const res = await fetch('/api/claude-code/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Only send attempt_id when we actually have one. An empty string
          // fails the route's z.string().uuid() check (400); omitting it lets
          // the route find-or-create the attempt itself.
          body: JSON.stringify({
            challenge_id: challenge.id,
            ...(attemptId ? { attempt_id: attemptId } : {}),
          }),
        })

        if (res.status === 402) {
          // Quota exhausted / not entitled → unified paywall, not a raw error.
          const err = await res.json().catch(() => ({})) as { used?: number; limit?: number }
          if (!cancelled) setPaywall({ used: err.used, limit: err.limit })
          return
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string }
          if (!cancelled) setSessionError(err.error ?? `Session start failed (${res.status})`)
          return
        }

        const data = await res.json() as {
          session_id: string
          status: string
          wss_url: string | null
          sub_problems?: AnalyticsSubProblem[]
          arc_complete?: boolean
          guidance?: 'scaffolded' | 'guided' | 'open'
        }
        if (cancelled) return
        setSessionId(data.session_id)
        // arc_complete → the server computed the full per-session adaptive arc
        // (guidance-shaped, persisted for resume): use it verbatim. Legacy
        // payloads are per-challenge OVERRIDES merged onto the default arc.
        if (data.sub_problems?.length) {
          setSubProblems(
            data.arc_complete
              ? data.sub_problems
              : mergeArc(challenge.difficulty, data.sub_problems),
          )
        }
        if (data.guidance) setGuidance(data.guidance)
        sessionStartRef.current = Date.now()

        // Already live (reconnect to a running container) — done.
        if (data.status === 'active' && data.wss_url) {
          setWssUrl(data.wss_url)
          setProvisionPhase(null)
          return
        }

        // Poll /state for readiness while provision runs. The phase advances on
        // elapsed time so the copy reflects the slow steps even though /state
        // only reports coarse status (provisioning → active).
        const provisionStart = Date.now()
        // Hard ceiling on the whole boot. A cold start is ~30-60s; well past that
        // something is wrong, so stop polling and show the retry path rather than
        // spin forever (e.g. if provisioning died before persisting a host).
        const POLL_DEADLINE_MS = 150_000
        setProvisionPhase('waking')
        const poll = async () => {
          if (cancelled) return
          const elapsed = Date.now() - provisionStart
          if (elapsed > POLL_DEADLINE_MS) {
            if (pollTimer) clearInterval(pollTimer)
            if (!cancelled) setSessionError('Sandbox took too long to start. Please try again.')
            return
          }
          // Time-based phase hints (the DB wake is the long pole, then boot).
          setProvisionPhase((cur) =>
            cur === null ? cur : elapsed > 22000 ? 'connecting' : elapsed > 8000 ? 'booting' : 'waking',
          )
          try {
            const sres = await fetch(`/api/claude-code/session/${data.session_id}/state`)
            if (sres.ok) {
              const sdata = await sres.json() as { status?: string; wss_url?: string | null }
              if (sdata.status === 'active' && sdata.wss_url) {
                if (!cancelled) { setWssUrl(sdata.wss_url); setProvisionPhase(null) }
                if (pollTimer) clearInterval(pollTimer)
                return
              }
              if (sdata.status === 'failed' || sdata.status === 'terminated') {
                if (!cancelled) setSessionError('Sandbox failed to start. Please try again.')
                if (pollTimer) clearInterval(pollTimer)
                return
              }
            }
          } catch { /* transient — keep polling */ }
        }

        // Kick off the heavy provision request (its own 60s budget). We do NOT
        // await it for the UI — the poll picks up the result either way, so a
        // client-side timeout/disconnect on this fetch never blocks readiness.
        fetch(`/api/claude-code/session/${data.session_id}/provision`, { method: 'POST' })
          .then(async (pres) => {
            if (cancelled) return
            if (pres.status === 402) {
              const err = await pres.json().catch(() => ({})) as { used?: number; limit?: number }
              setPaywall({ used: err.used, limit: err.limit })
              if (pollTimer) clearInterval(pollTimer)
              return
            }
            if (pres.ok) {
              const pdata = await pres.json().catch(() => ({})) as { status?: string; wss_url?: string | null }
              // Only connect when the revision is actually Ready (`active`). A
              // `provisioning` response means the container is still booting —
              // the /state poll will flip it and set wss_url then.
              if (pdata.status === 'active' && pdata.wss_url && !cancelled) {
                setWssUrl(pdata.wss_url)
                setProvisionPhase(null)
                if (pollTimer) clearInterval(pollTimer)
              }
            }
            // Non-OK (503/timeout) is handled by the poll loop + its failed flip.
          })
          .catch(() => { /* the poll loop is the source of truth */ })

        await poll()
        pollTimer = setInterval(poll, 3000)
      } catch (err) {
        if (!cancelled) setSessionError(String(err))
      }
    }

    run()
    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  // Idle detection — mirrors CanvasChatPanel:~189 setInterval pattern.
  // Nudge eagerness follows the guidance level (design §3.3): scaffolded
  // learners get eager nudges, guided the standard delay, open learners are
  // never auto-nudged — they ask when they want input.
  useEffect(() => {
    if (guidance === 'open') return
    const thresholdMs = guidance === 'scaffolded' ? IDLE_THRESHOLD_MS : IDLE_THRESHOLD_MS * 2
    idleTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      if (elapsed > thresholdMs) {
        fetchNudge()
        lastActivityRef.current = Date.now() // reset after nudge so it doesn't spam
      }
    }, 5000)

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubProblemIdx, terminalTail, guidance])

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
          artifact_state: artifactSummary,
          active_sub_problem_id: activeSubProblem.id,
          active_sub_problem_title: activeSubProblem.title,
          active_sub_problem_objective: activeSubProblem.objective,
          active_sub_problem_kind: activeSubProblem.kind,
          active_sub_problem_teaching_note: activeSubProblem.teachingNote ?? null,
          report_written: !!reportPath,
          time_elapsed_seconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
          guidance_level: guidance,
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
    reapActivityRef.current = Date.now()
    setProactiveNudge(null)
    setShowReapModal((open) => (open ? false : open))
  }, [])

  // Idle-reap watcher: while a live session is running, show the warning modal
  // once activity has been stale for REAP_WARN_MS. "Keep working" resets it.
  useEffect(() => {
    if (!wssUrl || showMirror || USE_DEV_STUB) return
    const t = setInterval(() => {
      if (Date.now() - reapActivityRef.current >= REAP_WARN_MS) {
        setShowReapModal(true)
      }
    }, 10000)
    return () => clearInterval(t)
  }, [wssUrl, showMirror])

  // User chose to keep the session alive: reset idle + ping the server so its
  // reaper backs off (the /state poll refreshes last_activity_at).
  const handleKeepWorking = useCallback(() => {
    reapActivityRef.current = Date.now()
    setShowReapModal(false)
    if (sessionId) {
      void fetch(`/api/claude-code/session/${sessionId}/state`).catch(() => {})
    }
    terminalRef.current?.focus()
  }, [sessionId])

  // Modal ignored for the full countdown → drop back to the (now "Resume") start
  // card. The server cron frees the instance; work is safe in the last autosave,
  // and re-starting rehydrates /workspace from it.
  useEffect(() => {
    if (!showReapModal) return
    const t = setTimeout(() => {
      setShowReapModal(false)
      setWasReaped(true)
      setStarted(false)
      setWssUrl(null)
    }, REAP_COUNTDOWN_SECONDS * 1000)
    return () => clearTimeout(t)
  }, [showReapModal])

  const handleOutput = useCallback((tail: string) => {
    setTerminalTail(tail)
  }, [])

  // ── Contextual "Try next" chips ─────────────────────────────────────────────
  // Hatch (Haiku) reads the live terminal + current step and writes 2-3 bespoke
  // next prompts. Refetched when the step or MCP/REPL state changes (immediate)
  // and after terminal activity settles (debounced). Falls back to the step's
  // static arc prompts whenever the call is empty/in-flight/failed, so the rail
  // is never blank. Skipped in the dev stub (no real session).
  const chipsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchSuggestedPrompts = useCallback(async () => {
    if (USE_DEV_STUB) return
    const step = subProblems[activeSubProblemIdx]
    if (!step) return
    try {
      const res = await fetch('/api/hatch/canvas/suggest-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeType: 'claude_code_analytics',
          mcp_connected: mcpConnected,
          repl_running: replRunning,
          terminal_tail: terminalTail.slice(-3000),
          artifact_state: artifactSummary,
          active_sub_problem_id: step.id,
          active_sub_problem_kind: step.kind,
          active_sub_problem_title: step.title,
          active_sub_problem_objective: step.objective,
          active_sub_problem_success_criterion: step.successCriterion,
          fallback_prompts: step.suggestedPrompts,
          guidance_level: guidance,
        }),
      })
      if (!res.ok) { setAiPrompts([]); return }
      const data = await res.json() as { prompts?: string[] }
      setAiPrompts(Array.isArray(data.prompts) ? data.prompts : [])
    } catch {
      setAiPrompts([]) // fall back to static prompts
    }
  }, [activeSubProblemIdx, subProblems, challenge.id, mcpConnected, replRunning, terminalTail, guidance])

  // Refetch immediately when the step or connection state changes (clear stale
  // chips first so we never show a previous step's suggestions).
  useEffect(() => {
    if (USE_DEV_STUB) return
    setAiPrompts([])
    void fetchSuggestedPrompts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubProblemIdx, mcpConnected, replRunning])

  // Debounced refetch after the terminal output changes (the user ran something
  // and saw a result) — wait for it to settle so we react to the final output.
  useEffect(() => {
    if (USE_DEV_STUB || !terminalTail) return
    if (chipsTimerRef.current) clearTimeout(chipsTimerRef.current)
    chipsTimerRef.current = setTimeout(() => { void fetchSuggestedPrompts() }, 4000)
    return () => { if (chipsTimerRef.current) clearTimeout(chipsTimerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalTail])

  // The terminal callbacks only flip state — the advance decision lives in an
  // effect below so it always reads the current mcpConnected/replRunning (the
  // two signals arrive in either order across separate renders, so deciding
  // inside a callback closure would race on a stale value).
  const handleMcpStatusChange = useCallback((connected: boolean) => {
    setMcpConnected(connected)
  }, [])

  const handleReplStatusChange = useCallback((running: boolean) => {
    setReplRunning(running)
  }, [])

  // Step 1 (mcp_setup) completes only once BOTH are true: the BigQuery MCP is
  // registered AND the `claude` REPL is running. Advancing on MCP alone dumped
  // the user on step 2 still in bash, where step 2's natural-language prompts
  // are "command not found". Gating on both makes the bash→REPL handoff
  // explicit. A returning user's MCP is pre-registered, so this still waits for
  // them to launch claude once before advancing.
  useEffect(() => {
    if (!mcpConnected || !replRunning) return
    const step = subProblems[activeSubProblemIdx]
    if (step && (step.kind === 'mcp_setup' || step.kind === 'connect')) {
      setCompletedIds(prev => new Set([...prev, step.id]))
      if (activeSubProblemIdx + 1 < subProblems.length) {
        setActiveSubProblemIdx(activeSubProblemIdx + 1)
      }
    }
  }, [mcpConnected, replRunning, subProblems, activeSubProblemIdx])

  const handleSkillWritten = useCallback((filename: string) => {
    setSkillsWritten(prev => prev.includes(filename) ? prev : [...prev, filename])
  }, [])

  const handleReportWritten = useCallback((path: string) => {
    setReportPath(path)
  }, [])

  // Finalize the session: tears down the sandbox, runs the analyst grader, marks
  // the attempt completed (so it reaches Submissions history), and returns the
  // grade + a share link. Runs once. Then shows the mirror.
  const finalizeSession = useCallback(async () => {
    if (finalizedRef.current || !sessionId || USE_DEV_STUB) {
      setShowMirror(true)
      return
    }
    finalizedRef.current = true
    setFinalizing(true)
    try {
      const res = await fetch(`/api/claude-code/session/${sessionId}/finalize`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as { share_url?: string | null; final_artifact?: unknown }
        if (data.share_url) setShareUrl(data.share_url)
        const views = toDimensionViews(data.final_artifact)
        if (views) setDimensions(views)
      }
    } catch {
      // Grading failure must not block the user from seeing their session summary.
    } finally {
      setFinalizing(false)
      setShowMirror(true)
    }
  }, [sessionId])

  async function handleMark(finding: string): Promise<MarkVerdict> {
    if (!activeSubProblem) return 'retry'

    try {
      const res = await fetch('/api/hatch/canvas/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Mark this step: ${finding}`,
          challengeId: challenge.id,
          ...(attemptId ? { attemptId } : {}),
          challengeType: 'claude_code_analytics',
          // No canvas in analytics. `scene` is optional in the interpret schema;
          // sending a partial scene ({entities,connections} only) fails the full
          // CanvasSceneSchema (elementCount/groups/freeText/foreignKeys) → 400.
          // Omit it entirely.
          history: [],
          mcp_connected: mcpConnected,
          terminal_tail: terminalTail.slice(-3000),
          artifact_state: artifactSummary,
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
      const allFindings = [...markedFindings, newFinding]
      setMarkedFindings(allFindings)

      // ── Adaptive: bounded guidance adjustment + arc branching (design §3.2, §5) ──
      const adj = applyVerdict(machineRef.current, verdict, guidance)
      machineRef.current = adj.state
      let nextGuidance = guidance
      if (adj.moved) {
        nextGuidance = adj.guidance
        setGuidance(nextGuidance)
        adaptiveLogRef.current.adjustments.push({
          from: guidance,
          to: nextGuidance,
          trigger: adj.moved === 'down' ? 'two retries in a row' : 'two clean passes in a row',
          atStepId: activeSubProblem.id,
        })
      }

      const log = adaptiveLogRef.current
      const plan = planBranch({
        arc: subProblems,
        activeIdx: activeSubProblemIdx,
        verdicts: allFindings.map((f) => ({ stepId: f.id, verdict: f.verdict })),
        scaffoldsInjected: log.injected.filter((i) => i.kind === 'scaffold_explainer').length,
        stretchesInjected: log.injected.filter((i) => i.kind !== 'scaffold_explainer').length,
      })
      let nextArc = subProblems
      if (plan.action !== 'none') {
        nextArc = applyBranch(subProblems, plan)
        setSubProblems(nextArc)
        log.injected.push({
          id: plan.step.id,
          kind: plan.step.kind,
          afterStepId: plan.atIdx > 0 ? nextArc[plan.atIdx - 1]?.id ?? null : null,
          reason: plan.reason,
        })
        // A scaffold lands AT the active index, becoming the new active step —
        // the learner regroups before re-attempting the stuck step.
        if (plan.action === 'inject_scaffold') {
          setActiveSubProblemIdx(plan.atIdx)
        }
        // Announce the branch through the Hatch dock so the arc visibly
        // reacts instead of silently changing shape (adaptive UI, F1).
        setProactiveNudge(
          plan.action === 'inject_scaffold'
            ? 'I added a regroup step. The last two attempts told me the question got too big, so shrink it: read your last output, then take one small query.'
            : 'Two clean passes in a row, so I added a stretch step after this one. Nail the metric definition and this session becomes portfolio material.',
        )
      }

      // Persist adaptive state best-effort; a failed write never blocks the verdict.
      if (sessionId && !USE_DEV_STUB) {
        void fetch(`/api/claude-code/session/${sessionId}/adaptive`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guidance: nextGuidance,
            arc: nextArc,
            injected: log.injected,
            adjustments: log.adjustments,
          }),
        }).catch(() => {})
      }

      if (verdict === 'pass' || verdict === 'partial') {
        setCompletedIds(prev => new Set([...prev, activeSubProblem.id]))
        const activeIdxInNext = nextArc.findIndex((s) => s.id === activeSubProblem.id)
        const nextIdx = (activeIdxInNext >= 0 ? activeIdxInNext : activeSubProblemIdx) + 1
        if (nextIdx < nextArc.length) {
          setActiveSubProblemIdx(nextIdx)
        } else {
          // All steps done — finalize (grade + mark attempt complete) then mirror.
          void finalizeSession()
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
        dimensions={dimensions}
        xpAwarded={50 + markedFindings.filter(f => f.verdict === 'pass').length * 25}
        reportPath={reportPath}
        reportDownloadUrl={sessionId && reportPath ? `/api/claude-code/session/report?session=${encodeURIComponent(sessionId)}` : null}
        shareUrl={shareUrl}
        adaptive={{
          guidance,
          injected: adaptiveLogRef.current.injected,
          adjustments: adaptiveLogRef.current.adjustments,
        }}
        onDashboard={() => { window.location.href = '/dashboard' }}
        onRunAnother={() => { window.location.reload() }}
      />
    )
  }

  // Free quota exhausted → unified upgrade modal (analytics tier), over a blurred
  // shell so the user sees what they're unlocking.
  if (paywall) {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <div style={{ height: '100%', filter: 'blur(4px)', opacity: 0.4, pointerEvents: 'none', padding: 24 }}>
          <div style={{ height: '100%', borderRadius: 12, background: 'var(--color-surface-container)' }} />
        </div>
        <PaywallModal
          open
          feature="claude_code_sessions"
          used={paywall.used}
          limit={paywall.limit}
          dismissible
          onClose={() => { setPaywall(null); setStarted(false) }}
        />
      </div>
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
          onClick={() => { setSessionError(null); setStarted(false) }}
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
      {showBrief && (
        <MissionBrief
          question={scenario?.question || challenge.title || 'Answer the business question with real data.'}
          briefBody={[scenario?.context, scenario?.trigger].filter(Boolean).join(' ') || undefined}
          ready={mcpConnected && replRunning}
          firstPrompt={activeSubProblem?.suggestedPrompts?.[0] ?? 'What tables are in the dataset?'}
          onStart={() => {
            setStarted(true)
            markMissionBriefSeen(challenge.id)
            setShowBrief(false)
          }}
          onRunFirstPrompt={() => {
            terminalRef.current?.insertText(activeSubProblem?.suggestedPrompts?.[0] ?? 'What tables are in the dataset?')
          }}
          onDismiss={() => {
            markMissionBriefSeen(challenge.id)
            setShowBrief(false)
          }}
        />
      )}

      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', minHeight: 0, overflow: 'hidden',
        background: 'var(--color-background)',
      }}>
        {/* Artifact spine — the deliverable as progress. 48px, never wraps;
            a long adaptive arc scrolls horizontally instead of stealing
            terminal height. */}
        <div style={{
          flexShrink: 0, height: 48, padding: '0 16px 0 10px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid var(--color-outline-variant)',
          background: 'var(--color-surface)',
        }}>
          {exitHref && (
            <a
              href={exitHref}
              aria-label="Back"
              className="material-symbols-outlined"
              style={{
                fontSize: 20, color: 'var(--color-on-surface-variant)',
                borderRadius: 999, padding: 4, flexShrink: 0,
                textDecoration: 'none',
              }}
            >
              arrow_back
            </a>
          )}
          <ArtifactSpineStrip rows={artifactRows} done={artifactDone} total={artifactTotal} />
        </div>

        {/* Body split. position: relative so the floating Hatch bubble anchors
            to this workspace row (its closed/floating modes use `absolute
            bottom-4 right-4`), and it's a flex row so the docked panel sits as
            the right column — exactly how FlowWorkspace mounts the same panel. */}
        <div
          ref={containerRef}
          className="flex flex-col overflow-y-auto md:flex-row md:overflow-hidden"
          style={{ flex: 1, minHeight: 0, position: 'relative', gap: 8, padding: 8, background: 'var(--color-surface-container-low)', ['--cc-left-w' as string]: `${leftWidth}%` }}
        >

          {/* LEFT — scenario + dataset. `minHeight: 0` + `height: 100%` are what
              let `overflowY: auto` actually engage inside the flex row: without
              them the column stretches to its content's intrinsic height, grows
              the row past the viewport, and the bottom (skills library) gets
              clipped with no scrollbar. */}
          <div
            className="w-full md:w-[var(--cc-left-w)] md:h-full md:min-h-0 md:overflow-y-auto"
            style={{
              flexShrink: 0,
              border: '1px solid var(--color-outline-variant)', borderRadius: 12,
              overflowX: 'hidden', padding: '14px 14px',
              display: 'flex', flexDirection: 'column', gap: 12,
              background: 'var(--color-surface-container-lowest)',
            }}>
            <button
              onClick={() => { questionTouchedRef.current = true; setQuestionCollapsed(v => !v) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 10, fontWeight: 800,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                color: 'var(--color-on-surface-variant)',
                flexShrink: 0, background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 0, fontFamily: 'inherit',
              }}
              aria-expanded={!questionCollapsed}
            >
              Challenge scenario
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {questionCollapsed ? 'expand_more' : 'expand_less'}
              </span>
            </button>
            {/* Title */}
            <div style={{
              fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 700,
              lineHeight: 1.3, color: 'var(--color-on-surface)',
            }}>
              {challenge.title || 'Analytics challenge'}
            </div>

            {/* Scenario brief — context, the trigger, and the question to answer.
                For analytics challenges prompt_text is empty; the narrative is in
                the scenario_* columns passed down as `scenario`. */}
            {scenario && (scenario.context || scenario.trigger || scenario.question) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!questionCollapsed && scenario.context && (
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--color-on-surface)', margin: 0 }}>
                    {scenario.context}
                  </p>
                )}
                {!questionCollapsed && scenario.trigger && (
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--color-on-surface)', margin: 0 }}>
                    {scenario.trigger}
                  </p>
                )}
                {scenario.question && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--color-surface-container-high)',
                    borderLeft: '3px solid var(--color-primary)',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: 'var(--color-on-surface-variant)',
                      marginBottom: 4,
                    }}>
                      The question
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-on-surface)', margin: 0, fontWeight: 600 }}>
                      {scenario.question}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-on-surface)' }}>
                {challenge.prompt_text || 'Drive the analyst session to answer the business question.'}
              </div>
            )}

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


            {/* Coaching register — how Hatch is coaching this session (F3).
                Product language only; the internal level never surfaces. */}
            <div
              title={REGISTER_TOOLTIPS[guidance]}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                alignSelf: 'flex-start',
                background: 'var(--color-surface-container)',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 999,
                padding: '3px 10px',
                cursor: 'default',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 13, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1, 'wght' 500" }}
              >
                school
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-label)' }}>
                Coaching: {REGISTER_LABELS[guidance]}
              </span>
            </div>

            {/* Objective card */}
            {activeSubProblem && (
              <AnalyticsObjectiveCard
                subProblem={activeSubProblem}
                stepIdx={activeSubProblemIdx}
                totalSteps={subProblems.length}
                mcpConnected={mcpConnected}
                replRunning={replRunning}
                skillsWritten={skillsWritten}
                hideTeachingNote={guidance === 'open'}
                reportWritten={!!reportPath}
                onMark={handleMark}
              />
            )}

            {/* Suggested prompt rail. Prefer the AI-generated contextual chips
                (driven by the live terminal); fall back to the step's static
                arc prompts whenever those are empty (loading / failed / budget). */}
            {(() => {
              // Prompt density follows guidance (design §3.3): scaffolded sees
              // everything, guided two, open a single sharp direction.
              const density = guidance === 'scaffolded' ? 3 : guidance === 'guided' ? 2 : 1
              const allRailPrompts = aiPrompts.length ? aiPrompts : (activeSubProblem?.suggestedPrompts ?? [])
              const railPrompts = allRailPrompts.slice(0, density)
              return railPrompts.length ? (
                <SuggestedPromptRail
                  prompts={railPrompts}
                  terminalRef={terminalRef}
                  contextual={aiPrompts.length > 0}
                />
              ) : null
            })()}

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

            {/* Skills library — browse + reload skills built across past sessions. */}
            <SkillsLibraryPanel
              terminalRef={terminalRef}
              sessionSkills={skillsWritten}
              replRunning={replRunning}
              onLoaded={handleSkillWritten}
            />
          </div>

          {/* Drag divider — desktop only (mobile stacks) */}
          <div
            onMouseDown={handleLeftDividerMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize mission panel and terminal"
            className="hidden md:flex"
            style={{ width: 8, margin: '0 -8px', cursor: 'col-resize', flexShrink: 0, zIndex: 5, alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: 4, height: 36, borderRadius: 999, background: 'var(--color-outline-variant)' }} />
          </div>

          {/* RIGHT — live session. overflow:hidden, NOT auto: the terminal is
              the only element allowed to scroll (xterm scrolls internally).
              An auto column here created a second scrollbar around the
              terminal and let sibling cards jitter its height. */}
          <div
            className="min-h-[360px] md:min-h-0"
            style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column',
              padding: '10px 12px',
              overflow: 'hidden',
              border: '1px solid var(--color-outline-variant)', borderRadius: 12,
              background: 'var(--color-surface-container-lowest)',
            }}>

            {/* Terminal frame */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {wssUrl ? (
                <>
                  <AnalyticsTerminalFrame
                    wssUrl={wssUrl}
                    terminalRef={terminalRef}
                    onOutput={handleOutput}
                    onActivity={handleActivity}
                    onMcpStatusChange={handleMcpStatusChange}
                    onReplStatusChange={handleReplStatusChange}
                    onSkillWritten={handleSkillWritten}
                    onReportWritten={handleReportWritten}
                  />
                  {showReapModal && (
                    <IdleReapModal
                      countdownSeconds={REAP_COUNTDOWN_SECONDS}
                      onKeepWorking={handleKeepWorking}
                    />
                  )}
                </>
              ) : resuming ? (
                // Mount-time check for an already-live sandbox (e.g. after a page
                // refresh). Held until /session/current resolves so the Start
                // button never flashes before we know whether to auto-reconnect.
                // Copy is deliberately honest — the probe may resolve to "none".
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#1c1f1e', borderRadius: 12,
                  flexDirection: 'column', gap: 14, padding: 24, textAlign: 'center',
                }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 30, color: '#8ecf9e', animation: 'spin 1s linear infinite' }}
                  >
                    progress_activity
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(232,228,220,0.85)' }}>
                    Checking for a running sandbox…
                  </span>
                </div>
              ) : !started ? (
                // Pre-start: the sandbox is NOT provisioned yet. The user starts
                // it explicitly so we only spin a live container once they commit.
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#1c1f1e', borderRadius: 12,
                  flexDirection: 'column', gap: 14, padding: 24, textAlign: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 34, color: '#8ecf9e', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                    terminal
                  </span>
                  <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e8e4dc' }}>
                      {wasReaped ? 'Resume your analyst sandbox' : 'Start your analyst sandbox'}
                    </span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(232,228,220,0.7)' }}>
                      {wasReaped
                        ? 'The idle sandbox was shut down to free resources. Resuming restores your previous work right where you left off.'
                        : 'This spins up a live environment with Claude Code and read-only BigQuery access. It starts when you are ready to work, and stays open while you do.'}
                    </span>
                  </div>
                  <button
                    onClick={() => setStarted(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: '#8ecf9e', color: '#1c1f1e',
                      border: 'none', borderRadius: 999,
                      padding: '10px 20px', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 500" }}>
                      {wasReaped ? 'restart_alt' : 'play_arrow'}
                    </span>
                    {wasReaped ? 'Resume sandbox' : 'Start sandbox'}
                  </button>
                </div>
              ) : (
                <SandboxStartupProgress phase={provisionPhase} resuming={wasReaped} />
              )}
            </div>

            {/* Proactive idle nudges now surface through the floating Hatch
                dock (mounted as the last child of this row), not as a separate
                inline panel, so the user has one coaching surface to also ask. */}
          </div>

          {/* Floating / dockable Hatch coach — mounted as the last flex child of
              the workspace row, the same way FlowWorkspace mounts it. Closed and
              floating modes anchor bottom-right of this (relative) row; docked
              mode becomes the right column. Hatch is fully aware of the live
              Claude Code session: every turn sends the terminal tail, the active
              sub-problem, the MCP connection, and the skills written, so it can
              step in and help on demand, not just nudge on idle. */}
          <CanvasChatPanel
            attemptId={attemptId}
            challengeId={challenge.id}
            challengeType="claude_code_analytics"
            // Analytics has no canvas, but the prop is required. Empty scene;
            // all real context flows through the analytics fields below.
            scene={{ elementCount: 0, entities: [], connections: [], groups: [], freeText: [], foreignKeys: [] }}
            isOpen={hatchOpen}
            onToggle={() => setHatchOpen((v) => !v)}
            autoOpenKey="cc-analytics"
            proactiveNudge={proactiveNudge ? { id: 'idle', text: proactiveNudge } : null}
            onDismissNudge={() => setProactiveNudge(null)}
            terminalTail={terminalTail.slice(-3000)}
            artifactState={artifactSummary}
            mcpConnected={mcpConnected}
            skillsWritten={skillsWritten}
            activeSubProblemId={activeSubProblem?.id ?? null}
            activeSubProblemSequence={activeSubProblem?.sequence}
            activeSubProblemTitle={activeSubProblem?.title ?? null}
            activeSubProblemObjective={activeSubProblem?.objective ?? null}
            activeSubProblemSuccessCriterion={activeSubProblem?.successCriterion ?? null}
            markedFindings={markedFindings}
            challengeTitle={challenge.title}
            guidanceLevel={guidance}
          />
        </div>
      </div>

    </>
  )
}

// ── Sandbox startup progress ────────────────────────────────────────────────
// A determinate, multi-phase indicator for the cold-start wait. The boot is a
// pipeline (wake the warehouse DB → mint a budgeted key → boot the container →
// connect), and on a cold start it can take ~30-60s. Showing the active step
// (and that cold starts are slow) beats an opaque spinner.
const STARTUP_STEPS: { key: 'requesting' | 'waking' | 'booting' | 'connecting'; label: string }[] = [
  { key: 'requesting', label: 'Requesting your sandbox' },
  { key: 'waking', label: 'Waking the data warehouse' },
  { key: 'booting', label: 'Booting the Claude Code container' },
  { key: 'connecting', label: 'Connecting BigQuery and finishing up' },
]

function SandboxStartupProgress({
  phase,
  resuming,
}: {
  phase: 'requesting' | 'waking' | 'booting' | 'connecting' | null
  resuming?: boolean
}) {
  const activeIdx = phase ? STARTUP_STEPS.findIndex((s) => s.key === phase) : 0
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1c1f1e', borderRadius: 12,
      flexDirection: 'column', gap: 18, padding: '28px 24px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: '#e8e4dc' }}>
          {resuming ? 'Resuming your sandbox' : 'Starting your sandbox'}
        </span>
        <span style={{ fontSize: 11.5, color: 'rgba(232,228,220,0.55)' }}>
          First start of an idle period can take 30–60s. Hang tight.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {STARTUP_STEPS.map((step, i) => {
          const done = i < activeIdx
          const active = i === activeIdx
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 18, height: 18, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#8ecf9e', fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                ) : active ? (
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(142,207,158,0.25)',
                    borderTopColor: '#8ecf9e',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(232,228,220,0.22)' }} />
                )}
              </span>
              <span style={{
                fontSize: 12.5,
                color: done ? 'rgba(232,228,220,0.6)' : active ? '#e8e4dc' : 'rgba(232,228,220,0.4)',
                fontWeight: active ? 600 : 400,
              }}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
