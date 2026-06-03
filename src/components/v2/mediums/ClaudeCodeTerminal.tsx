'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import type { ClaudeCodeTerminalProps, ClaudeCodeTerminalHandle } from './types'

// xterm@5.3.0 is installed (not @xterm/xterm)
// Dynamically imported to avoid SSR issues

const MCP_CONNECTED_RE = /MCP.*connected|bigquery.*mcp.*ready|mcp.*bigquery.*✓/i
const SKILL_WRITTEN_RE = /Wrote?\s+\.claude\/skills\/([^\s]+\.md)/i
// A report artifact landing in the workspace (e.g. "Wrote /workspace/report.md").
const REPORT_WRITTEN_RE = /Wrote?\s+(\/workspace\/[^\s]*report[^\s]*\.md)/i

const TAIL_MAX_BYTES = 4000

export const ClaudeCodeTerminal = forwardRef<ClaudeCodeTerminalHandle, ClaudeCodeTerminalProps>(
  function ClaudeCodeTerminal(
    { wssUrl, onOutput, onActivity, onMcpStatusChange, onSkillWritten, onReportWritten },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const termRef = useRef<import('xterm').Terminal | null>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const tailRef = useRef<string>('')
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const mountedRef = useRef(true)
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

      async function initTerminal() {
        if (!containerRef.current || !mountedRef.current) return

        const { Terminal } = await import('xterm')
        const { FitAddon } = await import('xterm-addon-fit')

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
        fitAddon.fit()
        termRef.current = term

        const ro = new ResizeObserver(() => {
          try { fitAddon.fit() } catch { /* ignore */ }
        })
        ro.observe(containerRef.current!)

        term.onKey(({ key }) => {
          onActivity?.()
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(key)
          }
        })

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
          setHandshaking(false)
          setWsError(null)
          termRef.current?.focus()
        }

        ws.onmessage = (event) => {
          if (!mountedRef.current) return
          const text = typeof event.data === 'string' ? event.data : ''
          if (!text) return

          onActivity?.()
          termRef.current?.write(text)

          // Rolling tail (~4KB)
          tailRef.current = (tailRef.current + text).slice(-TAIL_MAX_BYTES)
          onOutput?.(tailRef.current)

          // Detect MCP connection
          if (MCP_CONNECTED_RE.test(text)) {
            onMcpStatusChange?.(true)
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
          setWsError('Connection error')
        }

        ws.onclose = (ev) => {
          if (!mountedRef.current) return
          setHandshaking(false)
          onMcpStatusChange?.(false)

          // Auto-reconnect for Cloud Run 60-min cap (code 1006 = abnormal closure)
          if (ev.code !== 1000 && ev.code !== 1001) {
            const delay = 3000
            termRef.current?.writeln('\r\n\x1b[33m[Reconnecting in 3s…]\x1b[0m')
            reconnectTimerRef.current = setTimeout(() => {
              if (mountedRef.current) {
                setHandshaking(true)
                connectWS()
              }
            }, delay)
          } else {
            termRef.current?.writeln('\r\n\x1b[90m[Session closed]\x1b[0m')
          }
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
