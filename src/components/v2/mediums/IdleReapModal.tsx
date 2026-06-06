'use client'

// IdleReapModal — when an analytics session has been idle long enough that the
// reaper is about to free its sandbox instance, give the (still-present) user a
// consented heads-up with a live countdown and a "Keep working" escape hatch.
// Work is autosaved every 30s, so a reap is non-destructive (the user resumes
// from the last autosave) — this modal just spares an active-but-quiet user the
// reconnect wait. A closed tab never sees this; the server cron reaps those.

import { useEffect, useRef, useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

interface IdleReapModalProps {
  /** Seconds remaining before the client stops heartbeating and lets the reap proceed. */
  countdownSeconds: number
  /** User chose to keep the session alive — reset idle + ping liveness. */
  onKeepWorking: () => void
}

export function IdleReapModal({ countdownSeconds, onKeepWorking }: IdleReapModalProps) {
  const [remaining, setRemaining] = useState(countdownSeconds)
  const onKeepRef = useRef(onKeepWorking)
  onKeepRef.current = onKeepWorking

  useEffect(() => {
    setRemaining(countdownSeconds)
    const t = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [countdownSeconds])

  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(28,31,30,0.72)', backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          width: 'min(380px, 90%)',
          background: 'var(--color-surface)',
          borderRadius: 16,
          border: '1px solid var(--color-outline-variant)',
          padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(46,50,48,0.28)',
        }}
      >
        <HatchGlyph size={40} state="idle" className="text-primary" />
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>
          Still there?
        </h3>
        <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--color-on-surface-variant)', margin: 0 }}>
          Your sandbox will shut down in{' '}
          <span style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{mm}:{ss}</span>{' '}
          to free resources. Your work is saved, so you can pick up right where you left off.
        </p>
        <button
          onClick={() => onKeepRef.current()}
          style={{
            marginTop: 4,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--color-primary)', color: 'var(--color-on-primary)',
            border: 'none', borderRadius: 999,
            padding: '10px 22px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Keep working
        </button>
      </div>
    </div>
  )
}
