'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PlanLimit {
  id: string
  plan: string
  feature: string
  limit_value: number
  window_days: number
  updated_at: string
}

export default function PaywallConfigPage() {
  const [limits, setLimits] = useState<PlanLimit[]>([])
  const [editing, setEditing] = useState<Record<string, { limit_value: number; window_days: number }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/plan-limits')
      .then(r => r.json())
      .then(d => setLimits(d.limits ?? []))
  }, [])

  function startEdit(limit: PlanLimit) {
    setEditing(prev => ({
      ...prev,
      [`${limit.plan}:${limit.feature}`]: {
        limit_value: limit.limit_value,
        window_days: limit.window_days,
      },
    }))
  }

  async function save(limit: PlanLimit) {
    const key = `${limit.plan}:${limit.feature}`
    const edit = editing[key]
    if (!edit) return

    setSaving(key)
    setError(null)

    const res = await fetch('/api/admin/plan-limits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: limit.plan, feature: limit.feature, ...edit }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Save failed')
    } else {
      const d = await res.json()
      setLimits(prev => prev.map(l =>
        l.plan === limit.plan && l.feature === limit.feature ? d.limit : l
      ))
      setEditing(prev => { const n = { ...prev }; delete n[key]; return n })
    }
    setSaving(null)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Paywall Config</h1>
      </div>

      <p className="font-body text-sm text-on-surface-variant mb-6">
        Changes apply within 60 seconds — no deploy needed.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error/10 text-error text-sm font-body">{error}</div>
      )}

      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Plan</th>
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Feature</th>
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Limit</th>
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Window (days)</th>
              <th className="px-5 py-3 text-left font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Last Updated</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {limits.map(limit => {
              const key = `${limit.plan}:${limit.feature}`
              const edit = editing[key]
              const isSaving = saving === key

              return (
                <tr key={key} className="border-b border-outline-variant/20 last:border-0">
                  <td className="px-5 py-3.5">
                    <span className="font-label text-sm font-semibold text-on-surface capitalize">{limit.plan}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-label text-sm text-on-surface capitalize">{limit.feature}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {edit ? (
                      <input
                        type="number"
                        min={0}
                        value={edit.limit_value}
                        onChange={e => setEditing(prev => ({ ...prev, [key]: { ...edit, limit_value: parseInt(e.target.value) || 0 } }))}
                        className="w-20 px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm font-body focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="font-body text-sm text-on-surface">{limit.limit_value}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {edit ? (
                      <input
                        type="number"
                        min={1}
                        value={edit.window_days}
                        onChange={e => setEditing(prev => ({ ...prev, [key]: { ...edit, window_days: parseInt(e.target.value) || 30 } }))}
                        className="w-20 px-2 py-1 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm font-body focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="font-body text-sm text-on-surface">{limit.window_days}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-body text-xs text-on-surface-variant">
                      {new Date(limit.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {edit ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => save(limit)}
                          disabled={isSaving}
                          className="px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-label font-semibold transition-opacity disabled:opacity-60"
                        >
                          {isSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditing(prev => { const n = { ...prev }; delete n[key]; return n })}
                          className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-label font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(limit)}
                        className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-label font-semibold hover:bg-surface-container-highest transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
