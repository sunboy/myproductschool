'use client'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useDomainChallenges, type DomainPanelChallenge } from '@/hooks/useDomainChallenges'
import { getTopicLabelAny } from '@/lib/data/taxonomy'

interface Props {
  domainSlug: string
  activeChallengeId?: string
}

/**
 * In-workspace left index for the `?from_domain=` 3-panel shell. Visual twin of
 * StudyPlanIndexPanel — same w-64 aside, header, progress bar, row styling and
 * active highlight — but renders the domain's flat challenge list grouped by
 * primary topic (domains have no chapters).
 */
export function DomainIndexPanel({ domainSlug, activeChallengeId }: Props) {
  const { domain, challenges, isLoading, refetch } = useDomainChallenges(domainSlug)

  useEffect(() => {
    const handler = (e: Event) => {
      const { fromDomain } = (e as CustomEvent).detail ?? {}
      if (fromDomain === domainSlug) refetch()
    }
    window.addEventListener('challenge-completed', handler)
    return () => window.removeEventListener('challenge-completed', handler)
  }, [domainSlug, refetch])

  const completedCount = challenges.filter(c => c.is_completed).length
  const progressPct = challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0

  // Group by primary topic to mirror the domain detail page's topic sections.
  const groups = useMemo(() => {
    const map = new Map<string, DomainPanelChallenge[]>()
    const ungrouped: DomainPanelChallenge[] = []
    for (const c of challenges) {
      const primary = c.topic_tags?.[0]
      if (primary) {
        const bucket = map.get(primary) ?? []
        bucket.push(c)
        map.set(primary, bucket)
      } else {
        ungrouped.push(c)
      }
    }
    const entries = Array.from(map.entries())
      .map(([slug, items]) => ({ label: getTopicLabelAny(slug) ?? slug, items }))
      .sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label))
    if (ungrouped.length > 0) entries.push({ label: 'Other', items: ungrouped })
    return entries
  }, [challenges])

  return (
    <aside className="hidden md:flex flex-col h-full w-64 shrink-0 bg-surface-container-low border-r border-outline-variant/40 overflow-y-auto">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-outline-variant/30">
        <Link
          href={`/explore/domains/${domainSlug}`}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mb-2.5 font-label"
        >
          <span
            className="material-symbols-outlined text-[13px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
          >
            arrow_back
          </span>
          Back to domain
        </Link>

        {domain ? (
          <>
            <p className="font-headline font-bold text-sm text-on-surface leading-tight">{domain.title}</p>
            {challenges.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1 bg-outline-variant/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant font-label shrink-0 tabular-nums">
                  {progressPct}%
                </span>
              </div>
            )}
          </>
        ) : (
          !isLoading && (
            <p className="font-headline font-bold text-sm text-on-surface leading-tight">Domain</p>
          )
        )}
      </div>

      {/* ── Topic-grouped challenge list ── */}
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 bg-surface-container-high rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex-1 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant font-label">
                {group.label}
              </p>
              {group.items.map((challenge) => {
                const isActive =
                  challenge.id === activeChallengeId ||
                  challenge.slug === activeChallengeId
                const isDone = challenge.is_completed ?? false
                const isInProgress = !isDone && (challenge.is_in_progress ?? false)
                const href = `/workspace/challenges/${challenge.slug ?? challenge.id}?from_domain=${domainSlug}&cid=${challenge.id}`

                let iconName = 'radio_button_unchecked'
                let iconColor: string | undefined
                let iconFill = "'FILL' 0, 'wght' 400"
                if (isDone) {
                  iconName = 'check_circle'
                  iconColor = '#4a7c59'
                  iconFill = "'FILL' 1, 'wght' 400"
                } else if (isActive) {
                  iconName = 'play_circle'
                  iconColor = '#4a7c59'
                  iconFill = "'FILL' 1, 'wght' 400"
                } else if (isInProgress) {
                  iconName = 'pending'
                  iconColor = '#705c30'
                  iconFill = "'FILL' 1, 'wght' 400"
                }

                return (
                  <Link
                    key={challenge.id}
                    href={href}
                    className={[
                      'flex items-start gap-2.5 px-4 py-2 transition-colors text-xs font-label',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                    ].join(' ')}
                  >
                    <span
                      className="material-symbols-outlined text-[14px] shrink-0 mt-[1px]"
                      style={{ fontVariationSettings: iconFill, color: iconColor }}
                    >
                      {iconName}
                    </span>
                    <span className="flex-1 leading-snug line-clamp-2">{challenge.title}</span>
                  </Link>
                )
              })}
            </div>
          ))}

          {groups.length === 0 && (
            <p className="px-4 py-6 text-xs text-on-surface-variant font-label text-center">
              No challenges found
            </p>
          )}
        </div>
      )}
    </aside>
  )
}
