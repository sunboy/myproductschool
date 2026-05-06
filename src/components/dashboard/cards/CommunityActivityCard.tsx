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
  return (
    <section className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-label font-extrabold uppercase tracking-[0.12em] text-primary">
            Community pulse
          </div>
          <h3 className="mt-1 font-headline text-lg font-bold text-on-surface">What peers are doing</h3>
        </div>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-fixed"
        >
          Practice
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

      <div className="space-y-3">
        {events.length === 0 && (
          <div className="rounded-xl bg-background p-4 text-sm text-on-surface-variant">
            The first shared answers and badges will show up here.
          </div>
        )}
        {events.map(event => (
          <div key={event.id} className="flex gap-3 rounded-xl bg-background p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[18px]">{eventIcon(event)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-5 text-on-surface">
                {formatCommunityDisplayName(event.display_mode, event.actor_display_name)}
                <span className="font-normal text-on-surface-variant"> | {event.headline}</span>
              </div>
              <div className="mt-0.5 truncate text-xs font-semibold text-on-surface-variant">
                {eventMeta(event)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
