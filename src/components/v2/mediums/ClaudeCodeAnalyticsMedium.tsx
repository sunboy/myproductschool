'use client'

import { readAnalyticsProgress, type AnalyticsProgress } from '@/lib/sandbox/analytics-progress'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ArtifactSpineStrip } from './ArtifactSpineStrip'
import { deriveArtifactRows, artifactProgress, artifactSummaryText } from './analyticsArtifact'
import { AnalyticsObjectiveCard } from './AnalyticsObjectiveCard'
import { AnalyticsTerminalFrame } from './AnalyticsTerminalFrame'
import { SuggestedPromptRail } from './SuggestedPromptRail'
import { SkillsLibraryPanel } from './SkillsLibraryPanel'
import { IdleReapModal } from './IdleReapModal'
import { MissionBrief, markMissionBriefSeen } from './MissionBrief'
import { AnalyticsSessionMirror } from './AnalyticsSessionMirror'
import { Md } from '@/components/ui/Md'
import { HatchImage } from '@/components/redesign/HatchImage'
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
import { getLabClient, labIdForChallengeType } from '@/lib/labs/client'
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
  // The lab definition: domain copy, detectors, spine, arc shape. Analytics is
  // the fallback so legacy sessions and unknown types keep original behavior.
  const lab = getLabClient(labIdForChallengeType(challenge.challenge_type))
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
  // after a browser refresh). Holds back the "Start analysis" button so it doesn't
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
    () => mergeArc(challenge.difficulty, undefined, 'guided', lab.arc),
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
  const [leftWidth, setLeftWidth] = useState(38) // percent, md and up only
  // Starts collapsed on small screens so the terminal is reachable without
  // a long scroll; auto-collapses on desktop once the session is live.
  const [briefPanel, setBriefPanel] = useState<'brief' | 'guidance' | 'findings'>('brief')
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false)
  // On small screens the brief and terminal are deliberate stages, rather than
  // two tall panels competing in one scroll. Desktop keeps both visible.
  const [mobilePanel, setMobilePanel] = useState<'brief' | 'workspace'>('brief')
  const [questionCollapsed, setQuestionCollapsed] = useState<boolean>(
    () => false,
  )
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
  const [sessionRetry, setSessionRetry] = useState(0)
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
  // True while a silent cold-start retry is in flight. Keeps the staged progress
  // card up (never resets to step 1) and swaps in a reassurance line so the user
  // never perceives a restart.
  const [retrying, setRetrying] = useState(false)

  const [activeSubProblemIdx, setActiveSubProblemIdx] = useState(0)
  const [, setCompletedIds] = useState<Set<string>>(new Set())
  const pendingMarkRef = useRef<(() => Promise<MarkVerdict>) | null>(null)
  const [checkpointPending, setCheckpointPending] = useState(false)
  const [checkpointResult, setCheckpointResult] = useState<{ stepId: string; verdict: MarkVerdict } | null>(null)
  const [progressSaveError, setProgressSaveError] = useState<string | null>(null)
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
  const [finalizationError, setFinalizationError] = useState<string | null>(null)
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

  const missionContext = [scenario?.context, scenario?.trigger, scenario?.question ? `Question: ${scenario.question}` : null].filter(Boolean).join('\n\n').slice(0, 12000)
  const activeSubProblem = subProblems[activeSubProblemIdx] ?? null

  // ── Artifact spine: the deliverable-as-progress, derived from live signals
  // (no new state). Recomputes when the arc changes, so injected adaptive
  // steps appear in the strip the moment planBranch inserts them.
  const artifactRows = useMemo(() => deriveArtifactRows({
    spine: lab.spine,
    scenarioQuestion: scenario?.question ?? null,
    mcpConnected,
    replRunning,
    markedFindings,
    reportPath,
    skillsWritten,
    dimensions,
    subProblems,
    activeStepId: activeSubProblem?.id ?? null,
  }), [lab.spine, scenario?.question, mcpConnected, replRunning, markedFindings, reportPath, skillsWritten, dimensions, subProblems, activeSubProblem?.id])
  const { done: artifactDone, total: artifactTotal } = useMemo(() => artifactProgress(artifactRows), [artifactRows])

  // Capped milestone-state string for Hatch (interpret + nudge): lets the
  // coach name the exact missing deliverable. 550 chars keeps the request
  // body comfortably inside the routes' validation caps.
  const artifactSummary = useMemo(() => artifactSummaryText(artifactRows).slice(0, 550), [artifactRows])

  // The learner can override the derived coaching register for this session.
  // Everything downstream (teaching notes, prompt density, nudge eagerness,
  // Hatch's register) reads the guidance state, so the change is immediate;
  // the adjustment is logged and persisted so it survives refresh.
  const handleRegisterChoice = useCallback((level: 'scaffolded' | 'guided' | 'open') => {
    setRegisterMenuOpen(false)
    if (level === guidance) return
    adaptiveLogRef.current.adjustments.push({
      from: guidance, to: level, trigger: 'user_choice',
      atStepId: activeSubProblem?.id ?? null,
    })
    setGuidance(level)
    if (sessionId && !USE_DEV_STUB) {
      void fetch(`/api/claude-code/session/${sessionId}/adaptive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guidance: level,
          arc: subProblems,
          injected: adaptiveLogRef.current.injected,
          adjustments: adaptiveLogRef.current.adjustments,
        }),
      }).catch(() => {})
    }
  }, [guidance, sessionId, subProblems, activeSubProblem?.id])

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

  // The brief is visible on entry; the optional walkthrough opens on request.
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
          progress?: AnalyticsProgress | null
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
                : mergeArc(challenge.difficulty, data.sub_problems, 'guided', lab.arc),
            )
          }
          if (data.guidance) setGuidance(data.guidance)
          const restored = readAnalyticsProgress({ adaptive: { progress: data.progress } })
          if (restored) {
            setMarkedFindings(restored.findings)
            const index = data.sub_problems?.findIndex(step => step.id === restored.activeStepId) ?? -1
            if (index >= 0) setActiveSubProblemIdx(index)
          }
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

    // Outcome of a single provision attempt. 'retryable' = a cold-transient
    // failure the outer loop may silently re-attempt; 'fatal' = surface an error.
    type AttemptOutcome =
      | { kind: 'connected' }
      | { kind: 'paywall' }
      | { kind: 'retryable' }
      | { kind: 'fatal'; message: string }

    // Run one start → provision → poll cycle to a terminal outcome. `isRetry`
    // keeps the staged card up (no reset to step 1) instead of showing
    // 'requesting'. `overallStart` anchors the TOTAL wait budget so this attempt's
    // poll deadline never lets total elapsed exceed TOTAL_DEADLINE_MS. Resolves
    // once the attempt reaches a terminal state.
    async function attempt(isRetry: boolean, overallStart: number): Promise<AttemptOutcome> {
      if (!isRetry) setProvisionPhase('requesting')
      const res = await fetch('/api/claude-code/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only send attempt_id when we actually have one. An empty string fails
        // the route's z.string().uuid() check (400); omitting it lets the route
        // find-or-create the attempt itself. On a retry we DO have it, so the
        // same attempt + session row is reused (the prior `failed` row is
        // replaced by start's upsert; a failed row records no usage_event, so it
        // does not consume quota — verified in check-limit.ts).
        body: JSON.stringify({
          challenge_id: challenge.id,
          ...(attemptId ? { attempt_id: attemptId } : {}),
        }),
      })

      if (res.status === 402) {
        const err = await res.json().catch(() => ({})) as { used?: number; limit?: number }
        if (!cancelled) setPaywall({ used: err.used, limit: err.limit })
        return { kind: 'paywall' }
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        return { kind: 'fatal', message: err.error ?? `Session start failed (${res.status})` }
      }

      const data = await res.json() as {
        session_id: string
        status: string
        wss_url: string | null
        progress?: AnalyticsProgress | null
        sub_problems?: AnalyticsSubProblem[]
        arc_complete?: boolean
        guidance?: 'scaffolded' | 'guided' | 'open'
      }
      if (cancelled) return { kind: 'fatal', message: '' }
      setSessionId(data.session_id)
      if (data.sub_problems?.length) {
        setSubProblems(
          data.arc_complete
            ? data.sub_problems
            : mergeArc(challenge.difficulty, data.sub_problems),
        )
      }
      if (data.guidance) setGuidance(data.guidance)
          const restored = readAnalyticsProgress({ adaptive: { progress: data.progress } })
          if (restored) {
            setMarkedFindings(restored.findings)
            const index = data.sub_problems?.findIndex(step => step.id === restored.activeStepId) ?? -1
            if (index >= 0) setActiveSubProblemIdx(index)
          }
      sessionStartRef.current = Date.now()

      // Already live (reconnect to a running container) — done.
      if (data.status === 'active' && data.wss_url) {
        setWssUrl(data.wss_url)
        setProvisionPhase(null)
        return { kind: 'connected' }
      }

      // Kick off the heavy provision request (its own 180s budget). Not awaited for
      // the UI — the poll below is the source of truth for readiness — but a 402
      // still routes to the paywall.
      let provisionRequestFailed = false
      fetch(`/api/claude-code/session/${data.session_id}/provision`, { method: 'POST' })
        .then(async (pres) => {
          if (cancelled) return
          if (pres.status === 402) {
            const err = await pres.json().catch(() => ({})) as { used?: number; limit?: number }
            setPaywall({ used: err.used, limit: err.limit })
          }
          if (!pres.ok) provisionRequestFailed = true
          // Success/active is picked up by the poll; non-OK (503/timeout) flips
          // the row to `failed`, which the poll reads and turns into an outcome.
        })
        .catch(() => { provisionRequestFailed = true })

      // Poll /state until the row goes active (connected), failed (classify by
      // failure_code), or the deadline is hit. Server provision_phase is truth;
      // the elapsed-time guess is only a fallback before the first phase lands.
      const provisionStart = Date.now()
      // This attempt polls until whichever comes first: its own per-attempt
      // ceiling, or the point where TOTAL elapsed would exceed the overall budget.
      const attemptDeadlineMs = Math.min(
        POLL_DEADLINE_MS,
        TOTAL_DEADLINE_MS - (provisionStart - overallStart),
      )
      if (!isRetry) setProvisionPhase('waking')
      return await new Promise<AttemptOutcome>((resolve) => {
        const poll = async () => {
          if (cancelled) { resolve({ kind: 'fatal', message: '' }); return }
          const elapsed = Date.now() - provisionStart
          if (elapsed > attemptDeadlineMs) {
            if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
            // Slow path. run() decides whether the TOTAL budget still allows a
            // retry; if not, it turns this into a fatal.
            resolve({ kind: 'retryable' })
            return
          }
          try {
            const sres = await fetch(`/api/claude-code/session/${data.session_id}/state`)
            if (sres.ok) {
              const sdata = await sres.json() as {
                status?: string
                wss_url?: string | null
                provision_phase?: string | null
                failure_code?: string | null
              }
              // A transport error does not prove the server stopped. Wait beyond
              // the route’s 180s execution limit before retrying a hostless row.
              if (provisionRequestFailed && sdata.status === 'provisioning' && !sdata.wss_url && elapsed >= 185000) {
                if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
                resolve({ kind: 'retryable' })
                return
              }
              // Phase: prefer server truth (monotonic via SandboxStartupProgress),
              // fall back to the elapsed-time guess before the first phase lands.
              const serverUi = sdata.provision_phase ? SERVER_PHASE_TO_UI[sdata.provision_phase] : undefined
              setProvisionPhase((cur) => {
                if (cur === null) return cur
                if (serverUi) return serverUi
                return elapsed > 22000 ? 'connecting' : elapsed > 8000 ? 'booting' : 'waking'
              })
              if (sdata.status === 'active' && sdata.wss_url) {
                if (!cancelled) { setWssUrl(sdata.wss_url); setProvisionPhase(null) }
                if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
                resolve({ kind: 'connected' })
                return
              }
              if (sdata.status === 'failed' || sdata.status === 'terminated') {
                if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
                const code = sdata.failure_code ?? ''
                resolve(
                  COLD_RETRYABLE_CODES.has(code)
                    ? { kind: 'retryable' }
                    : { kind: 'fatal', message: FAILURE_COPY },
                )
                return
              }
            }
          } catch { /* transient — keep polling */ }
        }
        // First tick immediately, then every 3s.
        void poll()
        pollTimer = setInterval(poll, 3000)
      })
    }

    async function run() {
      // Anchor the TOTAL wait budget once, so it spans every silent retry.
      const overallStart = Date.now()
      try {
        for (let tries = 0; tries <= MAX_COLD_RETRIES; tries++) {
          const isRetry = tries > 0
          if (isRetry && !cancelled) setRetrying(true)
          const outcome = await attempt(isRetry, overallStart)
          if (cancelled) return
          if (outcome.kind === 'connected' || outcome.kind === 'paywall') {
            setRetrying(false)
            return
          }
          if (outcome.kind === 'fatal') {
            setRetrying(false)
            if (outcome.message) setSessionError(outcome.message)
            return
          }
          // retryable: loop again only if BOTH budgets allow it — attempts left,
          // AND enough of the total wait window remains for another to be
          // meaningful. Otherwise this is a genuine exhaustion → fatal.
          const totalElapsed = Date.now() - overallStart
          const budgetLeft = TOTAL_DEADLINE_MS - totalElapsed
          // Require a real slice of time left (a token window would just re-fail
          // the deadline instantly). One poll interval is the floor.
          if (tries === MAX_COLD_RETRIES || budgetLeft < 3000) {
            setRetrying(false)
            setSessionError(FAILURE_COPY)
            return
          }
          // else: fall through to the next silent attempt (retrying stays true).
        }
      } catch (err) {
        if (!cancelled) { setRetrying(false); setSessionError(String(err)) }
      }
    }

    run()
    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, sessionRetry])

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
  }, [activeSubProblemIdx, terminalTail, guidance, wssUrl, replRunning])

  async function fetchNudge() {
    if (!activeSubProblem || !wssUrl || !replRunning) return
    try {
      const res = await fetch('/api/hatch/canvas/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          attemptId,
          challengeType: 'claude_code_analytics',
          problem_statement: missionContext,
          mcp_connected: mcpConnected,
          terminal_tail: terminalTail.slice(-2000),
          artifact_state: artifactSummary,
          active_sub_problem_id: activeSubProblem.id,
          active_sub_problem_title: activeSubProblem.title,
          active_sub_problem_objective: activeSubProblem.objective,
          active_sub_problem_success_criterion: activeSubProblem.successCriterion,
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
    if (!wssUrl || showMirror || finalizing || finalizationError || USE_DEV_STUB) return
    const t = setInterval(() => {
      if (Date.now() - reapActivityRef.current >= REAP_WARN_MS) {
        setShowReapModal(true)
      }
    }, 10000)
    return () => clearInterval(t)
  }, [wssUrl, showMirror, finalizing, finalizationError])

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
    if (USE_DEV_STUB || !wssUrl || !replRunning) return
    const step = subProblems[activeSubProblemIdx]
    if (!step) return
    try {
      const res = await fetch('/api/hatch/canvas/suggest-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeType: 'claude_code_analytics',
          problem_statement: missionContext,
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
  }, [activeSubProblemIdx, subProblems, challenge.id, mcpConnected, replRunning, terminalTail, guidance, artifactSummary, missionContext, wssUrl])

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
    if (USE_DEV_STUB) { setShowMirror(true); return }
    if (finalizedRef.current) return
    if (!sessionId) { setFinalizationError('Your session could not be found. Reload this page to reconnect.'); return }
    finalizedRef.current = true
    setFinalizing(true)
    setFinalizationError(null)
    setShowReapModal(false)
    try {
      const res = await fetch(`/api/claude-code/session/${sessionId}/finalize`, { method: 'POST' })
      const data = await res.json() as { error?: string; share_url?: string | null; final_artifact?: unknown }
      if (!res.ok) throw new Error(data.error || 'Your submission could not be saved. Please try again.')
      if (data.share_url) setShareUrl(data.share_url)
      const views = toDimensionViews(data.final_artifact)
      if (views) setDimensions(views)
      setShowMirror(true)
    } catch (error) {
      finalizedRef.current = false
      setFinalizationError(error instanceof Error ? error.message : 'Your submission could not be saved. Please try again.')
    } finally {
      setFinalizing(false)
    }
  }, [sessionId])

  async function handleMark(finding: string): Promise<MarkVerdict> {
    if (pendingMarkRef.current) {
      throw new Error('Save your previous finding before submitting another.')
    }
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
          problem_statement: missionContext,
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

      // Keep a failed checkpoint retryable without another model call. Persist
      // the final finding before teardown/grading can replace the artifact.
      const activeIdxInNext = nextArc.findIndex(step => step.id === activeSubProblem.id)
      const nextIdx = verdict === 'pass' || verdict === 'partial' ? (activeIdxInNext >= 0 ? activeIdxInNext : activeSubProblemIdx) + 1 : activeSubProblemIdx
      setCheckpointPending(true)
      let checkpointPromise: Promise<MarkVerdict> | null = null
      const saveCheckpoint = async (): Promise<MarkVerdict> => {
        setProgressSaveError(null)
        if (sessionId && !USE_DEV_STUB) {
          const saved = await fetch(`/api/claude-code/session/${sessionId}/adaptive`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guidance: nextGuidance, arc: nextArc, injected: log.injected, adjustments: log.adjustments, progress: { findings: allFindings, activeStepId: nextArc[Math.min(nextIdx, nextArc.length - 1)]?.id ?? null } }),
          }).catch(() => null)
          if (!saved?.ok) {
            setProgressSaveError('Your finding is still here, but could not be saved. Retry saving before continuing.')
            throw new Error('Checkpoint was not saved')
          }
        }
        pendingMarkRef.current = null
        setCheckpointPending(false)
        setMarkedFindings(allFindings)
        setCheckpointResult({ stepId: activeSubProblem.id, verdict })
        if (verdict === 'pass' || verdict === 'partial') {
          setCompletedIds(previous => new Set([...previous, activeSubProblem.id]))
          if (nextIdx < nextArc.length) setActiveSubProblemIdx(nextIdx)
          else void finalizeSession()
        }
        return verdict
      }
      pendingMarkRef.current = () => {
        if (!checkpointPromise) checkpointPromise = saveCheckpoint().finally(() => { checkpointPromise = null })
        return checkpointPromise
      }
      return await pendingMarkRef.current()

    } catch (error) {
      if (pendingMarkRef.current) throw error
      return 'retry'
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (finalizing || finalizationError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 overflow-y-auto p-6 text-center">
        <h2 className="font-headline text-2xl font-semibold text-ink-strong">{finalizing ? 'Saving your submission' : 'Submission needs another try'}</h2>
        <p role={finalizationError ? 'alert' : 'status'} className="max-w-lg text-base text-ink-secondary">{finalizationError ?? 'Preparing your feedback and saving it to your submission history.'}</p>
        {finalizationError && <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => void finalizeSession()} className="min-h-11 rounded-lg bg-forest-950 px-4 text-sm font-bold text-white">Retry submission</button>
          <a href="/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-hairline px-4 text-sm font-bold">Back to Home</a>
        </div>}
      </div>
    )
  }

  if (showMirror) {
    return (
      <AnalyticsSessionMirror
        missionQuestion={scenario?.question || challenge.title || null}
        provenAnswer={(() => {
          // The answer-kind pass/partial finding is the proven answer; else
          // fall back to the last passing finding of any step.
          const kindById = new Map(subProblems.map((sp) => [sp.id, sp.kind as string]))
          const answer = markedFindings.find(
            (f) => kindById.get(f.id) === 'answer' && (f.verdict === 'pass' || f.verdict === 'partial'),
          )
          if (answer) return answer.text
          const lastPass = [...markedFindings].reverse().find((f) => f.verdict === 'pass')
          return lastPass?.text ?? null
        })()}
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

  const sessionErrorPanel = sessionError ? (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 14, padding: 32,
      }}>
        <HatchImage size={48} state="idle" />
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
          fontFamily: 'var(--font-body)', maxWidth: 420, textAlign: 'center',
        }}>
          {sessionError}
        </div>
        <button
          onClick={() => { setSessionError(null); setStarted(true); setSessionRetry(value => value + 1) }}
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
  ) : null

  return (
    <>
      {showBrief && (
        <MissionBrief
          question={scenario?.question || challenge.title || 'Answer the business question with real data.'}
          subtitle={lab.missionBrief.subtitle}
          promises={lab.missionBrief.promises}
          readyLabel={lab.missionBrief.readyLabel}
          briefBody={[scenario?.context, scenario?.trigger].filter(Boolean).join(' ') || undefined}
          ready={mcpConnected && replRunning}
          firstPrompt={activeSubProblem?.suggestedPrompts?.[0] ?? lab.missionBrief.fallbackFirstPrompt}
          onStart={() => {
            setStarted(true)
            markMissionBriefSeen(challenge.id)
            setShowBrief(false)
          }}
          onRunFirstPrompt={() => {
            terminalRef.current?.insertText(activeSubProblem?.suggestedPrompts?.[0] ?? lab.missionBrief.fallbackFirstPrompt)
          }}
          onDismiss={() => {
            markMissionBriefSeen(challenge.id)
            setShowBrief(false)
          }}
        />
      )}

      <div className="analytics-studio" style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', minHeight: 0, overflow: 'hidden',
        background: 'var(--color-background)',
      }}>
        <header className="analytics-studio-header">
          {exitHref && <a href={exitHref} className="analytics-back" aria-label="Back to practice">←</a>}
          <div className="analytics-studio-title"><span>AI analytics</span><h1>{challenge.title || 'Your analysis'}</h1></div>
          <button type="button" className="analytics-help" onClick={() => setShowBrief(true)}>How it works</button>
          <button type="button" className="analytics-help" onClick={() => { setBriefPanel('findings'); setMobilePanel('brief') }}>{artifactDone}/{artifactTotal} complete</button>
          <span className="analytics-session-state" role="status">{wssUrl && mcpConnected && replRunning ? 'Ready to analyze' : wssUrl ? 'Connecting…' : resuming ? 'Checking session…' : started ? 'Preparing session…' : 'Ready when you are'}</span>
        </header>

        {/* Body split. position: relative so the floating Hatch bubble anchors
            to this workspace row (its closed/floating modes use `absolute
            bottom-4 right-4`), and it's a flex row so the docked panel sits as
            the right column — exactly how FlowWorkspace mounts the same panel. */}
        <div
          ref={containerRef}
          className="analytics-studio-body flex flex-col overflow-y-auto md:flex-row md:overflow-hidden"
          style={{ flex: 1, minHeight: 0, position: 'relative', gap: 8, padding: 8, background: 'var(--color-surface-container-low)', ['--cc-left-w' as string]: `${leftWidth}%` }}
        >

          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-1 md:hidden" role="tablist" aria-label="Analytics workspace stages">
            <button
              type="button"
              role="tab"
              aria-selected={mobilePanel === 'brief'}
              aria-controls="analytics-brief-panel"
              id="analytics-brief-tab"
              onClick={() => setMobilePanel('brief')}
              className={"min-h-11 flex-1 rounded-md px-3 text-sm font-semibold transition-colors " + (mobilePanel === 'brief' ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]')}
            >
              Brief
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobilePanel === 'workspace'}
              aria-controls="analytics-workspace-panel"
              id="analytics-workspace-tab"
              onClick={() => setMobilePanel('workspace')}
              className={"min-h-11 flex-1 rounded-md px-3 text-sm font-semibold transition-colors " + (mobilePanel === 'workspace' ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]')}
            >
              Workspace
            </button>
          </div>

          {/* LEFT — scenario + dataset. `minHeight: 0` + `height: 100%` are what
              let `overflowY: auto` actually engage inside the flex row: without
              them the column stretches to its content's intrinsic height, grows
              the row past the viewport, and the bottom (skills library) gets
              clipped with no scrollbar. */}
          <div
            id="analytics-brief-panel"
            role="tabpanel"
            aria-labelledby="analytics-brief-tab"
            className={(mobilePanel === 'brief' ? 'flex' : 'hidden') + " analytics-studio-brief w-full flex-col md:flex md:w-[var(--cc-left-w)] md:h-full md:min-h-0 md:overflow-y-auto"}
            style={{
              flexShrink: 0,
              border: '1px solid var(--color-outline-variant)', borderRadius: 12,
              overflowX: 'hidden', padding: '14px 14px',
              gap: 12,
              background: 'var(--color-surface-container-lowest)',
            }}>
            {progressSaveError && <div role="alert" className="analytics-empty"><p>{progressSaveError}</p><button type="button" onClick={() => { void pendingMarkRef.current?.().catch(() => {}) }}>Retry saving</button></div>}
            <nav className="analytics-panel-nav" aria-label="Analysis reference">
              {(['brief', 'guidance', 'findings'] as const).map(panel => <button type="button" key={panel} aria-pressed={briefPanel === panel} onClick={() => setBriefPanel(panel)}>{panel === 'brief' ? 'The brief' : panel === 'guidance' ? 'Guidance' : 'Findings'}</button>)}
            </nav>
            <section className="analytics-panel-content" hidden={briefPanel !== 'brief'}>
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
                  <Md className="text-base leading-relaxed">{scenario.context}</Md>
                )}
                {!questionCollapsed && scenario.trigger && (
                  <Md className="text-base leading-relaxed">{scenario.trigger}</Md>
                )}
                {scenario.question && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--color-surface-container-high)',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: 'var(--color-on-surface-variant)',
                      marginBottom: 4,
                    }}>
                      The question
                    </div>
                    <Md className="text-base font-semibold leading-relaxed">{scenario.question}</Md>
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
                {lab.resourceBadge.icon}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                {lab.resourceBadge.label}
              </span>
            </div>


            <button type="button" className="analytics-continue" onClick={() => { setBriefPanel('guidance'); setMobilePanel('workspace') }}>Continue to your analysis <span aria-hidden="true">→</span></button>
            </section>
            <section className="analytics-panel-content" hidden={briefPanel !== 'guidance'}>
            {/* Coaching register — how Hatch coaches this session (F3). Derived
                from the learner's track record, adjustable per session. Product
                language only; the internal level never surfaces. */}
            <div style={{ position: 'relative', alignSelf: 'flex-start' }}>
              <button
                onClick={() => setRegisterMenuOpen((v) => !v)}
                aria-expanded={registerMenuOpen}
                aria-haspopup="menu"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'var(--color-surface-container)',
                  border: '1px solid var(--color-outline-variant)',
                  borderRadius: 999,
                  padding: '3px 6px 3px 10px',
                  cursor: 'pointer', fontFamily: 'inherit',
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
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-on-surface-variant)' }}>
                  arrow_drop_down
                </span>
              </button>
              {registerMenuOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 30,
                    width: 280,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 12,
                    boxShadow: '0 12px 32px -8px rgba(30,27,20,0.18)',
                    padding: 6,
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}
                >
                  <div style={{
                    fontSize: 10.5, lineHeight: 1.5, color: 'var(--color-on-surface-variant)',
                    padding: '6px 8px 8px', borderBottom: '1px solid var(--color-outline-variant)',
                    marginBottom: 2,
                  }}>
                    How Hatch coaches this session. Set from your track record, yours to change.
                  </div>
                  {(['scaffolded', 'guided', 'open'] as const).map((level) => (
                    <button
                      key={level}
                      role="menuitemradio"
                      aria-checked={guidance === level}
                      onClick={() => handleRegisterChoice(level)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        textAlign: 'left', width: '100%',
                        background: guidance === level ? 'var(--color-primary-fixed)' : 'transparent',
                        border: 'none', borderRadius: 8,
                        padding: '7px 8px', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 15, marginTop: 1, flexShrink: 0,
                          color: guidance === level ? 'var(--color-primary)' : 'var(--color-outline)',
                          fontVariationSettings: `'FILL' ${guidance === level ? 1 : 0}, 'wght' 500`,
                        }}
                      >
                        {guidance === level ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                          {REGISTER_LABELS[level]}
                        </span>
                        <span style={{ fontSize: 10.5, lineHeight: 1.45, color: 'var(--color-on-surface-variant)' }}>
                          {REGISTER_TOOLTIPS[level]}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Objective card */}
            {activeSubProblem && (
              <AnalyticsObjectiveCard
                key={activeSubProblem.id}
                savedVerdict={checkpointResult?.stepId === activeSubProblem.id ? checkpointResult.verdict : null}
                subProblem={activeSubProblem}
                stepIdx={activeSubProblemIdx}
                totalSteps={subProblems.length}
                mcpConnected={mcpConnected}
                replRunning={replRunning}
                skillsWritten={skillsWritten}
                hideTeachingNote={guidance === 'open'}
                reportWritten={!!reportPath}
                onMark={handleMark}
                checkpointPending={checkpointPending}
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
                  disabled={!wssUrl}
                  onInsert={() => setMobilePanel('workspace')}
                />
              ) : null
            })()}

            {/* Skills library — browse + reload skills built across past sessions. */}
            <SkillsLibraryPanel
              terminalRef={terminalRef}
              sessionSkills={skillsWritten}
              replRunning={replRunning}
              onLoaded={handleSkillWritten}
            />
            </section>
            <section className="analytics-panel-content analytics-findings" hidden={briefPanel !== 'findings'}>
              <h2>Your findings</h2>
              <p>Review the evidence you have submitted as your analysis develops.</p>
              <ArtifactSpineStrip rows={artifactRows} done={artifactDone} total={artifactTotal} />
              {markedFindings.length ? <ol>{markedFindings.map((finding, index) => <li key={finding.id + ':' + index}><span>Finding {index + 1}</span><p>{finding.text}</p><small>{finding.verdict === 'retry' ? 'Needs another look' : 'Reviewed by Hatch'}</small></li>)}</ol> : <div className="analytics-empty">No findings submitted yet. Use Guidance to work through the question and share your evidence with Hatch.</div>}
              <button type="button" className="analytics-continue" onClick={() => setBriefPanel('guidance')}>Back to guidance</button>
            </section>
          </div>

          {/* Drag divider — desktop only (mobile stacks) */}
          {/* A focusable separator supports the same resize action by keyboard. */}
          {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- Keyboard-operable resize separator. */}
          <div
            onMouseDown={handleLeftDividerMouseDown}
            tabIndex={0}
            aria-valuemin={20}
            aria-valuemax={50}
            aria-valuenow={Math.round(leftWidth)}
            onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setLeftWidth(width => Math.max(20, Math.min(50, width + (event.key === 'ArrowLeft' ? -2 : 2)))) } }}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize mission panel and terminal"
            className="hidden md:flex"
            style={{ width: 8, margin: '0 -8px', cursor: 'col-resize', flexShrink: 0, zIndex: 5, alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: 4, height: 36, borderRadius: 999, background: 'var(--color-outline-variant)' }} />
          </div>
          {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}

          {/* RIGHT — live session. overflow:hidden, NOT auto: the terminal is
              the only element allowed to scroll (xterm scrolls internally).
              An auto column here created a second scrollbar around the
              terminal and let sibling cards jitter its height. */}
          <div
            id="analytics-workspace-panel"
            role="tabpanel"
            aria-labelledby="analytics-workspace-tab"
            className={(mobilePanel === 'workspace' ? 'flex' : 'hidden') + " analytics-work-surface min-h-[360px] flex-col md:flex md:min-h-0"}
            style={{
              flex: 1, minWidth: 0,
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
                    mcpNamePattern={lab.detectors.mcpName ?? undefined}
                    reportPathPattern={lab.detectors.reportPathPattern}
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
              ) : sessionError ? sessionErrorPanel : resuming ? (
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
                    Checking for your previous session…
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
                      {wasReaped ? 'Continue your analysis' : 'Explore the data with Claude Code'}
                    </span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(232,228,220,0.7)' }}>
                      {wasReaped
                        ? 'The idle sandbox was shut down to free resources. Resuming restores your previous work right where you left off.'
                        : 'Use Claude Code to explore the dataset, test a hypothesis, and build an evidence-backed answer. Your session starts only when you choose.'}
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
                    {wasReaped ? 'Resume analysis' : 'Start sandbox'}
                  </button>
                </div>
              ) : (
                <SandboxStartupProgress phase={provisionPhase} resuming={wasReaped} retrying={retrying} stepLabels={lab.startup.steps} />
              )}
            </div>

            {/* Session status bar — telemetry lives with the work surface, not
                the mission panel: connection dots, skills count, compact spend
                with the budget color banding. Only once a session exists. */}
            {(started || wssUrl) && (
              <div style={{
                flexShrink: 0, height: 26, marginTop: 8,
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '0 4px',
                fontFamily: 'var(--font-label)',
              }}>
                {lab.detectors.mcpChipLabel && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: 99,
                      background: mcpConnected ? 'var(--color-primary)' : 'var(--color-outline)',
                      boxShadow: mcpConnected ? '0 0 0 2px rgba(74,124,89,0.2)' : 'none',
                    }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: mcpConnected ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)' }}>
                      {lab.detectors.mcpChipLabel}
                    </span>
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: 99,
                    background: replRunning ? 'var(--color-primary)' : 'var(--color-outline)',
                    boxShadow: replRunning ? '0 0 0 2px rgba(74,124,89,0.2)' : 'none',
                  }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: replRunning ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)' }}>
                    Claude
                  </span>
                </span>
                {skillsWritten.length > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10.5, fontWeight: 700, color: 'var(--color-tertiary)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>construction</span>
                    {skillsWritten.length} skill{skillsWritten.length === 1 ? '' : 's'}
                  </span>
                )}
                {usage && usage.budget_usd > 0 && (() => {
                  const ratio = Math.min(usage.spent_usd / usage.budget_usd, 1)
                  const fill = ratio >= 0.85 ? 'var(--color-error)' : ratio >= 0.6 ? 'var(--color-tertiary)' : 'var(--color-primary)'
                  return (
                    <span
                      title={`AI usage: $${usage.spent_usd.toFixed(2)} of $${usage.budget_usd.toFixed(2)} · ${usage.input_tokens.toLocaleString()} in / ${usage.output_tokens.toLocaleString()} out tokens`}
                      style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: fill, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      <span style={{ width: 56, height: 4, borderRadius: 99, background: 'var(--color-surface-container-highest)', overflow: 'hidden' }}>
                        <span style={{ display: 'block', width: `${Math.round(ratio * 100)}%`, height: '100%', background: fill, transition: 'width 600ms' }} />
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-on-surface-variant)', fontVariantNumeric: 'tabular-nums' }}>
                        ${usage.spent_usd.toFixed(2)}
                      </span>
                    </span>
                  )
                })()}
              </div>
            )}

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
            // Lab-aware: the debugging lab gets its own Hatch intro, suggestion
            // prompts, and pill copy in CanvasChatPanel (repo + failing tests,
            // not dataset connection). Analytics keeps its original copy.
            challengeType={lab.id === 'debugging' ? 'claude_code_debugging' : 'claude_code_analytics'}
            // Analytics has no canvas, but the prop is required. Empty scene;
            // all real context flows through the analytics fields below.
            scene={{ elementCount: 0, entities: [], connections: [], groups: [], freeText: [], foreignKeys: [] }}
            isOpen={hatchOpen}
            onToggle={() => setHatchOpen((v) => !v)}
            autoOpenKey={undefined}
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
            problemStatement={missionContext}
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
const STARTUP_KEYS = ['requesting', 'waking', 'booting', 'connecting'] as const

// Server provision_phase → the client's 4-step UI key. The server phase is truth;
// the elapsed-time guess (below) is only a fallback before the first /state poll.
const SERVER_PHASE_TO_UI: Record<string, 'waking' | 'booting' | 'connecting'> = {
  waking_database: 'waking',
  starting_gateway: 'booting',
  booting_sandbox: 'booting',
  ready: 'connecting',
}

// Only a warehouse wake timeout is safe to retry automatically. A gateway key
// failure can mean broken configuration, not a cold start; surface it promptly
// instead of creating several sessions and repeating costly startup work.
// readiness_timeout and create_session are NOT retried here (the /state poll
// already carries readiness across polls; a true readiness failure is a
// different problem worth surfacing).
const COLD_RETRYABLE_CODES = new Set(['sql_wake_timeout'])

// Max silent cold-start retries before surfacing a real failure.
const MAX_COLD_RETRIES = 1

// Per-attempt poll ceiling. Must exceed the real cold path (SQL wake up to ~40s +
// gateway cold mint + revision boot up to ~40s). Widened from 150s so a genuinely
// slow first attempt isn't cut short before the container is Ready.
const POLL_DEADLINE_MS = 210_000

// TOTAL wait budget across ALL attempts (including silent retries). Caps the
// worst case: without this, N retries each hitting the per-attempt deadline could
// spin ~3 × 210s ≈ 10.5 min. Realistic cold failures return fast (a 503 flips the
// row to `failed` in seconds), so retries stay cheap and this ceiling only bites
// the pathological hang path — where we'd rather surface a failure than spin.
const TOTAL_DEADLINE_MS = 240_000

// Shown only when the cold-start retries are genuinely exhausted. Honest and
// actionable; progress is autosaved so a later retry resumes where they left off.
const FAILURE_COPY = 'Your analytics session could not connect. Your saved work is safe. You can retry or return to practice.'

function SandboxStartupProgress({
  phase,
  resuming,
  retrying,
  stepLabels,
}: {
  phase: 'requesting' | 'waking' | 'booting' | 'connecting' | null
  resuming?: boolean
  retrying?: boolean
  stepLabels: readonly [string, string, string, string]
}) {
  const STARTUP_STEPS = STARTUP_KEYS.map((key, i) => ({ key, label: stepLabels[i] }))
  const rawIdx = phase ? STARTUP_STEPS.findIndex((s) => s.key === phase) : 0
  // Never step backward: a silent retry restarts the server phases, but the user
  // should not see the row collapse to step 1. Track the furthest step reached in
  // state and advance it monotonically from an effect (never mutate during render).
  const [activeIdx, setActiveIdx] = useState(0)
  useEffect(() => {
    setActiveIdx((cur) => (rawIdx > cur ? rawIdx : cur))
  }, [rawIdx])
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
          {retrying
            ? 'Setup is taking longer than usual. We are still checking the connection.'
            : 'A cold start can take a few minutes. You can keep reading the brief while it connects.'}
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
