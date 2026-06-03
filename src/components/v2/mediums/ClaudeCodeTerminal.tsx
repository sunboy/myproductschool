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
const MCP_CONNECTED_RE = /added\s+(?:stdio\s+)?mcp\s+server\s+bigquery|bigquery.*(?:✓|connected|ready)|mcp.*bigquery.*✓|MCP.*connected/i
// Detect that the `claude` REPL has launched. On start the CLI prints a version
// banner ("Claude Code v2.1.x") and an `❯` input prompt with "accept edits on".
// Matching the version banner is the most stable signal across CLI versions.
const CLAUDE_REPL_RE = /Claude\s+Code\s+v\d|accept edits on|❯\s/i
const SKILL_WRITTEN_RE = /Wrote?\s+\.claude\/skills\/([^\s]+\.md)/i
// A report artifact landing in the workspace (e.g. "Wrote /workspace/report.md").
const REPORT_WRITTEN_RE = /Wrote?\s+(\/workspace\/[^\s]*report[^\s]*\.md)/i

const TAIL_MAX_BYTES = 4000

// The container PTY bridge spawns the shell LAZILY on the first resize message
// (it waits for real terminal dimensions so the banner paints at the right
// width). The client MUST send this on open, or no shell is ever spawned and
// the terminal stays blank. Protocol: `\x1b[?resize=` + JSON {cols, rows}.
// Mirrors RESIZE_PREFIX in infra/claude-code-sandbox/entrypoint-pty.js.
const RESIZE_PREFIX = '\x1b[?resize='

export const ClaudeCodeTerminal = forwardRef<ClaudeCodeTerminalHandle, ClaudeCodeTerminalProps>(
  function ClaudeCodeTerminal(
    { wssUrl, onOutput, onActivity, onMcpStatusChange, onReplStatusChange, onSkillWritten, onReportWritten },
    ref
  ) {
    // Latch so we only emit the REPL-running signal once per launch.
    const replSignalledRef = useRef(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const termRef = useRef<import('xterm').Terminal | null>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const tailRef = useRef<string>('')
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const mountedRef = useRef(true)
    const fitRef = useRef<() => void>(() => {})
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
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(text)
        }
      },
      focus() {
        termRef.current?.focus()
      },
    }))

    useEffect(() => {
      mountedRef.current = true
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

      async function initTerminal() {
        if (!containerRef.current || !mountedRef.current) return

        const { Terminal } = await import('xterm')
        const { FitAddon } = await import('xterm-addon-fit')

        // Gate xterm.open() on a measurable container.
        await waitForSize(containerRef.current)
        if (!containerRef.current || !mountedRef.current) return

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
          cursorBlink: true,
          scrollback: 2000,
          allowProposedApi: true,
        })

        fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(containerRef.current!)
        termRef.current = term

        // Only fit once the container has a real, nonzero size. Calling fit()
        // (or letting xterm's Viewport refresh run) before the element is laid
        // out makes xterm read `_renderService.dimensions` while it's still
        // undefined and throw "Cannot read properties of undefined (reading
        // 'dimensions')". Guard every fit and skip zero-size passes.
        const safeFit = () => {
          const el = containerRef.current
          if (!el || el.clientWidth === 0 || el.clientHeight === 0) return
          try { fitAddon.fit() } catch { /* renderer not ready yet — ignore */ }
          // Tell the container PTY the current size so it can spawn/resize.
          sendResizeRef.current()
        }
        // Expose the fit so the WS open handler can re-fit + send dimensions
        // once the socket is live (the open may land before/after the first fit).
        fitRef.current = safeFit
        // Defer the initial fit to the next frame so layout has settled.
        requestAnimationFrame(safeFit)

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
        mountedRef.current = false
        cleanup.then(fn => fn?.())
        wsRef.current?.close()
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function connectWS() {
      if (!mountedRef.current) return
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

          onActivity?.()
          // Ensure the renderer is sized before writing. If xterm hasn't
          // measured yet, write() triggers a Viewport refresh that reads the
          // undefined `dimensions` and throws (corrupting the display with
          // W/] measurement probes). A safeFit first, and a guarded write,
          // make this resilient to data arriving before layout settles.
          fitRef.current()
          try {
            termRef.current?.write(text)
          } catch {
            // Renderer not ready — re-fit and retry once on the next frame.
            requestAnimationFrame(() => {
              fitRef.current()
              try { termRef.current?.write(text) } catch { /* drop this chunk */ }
            })
          }

          // Rolling tail (~4KB)
          tailRef.current = (tailRef.current + text).slice(-TAIL_MAX_BYTES)
          onOutput?.(tailRef.current)

          // Detect MCP connection
          if (MCP_CONNECTED_RE.test(text)) {
            onMcpStatusChange?.(true)
          }

          // Detect the `claude` REPL launching. Test the rolling tail (not just
          // this chunk) since the banner can arrive split across frames. Latch
          // so we signal once per launch.
          if (!replSignalledRef.current && CLAUDE_REPL_RE.test(tailRef.current)) {
            replSignalledRef.current = true
            onReplStatusChange?.(true)
          }

          // Detect skill file writes
          const match = SKILL_WRITTEN_RE.exec(text)
          if (match?.[1]) {
            onSkillWritten?.(match[1])
          }

          // Detect a report artifact written to the workspace
          const reportMatch = REPORT_WRITTEN_RE.exec(text)
          if (reportMatch?.[1]) {
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
