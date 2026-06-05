'use client'
// Dashboard card: the user's top job matches, deep-linking to /career-ops. Renders
// only when the master + discovery flags are on; prompts for a target role when the
// profile is empty.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { isCareerOpsFeatureEnabled } from '@/lib/careerops/flags'
import { ProfileRolePrompt } from '@/components/careerops/ProfileRolePrompt'
import { gradeClasses } from '@/components/careerops/grade'
import type { FeedEntry, FeedResponse } from '@/lib/careerops/types'

type State = (FeedResponse & { needs_profile?: boolean }) | null

export function CareerDiscoveryCard() {
  const enabled = isCareerOpsFeatureEnabled('discovery')
  const [state, setState] = useState<State>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) { setLoading(false); return }
    let active = true
    fetch('/api/career-ops/feed')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active) setState(d) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [enabled])

  if (!enabled) return null

  return (
    <section className="rounded-2xl bg-surface-container p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-headline text-base font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>work</span>
          Jobs for you
        </h2>
        <Link href="/career-ops" className="font-label text-sm text-primary no-underline">See all</Link>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-surface-container-high" aria-busy />
      ) : state?.needs_profile ? (
        <ProfileRolePrompt compact onSaved={() => { window.location.assign('/career-ops') }} />
      ) : !state || state.listings.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant">
          No matches yet. <Link href="/career-ops" className="text-primary no-underline">Open Career</Link> to set up your search.
        </p>
      ) : (
        <div className="space-y-2">
          {state.listings.slice(0, 3).map((entry: FeedEntry) => (
            <Link
              key={entry.id}
              href="/career-ops"
              className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3 no-underline"
            >
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-semibold text-on-surface">{entry.role_title}</p>
                <p className="truncate font-body text-xs text-on-surface-variant">{entry.company}{entry.location ? ` · ${entry.location}` : ''}</p>
              </div>
              {entry.grade && (
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-label text-xs font-bold ${gradeClasses(entry.grade)}`}>{entry.grade}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
