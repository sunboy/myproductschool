import { ChallengeDiscussion } from '@/lib/types'

interface Props {
  discussion: ChallengeDiscussion
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getInitials(username: string): string {
  const parts = username.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return username.slice(0, 2).toUpperCase()
}

export function DiscussionThread({ discussion }: Props) {
  const initials = getInitials(discussion.username ?? 'User')

  return (
    <div className="bg-surface-container rounded-xl p-5">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
          <span className="text-on-primary-container font-bold text-sm">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1">
            <span className="font-bold text-on-surface text-sm">{discussion.username ?? 'Anonymous'}</span>
            {discussion.is_expert_pick && (
              <span className="ml-2 bg-tertiary-container text-on-tertiary-container text-xs font-bold px-2 py-0.5 rounded-full">
                Expert Pick
              </span>
            )}
          </div>
          <div className="text-xs text-on-surface-variant">{relativeTime(discussion.created_at)}</div>
        </div>
      </div>

      {/* Content */}
      <p className="mt-3 text-sm text-on-surface leading-relaxed">{discussion.content}</p>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>thumb_up</span>
          {discussion.upvote_count}
        </div>
        <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chat_bubble_outline</span>
          {discussion.reply_count ?? 0} replies
        </div>
      </div>
    </div>
  )
}
