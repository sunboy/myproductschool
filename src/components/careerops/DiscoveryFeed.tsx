'use client'
// The ranked "Jobs for you" feed — the cold-start "aha". Fetches /api/career-ops/feed
// (Stage A deterministic rank + Stage B cached AI auto-scores of the top N), renders
// listing cards with grade chips + a mini readiness map, and gates locked rows.

import { useCallback, useEffect, useState } from 'react'
import { ReadinessMap } from './ReadinessMap'
import { ProfileRolePrompt } from './ProfileRolePrompt'
import { gradeClasses } from './grade'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import type { FeedEntry, FeedResponse } from '@/lib/careerops/types'

type FeedState = (FeedResponse & { needs_profile?: boolean }) | null

const PROVIDER_LABEL: Record<string, string> = {
  jsearch: 'Job board',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  workable: 'Workable',
}

export function DiscoveryFeed() {
  const [state, setState] = useState<FeedState>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const trackerOn = isCareerOpsFeatureEnabled('tracker')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/career-ops/feed')
      if (res.ok) setState(await res.json())
      else setState({ listings: [], scored_count: 0, limit_reached: false })
    } catch {
      setState({ listings: [], scored_count: 0, limit_reached: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-3" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
    )
  }

  if (state?.needs_profile) {
    return <ProfileRolePrompt onSaved={load} />
  }

  if (!state || state.listings.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-container p-6 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant" aria-hidden>work_off</span>
        <p className="mt-2 font-body text-sm text-on-surface-variant">
          No matching openings yet. New jobs are pulled in daily, check back soon.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {state.listings.map((entry) => (
        <ListingCard
          key={entry.id}
          entry={entry}
          providerLabel={PROVIDER_LABEL[entry.provider] ?? entry.provider}
          trackerOn={trackerOn}
          expanded={expanded === entry.id}
          onToggle={() => setExpanded((cur) => (cur === entry.id ? null : entry.id))}
        />
      ))}
    </div>
  )
}

function ListingCard({
  entry,
  providerLabel,
  trackerOn,
  expanded,
  onToggle,
}: {
  entry: FeedEntry
  providerLabel: string
  trackerOn: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function saveToPipeline() {
    setSaving(true)
    try {
      const res = await fetch('/api/career-ops/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: entry.company,
          role_title: entry.role_title,
          jd_url: entry.url,
          jd_text: entry.description ?? undefined,
          source: entry.provider,
          fit_score: entry.score ?? undefined,
          fit_grade: entry.grade ?? undefined,
        }),
      })
      if (res.status === 402) { window.dispatchEvent(new Event('open-upgrade-modal')); return }
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl bg-surface-container-low p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-headline text-lg font-semibold text-on-surface">{entry.role_title}</h3>
          <p className="font-body text-sm text-on-surface-variant">
            {entry.company}{entry.location ? ` · ${entry.location}` : ''}
          </p>
        </div>
        {entry.grade ? (
          <span className={`shrink-0 rounded-full px-3 py-1 font-label text-sm font-bold ${gradeClasses(entry.grade)}`}>
            {entry.grade}
          </span>
        ) : entry.locked ? (
          <span className="shrink-0 rounded-full bg-surface-container-highest px-3 py-1 font-label text-xs font-semibold text-on-surface-variant">
            Pro
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary-container px-2.5 py-0.5 font-label text-xs text-on-secondary-container">
          {providerLabel}
        </span>
        {entry.score != null && (
          <span className="font-label text-xs text-on-surface-variant">Fit {entry.score}/100</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-label text-sm font-semibold text-on-primary no-underline"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden>open_in_new</span>
          View
        </a>
        {entry.readiness_map && entry.readiness_map.some((r) => r.demanded) && (
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-4 py-1.5 font-label text-sm font-semibold text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden>{expanded ? 'expand_less' : 'expand_more'}</span>
            Readiness
          </button>
        )}
        {trackerOn && (
          <button
            onClick={saveToPipeline}
            disabled={saving || saved}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-4 py-1.5 font-label text-sm font-semibold text-on-secondary-container disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden>{saved ? 'check' : 'bookmark_add'}</span>
            {saved ? 'Saved' : 'Save to pipeline'}
          </button>
        )}
        {entry.locked && (
          <button
            onClick={() => window.dispatchEvent(new Event('open-upgrade-modal'))}
            className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-container px-4 py-1.5 font-label text-sm font-semibold text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden>lock_open</span>
            Unlock score
          </button>
        )}
      </div>

      {expanded && entry.readiness_map && (
        <div className="mt-4">
          <ReadinessMap rows={entry.readiness_map} compact />
        </div>
      )}
    </div>
  )
}
