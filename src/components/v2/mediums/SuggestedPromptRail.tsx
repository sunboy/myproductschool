'use client'

import type { ClaudeCodeTerminalHandle } from './types'
import type { RefObject } from 'react'

interface SuggestedPromptRailProps {
  prompts: string[]
  terminalRef: RefObject<ClaudeCodeTerminalHandle | null>
  /** True when these chips were generated from the live session (vs the step's
   *  static defaults) — surfaces a subtle label so the user knows they adapt. */
  contextual?: boolean
  disabled?: boolean
  onInsert?: () => void
}

export function SuggestedPromptRail({ prompts, terminalRef, contextual = false, disabled = false, onInsert }: SuggestedPromptRailProps) {
  if (!prompts.length) return null

  function handleInsert(prompt: string) {
    if (disabled || !terminalRef.current) return
    onInsert?.()
    terminalRef.current?.insertText(prompt)
    requestAnimationFrame(() => terminalRef.current?.focus())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        fontSize: 10, fontWeight: 800,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        color: 'var(--color-on-surface-variant)',
        fontFamily: 'var(--font-label)',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
          tips_and_updates
        </span>
        {contextual ? 'Try next · from your session' : 'Try next'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {prompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => handleInsert(prompt)}
            title={disabled ? 'Start your session to use this prompt.' : 'Inserts into Claude Code. You edit and run it.'}
            style={{
              padding: '5px 12px',
              borderRadius: 99,
              background: 'var(--color-secondary-container)',
              color: 'var(--color-on-secondary-container)',
              border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
              fontSize: 14, fontWeight: 600,
              fontFamily: 'var(--font-label)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              transition: 'opacity 150ms',
              maxWidth: '100%',
              textAlign: 'left',
              whiteSpace: 'normal',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12, flexShrink: 0, fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
              subdirectory_arrow_right
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
