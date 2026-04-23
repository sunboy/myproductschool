'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useStudyPlan } from '@/hooks/useStudyPlan'

interface Props {
  planSlug: string
  activeChallengeId?: string
}

export function StudyPlanIndexPanel({ planSlug, activeChallengeId }: Props) {
  const { plan, chapters, userProgress, inProgressChallengeIds, isLoading, refetch } = useStudyPlan(planSlug)

  useEffect(() => {
    const handler = (e: Event) => {
      const { fromPlan } = (e as CustomEvent).detail ?? {}
      if (fromPlan === planSlug) refetch()
    }
    window.addEventListener('challenge-completed', handler)
    return () => window.removeEventListener('challenge-completed', handler)
  }, [planSlug, refetch])

  return (
    <aside className="hidden md:flex flex-col h-full w-64 shrink-0 bg-surface-container-low border-r border-outline-variant/40 overflow-y-auto">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-outline-variant/30">
        <Link
          href={`/explore/plans/${planSlug}`}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mb-2.5 font-label"
        >
          <span
            className="material-symbols-outlined text-[13px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
          >
            arrow_back
          </span>
          Back to plan
        </Link>

        {plan ? (
          <>
            <p className="font-headline font-bold text-sm text-on-surface leading-tight">{plan.title}</p>
            {userProgress && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1 bg-outline-variant/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${userProgress.progress_pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant font-label shrink-0 tabular-nums">
                  {Math.round(userProgress.progress_pct)}%
                </span>
              </div>
            )}
          </>
        ) : (
          !isLoading && (
            <p className="font-headline font-bold text-sm text-on-surface leading-tight">Study Plan</p>
          )
        )}
      </div>

      {/* ── Chapter + challenge list ── */}
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 bg-surface-container-high rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex-1 py-2">
          {chapters.map((chapter) => (
            <div key={chapter.id}>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant font-label">
                {chapter.title}
              </p>
              {(chapter.challenges ?? []).map((challenge) => {
                const challengeSlug = (challenge as { slug?: string }).slug
                const isActive =
                  challenge.id === activeChallengeId ||
                  challengeSlug === activeChallengeId
                const isDone = userProgress?.completed_challenges?.includes(challenge.id) ?? false
                const isInProgress = !isDone && inProgressChallengeIds.includes(challenge.id)
                const href = `/workspace/challenges/${challengeSlug ?? challenge.id}?from_plan=${planSlug}&cid=${challenge.id}`

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

          {chapters.length === 0 && (
            <p className="px-4 py-6 text-xs text-on-surface-variant font-label text-center">
              No chapters found
            </p>
          )}
        </div>
      )}
    </aside>
  )
}
