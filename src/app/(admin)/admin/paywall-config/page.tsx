'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type UsageUnit = 'count' | 'cents'

interface PlanLimit {
  id: string
  plan: string
  feature: string
  limit_value: number
  window_days: number
  unit?: UsageUnit
  description?: string | null
  cost_ceiling_cents?: number | null
  updated_at: string
}

type LimitEdit = {
  limit_value: number
  window_days: number
  unit: UsageUnit
  description: string
  cost_ceiling_cents: number | null
}

const FEATURE_LABELS: Record<string, string> = {
  challenges: 'Challenge starts',
  interviews: 'AI interview starts',
  hatch_ai_cents: 'Hatch AI budget',
}

function editFromLimit(limit: PlanLimit): LimitEdit {
  return {
    limit_value: limit.limit_value,
    window_days: limit.window_days,
    unit: limit.unit ?? (limit.feature === 'hatch_ai_cents' ? 'cents' : 'count'),
    description: limit.description ?? '',
    cost_ceiling_cents: limit.cost_ceiling_cents ?? null,
  }
}

function formatLimit(limit: PlanLimit) {
  if ((limit.unit ?? 'count') === 'cents') return `$${(limit.limit_value / 100).toFixed(2)}`
  return limit.limit_value.toLocaleString()
}

export default function PaywallConfigPage() {
  const [limits, setLimits] = useState<PlanLimit[]>([])
  const [editing, setEditing] = useState<Record<string, LimitEdit>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/plan-limits')
      .then(r => r.json())
      .then(d => setLimits(d.limits ?? []))
  }, [])

  function keyFor(limit: Pick<PlanLimit, 'plan' | 'feature'>) {
    return `${limit.plan}:${limit.feature}`
  }

  function startEdit(limit: PlanLimit) {
    setEditing(prev => ({ ...prev, [keyFor(limit)]: editFromLimit(limit) }))
  }

  function updateEdit(key: string, patch: Partial<LimitEdit>) {
    setEditing(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  async function save(limit: PlanLimit) {
    const key = keyFor(limit)
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
      setLimits(prev => prev.map(l => keyFor(l) === key ? d.limit : l))
      setEditing(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }

    setSaving(null)
  }

  return (
    <main className="max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link href="/admin" className="text-on-surface-variant transition-colors hover:text-on-surface" aria-label="Back to admin">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <p className="font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
              Revenue controls
            </p>
          </div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Freemium limits</h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-on-surface-variant">
            Tune monthly free and Pro allowances without a deploy. Hatch AI budget is tracked in estimated vendor-cost cents.
          </p>
        </div>
        <div className="rounded-2xl bg-primary/10 px-4 py-3 text-right">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Pro target</p>
          <p className="font-headline text-xl font-bold text-on-surface">$30/mo</p>
          <p className="font-body text-xs text-on-surface-variant">Keep AI COGS under $6</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-error/10 px-4 py-3 font-body text-sm text-error">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b border-outline-variant/30">
              {['Plan', 'Feature', 'Limit', 'Unit', 'Window', 'COGS ceiling', 'Notes', 'Updated', ''].map(label => (
                <th key={label} className="px-4 py-3 text-left font-label text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {limits.map(limit => {
              const key = keyFor(limit)
              const edit = editing[key]
              const isSaving = saving === key

              return (
                <tr key={key} className="border-b border-outline-variant/20 last:border-0">
                  <td className="px-4 py-3.5">
                    <span className="font-label text-sm font-semibold capitalize text-on-surface">{limit.plan}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-body text-sm text-on-surface">{FEATURE_LABELS[limit.feature] ?? limit.feature}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {edit ? (
                      <input
                        type="number"
                        min={0}
                        value={edit.limit_value}
                        onChange={e => updateEdit(key, { limit_value: parseInt(e.target.value, 10) || 0 })}
                        className="w-24 rounded-lg border border-outline-variant bg-surface px-2 py-1 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <span className="font-body text-sm tabular-nums text-on-surface">{formatLimit(limit)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {edit ? (
                      <select
                        value={edit.unit}
                        onChange={e => updateEdit(key, { unit: e.target.value as UsageUnit })}
                        className="rounded-lg border border-outline-variant bg-surface px-2 py-1 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
                      >
                        <option value="count">count</option>
                        <option value="cents">cents</option>
                      </select>
                    ) : (
                      <span className="font-body text-xs text-on-surface-variant">{limit.unit ?? 'count'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {edit ? (
                      <input
                        type="number"
                        min={1}
                        value={edit.window_days}
                        onChange={e => updateEdit(key, { window_days: parseInt(e.target.value, 10) || 30 })}
                        className="w-20 rounded-lg border border-outline-variant bg-surface px-2 py-1 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <span className="font-body text-sm text-on-surface">{limit.window_days}d</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {edit ? (
                      <input
                        type="number"
                        min={0}
                        value={edit.cost_ceiling_cents ?? ''}
                        onChange={e => updateEdit(key, {
                          cost_ceiling_cents: e.target.value === '' ? null : parseInt(e.target.value, 10) || 0,
                        })}
                        className="w-24 rounded-lg border border-outline-variant bg-surface px-2 py-1 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <span className="font-body text-sm tabular-nums text-on-surface">
                        {limit.cost_ceiling_cents == null ? '-' : `$${(limit.cost_ceiling_cents / 100).toFixed(2)}`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {edit ? (
                      <input
                        value={edit.description}
                        onChange={e => updateEdit(key, { description: e.target.value })}
                        className="w-56 rounded-lg border border-outline-variant bg-surface px-2 py-1 font-body text-sm text-on-surface focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <span className="line-clamp-2 max-w-[220px] font-body text-xs text-on-surface-variant">
                        {limit.description ?? '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-body text-xs text-on-surface-variant">
                      {new Date(limit.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {edit ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => save(limit)}
                          disabled={isSaving}
                          className="rounded-full bg-primary px-3 py-1 font-label text-xs font-semibold text-on-primary transition-opacity disabled:opacity-60"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditing(prev => {
                            const next = { ...prev }
                            delete next[key]
                            return next
                          })}
                          className="rounded-full bg-surface-container-high px-3 py-1 font-label text-xs font-semibold text-on-surface"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(limit)}
                        className="rounded-full bg-surface-container-high px-3 py-1 font-label text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
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
    </main>
  )
}
