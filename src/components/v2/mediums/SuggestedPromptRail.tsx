'use client'

import type { ClaudeCodeTerminalHandle } from './types'
import type { RefObject } from 'react'

interface SuggestedPromptRailProps {
  prompts: string[]
  terminalRef: RefObject<ClaudeCodeTerminalHandle | null>
}

export function SuggestedPromptRail({ prompts, terminalRef }: SuggestedPromptRailProps) {
  if (!prompts.length) return null

  function handleInsert(prompt: string) {
    terminalRef.current?.insertText(prompt)
    terminalRef.current?.focus()
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
        Try next
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleInsert(prompt)}
            title="Inserts into the terminal. You edit and run it."
            style={{
              padding: '5px 12px',
              borderRadius: 99,
              background: 'var(--color-secondary-container)',
              color: 'var(--color-on-secondary-container)',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-label)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              transition: 'opacity 150ms',
              maxWidth: 280,
              textAlign: 'left',
              whiteSpace: 'nowrap',
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
