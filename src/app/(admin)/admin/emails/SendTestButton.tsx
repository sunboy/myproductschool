'use client'

import { useState } from 'react'

interface SendTestButtonProps {
  kind: string
}

type SendState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; id: string | null }
  | { status: 'error'; message: string }

export function SendTestButton({ kind }: SendTestButtonProps) {
  const [state, setState] = useState<SendState>({ status: 'idle' })

  async function handleClick() {
    setState({ status: 'sending' })
    try {
      const res = await fetch('/api/admin/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      const data = await res.json().catch(() => ({})) as { id?: string | null; error?: string }
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? `Request failed (${res.status})` })
        return
      }
      setState({ status: 'sent', id: data.id ?? null })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Send failed' })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={state.status === 'sending'}
        className="rounded-full bg-ink-strong px-3 py-1.5 text-xs font-semibold text-card-bright transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {state.status === 'sending' ? 'Sending…' : 'Send to me'}
      </button>
      {state.status === 'sent' && (
        <span className="text-xs text-success">Sent{state.id ? ` (${state.id})` : ''}</span>
      )}
      {state.status === 'error' && (
        <span className="text-xs text-error">{state.message}</span>
      )}
    </div>
  )
}
