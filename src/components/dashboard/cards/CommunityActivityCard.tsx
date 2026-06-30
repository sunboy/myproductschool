import Link from 'next/link'
import type { ActivityFeedEvent } from '@/lib/types'
import { COMMUNITY_BADGE_LABELS, formatCommunityDisplayName } from '@/lib/community-shared'

function eventIcon(event: ActivityFeedEvent): string {
  if (event.event_type === 'earned_badge') return 'workspace_premium'
  if (event.event_type === 'expert_picked_answer') return 'verified'
  if (event.event_type === 'feedback_trade') return 'rate_review'
  if (event.event_type === 'shared_answer') return 'groups'
  return 'track_changes'
}

function eventMeta(event: ActivityFeedEvent): string {
  if (event.badge_key) return COMMUNITY_BADGE_LABELS[event.badge_key]
  if (event.challenge_title) return event.challenge_title
  return 'Community'
}

export function CommunityActivityCard({ events }: { events: ActivityFeedEvent[] }) {
  const visibleEvents = events.slice(0, 3)

  return (
    <section className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-headline text-base font-bold text-on-surface">What peers are doing</h3>
        </div>
        <Link
          href="/cohort"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-outline-variant px-2.5 py-1 text-[11px] font-bold text-primary no-underline hover:bg-primary-fixed"
        >
          Weekly room
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

      <div className="space-y-2">
        {events.length === 0 && (
          <div className="rounded-xl bg-background p-3 text-xs text-on-surface-variant">
            The first shared answers and badges will show up here.
          </div>
        )}
        {visibleEvents.map(event => (
          <div key={event.id} className="flex gap-2.5 rounded-xl bg-background p-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[16px]">{eventIcon(event)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[12px] font-semibold leading-4 text-on-surface">
                {formatCommunityDisplayName(event.display_mode, event.actor_display_name)}
                <span className="font-normal text-on-surface-variant"> | {event.headline}</span>
              </div>
              <div className="mt-0.5 truncate text-[11px] font-semibold text-on-surface-variant">
                {eventMeta(event)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
