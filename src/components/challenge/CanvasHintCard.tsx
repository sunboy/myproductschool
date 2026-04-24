'use client'

import { useState, useEffect } from 'react'

interface CanvasHintCardProps {
  challengeType: 'system_design' | 'data_modeling'
  forceOpen?: boolean
  onDismiss?: () => void
}

const CONTENT = {
  system_design: {
    heading: 'How to build',
    icon: 'architecture',
    body: (
      <ul className="mt-2 space-y-1.5 list-none">
        <li className="flex items-start gap-1">
          <span className="material-symbols-outlined text-base text-primary mr-1 shrink-0 mt-0.5">library_add</span>
          <span>Drag shapes from Library (top-left toolbar) — common components like API, DB, cache</span>
        </li>
        <li className="flex items-start gap-1">
          <span className="material-symbols-outlined text-base text-primary mr-1 shrink-0 mt-0.5">arrow_forward</span>
          <span>Connect components with arrows to show data flow</span>
        </li>
        <li className="flex items-start gap-1">
          <span className="material-symbols-outlined text-base text-primary mr-1 shrink-0 mt-0.5">chat</span>
          <span>Ask Hatch in chat: <em>&ldquo;add a Redis cache between API and Postgres&rdquo;</em> or <em>&ldquo;what&apos;s missing?&rdquo;</em></span>
        </li>
      </ul>
    ),
  },
  data_modeling: {
    heading: 'How to model',
    icon: 'table',
    body: (
      <>
        <p className="mt-2">Each table is a labeled rectangle. Type columns inside on separate lines:</p>
        <pre className="mt-2 bg-surface-container-highest rounded-lg p-2 text-xs font-mono leading-relaxed overflow-x-auto">{`users\n──\nid PK\nemail UNIQUE\ntenant_id FK→tenants.id`}</pre>
        <p className="mt-2 font-semibold text-on-surface">Relationships, three ways:</p>
        <ul className="mt-1 space-y-1.5 list-none">
          <li className="flex items-start gap-1">
            <span className="material-symbols-outlined text-base text-primary mr-1 shrink-0 mt-0.5">key</span>
            <span>Inline FK in a column: <code className="bg-surface-container-highest rounded px-1 text-xs font-mono">FK→table.col</code></span>
          </li>
          <li className="flex items-start gap-1">
            <span className="material-symbols-outlined text-base text-primary mr-1 shrink-0 mt-0.5">arrow_forward</span>
            <span>Labeled arrow between tables (e.g. &ldquo;1:N&rdquo;)</span>
          </li>
          <li className="flex items-start gap-1">
            <span className="material-symbols-outlined text-base text-primary mr-1 shrink-0 mt-0.5">chat</span>
            <span>Just describe it to Hatch in chat</span>
          </li>
        </ul>
      </>
    ),
  },
}

export function CanvasHintCard({ challengeType, forceOpen, onDismiss }: CanvasHintCardProps) {
  const storageKey = `hatch_canvas_hint_dismissed_${challengeType}`

  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(storageKey) !== '1'
  })

  useEffect(() => {
    if (forceOpen) {
      setVisible(true)
    } else if (forceOpen === false) {
      const dismissed = typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1'
      if (dismissed) setVisible(false)
    }
  }, [forceOpen, storageKey])

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, '1')
    }
    setVisible(false)
    onDismiss?.()
  }

  if (!visible) return null

  const content = CONTENT[challengeType]

  return (
    <div className="absolute top-3 left-3 z-20 max-w-sm bg-surface-container-low border border-outline-variant rounded-xl shadow-sm p-4 font-body text-sm text-on-surface">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base text-primary">{content.icon}</span>
          <span className="font-headline font-semibold text-on-surface">{content.heading}</span>
        </div>
        <button
          onClick={dismiss}
          className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          aria-label="Dismiss hint"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Body content */}
      <div className="mt-1 leading-relaxed">
        {content.body}
      </div>

      {/* Footer dismiss */}
      <button
        onClick={dismiss}
        className="text-xs text-on-surface-variant hover:text-on-surface mt-2 transition-colors"
      >
        Got it
      </button>
    </div>
  )
}
