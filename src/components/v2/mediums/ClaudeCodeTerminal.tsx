'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import type { ClaudeCodeTerminalProps, ClaudeCodeTerminalHandle } from './types'
// xterm's required stylesheet. Without it the renderer can't size correctly and
// the off-screen accessibility helper (the screen-reader probe text) renders
// VISIBLY as rows of W/K/$ characters instead of being clipped. Import once.
import 'xterm/css/xterm.css'

// xterm@5.3.0 is installed (not @xterm/xterm)
// Dynamically imported to avoid SSR issues

// Detect a successful BigQuery MCP registration in the terminal output. The
// `claude mcp add bigquery -- bq-mcp` command prints "Added stdio MCP server
// bigquery ..."; `claude mcp list` shows "bigquery: ... ✓ Connected". Match any
// of these so the connection strip flips to Connected and step 1 auto-advances.
// Default = the analytics lab's BigQuery MCP. Labs override via the
// mcpNamePattern prop (a name fragment substituted into this template).
function mcpConnectedRe(mcpName: string): RegExp {
  const n = mcpName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(
    `added\\s+(?:stdio\\s+)?mcp\\s+server\\s+${n}|${n}.*(?:✓|connected|ready)|mcp.*${n}.*✓|MCP.*connected`,
    'i',
  )
}
const MCP_CONNECTED_RE = mcpConnectedRe('bigquery')
// Detect that the `claude` REPL has launched. On start the CLI prints a version
// banner ("Claude Code v2.1.x") and an `❯` input prompt with "accept edits on".
// Matching the version banner is the most stable signal across CLI versions.
const CLAUDE_REPL_RE = /Claude\s+Code\s+v\d|accept edits on|❯\s/i
// Detect a skill file landing under ~/.claude/skills/. Claude's TUI phrases a write
// many ways depending on the tool + CLI version: "Wrote", "Created", "Updated",
// "File created/modified", the diff-style "● Write(...)/Update(...)" tool-call lines,
// or a bare `cat > ...`/`tee ...` shell redirect. The path is often the ABSOLUTE
// /home/analyst/.claude/skills/... and may be ANSI-colored. We require a WRITE-VERB
// context immediately before the path (within ~24 chars) so we don't false-positive
// on Claude merely *mentioning* a skill path in conversational prose before any file
// exists. A global, case-insensitive match collects every write in the scanned text;
// group 1 is the file segment after skills/. The SkillsLibraryPanel store fetch is the
// authoritative backstop — this is the no-refresh fast path.
// A write-COMPLETION signal, then the skills path on the SAME line. We key only on
// COMPLETED-action verbs (wrote/created/updated/modified/written), the
// parenthesis-anchored tool-call forms (Write(/Update(), and shell redirects
// (cat >/tee/>>). Bare imperatives (write/update/creating) are EXCLUDED — they
// false-positive on instructional prose ("Please write .claude/skills/x next.").
// Between the verb and the path we allow up to 80 chars on the SAME line, but the gap
// may NOT cross a sentence boundary — the `(?![.!?]\s)` negative lookahead stops it at
// ". " / "! " / "? ". That's exactly what separates Claude Code's real Write-tool
// result, "⎿  Wrote 21 lines to /home/analyst/.claude/skills/foo/SKILL.md" (no sentence
// break), from prose that merely mentions a path after a past-tense verb in an earlier
// sentence ("Earlier I wrote some notes. To view ... .claude/skills/bar/SKILL.md").
// Combined with the COMPLETED-action-only verb list (no bare imperatives), this matches
// real writes — "Wrote N lines to <abs>", "File created: <abs>", "● Write(<abs>)",
// "cat > <abs>" — with no known conversational false positive. The SkillsLibraryPanel
// store fetch is the authoritative layer; this is the no-refresh fast path. group 1 =
// the segment after skills/.
const SKILL_PATH_RE =
  /(?:wrote|created|updated|modified|written|Write\(|Update\(|tee|cat\s*>|>>?)(?:(?![.!?]\s)[^\n]){0,80}\.claude\/skills\/([A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\.md)/gi
// A report artifact landing in the workspace (e.g. "Wrote /workspace/report.md").
const REPORT_WRITTEN_RE = /Wrote?\s+(\/workspace\/[^\s]*report[^\s]*\.md)/i
function reportWrittenRe(pattern?: string): RegExp {
  if (!pattern) return REPORT_WRITTEN_RE
  try { return new RegExp(`Wrote?\\s+(${pattern})`, 'i') } catch { return REPORT_WRITTEN_RE }
}

const TAIL_MAX_BYTES = 4000

// The container PTY bridge spawns the shell LAZILY on the first resize message
// (it waits for real terminal dimensions so the banner paints at the right
// width). The client MUST send this on open, or no shell is ever spawned and
// the terminal stays blank. Protocol: `\x1b[?resize=` + JSON {cols, rows}.
// Mirrors RESIZE_PREFIX in infra/claude-code-sandbox/entrypoint-pty.js.
const RESIZE_PREFIX = '\x1b[?resize='

export const ClaudeCodeTerminal = forwardRef<ClaudeCodeTerminalHandle, ClaudeCodeTerminalProps>(
  function ClaudeCodeTerminal(
    { wssUrl, onOutput, onActivity, onMcpStatusChange, onReplStatusChange, onSkillWritten, onReportWritten, mcpNamePattern, reportPathPattern },
    ref
  ) {
    // Latch so we only emit the REPL-running signal once per launch.
    const replSignalledRef = useRef(false)
    // Latch the MCP-connected signal so the connect line lingering in the rolling
    // tail doesn't re-fire every frame. (Reset on WS close — see ws.onclose.)
    const mcpSignalledRef = useRef(false)
    // Skills + report paths already reported via the terminal-scan fast path, so a
    // path that stays on screen (or re-prints) doesn't re-fire its callback every
    // frame — while a genuinely NEW path still fires (dedup by value, not a latch).
    const seenSkillsRef = useRef<Set<string>>(new Set())
    const seenReportsRef = useRef<Set<string>>(new Set())
    const containerRef = useRef<HTMLDivElement>(null)
    const termRef = useRef<import('xterm').Terminal | null>(null)
    const wsRef = useRef<WebSocket | null>(null)
    // A prompt may be selected while the mobile terminal is hidden or connecting.
    // Keep the most recent selection until the PTY has actually produced output.
    const pendingInsertRef = useRef<string | null>(null)
    const shellReadyRef = useRef(false)
    const tailRef = useRef<string>('')
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const mountedRef = useRef(true)
    const fitRef = useRef<() => void>(() => {})
    // Incoming PTY data that arrived before xterm's renderer finished measuring.
    // Writing before the renderer has dimensions makes xterm's Viewport refresh
    // throw "reading 'dimensions'" (async, so a try/catch on write() can't catch
    // it) and leaks measurement probes ($$$$) into the display. Buffer until the
    // renderer is ready, then flush in order.
    const renderReadyRef = useRef(false)
    const writeBufferRef = useRef<string[]>([])
    const safeWriteRef = useRef<(text: string) => void>(() => {})
    // True once a WS has successfully opened at least once. A drop after a
    // successful open is a real reconnect (Cloud Run 60-min cap, network blip).
    // A connect that NEVER opened means the instance isn't serving yet — retry
    // with backoff instead of a tight 3s loop so we don't hammer the lone
    // concurrency-limited instance into a "no available instance" storm.
    const everOpenedRef = useRef(false)
    const connectAttemptsRef = useRef(0)
    // Send the current terminal size to the PTY using the resize protocol.
    // This is what triggers the lazy shell spawn in the container.
    const sendResizeRef = useRef<() => void>(() => {
      const term = termRef.current
      const ws = wsRef.current
      if (!term || ws?.readyState !== WebSocket.OPEN) return
      const payload = RESIZE_PREFIX + JSON.stringify({ cols: term.cols, rows: term.rows })
      try { ws.send(payload) } catch { /* socket not ready — ignore */ }
    })
    const [handshaking, setHandshaking] = useState(true)
    const [wsError, setWsError] = useState<string | null>(null)

    // Expose imperative handle to parent
    useImperativeHandle(ref, () => ({
      insertText(text: string) {
        if (wsRef.current?.readyState === WebSocket.OPEN && shellReadyRef.current) {
          wsRef.current.send(text)
        } else {
          pendingInsertRef.current = text
        }
      },
      focus() {
        termRef.current?.focus()
      },
    }))

    useEffect(() => {
      mountedRef.current = true
      // Per-effect-run cancellation flag. React 18/19 StrictMode mounts the
      // effect, runs its cleanup, then mounts AGAIN in dev. xterm 5.x's
      // Viewport schedules a refresh via requestAnimationFrame but does NOT
      // cancel that frame on dispose() — so if the first (doomed) instance has
      // already called term.open() and queued a Viewport rAF, disposing it
      // leaves that frame to fire afterward. The frame's _innerRefresh reads
      // `_renderService.dimensions`, whose backing `_renderer.value` was
      // cleared by dispose → "Cannot read properties of undefined (reading
      // 'dimensions')" (it throws once per queued frame, hence the pair of
      // errors). A shared ref can't distinguish runs, so each run gets its own
      // `cancelled` closure: the first run's cleanup flips ITS flag before the
      // async init reaches open(), so only the surviving instance ever opens
      // and no rAF outlives a dispose.
      let cancelled = false
      let term: import('xterm').Terminal
      let fitAddon: import('xterm-addon-fit').FitAddon

      // Wait until the container has a real, nonzero size before opening xterm.
      // Opening (or fitting) xterm on a 0×0 element makes its renderer leave
      // `_renderService.dimensions` undefined; the next refresh then throws
      // "Cannot read properties of undefined (reading 'dimensions')" and the
      // display renders garbage (the W/] measurement probes leak as text).
      function waitForSize(el: HTMLElement): Promise<void> {
        return new Promise((resolve) => {
          if (el.clientWidth > 0 && el.clientHeight > 0) return resolve()
          const obs = new ResizeObserver(() => {
            if (el.clientWidth > 0 && el.clientHeight > 0) {
              obs.disconnect()
              resolve()
            }
          })
          obs.observe(el)
          // Safety net: resolve after 3s even if the observer never fires.
          setTimeout(() => { obs.disconnect(); resolve() }, 3000)
        })
      }

      // xterm measures a single cell from the configured font the moment
      // `term.open()` runs. If that font ("JetBrains Mono") hasn't loaded yet,
      // the first measure uses the fallback metrics, then the real font load
      // fires a SECOND char-size change + render-service refresh on a later
      // tick. That second async refresh is exactly the window where the
      // RenderService's renderer (`_renderer.value`) / `dimensions` can be read
      // while transiently undefined — the "Cannot read properties of undefined
      // (reading 'dimensions')" throw. Waiting for fonts to settle before open
      // makes the in-open measure final, so the renderer + dimensions are
      // established synchronously within a single open() pass.
      function waitForFonts(): Promise<void> {
        return new Promise((resolve) => {
          const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
          if (!fonts || typeof fonts.ready?.then !== 'function') return resolve()
          let settled = false
          const done = () => { if (!settled) { settled = true; resolve() } }
          fonts.ready.then(done).catch(done)
          // Safety net: never block open longer than 2s on a font that stalls.
          setTimeout(done, 2000)
        })
      }

      async function initTerminal() {
        if (cancelled || !containerRef.current || !mountedRef.current) return

        const { Terminal } = await import('xterm')
        const { FitAddon } = await import('xterm-addon-fit')
        if (cancelled || !mountedRef.current) return

        // Gate xterm.open() on a measurable container AND a settled font so the
        // in-open char measure is final (no second async re-measure that races
        // the renderer attach — see waitForFonts).
        await waitForSize(containerRef.current)
        if (cancelled || !containerRef.current || !mountedRef.current) return
        await waitForFonts()
        if (cancelled || !containerRef.current || !mountedRef.current) return

        term = new Terminal({
          theme: {
            background: '#1c1f1e',
            foreground: '#e8e4dc',
            cursor: '#8ecf9e',
            selectionBackground: '#4a7c5944',
          },
          fontFamily: '"JetBrains Mono", "Fira Mono", monospace',
          fontSize: 13,
          lineHeight: 1.45,
          // cursorBlink schedules an internal Viewport refresh on a timer the
          // moment the terminal opens — before the renderer has measured the
          // container, that refresh reads `_renderService.dimensions` while it's
          // still undefined and throws. Start with blink OFF and enable it only
          // after the first successful fit (below), once dimensions exist.
          cursorBlink: false,
          scrollback: 2000,
          allowProposedApi: true,
        })

        fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(containerRef.current!)
        termRef.current = term

        // The crash ("Cannot read properties of undefined (reading
        // 'dimensions')" inside Viewport._innerRefresh) happens when ANY
        // resize/refresh runs before xterm's renderer has measured a cell. The
        // addon itself exposes the only reliable readiness signal:
        // `proposeDimensions()` returns `undefined` the moment
        // `_renderService.dimensions.css.cell.width/height` is 0 (see
        // xterm-addon-fit source). So instead of calling `fitAddon.fit()`
        // (which internally calls resize() and can trip the async refresh) or
        // poking `_core` internals, we gate on a DEFINED propose result with
        // finite cols/rows. Until that's true, no fit/resize runs at all and
        // incoming PTY data stays buffered.
        const proposeReady = (): { cols: number; rows: number } | null => {
          try {
            const dims = fitAddon.proposeDimensions()
            if (
              dims &&
              Number.isFinite(dims.cols) &&
              Number.isFinite(dims.rows) &&
              dims.cols > 0 &&
              dims.rows > 0
            ) {
              return dims
            }
          } catch {
            /* renderer not measured yet — ignore */
          }
          return null
        }

        const flushBuffer = () => {
          if (!writeBufferRef.current.length) return
          const pending = writeBufferRef.current.join('')
          writeBufferRef.current = []
          try { term.write(pending) } catch { /* ignore */ }
        }

        // Write through the readiness gate: buffer until the renderer is ready,
        // then flush. Once ready, write straight through.
        safeWriteRef.current = (text: string) => {
          if (renderReadyRef.current) {
            try { term.write(text) } catch { /* ignore */ }
            return
          }
          writeBufferRef.current.push(text)
        }

        let firstFitDone = false
        const safeFit = () => {
          if (cancelled) return
          const el = containerRef.current
          if (!el || el.clientWidth === 0 || el.clientHeight === 0) return
          // Gate on the addon's own readiness signal. If the renderer hasn't
          // measured a cell yet, proposeDimensions() is undefined — do NOT call
          // fit()/resize() (that's what throws + leaks $$$$ probes). Bail and
          // let the rAF pump retry on a later frame.
          const dims = proposeReady()
          if (!dims) return
          // Renderer is measured: a fit/resize is now safe.
          try { fitAddon.fit() } catch { /* defensive — ignore */ }
          // First successful real fit: mark ready, enable cursor blink (its
          // refresh timer reads dimensions, now defined), and flush any buffered
          // PTY data in order.
          if (!renderReadyRef.current) {
            renderReadyRef.current = true
            if (!firstFitDone && term) {
              firstFitDone = true
              try { term.options.cursorBlink = true } catch { /* ignore */ }
            }
            flushBuffer()
          }
          // Tell the container PTY the current size so it can spawn/resize.
          sendResizeRef.current()
        }
        // Expose the fit so the WS open handler can re-fit + send dimensions
        // once the socket is live (the open may land before/after the first fit).
        fitRef.current = safeFit
        // Fit now (container is known-nonzero from waitForSize), then keep
        // retrying on frames until the async renderer measure completes and we
        // flip renderReady (flushing any banner that arrived first).
        safeFit()
        let readyTries = 0
        const pumpReady = () => {
          // Keep retrying until the renderer reports a measured cell via
          // proposeDimensions() (safeFit flips renderReady). Cap generously
          // (~600 frames ≈ 10s) to cover slow cold-start layout; the
          // ResizeObserver below is the backstop if the cap is ever hit.
          if (cancelled || renderReadyRef.current || !mountedRef.current || readyTries++ > 600) return
          safeFit()
          requestAnimationFrame(pumpReady)
        }
        requestAnimationFrame(pumpReady)

        const ro = new ResizeObserver(() => safeFit())
        ro.observe(containerRef.current!)

        // onData is the canonical xterm input event: it covers typed
        // characters, pasted text, and control sequences. We must NOT also
        // forward onKey — both fire for a single keystroke, so sending from
        // both doubled every character to the PTY (each char appeared twice).
        term.onData((data) => {
          onActivity?.()
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data)
          }
        })

        connectWS()

        return () => {
          ro.disconnect()
          term.dispose()
        }
      }

      const cleanup = initTerminal()

      return () => {
        // Flip the per-run flag FIRST and synchronously. If this run's async
        // init hasn't reached term.open() yet (the common StrictMode case for
        // the first, doomed mount), it now bails before opening — so no xterm
        // Viewport rAF is ever scheduled for an instance that's about to be
        // disposed, which is what was throwing the "dimensions" TypeError.
        cancelled = true
        mountedRef.current = false
        cleanup.then(fn => fn?.())
        wsRef.current?.close()
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function connectWS() {
      if (!mountedRef.current) return
      shellReadyRef.current = false
      setWsError(null)

      try {
        const ws = new WebSocket(wssUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (!mountedRef.current) return
          everOpenedRef.current = true
          connectAttemptsRef.current = 0
          setHandshaking(false)
          setWsError(null)
          termRef.current?.focus()
          // Re-fit + send dimensions now that the socket is live. The PTY
          // bridge spawns the shell lazily on the first resize message, so
          // without this the terminal connects but never produces a prompt.
          fitRef.current()
          sendResizeRef.current()
        }

        ws.onmessage = (event) => {
          if (!mountedRef.current) return
          const text = typeof event.data === 'string' ? event.data : ''
          if (!text) return

          shellReadyRef.current = true
          if (pendingInsertRef.current !== null && ws.readyState === WebSocket.OPEN) {
            ws.send(pendingInsertRef.current)
            pendingInsertRef.current = null
            termRef.current?.focus()
          }

          onActivity?.()
          // Route through the readiness gate: if xterm's renderer hasn't measured
          // yet, this buffers the data and flushes it once dimensions exist. This
          // is what prevents the async Viewport-refresh "dimensions" throw + the
          // $$$$ probe-leak that a plain write()+try/catch can't catch.
          safeWriteRef.current(text)

          // Rolling tail (~4KB)
          tailRef.current = (tailRef.current + text).slice(-TAIL_MAX_BYTES)
          onOutput?.(tailRef.current)

          // ANSI-stripped rolling tail. EVERY status detector scans this (not the
          // raw chunk) so a signal split across WS frames or wrapped/colored by the
          // TUI is still matched. The `claude mcp list` "✓ Connected" line and the
          // skill/report write lines are all ANSI-colored, so stripping is required.
          const scan = tailRef.current.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')

          // Detect MCP connection. Latch once — the "Added stdio MCP server bigquery"
          // / "bigquery ✓ Connected" line stays in the tail and we only need to flip
          // the strip to Connected one time.
          if (!mcpSignalledRef.current && mcpConnectedRe(mcpNamePattern ?? 'bigquery').test(scan)) {
            mcpSignalledRef.current = true
            onMcpStatusChange?.(true)
          }

          // Detect the `claude` REPL launching. Latch so we signal once per launch.
          if (!replSignalledRef.current && CLAUDE_REPL_RE.test(scan)) {
            replSignalledRef.current = true
            onReplStatusChange?.(true)
          }

          // Detect skill file writes. The global regex finds every
          // .claude/skills/<...>.md occurrence; we emit each unique one once.
          // (The SkillsLibraryPanel's /api/claude-code/skills re-fetch is the
          // authoritative source — this is just the no-refresh fast path.)
          SKILL_PATH_RE.lastIndex = 0
          let m: RegExpExecArray | null
          while ((m = SKILL_PATH_RE.exec(scan)) !== null) {
            const rel = m[1] // e.g. "funnel-dropoff/SKILL.md" or "foo.md"
            if (!seenSkillsRef.current.has(rel)) {
              seenSkillsRef.current.add(rel)
              onSkillWritten?.(rel)
            }
          }

          // Detect a report artifact written to the workspace. Dedup per PATH (not
          // a one-shot latch) so the same path lingering in the tail doesn't re-fire
          // every frame, while a genuinely new report path later in the session
          // (e.g. the user re-runs the report step) still fires.
          const reportMatch = reportWrittenRe(reportPathPattern).exec(scan)
          if (reportMatch?.[1] && !seenReportsRef.current.has(reportMatch[1])) {
            seenReportsRef.current.add(reportMatch[1])
            onReportWritten?.(reportMatch[1])
          }
        }

        ws.onerror = () => {
          if (!mountedRef.current) return
          // Don't flash the error panel on a transient connect failure — the
          // onclose handler immediately schedules a backoff reconnect and keeps
          // the spinner up. Only surface a hard error if we never connect.
          if (everOpenedRef.current || connectAttemptsRef.current < 5) return
          setWsError('Connection error')
        }

        ws.onclose = (ev) => {
          if (!mountedRef.current) return
          onMcpStatusChange?.(false)
          // Reset the MCP latch so the replayed scrollback after a reconnect
          // (e.g. a refresh reattaching to the live PTY) re-detects the
          // "Connected" line and flips the strip back, instead of staying Waiting.
          // Clear the rolling tail in lockstep: otherwise the first post-reconnect
          // chunk would scan stale PRE-close text and re-fire MCP-connected from a
          // line that's no longer true (e.g. the MCP was removed). The replayed
          // scrollback rebuilds the tail, so real signals are re-detected cleanly.
          mcpSignalledRef.current = false
          tailRef.current = ''

          // Clean close — nothing to do.
          if (ev.code === 1000 || ev.code === 1001) {
            setHandshaking(false)
            termRef.current?.writeln('\r\n\x1b[90m[Session closed]\x1b[0m')
            return
          }

          // Reconnect. If we never opened, the instance is still coming up —
          // back off (3s, 6s, 9s, capped 12s) so the lone instance is not
          // hammered. After a successful open, reconnect promptly (60-min cap).
          connectAttemptsRef.current += 1
          const delay = everOpenedRef.current
            ? 2000
            : Math.min(3000 * connectAttemptsRef.current, 12000)
          const secs = Math.round(delay / 1000)
          // Keep the spinner up while we wait, instead of flashing the error.
          setHandshaking(true)
          termRef.current?.writeln(`\r\n\x1b[33m[Reconnecting in ${secs}s…]\x1b[0m`)
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) connectWS()
          }, delay)
        }
      } catch (err) {
        setWsError(String(err))
        setHandshaking(false)
      }
    }

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Handshake spinner overlay */}
        {handshaking && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#1c1f1e',
            gap: 12,
          }}>
            <div style={{
              width: 28, height: 28,
              border: '3px solid rgba(142,207,158,0.2)',
              borderTopColor: '#8ecf9e',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{
              fontSize: 12, color: '#8ecf9e',
              fontFamily: 'monospace',
            }}>
              Connecting to sandbox…
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Error state */}
        {wsError && !handshaking && (
          <div style={{
            position: 'absolute', bottom: 8, left: 12, right: 12,
            background: 'rgba(184,50,48,0.15)',
            border: '1px solid rgba(184,50,48,0.4)',
            borderRadius: 8, padding: '6px 10px',
            fontSize: 11, color: '#f4a49f',
            fontFamily: 'monospace',
          }}>
            {wsError} — retrying…
          </div>
        )}
      </div>
    )
  }
)
