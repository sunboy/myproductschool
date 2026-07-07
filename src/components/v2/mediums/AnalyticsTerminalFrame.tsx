'use client'

import { useRef } from 'react'
import { ClaudeCodeTerminal } from './ClaudeCodeTerminal'
import type { ClaudeCodeTerminalHandle } from './types'
import type { RefObject } from 'react'

interface AnalyticsTerminalFrameProps {
  /** Lab detector overrides, forwarded to the terminal (additive, optional). */
  mcpNamePattern?: string
  reportPathPattern?: string
  wssUrl: string
  terminalRef: RefObject<ClaudeCodeTerminalHandle | null>
  onOutput?: (tail: string) => void
  onActivity?: () => void
  onMcpStatusChange?: (connected: boolean) => void
  onReplStatusChange?: (running: boolean) => void
  onSkillWritten?: (filename: string) => void
  onReportWritten?: (path: string) => void
}

export function AnalyticsTerminalFrame({
  mcpNamePattern,
  reportPathPattern,
  wssUrl,
  terminalRef,
  onOutput,
  onActivity,
  onMcpStatusChange,
  onReplStatusChange,
  onSkillWritten,
  onReportWritten,
}: AnalyticsTerminalFrameProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      borderRadius: 12, overflow: 'hidden',
      border: '1px solid var(--color-outline-variant)',
      flex: 1, minHeight: 0,
    }}>
      {/* Title bar — Terra inverse surface */}
      <div style={{
        background: 'var(--color-inverse-surface)',
        padding: '7px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
      }}>
        {/* Traffic light dots */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {(['#ff5f57', '#ffbd2e', '#28ca41'] as const).map((c, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: c, opacity: 0.8,
            }} />
          ))}
        </div>

        <span style={{
          fontSize: 11, fontWeight: 600,
          color: 'var(--color-inverse-on-surface)',
          fontFamily: 'monospace',
          flex: 1, textAlign: 'center',
        }}>
          Claude Code ▸ ~/workspace
        </span>

        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: '2px 6px', borderRadius: 4,
          background: 'rgba(142,207,158,0.15)',
          color: '#8ecf9e',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}>
          live
        </span>
      </div>

      {/* Terminal body */}
      <div style={{
        flex: 1, minHeight: 0,
        background: '#1c1f1e',
        position: 'relative',
      }}>
        <ClaudeCodeTerminal
          mcpNamePattern={mcpNamePattern}
          reportPathPattern={reportPathPattern}
          ref={terminalRef}
          wssUrl={wssUrl}
          onOutput={onOutput}
          onActivity={onActivity}
          onMcpStatusChange={onMcpStatusChange}
          onReplStatusChange={onReplStatusChange}
          onSkillWritten={onSkillWritten}
          onReportWritten={onReportWritten}
        />
      </div>
    </div>
  )
}
