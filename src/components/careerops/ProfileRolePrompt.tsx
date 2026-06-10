'use client'
// Compact "set your target role" prompt shown when the user has no career profile
// yet. Creating one unlocks the discovery feed. Reused on the hub feed and the
// dashboard CareerDiscoveryCard.

import { useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

export function ProfileRolePrompt({ onSaved, compact = false }: { onSaved?: () => void; compact?: boolean }) {
  const [role, setRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!role.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/career-ops/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target_role: role.trim() }),
      })
      if (!res.ok) throw new Error('save_failed')
      onSaved?.()
    } catch {
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-2xl bg-surface-container ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center gap-3">
        {!compact && <HatchGlyph size={36} state="idle" className="shrink-0 text-primary" />}
        <div>
          <h3 className="font-headline text-base font-semibold text-on-surface">
            What role are you targeting?
          </h3>
          <p className="font-body text-sm text-on-surface-variant">
            Set your target role and Hatch surfaces matching openings, scored for you.
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save() }}
          placeholder="e.g. Staff Backend Engineer"
          className="min-w-0 flex-1 rounded-full border border-outline-variant bg-surface px-4 py-2 font-body text-sm text-on-surface outline-none focus:border-primary"
        />
        <button
          onClick={save}
          disabled={saving || !role.trim()}
          className="rounded-full bg-primary px-5 py-2 font-label text-sm font-semibold text-on-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Find jobs'}
        </button>
      </div>
      {error && <p className="mt-2 font-body text-sm text-error">{error}</p>}
    </div>
  )
}
