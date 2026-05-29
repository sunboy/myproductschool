'use client'

import { useEffect, useMemo, useState } from 'react'

interface VoiceViolationGroup {
  rule: string
  route: string
  count: number
  latestAt: string
}

interface VoiceViolationRow {
  id: string
  user_id: string | null
  route: string
  model: string
  rule: string
  needle: string
  replacement: string
  context_excerpt: string
  created_at: string
}

type SortKey = 'rule' | 'route' | 'count' | 'latestAt'
type SortDirection = 'asc' | 'desc'

const RULE_LABELS: Record<string, string> = {
  em_dash: 'Em dash',
  identity_leak: 'Identity leak',
  role_framing: 'Role framing',
  slop: 'Voice slop',
}

const RULE_STYLES: Record<string, string> = {
  em_dash: 'bg-tertiary-container text-on-tertiary-container',
  identity_leak: 'bg-error-container text-on-error-container',
  role_framing: 'bg-secondary-container text-on-secondary-container',
  slop: 'bg-primary-container text-on-primary-container',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function sortGroups(groups: VoiceViolationGroup[], key: SortKey, direction: SortDirection) {
  return [...groups].sort((a, b) => {
    const modifier = direction === 'asc' ? 1 : -1
    if (key === 'count') return (a.count - b.count) * modifier
    if (key === 'latestAt') return (new Date(a.latestAt).getTime() - new Date(b.latestAt).getTime()) * modifier
    return a[key].localeCompare(b[key]) * modifier
  })
}

function ruleLabel(rule: string) {
  return RULE_LABELS[rule] ?? rule
}

function ruleClass(rule: string) {
  return RULE_STYLES[rule] ?? 'bg-surface-container-high text-on-surface-variant'
}

export default function AdminVoiceViolationsPage() {
  const [groups, setGroups] = useState<VoiceViolationGroup[]>([])
  const [recent, setRecent] = useState<VoiceViolationRow[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('count')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/admin/voice-violations')
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'Failed to load voice violations')
        return data as { groups: VoiceViolationGroup[]; recent: VoiceViolationRow[] }
      })
      .then(data => {
        if (cancelled) return
        setGroups(data.groups ?? [])
        setRecent(data.recent ?? [])
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load voice violations')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const sortedGroups = useMemo(
    () => sortGroups(groups, sortKey, sortDirection),
    [groups, sortKey, sortDirection]
  )

  const totalViolations = recent.length
  const identityLeaks = recent.filter(row => row.rule === 'identity_leak').length
  const topRoute = groups[0]?.route ?? 'None'

  function updateSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(key)
    setSortDirection(key === 'count' || key === 'latestAt' ? 'desc' : 'asc')
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return 'unfold_more'
    return sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'
  }

  return (
    <main className="p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-label text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
            Hatch quality
          </p>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Voice violations</h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-on-surface-variant">
            Review sanitizer replacements across recent Hatch outputs and find routes that need prompt tuning.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-error/10 px-4 py-3 font-body text-sm text-error">{error}</div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
          <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Last 100 events</p>
          <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{loading ? '...' : totalViolations}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
          <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Identity leaks</p>
          <p className="mt-2 font-headline text-3xl font-bold text-on-surface">{loading ? '...' : identityLeaks}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
          <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Top route</p>
          <p className="mt-2 truncate font-mono text-sm font-semibold text-on-surface">{loading ? '...' : topRoute}</p>
        </div>
      </section>

      <section className="mb-8 overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="border-b border-outline-variant px-4 py-3">
          <h2 className="font-headline text-lg font-bold text-on-surface">Grouped by route and rule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                {[
                  ['rule', 'Rule'],
                  ['route', 'Route'],
                  ['count', 'Count'],
                  ['latestAt', 'Latest'],
                ].map(([key, label]) => (
                  <th key={key} className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    <button
                      type="button"
                      onClick={() => updateSort(key as SortKey)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-on-surface"
                    >
                      {label}
                      <span className="material-symbols-outlined text-[16px]">{sortIcon(key as SortKey)}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {sortedGroups.map(group => (
                <tr key={`${group.rule}:${group.route}`} className="hover:bg-surface-container-high">
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 font-label text-xs font-semibold ${ruleClass(group.rule)}`}>
                      {ruleLabel(group.rule)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-on-surface">{group.route}</td>
                  <td className="px-4 py-3 font-body text-sm tabular-nums text-on-surface">{group.count}</td>
                  <td className="px-4 py-3 font-body text-xs text-on-surface-variant">{formatDate(group.latestAt)}</td>
                </tr>
              ))}
              {!loading && sortedGroups.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                    No voice violations logged yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                    Loading voice violations...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
        <div className="border-b border-outline-variant px-4 py-3">
          <h2 className="font-headline text-lg font-bold text-on-surface">Recent events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                {['Rule', 'Route', 'Needle', 'Replacement', 'Context', 'User', 'Time'].map(label => (
                  <th key={label} className="px-4 py-3 text-left font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {recent.map(row => (
                <tr key={row.id} className="align-top hover:bg-surface-container-high">
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 font-label text-xs font-semibold ${ruleClass(row.rule)}`}>
                      {ruleLabel(row.rule)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-on-surface">{row.route}</td>
                  <td className="max-w-[180px] px-4 py-3 font-body text-sm text-on-surface">
                    <span className="line-clamp-2">{row.needle}</span>
                  </td>
                  <td className="max-w-[180px] px-4 py-3 font-body text-sm text-on-surface-variant">
                    <span className="line-clamp-2">{row.replacement || '(stripped)'}</span>
                  </td>
                  <td className="max-w-[320px] px-4 py-3 font-body text-xs leading-relaxed text-on-surface-variant">
                    <span className="line-clamp-3">{row.context_excerpt}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">
                    {row.user_id ? row.user_id.slice(0, 8) : 'system'}
                  </td>
                  <td className="px-4 py-3 font-body text-xs text-on-surface-variant">{formatDate(row.created_at)}</td>
                </tr>
              ))}
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                    No recent events.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-body text-sm text-on-surface-variant">
                    Loading recent events...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
